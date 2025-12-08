import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors();

    const clientDist = join(__dirname, '..', '..', 'client', 'dist');
    console.log(clientDist)
    app.useStaticAssets(clientDist);
    app.setBaseViewsDir(clientDist);
    app.setViewEngine('html');

    await app.listen(8000);
}
bootstrap();
