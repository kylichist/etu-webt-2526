import { Controller, Post, Body, Get } from '@nestjs/common';
import { BrokerService } from './broker.service';
import { EventsGateway } from '../websocket/websocket.gateway';

@Controller('broker')
export class BrokerController {
    constructor(
        private readonly brokerService: BrokerService,
        private readonly eventsGateway: EventsGateway,
    ) {}

    @Post('login')
    async login(@Body() body: { name: string }) {
        const name = String(body?.name || '').trim();
        if (!name) {
            return { error: 'Name required' };
        }
        let broker = this.brokerService.getBroker(name);
        if (!broker) {
            broker = this.brokerService.createBroker(name, 10000);
        }
        return broker;
    }

    @Get('stocks')
    getStocks() {
        return this.brokerService.getStocks();
    }

    @Get('admin')
    getAdmin() {
        return this.brokerService.getAllBrokers();
    }

    @Post('buy')
    async buy(@Body() body: { brokerName: string; symbol: string; quantity: number }) {
        const { brokerName, symbol, quantity } = body;
        const result = this.brokerService.buyStock(brokerName, String(symbol).toUpperCase(), Number(quantity || 0));

        if (!result.ok) {
            // return failure with broker snapshot (if exists) for client diagnostics
            const broker = this.brokerService.getBroker(brokerName);
            return { ok: false, error: result.error, broker };
        }

        // successful -> emit updates
        try {
            const broker = this.brokerService.getBroker(brokerName);
            if (this.eventsGateway && this.eventsGateway.server) {
                this.eventsGateway.server.emit('brokerUpdate', broker);
                const prices = this.brokerService.getPricesMap();
                const currentDate = this.brokerService.getCurrentDate();
                this.eventsGateway.server.emit('priceUpdate', { pricesMap: prices, currentDate, ts: Date.now() });
                const stocksSnapshot = this.brokerService.getStocks();
                this.eventsGateway.server.emit('stocksSnapshot', { stocks: stocksSnapshot, ts: Date.now() });
            }
        } catch (e) {
            console.warn('Emit after buy failed', e);
        }

        return { ok: true, broker: this.brokerService.getBroker(brokerName) };
    }

    @Post('sell')
    async sell(@Body() body: { brokerName: string; symbol: string; quantity: number }) {
        const { brokerName, symbol, quantity } = body;
        const result = this.brokerService.sellStock(brokerName, String(symbol).toUpperCase(), Number(quantity || 0));

        if (!result.ok) {
            const broker = this.brokerService.getBroker(brokerName);
            return { ok: false, error: result.error, broker };
        }

        try {
            const broker = this.brokerService.getBroker(brokerName);
            if (this.eventsGateway && this.eventsGateway.server) {
                this.eventsGateway.server.emit('brokerUpdate', broker);
                const prices = this.brokerService.getPricesMap();
                const currentDate = this.brokerService.getCurrentDate();
                this.eventsGateway.server.emit('priceUpdate', { pricesMap: prices, currentDate, ts: Date.now() });
                const stocksSnapshot = this.brokerService.getStocks();
                this.eventsGateway.server.emit('stocksSnapshot', { stocks: stocksSnapshot, ts: Date.now() });
            }
        } catch (e) {
            console.warn('Emit after sell failed', e);
        }

        return { ok: true, broker: this.brokerService.getBroker(brokerName) };
    }
}
