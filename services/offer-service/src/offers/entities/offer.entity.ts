import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum OfferStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED'
}

export enum VehicleCondition {
  NEW = 'NEW',
  USED = 'USED',
  CERTIFIED_PRE_OWNED = 'CERTIFIED_PRE_OWNED',
  DAMAGED = 'DAMAGED'
}

@Entity('offers')
export class Offer {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  offerId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  sellerId: string;

  @ApiProperty()
  @Column({ length: 17, unique: true })
  vin: string;

  @ApiProperty()
  @Column({ length: 100 })
  make: string;

  @ApiProperty()
  @Column({ length: 100 })
  model: string;

  @ApiProperty()
  @Column({ type: 'integer' })
  year: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty()
  @Column({ length: 200 })
  location: string;

  @ApiProperty({ enum: VehicleCondition })
  @Column({
    type: 'enum',
    enum: VehicleCondition,
    default: VehicleCondition.USED
  })
  condition: VehicleCondition;

  @ApiProperty({ enum: OfferStatus })
  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.ACTIVE
  })
  status: OfferStatus;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty()
  @Column({ type: 'integer', nullable: true })
  mileage: number;

  @ApiProperty()
  @Column({ length: 50, nullable: true })
  color: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}