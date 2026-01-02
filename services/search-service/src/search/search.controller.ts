import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService, SearchResult, AutocompleteResult } from './search.service';
import { SearchQueryDto, AutocompleteQueryDto, UserType } from './dto/search-query.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: 'Search entities with role-based access control' })
  @ApiResponse({ status: 200, description: 'Search results with pagination and aggregations' })
  async search(@Body() query: SearchQueryDto): Promise<SearchResult> {
    return this.searchService.search(query);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiQuery({ name: 'searchText', type: String, description: 'Partial search text' })
  @ApiQuery({ name: 'field', type: String, required: false, description: 'Specific field for suggestions' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Maximum suggestions' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions' })
  async autocomplete(
    @Query('searchText') searchText: string,
    @Query('field') field?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ): Promise<AutocompleteResult> {
    const query: AutocompleteQueryDto = {
      searchText,
      userType: UserType.AGENT,
      field,
      limit,
    };
    return this.searchService.autocomplete(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get search index statistics' })
  @ApiResponse({ status: 200, description: 'Search index statistics' })
  async getStatistics(): Promise<any> {
    return this.searchService.getStatistics();
  }

  // Convenience endpoints for different user types
  @Post('seller')
  @ApiOperation({ summary: 'Search for sellers (shows own offers and related data)' })
  @ApiResponse({ status: 200, description: 'Search results filtered for seller' })
  async searchAsSeller(
    @Body() body: { accountId: string; searchText: string; page?: number; limit?: number; filters?: any }
  ): Promise<SearchResult> {
    const query: SearchQueryDto = {
      userType: UserType.SELLER,
      accountId: body.accountId,
      searchText: body.searchText,
      page: body.page || 1,
      limit: body.limit || 20,
      ...body.filters,
    };
    return this.searchService.search(query);
  }

  @Post('buyer')
  @ApiOperation({ summary: 'Search for buyers (shows available offers and own purchases)' })
  @ApiResponse({ status: 200, description: 'Search results filtered for buyer' })
  async searchAsBuyer(
    @Body() body: { accountId: string; searchText: string; page?: number; limit?: number; filters?: any }
  ): Promise<SearchResult> {
    const query: SearchQueryDto = {
      userType: UserType.BUYER,
      accountId: body.accountId,
      searchText: body.searchText,
      page: body.page || 1,
      limit: body.limit || 20,
      ...body.filters,
    };
    return this.searchService.search(query);
  }

  @Post('carrier')
  @ApiOperation({ summary: 'Search for carriers (shows assigned transports and related data)' })
  @ApiResponse({ status: 200, description: 'Search results filtered for carrier' })
  async searchAsCarrier(
    @Body() body: { accountId: string; searchText: string; page?: number; limit?: number; filters?: any }
  ): Promise<SearchResult> {
    const query: SearchQueryDto = {
      userType: UserType.CARRIER,
      accountId: body.accountId,
      searchText: body.searchText,
      page: body.page || 1,
      limit: body.limit || 20,
      ...body.filters,
    };
    return this.searchService.search(query);
  }

  @Post('agent')
  @ApiOperation({ summary: 'Search for agents (shows all entities)' })
  @ApiResponse({ status: 200, description: 'Search results with full access' })
  async searchAsAgent(
    @Body() body: { accountId: string; searchText: string; page?: number; limit?: number; filters?: any }
  ): Promise<SearchResult> {
    const query: SearchQueryDto = {
      userType: UserType.AGENT,
      accountId: body.accountId,
      searchText: body.searchText,
      page: body.page || 1,
      limit: body.limit || 20,
      ...body.filters,
    };
    return this.searchService.search(query);
  }
}