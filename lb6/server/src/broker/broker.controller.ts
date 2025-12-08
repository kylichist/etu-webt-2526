import {Body, Controller, Get, Param, Post} from '@nestjs/common';
import {BrokerService} from './broker.service';
import {BuySellDto} from './dto/buy-sell.dto';
import {LoginDto} from './dto/login.dto';

@Controller('broker')
export class BrokerController {
    constructor(private readonly brokerService: BrokerService) {
    }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        const broker = this.brokerService.getBroker(loginDto.name);
        if (!broker) throw new Error('Broker not found');
        return broker;
    }

    @Get('stocks')
    getStocks() {
        return this.brokerService.getStocks();
    }

    @Post('buy')
    buy(@Body() buyDto: BuySellDto) {
        const success = this.brokerService.buyStock(buyDto.brokerName, buyDto.symbol, buyDto.quantity);
        if (!success) throw new Error('Insufficient funds');
        return {success: true};
    }

    @Post('sell')
    sell(@Body() sellDto: BuySellDto) {
        const success = this.brokerService.sellStock(sellDto.brokerName, sellDto.symbol, sellDto.quantity);
        if (!success) throw new Error('Insufficient stocks');
        return {success: true};
    }

    @Get('admin')
    getAllBrokers() {
        return this.brokerService.getAllBrokers();
    }

    @Get('profit/:brokerName/:symbol')
    getProfit(@Param('brokerName') brokerName: string, @Param('symbol') symbol: string) {
        return this.brokerService.getProfitLoss(brokerName, symbol);
    }
}
