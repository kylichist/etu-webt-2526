import { Module, forwardRef } from '@nestjs/common';
import { BrokerService } from './broker.service';
import { BrokerController } from './broker.controller';
import { WebSocketModule } from '../websocket/websocket.module';
import { HttpModule } from '@nestjs/axios';

/**
 * BrokerModule
 * - импортирует HttpModule, чтобы HttpService был доступен провайдерам модуля
 * - импортирует WebSocketModule через forwardRef чтобы разрешить циклическую зависимость
 */
@Module({
    imports: [forwardRef(() => WebSocketModule), HttpModule],
    controllers: [BrokerController],
    providers: [BrokerService],
    exports: [BrokerService],
})
export class BrokerModule {}
