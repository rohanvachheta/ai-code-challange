import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Purchase, PurchaseStatus } from './entities/purchase.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { EventsService } from '../events/events.service';
import { OfferService } from './offer.service';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private readonly purchaseRepository: Repository<Purchase>,
    private readonly eventsService: EventsService,
    private readonly offerService: OfferService,
  ) {}

  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    // Verify offer exists and is available
    const offer = await this.offerService.getOffer(createPurchaseDto.offerId);
    if (!offer || offer.status !== 'ACTIVE') {
      throw new BadRequestException('Offer is not available for purchase');
    }

    // Calculate tax and total amounts
    let taxAmount = 0;
    let totalAmount = createPurchaseDto.purchasePrice;
    
    if (createPurchaseDto.taxRate) {
      taxAmount = (createPurchaseDto.purchasePrice * createPurchaseDto.taxRate) / 100;
      totalAmount = createPurchaseDto.purchasePrice + taxAmount;
    }

    const purchase = this.purchaseRepository.create({
      ...createPurchaseDto,
      taxAmount,
      totalAmount,
    });

    const savedPurchase = await this.purchaseRepository.save(purchase);

    // Fetch buyer and seller details from user service
    let buyerDetails = null;
    let sellerDetails = null;
    try {
      const [buyerResponse, sellerResponse] = await Promise.allSettled([
        fetch(`http://user-service:3005/users/${savedPurchase.buyerId}`),
        fetch(`http://user-service:3005/users/${savedPurchase.sellerId}`)
      ]);

      if (buyerResponse.status === 'fulfilled' && buyerResponse.value.ok) {
        buyerDetails = await buyerResponse.value.json();
      }
      if (sellerResponse.status === 'fulfilled' && sellerResponse.value.ok) {
        sellerDetails = await sellerResponse.value.json();
      }
    } catch (error) {
      console.log('Could not fetch user details:', error.message);
    }

    // Publish Kafka event with enriched data for search service to process
    try {
      await this.eventsService.publishPurchaseCreated(savedPurchase, buyerDetails, sellerDetails);
      console.log('✅ Purchase event published to Kafka:', savedPurchase.purchaseId);
    } catch (error) {
      console.error('❌ Failed to publish purchase event to Kafka:', error);
      throw error;
    }

    return savedPurchase;
  }

  async findAll(page = 1, limit = 10, buyerId?: string, sellerId?: string): Promise<{ purchases: Purchase[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const options: FindManyOptions<Purchase> = {
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    const where: any = {};
    if (buyerId) where.buyerId = buyerId;
    if (sellerId) where.sellerId = sellerId;
    
    if (Object.keys(where).length > 0) {
      options.where = where;
    }

    const [purchases, total] = await this.purchaseRepository.findAndCount(options);

    return {
      purchases,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Purchase> {
    const purchase = await this.purchaseRepository.findOne({ where: { purchaseId: id } });
    if (!purchase) {
      throw new NotFoundException(`Purchase with ID ${id} not found`);
    }
    return purchase;
  }

  async findByOffer(offerId: string): Promise<Purchase[]> {
    return this.purchaseRepository.find({ where: { offerId } });
  }

  async findByBuyer(buyerId: string, page = 1, limit = 10): Promise<{ purchases: Purchase[]; total: number; pages: number }> {
    return this.findAll(page, limit, buyerId);
  }

  async findBySeller(sellerId: string, page = 1, limit = 10): Promise<{ purchases: Purchase[]; total: number; pages: number }> {
    return this.findAll(page, limit, undefined, sellerId);
  }

  async update(id: string, updatePurchaseDto: UpdatePurchaseDto): Promise<Purchase> {
    const purchase = await this.findOne(id);
    
    // Handle status transitions
    if (updatePurchaseDto.status) {
      await this.handleStatusTransition(purchase, updatePurchaseDto.status);
    }

    const updatedPurchase = await this.purchaseRepository.save({
      ...purchase,
      ...updatePurchaseDto,
    });

    // Emit event after successful update
    await this.eventsService.publishPurchaseUpdated(updatedPurchase);

    return updatedPurchase;
  }

  private async handleStatusTransition(purchase: Purchase, newStatus: PurchaseStatus): Promise<void> {
    const now = new Date();
    
    switch (newStatus) {
      case PurchaseStatus.CONFIRMED:
        if (!purchase.confirmedAt) {
          purchase.confirmedAt = now;
        }
        break;
      case PurchaseStatus.PAID:
        if (!purchase.paidAt) {
          purchase.paidAt = now;
        }
        break;
      case PurchaseStatus.COMPLETED:
        if (!purchase.completedAt) {
          purchase.completedAt = now;
        }
        break;
    }
  }

  async remove(id: string): Promise<void> {
    const purchase = await this.findOne(id);
    purchase.status = PurchaseStatus.CANCELLED;
    await this.purchaseRepository.save(purchase);

    // Emit event after cancellation
    await this.eventsService.publishPurchaseUpdated(purchase);
  }

  async getPurchasesByStatus(status: PurchaseStatus, page = 1, limit = 10): Promise<{ purchases: Purchase[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const [purchases, total] = await this.purchaseRepository.findAndCount({
      where: { status },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      purchases,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getStatistics(): Promise<{
    totalPurchases: number;
    pendingPurchases: number;
    completedPurchases: number;
    totalRevenue: number;
    averagePurchaseAmount: number;
  }> {
    const [totalPurchases, pendingPurchases, completedPurchases] = await Promise.all([
      this.purchaseRepository.count(),
      this.purchaseRepository.count({ where: { status: PurchaseStatus.PENDING } }),
      this.purchaseRepository.count({ where: { status: PurchaseStatus.COMPLETED } }),
    ]);

    const revenueResult = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('SUM(purchase.totalAmount)', 'total')
      .where('purchase.status = :status', { status: PurchaseStatus.COMPLETED })
      .getRawOne();

    const avgResult = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .select('AVG(purchase.totalAmount)', 'avg')
      .getRawOne();

    const totalRevenue = parseFloat(revenueResult.total) || 0;
    const averagePurchaseAmount = parseFloat(avgResult.avg) || 0;

    return {
      totalPurchases,
      pendingPurchases,
      completedPurchases,
      totalRevenue,
      averagePurchaseAmount,
    };
  }
}