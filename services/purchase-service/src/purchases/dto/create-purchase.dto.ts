import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../entities/purchase.entity';

export class CreatePurchaseDto {
  @ApiProperty({ description: 'Offer ID to purchase' })
  @IsUUID()
  offerId: string;

  @ApiProperty({ description: 'Buyer ID' })
  @IsUUID()
  buyerId: string;

  @ApiProperty({ description: 'Seller ID' })
  @IsUUID()
  sellerId: string;

  @ApiProperty({ description: 'Purchase price in USD', example: 25000.00 })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Tax rate percentage', required: false, example: 8.25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;
}