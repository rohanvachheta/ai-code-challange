import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsOptional, IsBoolean, IsPhoneNumber } from 'class-validator';
import { UserType } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ enum: UserType, description: 'Type of user account' })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ description: 'First name of the user' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the user' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Email address of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number of the user' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Street address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ description: 'State or province', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Postal/ZIP code', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiProperty({ description: 'Country', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Whether the user account is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}