import { Module } from '@nestjs/common';
import { BrokersModule } from './brokers/brokers.module';
import { StocksModule } from './stocks/stocks.module';
import { TradingModule } from './trading/trading.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [BrokersModule, StocksModule, TradingModule, AuthModule],
})
export class AppModule {}
