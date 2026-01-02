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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';

@ApiTags('purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle purchase' })
  @ApiResponse({ status: 201, description: 'Purchase created successfully', type: Purchase })
  create(@Body() createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    return this.purchasesService.create(createPurchaseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchases with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'buyerId', required: false, type: String, description: 'Filter by buyer ID' })
  @ApiQuery({ name: 'sellerId', required: false, type: String, description: 'Filter by seller ID' })
  @ApiResponse({ status: 200, description: 'List of purchases with pagination info' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('buyerId') buyerId?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.purchasesService.findAll(page, limit, buyerId, sellerId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get purchase statistics' })
  @ApiResponse({ status: 200, description: 'Purchase statistics' })
  getStatistics() {
    return this.purchasesService.getStatistics();
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get purchases by status' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of purchases by status' })
  findByStatus(
    @Param('status') status: PurchaseStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.purchasesService.getPurchasesByStatus(status, page, limit);
  }

  @Get('buyer/:buyerId')
  @ApiOperation({ summary: 'Get purchases by buyer ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of purchases by buyer' })
  findByBuyer(
    @Param('buyerId') buyerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.purchasesService.findByBuyer(buyerId, page, limit);
  }

  @Get('seller/:sellerId')
  @ApiOperation({ summary: 'Get purchases by seller ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of purchases by seller' })
  findBySeller(
    @Param('sellerId') sellerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.purchasesService.findBySeller(sellerId, page, limit);
  }

  @Get('offer/:offerId')
  @ApiOperation({ summary: 'Get purchases by offer ID' })
  @ApiResponse({ status: 200, description: 'List of purchases for the offer' })
  findByOffer(@Param('offerId') offerId: string): Promise<Purchase[]> {
    return this.purchasesService.findByOffer(offerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase by ID' })
  @ApiResponse({ status: 200, description: 'Purchase found', type: Purchase })
  @ApiResponse({ status: 404, description: 'Purchase not found' })
  findOne(@Param('id') id: string): Promise<Purchase> {
    return this.purchasesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a purchase' })
  @ApiResponse({ status: 200, description: 'Purchase updated successfully', type: Purchase })
  @ApiResponse({ status: 404, description: 'Purchase not found' })
  update(@Param('id') id: string, @Body() updatePurchaseDto: UpdatePurchaseDto): Promise<Purchase> {
    return this.purchasesService.update(id, updatePurchaseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a purchase' })
  @ApiResponse({ status: 200, description: 'Purchase cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Purchase not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.purchasesService.remove(id);
  }
}