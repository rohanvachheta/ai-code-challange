import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { Purchase } from '../purchases/entities/purchase.entity';

export interface PurchaseEvent {
  eventType: 'PurchaseCreated' | 'PurchaseUpdated';
  entityType: 'purchase';
  entityId: string;
  timestamp: string;
  payload: Purchase & {
    buyerDetails?: {
      userId: string;
      firstName: string;
      lastName: string;
      fullName: string;
      email: string;
      phone: string;
      userType: string;
    };
    sellerDetails?: {
      userId: string;
      firstName: string;
      lastName: string;
      fullName: string;
      email: string;
      phone: string;
      userType: string;
    };
  };
}

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'purchase-service',
      brokers: [this.configService.get('KAFKA_BROKER', 'kafka:9092')],
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      console.log('Kafka producer connected successfully');
    } catch (error) {
      console.error('Failed to connect Kafka producer:', error);
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
    } catch (error) {
      console.error('Error disconnecting Kafka producer:', error);
    }
  }

  async publishPurchaseCreated(purchase: Purchase, buyerDetails?: any, sellerDetails?: any): Promise<void> {
    const event: PurchaseEvent = {
      eventType: 'PurchaseCreated',
      entityType: 'purchase',
      entityId: purchase.purchaseId,
      timestamp: new Date().toISOString(),
      payload: {
        ...purchase,
        buyerDetails: buyerDetails ? {
          userId: buyerDetails.userId,
          firstName: buyerDetails.firstName,
          lastName: buyerDetails.lastName,
          fullName: `${buyerDetails.firstName} ${buyerDetails.lastName}`,
          email: buyerDetails.email,
          phone: buyerDetails.phone,
          userType: buyerDetails.userType
        } : null,
        sellerDetails: sellerDetails ? {
          userId: sellerDetails.userId,
          firstName: sellerDetails.firstName,
          lastName: sellerDetails.lastName,
          fullName: `${sellerDetails.firstName} ${sellerDetails.lastName}`,
          email: sellerDetails.email,
          phone: sellerDetails.phone,
          userType: sellerDetails.userType
        } : null
      },
    };

    await this.publishEvent('purchase-events', event);
  }

  async publishPurchaseUpdated(purchase: Purchase): Promise<void> {
    const event: PurchaseEvent = {
      eventType: 'PurchaseUpdated',
      entityType: 'purchase',
      entityId: purchase.purchaseId,
      timestamp: new Date().toISOString(),
      payload: purchase,
    };

    await this.publishEvent('purchase-events', event);
  }

  private async publishEvent(topic: string, event: PurchaseEvent): Promise<void> {
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
      
      console.log(`Event published: ${event.eventType} for purchase ${event.entityId}`);
    } catch (error) {
      console.error('Error publishing event:', error);
    }
  }
}