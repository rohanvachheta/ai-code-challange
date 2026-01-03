import { Injectable } from '@nestjs/common';
import { ElasticsearchService, GlobalSearchDocument } from '../elasticsearch/elasticsearch.service';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class IndexService {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly cacheService: CacheService,
  ) {}

  async indexOffer(offer: any): Promise<void> {
    const document: GlobalSearchDocument = {
      entityType: 'offer',
      entityId: offer.offerId,
      vin: offer.vin,
      sellerId: offer.sellerId,
      offerId: offer.offerId,
      status: offer.status,
      searchableText: this.buildOfferSearchText(offer),
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      permissions: {
        sellerIds: [offer.sellerId],
        buyerIds: offer.status === 'ACTIVE' ? ['*'] : [], // Available to all buyers if active
        carrierIds: []
      },
      make: offer.make,
      model: offer.model,
      year: offer.year,
      price: offer.price,
      location: offer.location,
      condition: offer.condition,
      // Include seller details if available
      sellerDetails: offer.sellerDetails ? {
        fullName: offer.sellerDetails.fullName,
        email: offer.sellerDetails.email,
        phone: offer.sellerDetails.phone,
        userType: offer.sellerDetails.userType
      } : null,
    };

    await this.elasticsearchService.indexDocument(document);
    
    // Clear relevant caches
    await this.invalidateRelatedCaches(['offer', offer.sellerId, offer.vin]);
  }

  async indexPurchase(purchase: any): Promise<void> {
    const document: GlobalSearchDocument = {
      entityType: 'purchase',
      entityId: purchase.purchaseId,
      sellerId: purchase.sellerId,
      buyerId: purchase.buyerId,
      offerId: purchase.offerId,
      purchaseId: purchase.purchaseId,
      status: purchase.status,
      searchableText: this.buildPurchaseSearchText(purchase),
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      permissions: {
        sellerIds: [purchase.sellerId],
        buyerIds: [purchase.buyerId],
        carrierIds: []
      },
      purchasePrice: purchase.purchasePrice,
      paymentMethod: purchase.paymentMethod,
      // Include buyer and seller details if available
      buyerDetails: purchase.buyerDetails ? {
        fullName: purchase.buyerDetails.fullName,
        email: purchase.buyerDetails.email,
        phone: purchase.buyerDetails.phone,
        userType: purchase.buyerDetails.userType
      } : null,
      sellerDetails: purchase.sellerDetails ? {
        fullName: purchase.sellerDetails.fullName,
        email: purchase.sellerDetails.email,
        phone: purchase.sellerDetails.phone,
        userType: purchase.sellerDetails.userType
      } : null,
    };

    await this.elasticsearchService.indexDocument(document);
    
    // Clear relevant caches
    await this.invalidateRelatedCaches(['purchase', purchase.sellerId, purchase.buyerId]);
  }

  async indexTransport(transport: any): Promise<void> {
    const document: GlobalSearchDocument = {
      entityType: 'transport',
      entityId: transport.transportId,
      carrierId: transport.carrierId,
      buyerId: transport.buyerId,
      offerId: transport.offerId,
      purchaseId: transport.purchaseId,
      status: transport.status,
      searchableText: this.buildTransportSearchText(transport),
      createdAt: transport.createdAt,
      updatedAt: transport.updatedAt,
      permissions: {
        sellerIds: [],
        buyerIds: [transport.buyerId],
        carrierIds: [transport.carrierId]
      },
      transportCost: transport.transportCost,
      pickupLocation: transport.pickupLocation,
      deliveryLocation: transport.deliveryLocation,
      scheduledPickupDate: transport.scheduledPickupDate,
      scheduledDeliveryDate: transport.scheduledDeliveryDate,
    };

    await this.elasticsearchService.indexDocument(document);
    
    // Clear relevant caches
    await this.invalidateRelatedCaches(['transport', transport.carrierId, transport.buyerId]);
  }

  private buildOfferSearchText(offer: any): string {
    const searchParts = [
      offer.make,
      offer.model,
      offer.year?.toString(),
      offer.vin,
      offer.condition,
      offer.location,
      offer.status,
      offer.description,
      offer.color,
      `${offer.make} ${offer.model}`,
      `${offer.year} ${offer.make}`,
      `${offer.year} ${offer.make} ${offer.model}`,
    ].filter(part => part);

    // Add seller details if available
    if (offer.sellerDetails) {
      searchParts.push(
        offer.sellerDetails.fullName,
        offer.sellerDetails.firstName,
        offer.sellerDetails.lastName,
        offer.sellerDetails.email,
        offer.sellerDetails.phone,
        offer.sellerDetails.userType
      );
    }

    return searchParts.join(' ').toLowerCase();
  }

  private buildPurchaseSearchText(purchase: any): string {
    const searchParts = [
      purchase.purchaseId,
      purchase.offerId,
      purchase.status,
      purchase.paymentMethod,
      purchase.purchasePrice?.toString(),
      purchase.notes,
    ].filter(part => part);

    // Add buyer details if available
    if (purchase.buyerDetails) {
      searchParts.push(
        purchase.buyerDetails.fullName,
        purchase.buyerDetails.firstName,
        purchase.buyerDetails.lastName,
        purchase.buyerDetails.email,
        purchase.buyerDetails.phone,
        purchase.buyerDetails.userType
      );
    }

    // Add seller details if available
    if (purchase.sellerDetails) {
      searchParts.push(
        purchase.sellerDetails.fullName,
        purchase.sellerDetails.firstName,
        purchase.sellerDetails.lastName,
        purchase.sellerDetails.email,
        purchase.sellerDetails.phone,
        purchase.sellerDetails.userType
      );
    }

    return searchParts.join(' ').toLowerCase();
  }

  private buildTransportSearchText(transport: any): string {
    const searchParts = [
      transport.transportId,
      transport.purchaseId,
      transport.offerId,
      transport.status,
      transport.pickupLocation,
      transport.deliveryLocation,
      transport.transportType,
      transport.trackingNumber,
      transport.driverName,
      transport.notes,
    ].filter(part => part);

    return searchParts.join(' ').toLowerCase();
  }

  async deleteDocument(entityType: string, entityId: string): Promise<void> {
    await this.elasticsearchService.deleteDocument(entityType, entityId);
    
    // Clear relevant caches
    await this.invalidateRelatedCaches([entityType, entityId]);
  }

  async bulkIndex(documents: { type: string; data: any }[]): Promise<void> {
    const esDocuments: GlobalSearchDocument[] = [];

    for (const doc of documents) {
      switch (doc.type) {
        case 'offer':
          esDocuments.push(this.buildOfferDocument(doc.data));
          break;
        case 'purchase':
          esDocuments.push(this.buildPurchaseDocument(doc.data));
          break;
        case 'transport':
          esDocuments.push(this.buildTransportDocument(doc.data));
          break;
      }
    }

    if (esDocuments.length > 0) {
      await this.elasticsearchService.bulkIndex(esDocuments);
      
      // Clear all search caches after bulk operation
      await this.cacheService.clearByPattern('search:*');
    }
  }

  private buildOfferDocument(offer: any): GlobalSearchDocument {
    return {
      entityType: 'offer',
      entityId: offer.offerId,
      vin: offer.vin,
      sellerId: offer.sellerId,
      offerId: offer.offerId,
      status: offer.status,
      searchableText: this.buildOfferSearchText(offer),
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
      permissions: {
        sellerIds: [offer.sellerId],
        buyerIds: offer.status === 'ACTIVE' ? ['*'] : [],
        carrierIds: []
      },
      make: offer.make,
      model: offer.model,
      year: offer.year,
      price: offer.price,
      location: offer.location,
      condition: offer.condition,
    };
  }

  private buildPurchaseDocument(purchase: any): GlobalSearchDocument {
    return {
      entityType: 'purchase',
      entityId: purchase.purchaseId,
      sellerId: purchase.sellerId,
      buyerId: purchase.buyerId,
      offerId: purchase.offerId,
      purchaseId: purchase.purchaseId,
      status: purchase.status,
      searchableText: this.buildPurchaseSearchText(purchase),
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      permissions: {
        sellerIds: [purchase.sellerId],
        buyerIds: [purchase.buyerId],
        carrierIds: []
      },
      purchasePrice: purchase.purchasePrice,
      paymentMethod: purchase.paymentMethod,
    };
  }

  private buildTransportDocument(transport: any): GlobalSearchDocument {
    return {
      entityType: 'transport',
      entityId: transport.transportId,
      carrierId: transport.carrierId,
      buyerId: transport.buyerId,
      offerId: transport.offerId,
      purchaseId: transport.purchaseId,
      status: transport.status,
      searchableText: this.buildTransportSearchText(transport),
      createdAt: transport.createdAt,
      updatedAt: transport.updatedAt,
      permissions: {
        sellerIds: [],
        buyerIds: [transport.buyerId],
        carrierIds: [transport.carrierId]
      },
      transportCost: transport.transportCost,
      pickupLocation: transport.pickupLocation,
      deliveryLocation: transport.deliveryLocation,
      scheduledPickupDate: transport.scheduledPickupDate,
      scheduledDeliveryDate: transport.scheduledDeliveryDate,
    };
  }

  private async invalidateRelatedCaches(tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.cacheService.clearByPattern(`search:*${tag}*`);
    }
  }

  async reindexAll(): Promise<void> {
    console.log('Starting full reindex operation...');
    
    try {
      // Clear existing cache
      await this.cacheService.clearByPattern('search:*');
      console.log('Cache cleared successfully');
      
      // Fetch and index offers
      console.log('Fetching offers from offer service...');
      try {
        const offersResponse = await fetch('http://offer-service:3001/offers');
        console.log(`Offers response status: ${offersResponse.status}`);
        
        if (offersResponse.ok) {
          const offersData = await offersResponse.json();
          console.log(`Found ${offersData.offers?.length || 0} offers to index`);
          
          if (offersData.offers) {
            for (const offer of offersData.offers) {
              console.log(`Indexing offer: ${offer.offerId} - ${offer.make} ${offer.model}`);
              await this.indexOffer(offer);
            }
          }
        } else {
          console.error('Failed to fetch offers:', offersResponse.status, offersResponse.statusText);
        }
      } catch (error) {
        console.error('Error fetching offers:', error);
      }
      
      // Fetch and index purchases
      console.log('Fetching purchases from purchase service...');
      try {
        const purchasesResponse = await fetch('http://purchase-service:3002/purchases');
        console.log(`Purchases response status: ${purchasesResponse.status}`);
        
        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          console.log(`Found ${purchasesData.purchases?.length || 0} purchases to index`);
          
          if (purchasesData.purchases) {
            for (const purchase of purchasesData.purchases) {
              console.log(`Indexing purchase: ${purchase.purchaseId}`);
              await this.indexPurchase(purchase);
            }
          }
        } else {
          console.error('Failed to fetch purchases:', purchasesResponse.status, purchasesResponse.statusText);
        }
      } catch (error) {
        console.error('Error fetching purchases:', error);
      }
      
      // Fetch and index transports
      console.log('Fetching transports from transport service...');
      try {
        const transportsResponse = await fetch('http://transport-service:3003/transports');
        console.log(`Transports response status: ${transportsResponse.status}`);
        
        if (transportsResponse.ok) {
          const transportsData = await transportsResponse.json();
          console.log(`Found ${transportsData.transports?.length || 0} transports to index`);
          
          if (transportsData.transports) {
            for (const transport of transportsData.transports) {
              console.log(`Indexing transport: ${transport.transportId}`);
              await this.indexTransport(transport);
            }
          }
        } else {
          console.error('Failed to fetch transports:', transportsResponse.status, transportsResponse.statusText);
        }
      } catch (error) {
        console.error('Error fetching transports:', error);
      }
      
      console.log('Reindex operation completed successfully');
    } catch (error) {
      console.error('Error during reindex operation:', error);
      throw error;
    }
  }
}