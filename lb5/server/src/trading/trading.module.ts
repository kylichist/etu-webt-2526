import { Module } from '@nestjs/common';
import { TradingGateway } from './trading.gateway';
import { TradingService } from './trading.service';
import { TradingController } from './trading.controller';
import { StocksModule } from '../stocks/stocks.module';
import { BrokersModule } from '../brokers/brokers.module';

@Module({
  imports: [StocksModule, BrokersModule],
  controllers: [TradingController],
  providers: [TradingGateway, TradingService],
})
export class TradingModule {}
