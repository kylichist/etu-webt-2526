import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface HistoricalDataPoint {
  date: string;
  open: string;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  selected: boolean;
  historicalData: HistoricalDataPoint[];
}

@Injectable()
export class StocksService {
  private readonly dataPath = process.env.DATA_PATH
    ? path.join(process.env.DATA_PATH, 'stocks.json')
    : path.join(process.cwd(), 'data', 'stocks.json');

  // Получить все акции
  async findAll(): Promise<Stock[]> {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  // Получить акцию по ID
  async findOne(id: string): Promise<Stock | null> {
    const stocks = await this.findAll();
    return stocks.find(stock => stock.id === id) || null;
  }

  // Обновить статус выбора акций
  async updateSelection(id: string, selected: boolean): Promise<Stock | null> {
    const stocks = await this.findAll();
    const stock = stocks.find(s => s.id === id);

    if (!stock) {
      return null;
    }

    stock.selected = selected;
    await this.saveAll(stocks);

    return stock;
  }

  // Получить выбранные акции
  async getSelected(): Promise<Stock[]> {
    const stocks = await this.findAll();
    return stocks.filter(stock => stock.selected);
  }

  // Получить цену акции на определенную дату
  getPriceForDate(stock: Stock, date: string): number {
    // Найти ближайшую дату в исторических данных
    const dataPoint = stock.historicalData.find(d => d.date === date);

    if (dataPoint) {
      // Удалить $ и , из строки и преобразовать в число
      return parseFloat(dataPoint.open.replace(/[$,]/g, ''));
    }

    // Если точная дата не найдена, найти ближайшую предыдущую
    const sortedData = [...stock.historicalData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    for (let i = sortedData.length - 1; i >= 0; i--) {
      if (new Date(sortedData[i].date) <= new Date(date)) {
        return parseFloat(sortedData[i].open.replace(/[$,]/g, ''));
      }
    }

    // Если не найдено, вернуть первую доступную цену
    if (sortedData.length > 0) {
      return parseFloat(sortedData[0].open.replace(/[$,]/g, ''));
    }

    return 0;
  }

  // Сохранить все акции
  private async saveAll(stocks: Stock[]): Promise<void> {
    await fs.writeFile(this.dataPath, JSON.stringify(stocks, null, 2), 'utf-8');
  }
}
