import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum PurchaseStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  FINANCING = 'FINANCING',
  CASH = 'CASH',
  TRADE_IN = 'TRADE_IN'
}

@Entity('purchases')
export class Purchase {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  purchaseId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  offerId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  buyerId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  sellerId: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  purchasePrice: number;

  @ApiProperty({ enum: PurchaseStatus })
  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.PENDING
  })
  status: PurchaseStatus;

  @ApiProperty({ enum: PaymentMethod })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CREDIT_CARD
  })
  paymentMethod: PaymentMethod;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  taxRate: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  taxAmount: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}