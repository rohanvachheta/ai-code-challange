import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum TransportStatus {
  SCHEDULED = 'SCHEDULED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  DELAYED = 'DELAYED'
}

export enum TransportType {
  OPEN_TRAILER = 'OPEN_TRAILER',
  ENCLOSED_TRAILER = 'ENCLOSED_TRAILER',
  FLATBED = 'FLATBED',
  SINGLE_CAR = 'SINGLE_CAR'
}

@Entity('transports')
export class Transport {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  transportId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  purchaseId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  carrierId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  offerId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  buyerId: string;

  @ApiProperty()
  @Column({ length: 200 })
  pickupLocation: string;

  @ApiProperty()
  @Column({ length: 200 })
  deliveryLocation: string;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  scheduledPickupDate: Date;

  @ApiProperty()
  @Column({ type: 'timestamp' })
  scheduledDeliveryDate: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  actualPickupDate: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryDate: Date;

  @ApiProperty({ enum: TransportStatus })
  @Column({
    type: 'enum',
    enum: TransportStatus,
    default: TransportStatus.SCHEDULED
  })
  status: TransportStatus;

  @ApiProperty({ enum: TransportType })
  @Column({
    type: 'enum',
    enum: TransportType,
    default: TransportType.OPEN_TRAILER
  })
  transportType: TransportType;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  transportCost: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distanceKm: number;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  trackingNumber: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  driverName: string;

  @ApiProperty()
  @Column({ length: 20, nullable: true })
  driverPhone: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}