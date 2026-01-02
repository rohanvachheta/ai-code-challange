import { PartialType } from '@nestjs/swagger';
import { CreateOfferDto } from './create-offer.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OfferStatus } from '../entities/offer.entity';

export class UpdateOfferDto extends PartialType(CreateOfferDto) {
  @ApiProperty({ enum: OfferStatus, description: 'Offer status', required: false })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;
}