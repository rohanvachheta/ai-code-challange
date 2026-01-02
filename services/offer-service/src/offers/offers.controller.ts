import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Offer, OfferStatus } from './entities/offer.entity';

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle offer' })
  @ApiResponse({ status: 201, description: 'Offer created successfully', type: Offer })
  create(@Body() createOfferDto: CreateOfferDto): Promise<Offer> {
    return this.offersService.create(createOfferDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all offers with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sellerId', required: false, type: String, description: 'Filter by seller ID' })
  @ApiResponse({ status: 200, description: 'List of offers with pagination info' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.offersService.findAll(page, limit, sellerId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get offer statistics' })
  @ApiResponse({ status: 200, description: 'Offer statistics' })
  getStatistics() {
    return this.offersService.getStatistics();
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get offers by status' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of offers by status' })
  findByStatus(
    @Param('status') status: OfferStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.offersService.getOffersByStatus(status, page, limit);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get offers by seller ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of offers by seller' })
  findBySeller(
    @Param('sellerId') sellerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.offersService.findBySeller(sellerId, page, limit);
  }

  @Get('vin/:vin')
  @ApiOperation({ summary: 'Get offers by VIN' })
  @ApiResponse({ status: 200, description: 'List of offers with matching VIN' })
  findByVin(@Param('vin') vin: string): Promise<Offer[]> {
    return this.offersService.findByVin(vin);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get offer by ID' })
  @ApiResponse({ status: 200, description: 'Offer found', type: Offer })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  findOne(@Param('id') id: string): Promise<Offer> {
    return this.offersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an offer' })
  @ApiResponse({ status: 200, description: 'Offer updated successfully', type: Offer })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  update(@Param('id') id: string, @Body() updateOfferDto: UpdateOfferDto): Promise<Offer> {
    return this.offersService.update(id, updateOfferDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an offer (mark as withdrawn)' })
  @ApiResponse({ status: 200, description: 'Offer removed successfully' })
  @ApiResponse({ status: 404, description: 'Offer not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.offersService.remove(id);
  }
}