import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { Purchase } from './entities/purchase.entity';
import { EventsModule } from '../events/events.module';
import { OfferService } from './offer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase]),
    EventsModule,
  ],
  controllers: [PurchasesController],
  providers: [PurchasesService, OfferService],
  exports: [PurchasesService],
})
export class PurchasesModule {}