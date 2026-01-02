import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { IndexModule } from '../index/index.module';

@Module({
  imports: [IndexModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}