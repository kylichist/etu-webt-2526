import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BrokersModule } from './brokers/brokers.module';
import { StocksModule } from './stocks/stocks.module';
import { TradingModule } from './trading/trading.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'dist'),
    }),
    BrokersModule,
    StocksModule,
    TradingModule,
    AuthModule,
  ],
})
export class AppModule {}
