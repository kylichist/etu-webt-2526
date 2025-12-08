import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BrokersService } from './brokers.service';

@Controller('brokers')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  // Получить всех брокеров
  @Get()
  async findAll() {
    return await this.brokersService.findAll();
  }

  // Получить одного брокера
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const broker = await this.brokersService.findOne(id);
    
    if (!broker) {
      throw new HttpException('Broker not found', HttpStatus.NOT_FOUND);
    }
    
    return broker;
  }

  // Создать брокера
  @Post()
  async create(@Body() body: { name: string; initialFunds: number }) {
    // Валидация данных
    if (!body.name || body.name.trim() === '') {
      throw new HttpException('Name is required', HttpStatus.BAD_REQUEST);
    }
    
    if (!body.initialFunds || body.initialFunds <= 0) {
      throw new HttpException(
        'Initial funds must be greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.brokersService.create(body);
  }

  // Обновить брокера
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; initialFunds?: number },
  ) {
    // Валидация данных
    if (body.name !== undefined && body.name.trim() === '') {
      throw new HttpException('Name cannot be empty', HttpStatus.BAD_REQUEST);
    }
    
    if (body.initialFunds !== undefined && body.initialFunds <= 0) {
      throw new HttpException(
        'Initial funds must be greater than 0',
        HttpStatus.BAD_REQUEST,
      );
    }

    const broker = await this.brokersService.update(id, body);
    
    if (!broker) {
      throw new HttpException('Broker not found', HttpStatus.NOT_FOUND);
    }
    
    return broker;
  }

  // Удалить брокера
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const success = await this.brokersService.remove(id);
    
    if (!success) {
      throw new HttpException('Broker not found', HttpStatus.NOT_FOUND);
    }
    
    return { message: 'Broker deleted successfully' };
  }
}
