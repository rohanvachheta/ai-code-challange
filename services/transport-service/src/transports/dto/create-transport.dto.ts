import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNumber, IsEnum, IsOptional, IsDateString, Length, Min } from 'class-validator';
import { TransportType } from '../entities/transport.entity';

export class CreateTransportDto {
  @ApiProperty({ description: 'Purchase ID to transport' })
  @IsUUID()
  purchaseId: string;

  @ApiProperty({ description: 'Carrier ID' })
  @IsUUID()
  carrierId: string;

  @ApiProperty({ description: 'Offer ID' })
  @IsUUID()
  offerId: string;

  @ApiProperty({ description: 'Buyer ID' })
  @IsUUID()
  buyerId: string;

  @ApiProperty({ description: 'Pickup location', example: 'San Francisco, CA' })
  @IsString()
  @Length(1, 200)
  pickupLocation: string;

  @ApiProperty({ description: 'Delivery location', example: 'Los Angeles, CA' })
  @IsString()
  @Length(1, 200)
  deliveryLocation: string;

  @ApiProperty({ description: 'Scheduled pickup date', example: '2024-01-15T10:00:00Z' })
  @IsDateString()
  scheduledPickupDate: string;

  @ApiProperty({ description: 'Scheduled delivery date', example: '2024-01-17T15:00:00Z' })
  @IsDateString()
  scheduledDeliveryDate: string;

  @ApiProperty({ enum: TransportType, description: 'Transport type' })
  @IsEnum(TransportType)
  transportType: TransportType;

  @ApiProperty({ description: 'Transport cost in USD', example: 1200.00 })
  @IsNumber()
  @Min(0)
  transportCost: number;

  @ApiProperty({ description: 'Distance in kilometers', required: false, example: 615.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceKm?: number;

  @ApiProperty({ description: 'Special transport instructions', required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiProperty({ description: 'Driver name', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  driverName?: string;

  @ApiProperty({ description: 'Driver phone number', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  driverPhone?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}