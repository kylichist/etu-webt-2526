import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';  // Добавить
import { join } from 'path';  // Добавить
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);  // Изменить тип
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors();

    app.useStaticAssets(join(__dirname, '..', '..', 'client', 'dist'));
    app.setBaseViewsDir(join(__dirname, '..', '..', 'client', 'dist'));
    app.setViewEngine('html');

    await app.listen(8000);
}
bootstrap();
