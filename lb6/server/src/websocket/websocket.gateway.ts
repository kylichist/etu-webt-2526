import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket as ServerSocket } from 'socket.io';
import { BrokerService } from '../broker/broker.service';
import { OnModuleInit } from '@nestjs/common';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnModuleInit, OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    private lb5Socket: ClientSocket;

    constructor(private brokerService: BrokerService) {}

    async onModuleInit() {
        // Подключаемся к lb5 как к источнику рыночных событий
        try {
            this.lb5Socket = ioClient('http://lb5:3000', { transports: ['websocket'] });

            this.lb5Socket.on('connect', () => {
                console.log('Connected to lb5 WebSocket');
            });

            this.lb5Socket.on('disconnect', () => {
                console.log('Disconnected from lb5 WebSocket');
            });

            // Когда lb5 шлёт обновление цен — обновляем внутреннее состояние и транслируем клиентам
            this.lb5Socket.on('priceUpdate', (data: any) => {
                try {
                    // Обновим текущую дату, если есть
                    if (data.currentDate) {
                        this.brokerService.updateCurrentDate(data.currentDate);
                    }

                    // Нормализуем incoming prices в карту symbol->price
                    const pricesMap = this.normalizeIncomingPricesToMap(data.prices);

                    // Обновляем брокерский сервис на каждую пару symbol->price
                    for (const [symbol, price] of Object.entries(pricesMap)) {
                        // symbol и price гарантированно определены из map
                        this.brokerService.updateStockPrice(String(symbol).toUpperCase(), Number(price));
                    }

                    const ts = Date.now();

                    // Транслируем всем клиентам: pricesMap (object symbol->price), оригинальные данные и метку времени
                    this.server.emit('priceUpdate', {
                        pricesMap,
                        prices: data.prices,
                        currentDate: data.currentDate,
                        ts,
                    });

                    // Отправим snapshot всех акций (включая priceHistory)
                    const stocksSnapshot = this.brokerService.getStocks();
                    this.server.emit('stocksSnapshot', { stocks: stocksSnapshot, ts });
                } catch (e) {
                    console.error('Error handling lb5 priceUpdate', e);
                }
            });

            console.log('EventsGateway initialized');
        } catch (e) {
            console.error('EventsGateway onModuleInit failed', e);
        }
    }

    // Когда клиент подключается к нашему сокету — отправим ему snapshot текущих цен/даты
    handleConnection(client: ServerSocket) {
        try {
            const prices = this.brokerService.getPricesMap();
            const currentDate = this.brokerService.getCurrentDate();
            const ts = Date.now();

            // Отправляем унифицированный priceUpdate: pricesMap всегда объект symbol->price
            client.emit('priceUpdate', { pricesMap: prices, currentDate, ts });

            // Отправим полноценный snapshot со всеми полями (включая priceHistory)
            const stocksSnapshot = this.brokerService.getStocks();
            client.emit('stocksSnapshot', { stocks: stocksSnapshot, ts });
        } catch (e) {
            console.error('Error while sending initial price snapshot to client', e);
        }
    }

    // Утилита: нормализует incoming prices (various shapes) -> { SYMBOL: price, ... }
    private normalizeIncomingPricesToMap(prices: any): { [symbol: string]: number } {
        const map: { [symbol: string]: number } = {};

        if (!prices) return map;

        // 1) если это уже объект с ключами-символами, например { AAPL: 123 }
        if (!Array.isArray(prices) && typeof prices === 'object') {
            const keys = Object.keys(prices);
            const looksLikeSymbolKeys = keys.length > 0 && keys.every(k => /^[A-Za-z]/.test(k));
            if (looksLikeSymbolKeys) {
                for (const [k, v] of Object.entries(prices)) {
                    if (v && typeof v === 'object' && ('price' in v || 'symbol' in v)) {
                        const sym = String((v as any).symbol || k).toUpperCase();
                        const price = Number((v as any).price ?? 0);
                        if (sym) map[sym] = price;
                    } else {
                        const sym = String(k).toUpperCase();
                        map[sym] = Number(v);
                    }
                }
                return map;
            }
            // иначе fall through и обработаем как "array-like object" ниже
        }

        // 2) Если это массив: [{symbol, price}, ...] OR [p0, p1, ...]
        if (Array.isArray(prices)) {
            if (
                prices.length > 0 &&
                typeof prices[0] === 'object' &&
                prices[0] !== null &&
                ('symbol' in prices[0] || 'price' in prices[0] || 'ticker' in prices[0])
            ) {
                // массив объектов с полем symbol
                (prices as any[]).forEach(it => {
                    const sym = String(it.symbol || it.ticker || '').toUpperCase();
                    if (sym) map[sym] = Number(it.price ?? it.p ?? 0);
                });
                return map;
            } else {
                // массив простых цен: сопоставим по индексу с текущим порядком акций в brokerService
                const stocks = this.brokerService.getStocks();
                (prices as any[]).forEach((p, idx) => {
                    const s = stocks[idx];
                    if (s && s.symbol) map[String(s.symbol).toUpperCase()] = Number(p);
                });
                return map;
            }
        }

        // 3) Fallback: интерпретируем каждую запись как пары ключ->значение
        Object.entries(prices).forEach(([k, v]) => {
            const key = String(k).toUpperCase();
            if (v && typeof v === 'object' && ('price' in v || 'symbol' in v)) {
                const sym = String((v as any).symbol || k).toUpperCase();
                const price = Number((v as any).price ?? 0);
                if (sym) map[sym] = price;
            } else {
                map[key] = Number(v);
            }
        });

        return map;
    }
}
