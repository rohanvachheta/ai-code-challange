import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ElasticsearchModule, CacheModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}