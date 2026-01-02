import { offerService } from './offerService.ts';
import { purchaseService } from './purchaseService.ts';
import { transportService } from './transportService.ts';

// Fallback search service that uses individual APIs when search service is unavailable
export interface FallbackSearchResult {
  id: string;
  entityType: 'offer' | 'purchase' | 'transport';
  title: string;
  description: string;
  price?: number;
  status: string;
  createdAt: string;
  data: any;
}

export interface FallbackSearchResponse {
  results: FallbackSearchResult[];
  total: number;
  page: number;
  pages: number;
  stats?: {
    totalOffers: number;
    totalPurchases: number;
    totalTransports: number;
    totalRevenue: number;
  };
}

class FallbackSearchService {
  async searchAll(query?: string): Promise<FallbackSearchResponse> {
    try {
      const [offers, purchases, transports, offerStats, purchaseStats, transportStats] = await Promise.all([
        offerService.getOffers(1, 10).catch(() => ({ offers: [], total: 0, page: 1, totalPages: 0 })),
        purchaseService.getPurchases(1, 10).catch(() => ({ purchases: [], total: 0, page: 1, totalPages: 0 })),
        transportService.getTransports(1, 10).catch(() => ({ transports: [], total: 0, page: 1, totalPages: 0 })),
        offerService.getOffersStatistics().catch(() => ({ totalOffers: 0, totalValue: 0 })),
        purchaseService.getPurchasesStatistics().catch(() => ({ totalPurchases: 0, totalRevenue: 0 })),
        transportService.getTransportsStatistics().catch(() => ({ totalTransports: 0, totalCost: 0 })),
      ]);

      const results: FallbackSearchResult[] = [];

      // Process offers
      if (offers.offers) {
        offers.offers.forEach(offer => {
          if (!query || this.matchesQuery(offer, query)) {
            results.push({
              id: offer.id,
              entityType: 'offer',
              title: `${offer.vehicle?.make || 'Vehicle'} ${offer.vehicle?.model || offer.vehicleId}`,
              description: offer.description || `${offer.vehicle?.year || ''} - $${offer.price}`,
              price: offer.price,
              status: offer.status,
              createdAt: offer.createdAt,
              data: offer,
            });
          }
        });
      }

      // Process purchases
      if (purchases.purchases) {
        purchases.purchases.forEach(purchase => {
          if (!query || this.matchesQuery(purchase, query)) {
            results.push({
              id: purchase.id,
              entityType: 'purchase',
              title: `Purchase ${purchase.id.substring(0, 8)}`,
              description: `${purchase.paymentMethod} - $${purchase.amount}`,
              price: purchase.amount,
              status: purchase.status,
              createdAt: purchase.createdAt,
              data: purchase,
            });
          }
        });
      }

      // Process transports
      if (transports.transports) {
        transports.transports.forEach(transport => {
          if (!query || this.matchesQuery(transport, query)) {
            results.push({
              id: transport.id,
              entityType: 'transport',
              title: `Transport ${transport.id.substring(0, 8)}`,
              description: `${transport.pickupLocation} → ${transport.deliveryLocation}`,
              price: transport.cost,
              status: transport.status,
              createdAt: transport.createdAt,
              data: transport,
            });
          }
        });
      }

      // Sort by creation date (newest first)
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        results,
        total: results.length,
        page: 1,
        pages: Math.ceil(results.length / 10),
        stats: {
          totalOffers: offerStats.totalOffers || offers.total || 0,
          totalPurchases: purchaseStats.totalPurchases || purchases.total || 0,
          totalTransports: transportStats.totalTransports || transports.total || 0,
          totalRevenue: purchaseStats.totalRevenue || 0,
        }
      };
    } catch (error) {
      console.error('Fallback search failed:', error);
      throw new Error('Unable to search - all services unavailable');
    }
  }

  async getOffers() {
    try {
      return await offerService.getOffers();
    } catch (error) {
      throw new Error('Offer service unavailable');
    }
  }

  async getPurchases() {
    try {
      return await purchaseService.getPurchases();
    } catch (error) {
      throw new Error('Purchase service unavailable');
    }
  }

  async getTransports() {
    try {
      return await transportService.getTransports();
    } catch (error) {
      throw new Error('Transport service unavailable');
    }
  }

  async getStatistics() {
    try {
      const [offerStats, purchaseStats, transportStats] = await Promise.all([
        offerService.getOffersStatistics().catch(() => ({ totalOffers: 0, totalValue: 0 })),
        purchaseService.getPurchasesStatistics().catch(() => ({ totalPurchases: 0, totalRevenue: 0 })),
        transportService.getTransportsStatistics().catch(() => ({ totalTransports: 0, totalCost: 0 })),
      ]);

      return {
        totalOffers: offerStats.totalOffers || 0,
        totalPurchases: purchaseStats.totalPurchases || 0,
        totalTransports: transportStats.totalTransports || 0,
        totalRevenue: purchaseStats.totalRevenue || 0,
        totalValue: offerStats.totalValue || 0,
        totalCost: transportStats.totalCost || 0,
      };
    } catch (error) {
      throw new Error('Statistics unavailable');
    }
  }

  private matchesQuery(item: any, query: string): boolean {
    const searchFields = JSON.stringify(item).toLowerCase();
    return searchFields.includes(query.toLowerCase());
  }
}

export const fallbackSearchService = new FallbackSearchService();
export default FallbackSearchService;