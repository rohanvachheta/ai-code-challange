import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransportsService } from './transports.service';
import { TransportsController } from './transports.controller';
import { Transport } from './entities/transport.entity';
import { EventsModule } from '../events/events.module';
import { PurchaseService } from './purchase.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transport]),
    EventsModule,
  ],
  controllers: [TransportsController],
  providers: [TransportsService, PurchaseService],
  exports: [TransportsService],
})
export class TransportsModule {}