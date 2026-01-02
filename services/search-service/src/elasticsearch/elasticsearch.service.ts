import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';

export interface GlobalSearchDocument {
  entityType: 'offer' | 'purchase' | 'transport';
  entityId: string;
  vin?: string;
  sellerId?: string;
  buyerId?: string;
  carrierId?: string;
  offerId?: string;
  purchaseId?: string;
  status: string;
  searchableText: string;
  createdAt: string;
  updatedAt: string;
  permissions: {
    sellerIds: string[];
    buyerIds: string[];
    carrierIds: string[];
  };
  // Entity-specific fields
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  location?: string;
  condition?: string;
  purchasePrice?: number;
  paymentMethod?: string;
  transportCost?: number;
  pickupLocation?: string;
  deliveryLocation?: string;
  scheduledPickupDate?: string;
  scheduledDeliveryDate?: string;
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private client: ElasticsearchClient;
  private readonly indexName = 'global_search';

  constructor(private readonly configService: ConfigService) {
    const elasticsearchUrl = this.configService.get('ELASTICSEARCH_URL', 'http://localhost:9200');
    this.client = new ElasticsearchClient({
      node: elasticsearchUrl,
    });
  }

  async onModuleInit() {
    await this.connectToElasticsearch();
    await this.createIndexIfNotExists();
  }

  private async connectToElasticsearch(): Promise<void> {
    try {
      await this.client.ping();
      console.log('Connected to Elasticsearch');
    } catch (error) {
      console.error('Failed to connect to Elasticsearch:', error);
      // In production, you might want to exit the process
    }
  }

  private async createIndexIfNotExists(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          settings: {
            analysis: {
              analyzer: {
                autocomplete_analyzer: {
                  type: 'custom',
                  tokenizer: 'autocomplete_tokenizer',
                  filter: ['lowercase', 'stop']
                },
                search_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop']
                }
              },
              tokenizer: {
                autocomplete_tokenizer: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 10,
                  token_chars: ['letter', 'digit']
                }
              }
            }
          },
          mappings: {
            properties: {
              vin: { type: 'keyword' },
              entityType: { type: 'keyword' },
              entityId: { type: 'keyword' },
              status: { type: 'keyword' },
              searchableText: { 
                type: 'text',
                analyzer: 'autocomplete_analyzer',
                search_analyzer: 'search_analyzer'
              },
              make: { type: 'keyword' },
              model: { type: 'keyword' },
              year: { type: 'integer' },
              price: { type: 'float' },
              location: { type: 'text' },
              sellerId: { type: 'keyword' },
              buyerId: { type: 'keyword' },
              carrierId: { type: 'keyword' },
              vehicleId: { type: 'keyword' },
              offerId: { type: 'keyword' },
              purchaseId: { type: 'keyword' },
              paymentMethod: { type: 'keyword' },
              condition: { type: 'keyword' },
              pickupLocation: { type: 'text' },
              deliveryLocation: { type: 'text' },
              trackingNumber: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
              validUntil: { type: 'date' },
              completedAt: { type: 'date' },
              scheduledPickupDate: { type: 'date' },
              scheduledDeliveryDate: { type: 'date' }
            }
          }
        });
        
        console.log(`Created Elasticsearch index: ${this.indexName}`);
      }
    } catch (error) {
      console.error('Failed to create Elasticsearch index:', error);
      // In production, you might want to exit the process
    }
  }

  async indexDocument(document: GlobalSearchDocument): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: `${document.entityType}_${document.entityId}`,
        document: document,
      });

      console.log(`Indexed document: ${document.entityType}_${document.entityId}`);
    } catch (error) {
      console.error('Failed to index document:', error);
    }
  }

  async bulkIndex(documents: GlobalSearchDocument[]): Promise<void> {
    if (documents.length === 0) return;

    const operations = documents.flatMap(doc => [
      { index: { _index: this.indexName, _id: `${doc.entityType}_${doc.entityId}` } },
      doc
    ]);

    try {
      const response = await this.client.bulk({ operations });

      if (response.errors) {
        console.error('Bulk index errors:', response.items?.filter((item: any) => item.index?.error));
      } else {
        console.log(`Bulk indexed ${documents.length} documents`);
      }
    } catch (error) {
      console.error('Failed to bulk index documents:', error);
    }
  }

  async deleteDocument(entityType: string, entityId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: `${entityType}_${entityId}`,
      });

      console.log(`Deleted document: ${entityType}_${entityId}`);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  }

  getClient(): ElasticsearchClient {
    return this.client;
  }

  getIndexName(): string {
    return this.indexName;
  }
}