import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { StocksService } from './stocks.service';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  // Получить все акции
  @Get()
  async findAll() {
    return await this.stocksService.findAll();
  }

  // Получить одну акцию
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const stock = await this.stocksService.findOne(id);
    
    if (!stock) {
      throw new HttpException('Stock not found', HttpStatus.NOT_FOUND);
    }
    
    return stock;
  }

  // Обновить выбор акции для торгов
  @Put(':id/selection')
  async updateSelection(
    @Param('id') id: string,
    @Body() body: { selected: boolean },
  ) {
    const stock = await this.stocksService.updateSelection(id, body.selected);
    
    if (!stock) {
      throw new HttpException('Stock not found', HttpStatus.NOT_FOUND);
    }
    
    return stock;
  }

  // Получить выбранные акции
  @Get('selected/list')
  async getSelected() {
    return await this.stocksService.getSelected();
  }
}
