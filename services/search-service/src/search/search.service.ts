import { Injectable } from '@nestjs/common';
import { ElasticsearchService, GlobalSearchDocument } from '../elasticsearch/elasticsearch.service';
import { CacheService } from '../cache/cache.service';
import { SearchQueryDto, UserType, AutocompleteQueryDto } from './dto/search-query.dto';

export interface SearchResult {
  results: GlobalSearchDocument[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  aggregations?: any;
}

export interface AutocompleteResult {
  suggestions: string[];
}

@Injectable()
export class SearchService {
  private readonly synonyms = {
    'car': ['vehicle', 'automobile', 'auto'],
    'truck': ['pickup', 'lorry'],
    'suv': ['sport utility vehicle', 'crossover'],
    'sedan': ['saloon'],
    'coupe': ['coup'],
  };

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly cacheService: CacheService,
  ) {}

  async search(query: SearchQueryDto): Promise<SearchResult> {
    console.log('🔍 SEARCH REQUEST RECEIVED:', JSON.stringify(query, null, 2));
    
    // Normalize pagination parameters
    const page = query.page || 1;
    const limit = query.limit || 20;
    
    // Generate cache key
    const cacheKey = this.cacheService.generateSearchKey(
      query.userType,
      query.accountId || 'agent',
      query.searchText,
      {
        entityTypes: query.entityTypes,
        status: query.status,
        minYear: query.minYear,
        maxYear: query.maxYear,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        make: query.make,
        model: query.model,
        location: query.location,
      }
    );

    // Try to get from cache first
    // const cached = await this.cacheService.getCachedSearchResults(cacheKey);
    // if (cached) {
    //   console.log('Returning cached search results');
    //   return cached;
    // }

    // Build Elasticsearch query
    const esQuery = this.buildElasticsearchQuery(query, page, limit);
    
    try {
      const client = this.elasticsearchService.getClient();
      const response = await client.search({
        index: this.elasticsearchService.getIndexName(),
        ...esQuery,
      });

      const results: SearchResult = {
        results: response.hits.hits.map(hit => hit._source as GlobalSearchDocument),
        total: typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0,
        page: page,
        limit: limit,
        pages: Math.ceil((typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0) / limit),
        aggregations: response.aggregations,
      };

      console.log(`✅ Search completed: ${results.results.length} results, ${results.total} total`);

      // Cache the results for 5 minutes
      await this.cacheService.cacheSearchResults(cacheKey, results, 300);

      return results;
    } catch (error) {
      console.error('❌ Elasticsearch search error:', error);
      return {
        results: [],
        total: 0,
        page: page,
        limit: limit,
        pages: 0,
      };
    }
  }

  private buildElasticsearchQuery(query: SearchQueryDto, page: number, limit: number): any {
    console.log(`🔍 Building ES query: page=${page}, limit=${limit}`);
    
    const must: any[] = [];
    const filter: any[] = [];
    
    // For AGENT users, don't apply restrictive filters
    if (query.userType !== UserType.AGENT) {
      if (query.accountId) {
        this.addRoleBasedFilters(filter, query.userType, query.accountId);
      }
    }

    // Add text search - simplified to avoid field type conflicts
    if (query.searchText && query.searchText.trim()) {
      const searchText = query.searchText.trim();
      
      if (searchText === '*') {
        must.push({ match_all: {} });
      } else {
        // Use simple match query to avoid field type conflicts
        must.push({
          bool: {
            should: [
              {
                multi_match: {
                  query: searchText,
                  fields: ["searchableText^3", "location"],
                  type: "best_fields",
                  operator: "or"
                }
              },
              {
                term: {
                  "make.keyword": searchText.toUpperCase()
                }
              },
              {
                term: {
                  "model.keyword": searchText.toUpperCase()
                }
              },
              {
                term: {
                  "vin.keyword": searchText
                }
              },
              {
                wildcard: {
                  "vin.keyword": `*${searchText}*`
                }
              }
            ],
            minimum_should_match: 1
          }
        });
      }
    } else {
      must.push({ match_all: {} });
    }

    // Add entity type filter
    if (query.entityTypes && query.entityTypes.length > 0) {
      filter.push({
        terms: { entityType: query.entityTypes }
      });
    }

    // Add status filter
    if (query.status) {
      filter.push({
        term: { status: query.status }
      });
    }

    // Pagination with proper validation
    const from = Math.max(0, (page - 1) * limit);
    
    const esQuery = {
      from,
      size: limit,
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter
        }
      },
      sort: [
        { createdAt: { order: 'desc' } }
      ]
    };

    console.log('🔍 Final ES Query:', JSON.stringify(esQuery, null, 2));

    return esQuery;
  }

  private addRoleBasedFilters(filter: any[], userType: UserType, accountId?: string): void {
    switch (userType) {
      case UserType.SELLER:
        if (!accountId) {
          throw new Error('Account ID is required for SELLER user type');
        }
        filter.push({
          bool: {
            should: [
              { term: { 'permissions.sellerIds': accountId } },
              { term: { sellerId: accountId } }
            ]
          }
        });
        break;

      case UserType.BUYER:
        if (!accountId) {
          throw new Error('Account ID is required for BUYER user type');
        }
        filter.push({
          bool: {
            should: [
              { term: { 'permissions.buyerIds': accountId } },
              { term: { buyerId: accountId } },
              { 
                bool: {
                  must: [
                    { term: { entityType: 'offer' } },
                    { term: { status: 'ACTIVE' } }
                  ]
                }
              }
            ]
          }
        });
        break;

      case UserType.CARRIER:
        if (!accountId) {
          throw new Error('Account ID is required for CARRIER user type');
        }
        filter.push({
          bool: {
            should: [
              { term: { 'permissions.carrierIds': accountId } },
              { term: { carrierId: accountId } }
            ]
          }
        });
        break;

      case UserType.AGENT:
        // Agents can see all entities - no additional filters needed
        // No accountId validation required for agents
        break;
    }
  }

  private buildTextQuery(searchText: string): any {
    // Handle wildcard search
    if (searchText === '*') {
      return { match_all: {} };
    }

    const queries = [];

    // Simple match on searchableText (main text field)
    queries.push({
      match: {
        searchableText: {
          query: searchText,
          boost: 3
        }
      }
    });

    // Match on make and model (keyword fields)
    queries.push({
      term: {
        make: {
          value: searchText.toUpperCase(),
          boost: 2
        }
      }
    });

    queries.push({
      term: {
        model: {
          value: searchText.toUpperCase(),
          boost: 2
        }
      }
    });

    // Match on VIN
    queries.push({
      wildcard: {
        "vin.keyword": {
          value: `*${searchText.toUpperCase()}*`,
          boost: 1
        }
      }
    });

    return {
      bool: {
        should: queries,
        minimum_should_match: 1
      }
    };
  }

  private buildSynonymQueries(searchText: string): any[] {
    const queries = [];
    const lowerSearchText = searchText.toLowerCase();

    Object.entries(this.synonyms).forEach(([key, synonyms]) => {
      if (lowerSearchText.includes(key)) {
        synonyms.forEach(synonym => {
          queries.push({
            multi_match: {
              query: lowerSearchText.replace(key, synonym),
              fields: ['searchableText', 'make', 'model'],
              boost: 1.5
            }
          });
        });
      }

      synonyms.forEach(synonym => {
        if (lowerSearchText.includes(synonym)) {
          queries.push({
            multi_match: {
              query: lowerSearchText.replace(synonym, key),
              fields: ['searchableText', 'make', 'model'],
              boost: 1.5
            }
          });
        }
      });
    });

    return queries;
  }

  async autocomplete(query: AutocompleteQueryDto): Promise<AutocompleteResult> {
    try {
      const client = this.elasticsearchService.getClient();
      
      // Use suggest API for better autocomplete
      const response = await client.search({
        index: this.elasticsearchService.getIndexName(),
        body: {
          size: 0,
          suggest: {
            text_suggest: {
              prefix: query.searchText,
              completion: {
                field: 'searchableText',
                size: query.limit,
                skip_duplicates: true
              }
            }
          },
          aggs: {
            makes: {
              terms: {
                field: 'make.keyword',
                include: `.*${query.searchText}.*`,
                size: query.limit
              }
            },
            models: {
              terms: {
                field: 'model.keyword',
                include: `.*${query.searchText}.*`,
                size: query.limit
              }
            }
          }
        }
      });

      const suggestions = new Set<string>();

      // Add term suggestions from aggregations
      if (response.aggregations?.makes && 'buckets' in response.aggregations.makes) {
        (response.aggregations.makes as any).buckets.forEach((bucket: any) => {
          suggestions.add(bucket.key);
        });
      }

      if (response.aggregations?.models && 'buckets' in response.aggregations.models) {
        (response.aggregations.models as any).buckets.forEach((bucket: any) => {
          suggestions.add(bucket.key);
        });
      }

      return {
        suggestions: Array.from(suggestions).slice(0, query.limit)
      };
    } catch (error) {
      console.error('Autocomplete error:', error);
      return { suggestions: [] };
    }
  }

  async getStatistics(): Promise<any> {
    try {
      const client = this.elasticsearchService.getClient();
      const response = await client.search({
        index: this.elasticsearchService.getIndexName(),
        body: {
          size: 0,
          aggs: {
            totalDocuments: {
              value_count: { field: 'entityId' }
            },
            entityTypeCounts: {
              terms: { field: 'entityType' }
            },
            statusCounts: {
              terms: { field: 'status' }
            },
            avgPrice: {
              avg: { field: 'price' }
            },
            priceStats: {
              stats: { field: 'price' }
            }
          }
        }
      });

      return {
        total: (response.aggregations.totalDocuments as any)?.value || 0,
        entityTypes: (response.aggregations.entityTypeCounts as any)?.buckets || [],
        statuses: (response.aggregations.statusCounts as any)?.buckets || [],
        averagePrice: (response.aggregations.avgPrice as any)?.value || 0,
        priceStatistics: response.aggregations.priceStats
      };
    } catch (error) {
      console.error('Statistics error:', error);
      return {
        total: 0,
        entityTypes: [],
        statuses: [],
        averagePrice: 0,
        priceStatistics: {}
      };
    }
  }
}