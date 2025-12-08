import {Module} from '@nestjs/common';
import {HttpModule} from '@nestjs/axios';
import {BrokerController} from './broker.controller';
import {BrokerService} from './broker.service';

@Module({
    imports: [HttpModule],
    controllers: [BrokerController],
    providers: [BrokerService],
    exports: [BrokerService],
})
export class BrokerModule {
}
