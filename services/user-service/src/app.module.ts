import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'user-db'),
        port: configService.get('DB_PORT', 5435),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'userdb'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // Only for development
        logging: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
})
export class AppModule {}