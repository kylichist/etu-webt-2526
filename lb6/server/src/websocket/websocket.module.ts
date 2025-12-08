import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './websocket.gateway';
import { BrokerModule } from '../broker/broker.module';

/**
 * WebSocketModule
 * - объявляет EventsGateway как провайдера
 * - импортирует BrokerModule через forwardRef, чтобы разрешить циклическую зависимость:
 *   EventsGateway инжектит BrokerService, а BrokerModule использует EventsGateway (broker.controller)
 */
@Module({
    imports: [forwardRef(() => BrokerModule)],
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class WebSocketModule {}
