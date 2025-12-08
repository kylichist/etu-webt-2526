export class Stock {
    constructor(public symbol: string, public price: number) {
        this.priceHistory = [];
    }
    priceHistory: { date: string; price: number }[];
}
