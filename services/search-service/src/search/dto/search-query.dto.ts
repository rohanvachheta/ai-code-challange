import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsString, IsOptional, IsNumber, Min, Max, ValidateIf } from 'class-validator';

export enum UserType {
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  CARRIER = 'CARRIER',
  AGENT = 'AGENT'
}

export class SearchQueryDto {
  @ApiProperty({ enum: UserType, description: 'User type for role-based access control' })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ 
    description: 'Account ID of the user performing the search (optional for AGENT, required for others)',
    required: false 
  })
  @ValidateIf(o => o.userType !== UserType.AGENT)
  @IsUUID('4', { message: 'Account ID must be a valid UUID' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiProperty({ description: 'Search text query' })
  @IsString()
  searchText: string;

  @ApiProperty({ description: 'Page number for pagination', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Number of results per page', required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ description: 'Entity types to filter by', required: false })
  @IsOptional()
  @IsString({ each: true })
  entityTypes?: string[];

  @ApiProperty({ description: 'Status filter', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Minimum year filter', required: false })
  @IsOptional()
  @IsNumber()
  minYear?: number;

  @ApiProperty({ description: 'Maximum year filter', required: false })
  @IsOptional()
  @IsNumber()
  maxYear?: number;

  @ApiProperty({ description: 'Minimum price filter', required: false })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiProperty({ description: 'Maximum price filter', required: false })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({ description: 'Vehicle make filter', required: false })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiProperty({ description: 'Vehicle model filter', required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: 'Location filter', required: false })
  @IsOptional()
  @IsString()
  location?: string;
}

export class AutocompleteQueryDto {
  @ApiProperty({ description: 'Partial search text for autocomplete' })
  @IsString()
  searchText: string;

  @ApiProperty({ description: 'Specific field for suggestions', required: false })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiProperty({ description: 'Maximum number of suggestions', required: false, default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({ enum: UserType, description: 'User type for role-based access control' })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ 
    description: 'Account ID of the user performing the search (optional for AGENT, required for others)',
    required: false 
  })
  @ValidateIf(o => o.userType !== UserType.AGENT)
  @IsUUID('4', { message: 'Account ID must be a valid UUID' })
  @IsOptional()
  @IsString()
  accountId?: string;
}