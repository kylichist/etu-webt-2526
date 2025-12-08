import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TradingService } from './trading.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class TradingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private tradingInterval: NodeJS.Timeout | null = null;

  constructor(private readonly tradingService: TradingService) {}

  afterInit(server: Server) {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Начать трансляцию изменений цен
  async startBroadcasting() {
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
    }

    const settings = await this.tradingService.getSettings();

    this.tradingInterval = setInterval(async () => {
      // Проверяем, активны ли торги
      const currentSettings = await this.tradingService.getSettings();
      
      if (!currentSettings.isTrading) {
        this.stopBroadcasting();
        return;
      }

      // Переходим к следующей дате
      await this.tradingService.advanceDate();

      // Получаем текущие цены
      const prices = await this.tradingService.getCurrentPrices();
      const updatedSettings = await this.tradingService.getSettings();

      // Транслируем обновления клиентам
      this.server.emit('priceUpdate', {
        prices,
        currentDate: updatedSettings.currentDate,
      });
    }, settings.speedSeconds * 1000);
  }

  // Остановить трансляцию
  stopBroadcasting() {
    if (this.tradingInterval) {
      clearInterval(this.tradingInterval);
      this.tradingInterval = null;
    }
  }
}
