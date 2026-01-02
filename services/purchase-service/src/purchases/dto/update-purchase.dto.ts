import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseDto } from './create-purchase.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PurchaseStatus } from '../entities/purchase.entity';

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {
  @ApiProperty({ enum: PurchaseStatus, description: 'Purchase status', required: false })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;
}