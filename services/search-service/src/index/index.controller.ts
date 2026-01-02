import {
  Controller,
  Post,
  Body,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IndexService } from './index.service';

@ApiTags('index')
@Controller('index')
export class IndexController {
  constructor(private readonly indexService: IndexService) {}

  @Post('offer')
  @ApiOperation({ summary: 'Index a single offer document' })
  @ApiResponse({ status: 201, description: 'Offer indexed successfully' })
  async indexOffer(@Body() offer: any): Promise<void> {
    await this.indexService.indexOffer(offer);
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Index a single purchase document' })
  @ApiResponse({ status: 201, description: 'Purchase indexed successfully' })
  async indexPurchase(@Body() purchase: any): Promise<void> {
    await this.indexService.indexPurchase(purchase);
  }

  @Post('transport')
  @ApiOperation({ summary: 'Index a single transport document' })
  @ApiResponse({ status: 201, description: 'Transport indexed successfully' })
  async indexTransport(@Body() transport: any): Promise<void> {
    await this.indexService.indexTransport(transport);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk index multiple documents' })
  @ApiResponse({ status: 201, description: 'Documents indexed successfully' })
  async bulkIndex(@Body() body: { documents: { type: string; data: any }[] }): Promise<void> {
    await this.indexService.bulkIndex(body.documents);
  }

  @Delete(':entityType/:entityId')
  @ApiOperation({ summary: 'Delete a document from the index' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  async deleteDocument(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<void> {
    await this.indexService.deleteDocument(entityType, entityId);
  }

  @Post('reindex')
  @ApiOperation({ summary: 'Trigger full reindex operation' })
  @ApiResponse({ status: 201, description: 'Reindex operation started' })
  async reindexAll(): Promise<void> {
    await this.indexService.reindexAll();
  }
}