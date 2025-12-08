import {Module} from '@nestjs/common';
import {HttpModule} from '@nestjs/axios';
import {BrokerModule} from './broker/broker.module';
import {WebSocketModule} from './websocket/websocket.module';

@Module({
    imports: [HttpModule, BrokerModule, WebSocketModule],
})
export class AppModule {
}
