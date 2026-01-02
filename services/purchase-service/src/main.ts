import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: ['http://localhost:3100', 'http://localhost:3101', 'http://localhost:8080', 'http://localhost:3000', 'http://localhost:8081'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
  });
  
  const config = new DocumentBuilder()
    .setTitle('Purchase Service API')
    .setDescription('Vehicle Purchase Management Service')
    .setVersion('1.0')
    .addTag('purchases')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3002);
  console.log('Purchase Service running on port 3002');
}
bootstrap();