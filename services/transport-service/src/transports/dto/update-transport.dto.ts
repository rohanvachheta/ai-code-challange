import { PartialType } from '@nestjs/swagger';
import { CreateTransportDto } from './create-transport.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { TransportStatus } from '../entities/transport.entity';

export class UpdateTransportDto extends PartialType(CreateTransportDto) {
  @ApiProperty({ enum: TransportStatus, description: 'Transport status', required: false })
  @IsOptional()
  @IsEnum(TransportStatus)
  status?: TransportStatus;

  @ApiProperty({ description: 'Actual pickup date', required: false })
  @IsOptional()
  @IsDateString()
  actualPickupDate?: string;

  @ApiProperty({ description: 'Actual delivery date', required: false })
  @IsOptional()
  @IsDateString()
  actualDeliveryDate?: string;

  @ApiProperty({ description: 'Tracking number', required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}