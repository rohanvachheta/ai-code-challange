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
              { term: { 'permissions.sellerIds.keyword': accountId } },
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
              { term: { 'permissions.buyerIds.keyword': accountId } },
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
              { term: { 'permissions.carrierIds.keyword': accountId } },
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
      const searchText = query.searchText.toLowerCase();
      
      // Enhanced search with fuzzy matching and better scoring
      const response = await client.search({
        index: this.elasticsearchService.getIndexName(),
        body: {
          size: 0,
          query: {
            bool: {
              should: [
                // Exact phrase match (highest priority)
                {
                  multi_match: {
                    query: searchText,
                    fields: ['make.keyword^4', 'model.keyword^4', 'vin.keyword^3'],
                    type: 'phrase',
                    boost: 5
                  }
                },
                // Prefix match (high priority)
                {
                  multi_match: {
                    query: searchText,
                    fields: ['make^3', 'model^3', 'vin^2'],
                    type: 'phrase_prefix',
                    boost: 4
                  }
                },
                // Fuzzy match for typos (medium priority)
                {
                  multi_match: {
                    query: searchText,
                    fields: ['make^2', 'model^2', 'vin^1.5'],
                    fuzziness: 'AUTO',
                    boost: 3
                  }
                },
                // Wildcard for partial matches
                {
                  wildcard: {
                    'make.keyword': {
                      value: `*${searchText}*`,
                      case_insensitive: true,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    'model.keyword': {
                      value: `*${searchText}*`,
                      case_insensitive: true,
                      boost: 2
                    }
                  }
                },
                {
                  wildcard: {
                    'vin.keyword': {
                      value: `*${searchText.toUpperCase()}*`,
                      case_insensitive: true,
                      boost: 1.5
                    }
                  }
                },
                // Search in searchableText for broader matches
                {
                  match: {
                    searchableText: {
                      query: searchText,
                      fuzziness: 'AUTO',
                      boost: 1
                    }
                  }
                }
              ],
              minimum_should_match: 1
            }
          },
          aggs: {
            makes: {
              terms: {
                field: 'make.keyword',
                size: query.limit,
                order: { _count: 'desc' }
              }
            },
            models: {
              terms: {
                field: 'model.keyword',
                size: query.limit,
                order: { _count: 'desc' }
              }
            },
            vins: {
              terms: {
                field: 'vin.keyword',
                size: Math.min(query.limit, 5), // Limit VINs as they are specific
                order: { _count: 'desc' }
              }
            },
            locations: {
              terms: {
                field: 'location.keyword',
                size: Math.min(query.limit, 3), // Limit locations
                order: { _count: 'desc' }
              }
            }
          }
        }
      });

      const suggestions: Array<{
        text: string;
        type: string;
        count: number;
        score: number;
      }> = [];

      // Add suggestions with type and relevance scoring
      const addSuggestions = (buckets: any[], type: string, baseScore: number) => {
        buckets.forEach((bucket: any) => {
          const text = bucket.key.toLowerCase();
          const searchLower = searchText.toLowerCase();
          
          // Calculate relevance score based on match quality
          let score = baseScore;
          
          if (text === searchLower) {
            score += 50; // Exact match bonus
          } else if (text.startsWith(searchLower)) {
            score += 30; // Prefix match bonus
          } else if (text.includes(searchLower)) {
            score += 20; // Contains match bonus
          } else {
            // Fuzzy match - calculate similarity
            const similarity = this.calculateStringSimilarity(searchLower, text);
            score += Math.round(similarity * 15);
          }
          
          suggestions.push({
            text: bucket.key,
            type,
            count: bucket.doc_count,
            score
          });
        });
      };

      // Process aggregation results with different base scores
      if (response.aggregations?.makes && 'buckets' in response.aggregations.makes) {
        addSuggestions((response.aggregations.makes as any).buckets, 'make', 100);
      }

      if (response.aggregations?.models && 'buckets' in response.aggregations.models) {
        addSuggestions((response.aggregations.models as any).buckets, 'model', 90);
      }

      if (response.aggregations?.vins && 'buckets' in response.aggregations.vins) {
        addSuggestions((response.aggregations.vins as any).buckets, 'vin', 110); // VINs get highest priority
      }

      if (response.aggregations?.locations && 'buckets' in response.aggregations.locations) {
        addSuggestions((response.aggregations.locations as any).buckets, 'location', 80);
      }

      // Sort by relevance score and remove duplicates
      const uniqueSuggestions = suggestions
        .sort((a, b) => b.score - a.score)
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
        )
        .slice(0, query.limit);

      return {
        suggestions: uniqueSuggestions.map(s => s.text)
      };
    } catch (error) {
      console.error('Autocomplete error:', error);
      return { suggestions: [] };
    }
  }

  // Helper method for string similarity calculation
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const maxLength = Math.max(str1.length, str2.length);
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  }

  // Levenshtein distance calculation for fuzzy matching
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
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