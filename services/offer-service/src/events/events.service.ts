import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { Offer } from '../offers/entities/offer.entity';

export interface OfferEvent {
  eventType: 'OfferCreated' | 'OfferUpdated';
  entityType: 'offer';
  entityId: string;
  timestamp: string;
  payload: Offer;
}

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    const kafkaBroker = process.env.KAFKA_BROKER || 'kafka:9092';
    console.log('🔗 Connecting to Kafka broker:', kafkaBroker);
    this.kafka = new Kafka({
      clientId: 'offer-service',
      brokers: [kafkaBroker],
      retry: {
        initialRetryTime: 100,
        retries: 8
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      console.log('Kafka producer connected successfully');
    } catch (error) {
      console.error('Failed to connect Kafka producer:', error);
      // In production, you might want to fail the service startup
      // For now, we'll continue without Kafka
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
    } catch (error) {
      console.error('Error disconnecting Kafka producer:', error);
    }
  }

  async publishOfferCreated(offer: Offer): Promise<void> {
    const event: OfferEvent = {
      eventType: 'OfferCreated',
      entityType: 'offer',
      entityId: offer.offerId,
      timestamp: new Date().toISOString(),
      payload: offer,
    };

    await this.publishEvent('offer-events', event);
  }

  async publishOfferUpdated(offer: Offer): Promise<void> {
    const event: OfferEvent = {
      eventType: 'OfferUpdated',
      entityType: 'offer',
      entityId: offer.offerId,
      timestamp: new Date().toISOString(),
      payload: offer,
    };

    await this.publishEvent('offer-events', event);
  }

  private async publishEvent(topic: string, event: OfferEvent): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.entityId,
            value: JSON.stringify(event),
            headers: {
              eventType: event.eventType,
              entityType: event.entityType,
            },
          },
        ],
      });
      
      console.log(`Event published: ${event.eventType} for offer ${event.entityId}`);
    } catch (error) {
      console.error('Error publishing event:', error);
      // In production, you might want to implement retry logic or dead letter queue
    }
  }
}