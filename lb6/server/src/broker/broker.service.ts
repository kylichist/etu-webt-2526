import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface Broker {
    name: string;
    cash: number;
    portfolio: Record<string, number>;
    purchasePrices: Record<string, number>;
}

export interface Stock {
    symbol: string;
    price: number;
    priceHistory: Array<{ date: string; price: number }>;
    [key: string]: any;
}

@Injectable()
export class BrokerService {
    private readonly logger = new Logger(BrokerService.name);

    private brokers: Record<string, Broker> = {};
    private stocks: Stock[] = [];
    private currentDate = '';

    constructor(private readonly httpService: HttpService) {}

    createBroker(name: string, initialCash = 10000): Broker {
        const key = String(name || '').trim();
        if (!key) throw new Error('Invalid broker name');
        if (!this.brokers[key]) {
            const b: Broker = {
                name: key,
                cash: initialCash,
                portfolio: {},
                purchasePrices: {},
            };
            this.brokers[key] = b;
            this.logger.log(`Created broker ${key} with cash=${initialCash}`);
        }
        return this.brokers[key];
    }

    getBroker(name: string): Broker | undefined {
        if (!name) return undefined;
        return this.brokers[String(name)];
    }

    getAllBrokers(): Broker[] {
        return Object.values(this.brokers);
    }

    getStocks(): Stock[] {
        return this.stocks;
    }

    setStocks(stocks: Stock[]) {
        this.stocks = Array.isArray(stocks) ? stocks.map(s => this.normalizeStock(s)) : [];
    }

    private normalizeStock(s: any): Stock {
        const symbol = String(s.symbol || s.ticker || '').toUpperCase();
        const price = Number(s.price ?? 0);
        const history = Array.isArray(s.priceHistory)
            ? s.priceHistory.slice()
            : Array.isArray(s.history)
                ? s.history.slice()
                : [{ date: this.currentDate || new Date().toISOString(), price }];
        return { ...s, symbol, price, priceHistory: history };
    }

    updateCurrentDate(date: string) {
        if (date) this.currentDate = date;
    }
    getCurrentDate() {
        return this.currentDate;
    }

    updateStockPrice(symbol: string, price: number) {
        const sym = String(symbol).toUpperCase();
        const idx = this.stocks.findIndex(s => String(s.symbol).toUpperCase() === sym);
        const now = this.currentDate || new Date().toISOString();

        if (idx >= 0) {
            const existing = { ...this.stocks[idx] };
            const last = existing.priceHistory && existing.priceHistory.length ? existing.priceHistory[existing.priceHistory.length - 1] : null;
            existing.priceHistory = existing.priceHistory ? existing.priceHistory.slice() : [];
            if (!last || Number(last.price) !== Number(price) || String(last.date) !== String(now)) {
                existing.priceHistory.push({ date: now, price: Number(price) });
            }
            existing.price = Number(price);
            this.stocks.splice(idx, 1, existing);
        } else {
            const s: Stock = { symbol: sym, price: Number(price), priceHistory: [{ date: now, price: Number(price) }] };
            this.stocks.push(s);
        }
    }

    getPricesMap(): Record<string, number> {
        const map: Record<string, number> = {};
        this.stocks.forEach(s => {
            if (s && s.symbol) map[String(s.symbol).toUpperCase()] = Number(s.price || 0);
        });
        return map;
    }

    /**
     * buyStock:
     * - валидация: quantity > 0, broker exists, price > 0, sufficient cash
     * - пересчёт средней цены покупки (weighted average)
     * - списание денег
     * - возвращает { ok: boolean, error?: string }
     */
    buyStock(brokerName: string, symbol: string, quantity: number): { ok: boolean; error?: string } {
        if (!brokerName || !symbol) return { ok: false, error: 'Broker or symbol missing' };
        const qty = Number(quantity || 0);
        if (!qty || qty <= 0) return { ok: false, error: 'Invalid quantity' };

        const b = this.brokers[brokerName];
        if (!b) return { ok: false, error: `Broker ${brokerName} not found` };

        const sym = String(symbol).toUpperCase();
        const price = this.getPricesMap()[sym] ?? 0;
        if (!price || price <= 0) return { ok: false, error: 'Invalid or zero price for symbol' };

        const total = price * qty;
        if ((b.cash ?? 0) < total) return { ok: false, error: 'Insufficient cash' };

        b.portfolio = b.portfolio || {};
        b.purchasePrices = b.purchasePrices || {};
        const have = Number(b.portfolio[sym] || 0);
        const prevAvg = Number(b.purchasePrices[sym] || 0);

        const newQty = have + qty;
        const newAvg = newQty > 0 ? ((prevAvg * have) + (price * qty)) / newQty : price;

        b.portfolio[sym] = newQty;
        b.purchasePrices[sym] = newAvg;
        b.cash = (b.cash || 0) - total;

        this.brokers[brokerName] = b;
        this.logger.log(`Broker ${brokerName} bought ${qty} ${sym} at ${price} each; newQty=${newQty}, newAvg=${newAvg}, cash=${b.cash}`);
        return { ok: true };
    }

    /**
     * sellStock:
     * - валидация: quantity > 0, broker exists, have enough shares
     * - списание позиции, пополнение cash
     * - возвращает { ok: boolean, error?: string }
     *
     * Note: we do NOT allow selling more than have (operation fails).
     */
    sellStock(brokerName: string, symbol: string, quantity: number): { ok: boolean; error?: string } {
        if (!brokerName || !symbol) return { ok: false, error: 'Broker or symbol missing' };
        const qty = Number(quantity || 0);
        if (!qty || qty <= 0) return { ok: false, error: 'Invalid quantity' };

        const b = this.brokers[brokerName];
        if (!b) return { ok: false, error: `Broker ${brokerName} not found` };

        const sym = String(symbol).toUpperCase();
        b.portfolio = b.portfolio || {};
        const have = Number(b.portfolio[sym] || 0);

        if (have <= 0) return { ok: false, error: `No holdings for ${sym}` };
        if (qty > have) return { ok: false, error: `Trying to sell ${qty} but only ${have} available` };

        const price = this.getPricesMap()[sym] ?? 0;
        const total = price * qty;

        b.portfolio[sym] = have - qty;
        if (b.portfolio[sym] === 0) {
            delete b.portfolio[sym];
            // optionally remove purchasePrices for closed position
            delete b.purchasePrices[sym];
        }

        b.cash = (b.cash || 0) + total;
        this.brokers[brokerName] = b;
        this.logger.log(`Broker ${brokerName} sold ${qty} ${sym} at ${price} each; remaining=${b.portfolio[sym] || 0}, cash=${b.cash}`);
        return { ok: true };
    }
}
