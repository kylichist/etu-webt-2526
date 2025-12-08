import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StocksService } from '../stocks/stocks.service';

export interface TradingSettings {
  startDate: string;
  speedSeconds: number;
  isTrading: boolean;
  currentDate: string;
}

export interface StockPrice {
  symbol: string;
  price: number;
  date: string;
}

@Injectable()
export class TradingService {
  private readonly settingsPath = process.env.DATA_PATH 
    ? path.join(process.env.DATA_PATH, 'settings.json')
    : path.join(process.cwd(), '..', 'data', 'settings.json');
  private tradingInterval: NodeJS.Timeout | null = null;

  constructor(private readonly stocksService: StocksService) {}

  // Получить настройки торгов
  async getSettings(): Promise<TradingSettings> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      const defaultSettings: TradingSettings = {
        startDate: '2021-01-01',
        speedSeconds: 1,
        isTrading: false,
        currentDate: '2021-01-01',
      };
      await this.saveSettings(defaultSettings);
      return defaultSettings;
    }
  }

  // Обновить настройки торгов
  async updateSettings(settings: Partial<TradingSettings>): Promise<TradingSettings> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    await this.saveSettings(newSettings);
    return newSettings;
  }

  // Начать торги
  async startTrading(): Promise<void> {
    const settings = await this.getSettings();
    settings.isTrading = true;
    settings.currentDate = settings.startDate;
    await this.saveSettings(settings);
  }

  // Остановить торги
  async stopTrading(): Promise<void> {
    const settings = await this.getSettings();
    settings.isTrading = false;
    await this.saveSettings(settings);
    
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }
  }

  // Получить текущие цены акций
  async getCurrentPrices(): Promise<StockPrice[]> {
    const settings = await this.getSettings();
    const stocks = await this.stocksService.getSelected();
    
    return stocks.map(stock => ({
      symbol: stock.symbol,
      price: this.stocksService.getPriceForDate(stock, settings.currentDate),
      date: settings.currentDate,
    }));
  }

  // Переместиться к следующей дате
  async advanceDate(): Promise<string> {
    const settings = await this.getSettings();
    const currentDate = new Date(settings.currentDate);
    
    // Двигаемся вперед на 1 месяц
    currentDate.setMonth(currentDate.getMonth() + 1);
    
    const newDate = currentDate.toISOString().split('T')[0];
    settings.currentDate = newDate;
    await this.saveSettings(settings);
    
    return newDate;
  }

  // Сохранить настройки
  private async saveSettings(settings: TradingSettings): Promise<void> {
    await fs.writeFile(
      this.settingsPath,
      JSON.stringify(settings, null, 2),
      'utf-8',
    );
  }
}
