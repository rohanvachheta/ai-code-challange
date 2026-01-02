import axios from 'axios';

export interface Purchase {
  id: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  vehicleId: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'financing';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  offer?: any;
}

export interface CreatePurchaseRequest {
  offerId: string;
  buyerId: string;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'cash' | 'financing';
  amount: number;
}

export interface UpdatePurchaseRequest {
  status?: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod?: 'credit_card' | 'bank_transfer' | 'cash' | 'financing';
}

export interface PurchasesResponse {
  purchases: Purchase[];
  total: number;
  page: number;
  totalPages: number;
}

const API_BASE_URL = process.env.REACT_APP_PURCHASE_SERVICE_URL || 'http://localhost:3002';

class PurchaseService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  async getPurchases(page: number = 1, limit: number = 10): Promise<PurchasesResponse> {
    const response = await this.axios.get(`/purchases?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getPurchase(id: string): Promise<Purchase> {
    const response = await this.axios.get(`/purchases/${id}`);
    return response.data;
  }

  async createPurchase(purchase: CreatePurchaseRequest): Promise<Purchase> {
    const response = await this.axios.post('/purchases', purchase);
    return response.data;
  }

  async updatePurchase(id: string, purchase: UpdatePurchaseRequest): Promise<Purchase> {
    const response = await this.axios.patch(`/purchases/${id}`, purchase);
    return response.data;
  }

  async cancelPurchase(id: string): Promise<Purchase> {
    const response = await this.axios.post(`/purchases/${id}/cancel`);
    return response.data;
  }

  async completePurchase(id: string): Promise<Purchase> {
    const response = await this.axios.post(`/purchases/${id}/complete`);
    return response.data;
  }

  async getPurchasesByBuyer(buyerId: string): Promise<Purchase[]> {
    const response = await this.axios.get(`/purchases/buyer/${buyerId}`);
    return response.data;
  }

  async getPurchasesBySeller(sellerId: string): Promise<Purchase[]> {
    const response = await this.axios.get(`/purchases/seller/${sellerId}`);
    return response.data;
  }

  async getPurchasesByStatus(status: string): Promise<Purchase[]> {
    const response = await this.axios.get(`/purchases/status/${status}`);
    return response.data;
  }

  async getPurchasesStatistics(): Promise<any> {
    const response = await this.axios.get('/purchases/statistics');
    return response.data;
  }
}

export const purchaseService = new PurchaseService();
export default PurchaseService;