import {
  Controller,
  Get,
  Post,
  Put,
  Body,
} from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradingGateway } from './trading.gateway';

@Controller('trading')
export class TradingController {
  constructor(
    private readonly tradingService: TradingService,
    private readonly tradingGateway: TradingGateway,
  ) {}

  // Получить настройки торгов
  @Get('settings')
  async getSettings() {
    return await this.tradingService.getSettings();
  }

  // Обновить настройки торгов
  @Put('settings')
  async updateSettings(@Body() settings: { startDate?: string; speedSeconds?: number }) {
    return await this.tradingService.updateSettings(settings);
  }

  // Начать торги
  @Post('start')
  async startTrading() {
    await this.tradingService.startTrading();
    await this.tradingGateway.startBroadcasting();
    return { message: 'Trading started' };
  }

  // Остановить торги
  @Post('stop')
  async stopTrading() {
    await this.tradingService.stopTrading();
    this.tradingGateway.stopBroadcasting();
    return { message: 'Trading stopped' };
  }

  // Получить текущие цены
  @Get('prices')
  async getCurrentPrices() {
    return await this.tradingService.getCurrentPrices();
  }
}
