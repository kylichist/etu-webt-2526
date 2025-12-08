import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { BrokerService } from '../broker/broker.service';
import { OnModuleInit } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnModuleInit {
 @WebSocketServer()
    server: Server;

    private lb5Socket: Socket;

    constructor(private brokerService: BrokerService) {}

    async onModuleInit() {
        this.lb5Socket = io('http://lb5:3000', { transports: ['websocket'] });

        this.lb5Socket.on('connect', () => {
            console.log('Connected to lb5 WebSocket');
        });

        this.lb5Socket.on('disconnect', () => {
            console.log('Disconnected from lb5 WebSocket');
        });

        this.lb5Socket.on('priceUpdate', (data: { prices: { [symbol: string]: number }, currentDate: string }) => {
            for (const [symbol, price] of Object.entries(data.prices)) {
                this.brokerService.updateStockPrice(symbol, price);
            }
            this.server.emit('priceUpdate', data);
        });
    }
}
