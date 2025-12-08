import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Broker } from './entities/broker.entity';
import { Stock } from './entities/stock.entity';

@Injectable()
export class BrokerService implements OnModuleInit {
    private brokers: Map<string, Broker> = new Map();
    private stocks: Map<string, Stock> = new Map();
    private configLoaded = false;
    private currentDate = '';

    constructor(private httpService: HttpService) {}

    async onModuleInit() {
        try {
            // Загрузка брокеров
            const brokersRes = await firstValueFrom(this.httpService.get('http://lb5:3000/api/brokers'));
            brokersRes.data.forEach((b: any) => {
                this.brokers.set(b.name, new Broker(b.name, b.currentFunds, b.portfolio));
            });

            // Загрузка акций
            const stocksRes = await firstValueFrom(this.httpService.get('http://lb5:3000/api/stocks'));
            stocksRes.data.forEach((s: any) => {
                this.stocks.set(s.symbol, new Stock(s.symbol, s.price || 0));  // Предполагая price в stocks
            });

            // Загрузка настроек для даты
            const settingsRes = await firstValueFrom(this.httpService.get('http://lb5:3000/api/trading/settings'));
            this.currentDate = settingsRes.data.currentDate || '';

            this.configLoaded = true;
        } catch (error) {
            console.error('Failed to load data from lb5:', error);
        }
    }

    getBroker(name: string): Broker | undefined {
        return this.brokers.get(name);
    }

    getAllBrokers(): Broker[] {
        return Array.from(this.brokers.values()).map(b => ({
            ...b,
            totalBalance: b.cash + this.calculatePortfolioValue(b),
        }));
    }

    private calculatePortfolioValue(broker: Broker): number {
        let value = 0;
        for (const [symbol, quantity] of Object.entries(broker.portfolio)) {
            const stock = this.stocks.get(symbol);
            if (stock) value += stock.price * quantity;
        }
        return value;
    }

    getStocks(): Stock[] {
        return Array.from(this.stocks.values());
    }

    buyStock(brokerName: string, stockSymbol: string, quantity: number): boolean {
        const broker = this.brokers.get(brokerName);
        const stock = this.stocks.get(stockSymbol);
        if (!broker || !stock || quantity <= 0 || broker.cash < stock.price * quantity) return false;
        broker.cash -= stock.price * quantity;
        broker.portfolio[stockSymbol] = (broker.portfolio[stockSymbol] || 0) + quantity;
        broker.purchasePrices[stockSymbol] = stock.price;
        return true;
    }

    sellStock(brokerName: string, stockSymbol: string, quantity: number): boolean {
        const broker = this.brokers.get(brokerName);
        const owned = broker?.portfolio[stockSymbol] || 0;
        if (!broker || quantity <= 0 || owned < quantity) return false;
        const stock = this.stocks.get(stockSymbol);
        broker.cash += stock.price * quantity;
        broker.portfolio[stockSymbol] = owned - quantity;
        return true;
    }

    updateStockPrice(stockSymbol: string, newPrice: number) {
        const stock = this.stocks.get(stockSymbol);
        if (stock) {
            stock.price = newPrice;
            stock.priceHistory.push({ date: this.currentDate, price: newPrice });
        }
    }

    updateCurrentDate(date: string) {
        this.currentDate = date;
    }

    getProfitLoss(brokerName: string, stockSymbol: string): number {
        const broker = this.brokers.get(brokerName);
        const stock = this.stocks.get(stockSymbol);
        const quantity = broker?.portfolio[stockSymbol] || 0;
        const purchasePrice = broker?.purchasePrices[stockSymbol] || 0;
        return (stock ? stock.price - purchasePrice : 0) * quantity;
    }
}
