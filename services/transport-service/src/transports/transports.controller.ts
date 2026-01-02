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
import { TransportsService } from './transports.service';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import { Transport, TransportStatus } from './entities/transport.entity';

@ApiTags('transports')
@Controller('transports')
export class TransportsController {
  constructor(private readonly transportsService: TransportsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transport job' })
  @ApiResponse({ status: 201, description: 'Transport created successfully', type: Transport })
  create(@Body() createTransportDto: CreateTransportDto): Promise<Transport> {
    return this.transportsService.create(createTransportDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transports with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'carrierId', required: false, type: String, description: 'Filter by carrier ID' })
  @ApiResponse({ status: 200, description: 'List of transports with pagination info' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('carrierId') carrierId?: string,
  ) {
    return this.transportsService.findAll(page, limit, carrierId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get transport statistics' })
  @ApiResponse({ status: 200, description: 'Transport statistics' })
  getStatistics() {
    return this.transportsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transport by ID' })
  @ApiResponse({ status: 200, description: 'Transport found', type: Transport })
  findOne(@Param('id') id: string): Promise<Transport> {
    return this.transportsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update transport' })
  @ApiResponse({ status: 200, description: 'Transport updated successfully', type: Transport })
  update(
    @Param('id') id: string,
    @Body() updateTransportDto: UpdateTransportDto,
  ): Promise<Transport> {
    return this.transportsService.update(id, updateTransportDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transport' })
  @ApiResponse({ status: 200, description: 'Transport deleted successfully' })
  remove(@Param('id') id: string): Promise<void> {
    return this.transportsService.remove(id);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get transport tracking information' })
  @ApiResponse({ status: 200, description: 'Transport tracking information' })
  getTracking(@Param('id') id: string) {
    return this.transportsService.getTracking(id);
  }

  @Post(':id/update-status')
  @ApiOperation({ summary: 'Update transport status' })
  @ApiResponse({ status: 200, description: 'Transport status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TransportStatus,
  ): Promise<Transport> {
    return this.transportsService.updateStatus(id, status);
  }
}