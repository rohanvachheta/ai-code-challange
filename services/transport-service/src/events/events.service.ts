import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { Transport } from '../transports/entities/transport.entity';

export interface TransportEvent {
  eventType: 'TransportCreated' | 'TransportUpdated';
  entityType: 'transport';
  entityId: string;
  timestamp: string;
  payload: Transport;
}

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'transport-service',
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

  async publishTransportCreated(transport: Transport): Promise<void> {
    const event: TransportEvent = {
      eventType: 'TransportCreated',
      entityType: 'transport',
      entityId: transport.transportId,
      timestamp: new Date().toISOString(),
      payload: transport,
    };

    await this.publishEvent('transport-events', event);
  }

  async publishTransportUpdated(transport: Transport): Promise<void> {
    const event: TransportEvent = {
      eventType: 'TransportUpdated',
      entityType: 'transport',
      entityId: transport.transportId,
      timestamp: new Date().toISOString(),
      payload: transport,
    };

    await this.publishEvent('transport-events', event);
  }

  private async publishEvent(topic: string, event: TransportEvent): Promise<void> {
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
      
      console.log(`Event published: ${event.eventType} for transport ${event.entityId}`);
    } catch (error) {
      console.error('Error publishing event:', error);
      // In production, you might want to implement retry logic or dead letter queue
    }
  }
}