import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { Offer, OfferStatus } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { EventsService } from '../events/events.service';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly eventsService: EventsService,
  ) {}

  async create(createOfferDto: CreateOfferDto): Promise<Offer> {
    const offer = this.offerRepository.create(createOfferDto);
    const savedOffer = await this.offerRepository.save(offer);

    // Publish Kafka event for search service to process
    try {
      await this.eventsService.publishOfferCreated(savedOffer);
      console.log('✅ Offer event published to Kafka:', savedOffer.offerId);
    } catch (error) {
      console.error('❌ Failed to publish offer event to Kafka:', error);
      throw error;
    }

    return savedOffer;
  }

  async findAll(page = 1, limit = 10, sellerId?: string): Promise<{ offers: Offer[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const options: FindManyOptions<Offer> = {
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    if (sellerId) {
      options.where = { sellerId };
    }

    const [offers, total] = await this.offerRepository.findAndCount(options);

    return {
      offers,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({ where: { offerId: id } });
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${id} not found`);
    }
    return offer;
  }

  async findByVin(vin: string): Promise<Offer[]> {
    return this.offerRepository.find({ where: { vin } });
  }

  async findBySeller(sellerId: string, page = 1, limit = 10): Promise<{ offers: Offer[]; total: number; pages: number }> {
    return this.findAll(page, limit, sellerId);
  }

  async update(id: string, updateOfferDto: UpdateOfferDto): Promise<Offer> {
    const offer = await this.findOne(id);
    const updatedOffer = await this.offerRepository.save({
      ...offer,
      ...updateOfferDto,
    });

    // Emit event after successful update
    await this.eventsService.publishOfferUpdated(updatedOffer);

    return updatedOffer;
  }

  async remove(id: string): Promise<void> {
    const offer = await this.findOne(id);
    offer.status = OfferStatus.WITHDRAWN;
    await this.offerRepository.save(offer);

    // Emit event after successful removal
    await this.eventsService.publishOfferUpdated(offer);
  }

  async getOffersByStatus(status: OfferStatus, page = 1, limit = 10): Promise<{ offers: Offer[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const [offers, total] = await this.offerRepository.findAndCount({
      where: { status },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      offers,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getStatistics(): Promise<{
    totalOffers: number;
    activeOffers: number;
    soldOffers: number;
    averagePrice: number;
  }> {
    const [totalOffers, activeOffers, soldOffers] = await Promise.all([
      this.offerRepository.count(),
      this.offerRepository.count({ where: { status: OfferStatus.ACTIVE } }),
      this.offerRepository.count({ where: { status: OfferStatus.SOLD } }),
    ]);

    const result = await this.offerRepository
      .createQueryBuilder('offer')
      .select('AVG(offer.price)', 'avg')
      .where('offer.status = :status', { status: OfferStatus.ACTIVE })
      .getRawOne();

    const averagePrice = parseFloat(result.avg) || 0;

    return {
      totalOffers,
      activeOffers,
      soldOffers,
      averagePrice,
    };
  }
}