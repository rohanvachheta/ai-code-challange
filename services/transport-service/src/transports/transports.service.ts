import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Transport, TransportStatus } from './entities/transport.entity';
import { CreateTransportDto } from './dto/create-transport.dto';
import { UpdateTransportDto } from './dto/update-transport.dto';
import { EventsService } from '../events/events.service';
import { PurchaseService } from './purchase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransportsService {
  constructor(
    @InjectRepository(Transport)
    private readonly transportRepository: Repository<Transport>,
    private readonly eventsService: EventsService,
    private readonly purchaseService: PurchaseService,
  ) {}

  async create(createTransportDto: CreateTransportDto): Promise<Transport> {
    // Verify purchase exists
    const purchase = await this.purchaseService.getPurchase(createTransportDto.purchaseId);
    if (!purchase || purchase.status !== 'COMPLETED') {
      throw new BadRequestException('Purchase must be completed to schedule transport');
    }

    // Generate tracking number
    const trackingNumber = `TR${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const transport = this.transportRepository.create({
      ...createTransportDto,
      scheduledPickupDate: new Date(createTransportDto.scheduledPickupDate),
      scheduledDeliveryDate: new Date(createTransportDto.scheduledDeliveryDate),
      trackingNumber,
    });

    const savedTransport = await this.transportRepository.save(transport);

    // Emit event after successful save
    await this.eventsService.publishTransportCreated(savedTransport);

    return savedTransport;
  }

  async findAll(page = 1, limit = 10, carrierId?: string, buyerId?: string): Promise<{ transports: Transport[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const options: FindManyOptions<Transport> = {
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    const where: any = {};
    if (carrierId) where.carrierId = carrierId;
    if (buyerId) where.buyerId = buyerId;
    
    if (Object.keys(where).length > 0) {
      options.where = where;
    }

    const [transports, total] = await this.transportRepository.findAndCount(options);

    return {
      transports,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Transport> {
    const transport = await this.transportRepository.findOne({ where: { transportId: id } });
    if (!transport) {
      throw new NotFoundException(`Transport with ID ${id} not found`);
    }
    return transport;
  }

  async findByPurchase(purchaseId: string): Promise<Transport[]> {
    return this.transportRepository.find({ where: { purchaseId } });
  }

  async findByCarrier(carrierId: string, page = 1, limit = 10): Promise<{ transports: Transport[]; total: number; pages: number }> {
    return this.findAll(page, limit, carrierId);
  }

  async findByBuyer(buyerId: string, page = 1, limit = 10): Promise<{ transports: Transport[]; total: number; pages: number }> {
    return this.findAll(page, limit, undefined, buyerId);
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Transport | null> {
    return this.transportRepository.findOne({ where: { trackingNumber } });
  }

  async update(id: string, updateTransportDto: UpdateTransportDto): Promise<Transport> {
    const transport = await this.findOne(id);
    
    // Handle status transitions with automatic date updates
    if (updateTransportDto.status) {
      await this.handleStatusTransition(transport, updateTransportDto.status, updateTransportDto);
    }

    // Convert date strings to Date objects
    if (updateTransportDto.scheduledPickupDate) {
      updateTransportDto.scheduledPickupDate = new Date(updateTransportDto.scheduledPickupDate) as any;
    }
    if (updateTransportDto.scheduledDeliveryDate) {
      updateTransportDto.scheduledDeliveryDate = new Date(updateTransportDto.scheduledDeliveryDate) as any;
    }
    if (updateTransportDto.actualPickupDate) {
      updateTransportDto.actualPickupDate = new Date(updateTransportDto.actualPickupDate) as any;
    }
    if (updateTransportDto.actualDeliveryDate) {
      updateTransportDto.actualDeliveryDate = new Date(updateTransportDto.actualDeliveryDate) as any;
    }

    const updatedTransport = await this.transportRepository.save({
      ...transport,
      ...updateTransportDto,
    });

    // Emit event after successful update
    await this.eventsService.publishTransportUpdated(updatedTransport);

    return updatedTransport;
  }

  private async handleStatusTransition(transport: Transport, newStatus: TransportStatus, updateDto: UpdateTransportDto): Promise<void> {
    const now = new Date();
    
    switch (newStatus) {
      case TransportStatus.IN_TRANSIT:
        if (!transport.actualPickupDate && !updateDto.actualPickupDate) {
          updateDto.actualPickupDate = now as any;
        }
        break;
      case TransportStatus.DELIVERED:
        if (!transport.actualDeliveryDate && !updateDto.actualDeliveryDate) {
          updateDto.actualDeliveryDate = now as any;
        }
        break;
    }
  }

  async remove(id: string): Promise<void> {
    const transport = await this.findOne(id);
    transport.status = TransportStatus.CANCELLED;
    await this.transportRepository.save(transport);

    // Emit event after cancellation
    await this.eventsService.publishTransportUpdated(transport);
  }

  async getTransportsByStatus(status: TransportStatus, page = 1, limit = 10): Promise<{ transports: Transport[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const [transports, total] = await this.transportRepository.findAndCount({
      where: { status },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      transports,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getStatistics(): Promise<{
    totalTransports: number;
    scheduledTransports: number;
    inTransitTransports: number;
    deliveredTransports: number;
    totalRevenue: number;
    averageTransportCost: number;
    averageDeliveryTime: number;
  }> {
    const [totalTransports, scheduledTransports, inTransitTransports, deliveredTransports] = await Promise.all([
      this.transportRepository.count(),
      this.transportRepository.count({ where: { status: TransportStatus.SCHEDULED } }),
      this.transportRepository.count({ where: { status: TransportStatus.IN_TRANSIT } }),
      this.transportRepository.count({ where: { status: TransportStatus.DELIVERED } }),
    ]);

    const revenueResult = await this.transportRepository
      .createQueryBuilder('transport')
      .select('SUM(transport.transportCost)', 'total')
      .where('transport.status = :status', { status: TransportStatus.DELIVERED })
      .getRawOne();

    const avgCostResult = await this.transportRepository
      .createQueryBuilder('transport')
      .select('AVG(transport.transportCost)', 'avg')
      .getRawOne();

    // Calculate average delivery time for completed transports
    const avgTimeResult = await this.transportRepository
      .createQueryBuilder('transport')
      .select('AVG(EXTRACT(EPOCH FROM (transport.actualDeliveryDate - transport.actualPickupDate)) / 3600)', 'avgHours')
      .where('transport.status = :status', { status: TransportStatus.DELIVERED })
      .andWhere('transport.actualPickupDate IS NOT NULL')
      .andWhere('transport.actualDeliveryDate IS NOT NULL')
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult.total) || 0;
    const averageTransportCost = parseFloat(avgCostResult.avg) || 0;
    const averageDeliveryTime = parseFloat(avgTimeResult.avgHours) || 0;

    return {
      totalTransports,
      scheduledTransports,
      inTransitTransports,
      deliveredTransports,
      totalRevenue,
      averageTransportCost,
      averageDeliveryTime,
    };
  }

  async getTracking(id: string): Promise<{
    transport: Transport;
    trackingHistory: Array<{
      status: string;
      timestamp: string;
      location?: string;
      notes?: string;
    }>;
  }> {
    const transport = await this.findOne(id);
    
    // Build tracking history based on transport status and dates
    const trackingHistory = [];
    
    if (transport.createdAt) {
      trackingHistory.push({
        status: 'Transport Scheduled',
        timestamp: transport.createdAt.toISOString(),
        location: transport.pickupLocation,
        notes: 'Transport has been scheduled'
      });
    }
    
    if (transport.actualPickupDate) {
      trackingHistory.push({
        status: 'Picked Up',
        timestamp: transport.actualPickupDate.toISOString(),
        location: transport.pickupLocation,
        notes: 'Vehicle has been picked up'
      });
    }
    
    if (transport.status === TransportStatus.IN_TRANSIT) {
      trackingHistory.push({
        status: 'In Transit',
        timestamp: transport.actualPickupDate?.toISOString() || new Date().toISOString(),
        notes: 'Vehicle is in transit'
      });
    }
    
    if (transport.actualDeliveryDate) {
      trackingHistory.push({
        status: 'Delivered',
        timestamp: transport.actualDeliveryDate.toISOString(),
        location: transport.deliveryLocation,
        notes: 'Vehicle has been delivered'
      });
    }

    return {
      transport,
      trackingHistory: trackingHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    };
  }

  async updateStatus(id: string, status: TransportStatus): Promise<Transport> {
    const transport = await this.findOne(id);
    
    // Handle status transitions with automatic date updates
    const updateDto: Partial<UpdateTransportDto> = { status };
    await this.handleStatusTransition(transport, status, updateDto);

    const updatedTransport = await this.transportRepository.save({
      ...transport,
      ...updateDto,
    });

    // Emit event after successful status update
    await this.eventsService.publishTransportUpdated(updatedTransport);

    return updatedTransport;
  }
}