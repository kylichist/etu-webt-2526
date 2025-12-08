import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Broker {
  id: string;
  name: string;
  initialFunds: number;
  currentFunds: number;
  portfolio: { [stockSymbol: string]: number }; // symbol -> quantity
}

@Injectable()
export class BrokersService {
  private readonly dataPath = process.env.DATA_PATH 
    ? path.join(process.env.DATA_PATH, 'brokers.json')
    : path.join(process.cwd(), '..', 'data', 'brokers.json');

  // Получить всех брокеров
  async findAll(): Promise<Broker[]> {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  // Получить брокера по ID
  async findOne(id: string): Promise<Broker | null> {
    const brokers = await this.findAll();
    return brokers.find(broker => broker.id === id) || null;
  }

  // Создать нового брокера
  async create(brokerData: { name: string; initialFunds: number }): Promise<Broker> {
    const brokers = await this.findAll();
    
    // Генерация ID
    const id = `broker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newBroker: Broker = {
      id,
      name: brokerData.name,
      initialFunds: brokerData.initialFunds,
      currentFunds: brokerData.initialFunds,
      portfolio: {},
    };

    brokers.push(newBroker);
    await this.saveAll(brokers);
    
    return newBroker;
  }

  // Обновить брокера
  async update(id: string, brokerData: Partial<Broker>): Promise<Broker | null> {
    const brokers = await this.findAll();
    const index = brokers.findIndex(broker => broker.id === id);
    
    if (index === -1) {
      return null;
    }

    brokers[index] = { ...brokers[index], ...brokerData };
    await this.saveAll(brokers);
    
    return brokers[index];
  }

  // Удалить брокера
  async remove(id: string): Promise<boolean> {
    const brokers = await this.findAll();
    const filteredBrokers = brokers.filter(broker => broker.id !== id);
    
    if (filteredBrokers.length === brokers.length) {
      return false;
    }

    await this.saveAll(filteredBrokers);
    return true;
  }

  // Сохранить всех брокеров
  private async saveAll(brokers: Broker[]): Promise<void> {
    await fs.writeFile(this.dataPath, JSON.stringify(brokers, null, 2), 'utf-8');
  }
}
