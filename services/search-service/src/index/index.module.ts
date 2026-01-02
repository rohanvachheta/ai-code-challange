import { Module } from '@nestjs/common';
import { IndexService } from './index.service';
import { IndexController } from './index.controller';
import { ElasticsearchModule } from '../elasticsearch/elasticsearch.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ElasticsearchModule, CacheModule],
  controllers: [IndexController],
  providers: [IndexService],
  exports: [IndexService],
})
export class IndexModule {}