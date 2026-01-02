import axios from 'axios';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  description?: string;
  condition: 'new' | 'used' | 'certified';
  features?: string[];
  images?: string[];
}

export interface Offer {
  id: string;
  vehicleId: string;
  sellerId: string;
  price: number;
  status: 'active' | 'sold' | 'expired' | 'withdrawn';
  description?: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: Vehicle;
}

export interface CreateOfferRequest {
  vehicleId: string;
  sellerId: string;
  price: number;
  description?: string;
  validUntil: string;
}

export interface UpdateOfferRequest {
  price?: number;
  description?: string;
  validUntil?: string;
  status?: 'active' | 'sold' | 'expired' | 'withdrawn';
}

export interface OffersResponse {
  offers: Offer[];
  total: number;
  page: number;
  totalPages: number;
}

const API_BASE_URL = process.env.REACT_APP_OFFER_SERVICE_URL || 'http://localhost:3001';

class OfferService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  async getOffers(page: number = 1, limit: number = 10): Promise<OffersResponse> {
    const response = await this.axios.get(`/offers?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getOffer(id: string): Promise<Offer> {
    const response = await this.axios.get(`/offers/${id}`);
    return response.data;
  }

  async createOffer(offer: CreateOfferRequest): Promise<Offer> {
    const response = await this.axios.post('/offers', offer);
    return response.data;
  }

  async updateOffer(id: string, offer: UpdateOfferRequest): Promise<Offer> {
    const response = await this.axios.patch(`/offers/${id}`, offer);
    return response.data;
  }

  async deleteOffer(id: string): Promise<void> {
    await this.axios.delete(`/offers/${id}`);
  }

  async getOffersByStatus(status: string): Promise<Offer[]> {
    const response = await this.axios.get(`/offers/status/${status}`);
    return response.data;
  }

  async getOffersByVehicle(vehicleId: string): Promise<Offer[]> {
    const response = await this.axios.get(`/offers/vehicle/${vehicleId}`);
    return response.data;
  }

  async getOffersBySeller(sellerId: string): Promise<Offer[]> {
    const response = await this.axios.get(`/offers/seller/${sellerId}`);
    return response.data;
  }

  async getOffersStatistics(): Promise<any> {
    const response = await this.axios.get('/offers/statistics');
    return response.data;
  }
}

export const offerService = new OfferService();
export default OfferService;