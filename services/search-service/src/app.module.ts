import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchModule } from './search/search.module';
import { IndexModule } from './index/index.module';
import { EventsModule } from './events/events.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { CacheModule } from './cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ElasticsearchModule,
    CacheModule,
    SearchModule,
    IndexModule,
    EventsModule,
  ],
})
export class AppModule {}