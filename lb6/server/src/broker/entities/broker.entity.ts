export class Broker {
    constructor(public name: string, public cash: number, public portfolio: { [symbol: string]: number } = {}) {
        this.purchasePrices = {};
    }
    purchasePrices: { [symbol: string]: number };
}
