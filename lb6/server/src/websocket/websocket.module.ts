import { Module } from '@nestjs/common';
import { EventsGateway } from './websocket.gateway';
import { BrokerModule } from '../broker/broker.module';

@Module({
    imports: [BrokerModule],
    providers: [EventsGateway],
})
export class WebSocketModule {}
