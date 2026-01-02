import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsNumber, IsEnum, IsOptional, Length, Min, Max } from 'class-validator';
import { VehicleCondition } from '../entities/offer.entity';

export class CreateOfferDto {
  @ApiProperty({ description: 'Seller ID' })
  @IsUUID()
  sellerId: string;

  @ApiProperty({ description: 'Vehicle VIN (17 characters)', example: '1HGBH41JXMN109186' })
  @IsString()
  @Length(17, 17)
  vin: string;

  @ApiProperty({ description: 'Vehicle make', example: 'Toyota' })
  @IsString()
  @Length(1, 100)
  make: string;

  @ApiProperty({ description: 'Vehicle model', example: 'Camry' })
  @IsString()
  @Length(1, 100)
  model: string;

  @ApiProperty({ description: 'Vehicle year', example: 2020 })
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ description: 'Price in USD', example: 25000.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Vehicle location', example: 'San Francisco, CA' })
  @IsString()
  @Length(1, 200)
  location: string;

  @ApiProperty({ enum: VehicleCondition, description: 'Vehicle condition' })
  @IsEnum(VehicleCondition)
  condition: VehicleCondition;

  @ApiProperty({ description: 'Vehicle description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Vehicle mileage', required: false, example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mileage?: number;

  @ApiProperty({ description: 'Vehicle color', required: false, example: 'Blue' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  color?: string;
}