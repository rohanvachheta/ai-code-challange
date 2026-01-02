import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { IndexService } from '../index/index.service';

interface BaseEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  payload: any;
}

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;
  private readonly topics = ['offer-events', 'purchase-events', 'transport-events'];

  constructor(
    private readonly configService: ConfigService,
    private readonly indexService: IndexService,
  ) {
    const kafkaBroker = process.env.KAFKA_BROKER || 'kafka:9092';
    console.log('🔗 Search service connecting to Kafka broker:', kafkaBroker);
    this.kafka = new Kafka({
      clientId: 'search-service-consumer',
      brokers: [kafkaBroker],
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });
    this.consumer = this.kafka.consumer({ groupId: 'search-service-group' });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      console.log('Kafka consumer connected successfully');

      // Subscribe to all topics
      for (const topic of this.topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      console.log(`Subscribed to topics: ${this.topics.join(', ')}`);
    } catch (error) {
      console.error('Failed to connect Kafka consumer:', error);
      // In production, you might want to implement retry logic
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
    } catch (error) {
      console.error('Error disconnecting Kafka consumer:', error);
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    try {
      const message = payload.message;
      const event: BaseEvent = JSON.parse(message.value?.toString() || '{}');
      
      console.log(`Processing event: ${event.eventType} for ${event.entityType} ${event.entityId}`);

      switch (event.entityType) {
        case 'offer':
          await this.handleOfferEvent(event);
          break;
        case 'purchase':
          await this.handlePurchaseEvent(event);
          break;
        case 'transport':
          await this.handleTransportEvent(event);
          break;
        default:
          console.warn(`Unknown entity type: ${event.entityType}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // In production, you might want to send to dead letter queue
    }
  }

  private async handleOfferEvent(event: BaseEvent): Promise<void> {
    switch (event.eventType) {
      case 'OfferCreated':
      case 'OfferUpdated':
        await this.indexService.indexOffer(event.payload);
        break;
      case 'OfferDeleted':
        await this.indexService.deleteDocument('offer', event.entityId);
        break;
      default:
        console.warn(`Unknown offer event type: ${event.eventType}`);
    }
  }

  private async handlePurchaseEvent(event: BaseEvent): Promise<void> {
    switch (event.eventType) {
      case 'PurchaseCreated':
      case 'PurchaseUpdated':
        await this.indexService.indexPurchase(event.payload);
        break;
      case 'PurchaseDeleted':
        await this.indexService.deleteDocument('purchase', event.entityId);
        break;
      default:
        console.warn(`Unknown purchase event type: ${event.eventType}`);
    }
  }

  private async handleTransportEvent(event: BaseEvent): Promise<void> {
    switch (event.eventType) {
      case 'TransportCreated':
      case 'TransportUpdated':
        await this.indexService.indexTransport(event.payload);
        break;
      case 'TransportDeleted':
        await this.indexService.deleteDocument('transport', event.entityId);
        break;
      default:
        console.warn(`Unknown transport event type: ${event.eventType}`);
    }
  }

  // Method to manually trigger reindexing (useful for recovery)
  async triggerReindex(): Promise<void> {
    console.log('Manual reindex triggered');
    await this.indexService.reindexAll();
  }
}