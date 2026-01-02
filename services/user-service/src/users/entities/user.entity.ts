import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserType {
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  CARRIER = 'CARRIER',
  AGENT = 'AGENT'
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['phone'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the user' })
  userId: string;

  @Column({ type: 'enum', enum: UserType })
  @ApiProperty({ enum: UserType, description: 'Type of user account' })
  userType: UserType;

  @Column({ length: 100 })
  @ApiProperty({ description: 'First name of the user' })
  firstName: string;

  @Column({ length: 100 })
  @ApiProperty({ description: 'Last name of the user' })
  lastName: string;

  @Column({ length: 200, unique: true })
  @ApiProperty({ description: 'Email address of the user' })
  email: string;

  @Column({ length: 20 })
  @ApiProperty({ description: 'Phone number of the user' })
  phone: string;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: 'Street address', required: false })
  address?: string;

  @Column({ length: 100, nullable: true })
  @ApiProperty({ description: 'City', required: false })
  city?: string;

  @Column({ length: 50, nullable: true })
  @ApiProperty({ description: 'State or province', required: false })
  state?: string;

  @Column({ length: 20, nullable: true })
  @ApiProperty({ description: 'Postal/ZIP code', required: false })
  zipCode?: string;

  @Column({ length: 100, nullable: true })
  @ApiProperty({ description: 'Country', required: false })
  country?: string;

  @Column({ default: true })
  @ApiProperty({ description: 'Whether the user account is active' })
  isActive: boolean;

  @CreateDateColumn()
  @ApiProperty({ description: 'Timestamp when user was created' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Timestamp when user was last updated' })
  updatedAt: Date;

  // Computed property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Computed property for formatted address
  get formattedAddress(): string {
    const parts = [this.address, this.city, this.state, this.zipCode, this.country].filter(Boolean);
    return parts.join(', ');
  }
}