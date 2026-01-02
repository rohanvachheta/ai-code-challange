import axios from 'axios';

export interface Transport {
  id: string;
  purchaseId: string;
  carrierId: string;
  pickupLocation: string;
  deliveryLocation: string;
  scheduledPickupDate: string;
  scheduledDeliveryDate: string;
  actualPickupDate?: string;
  actualDeliveryDate?: string;
  status: 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
  cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransportRequest {
  purchaseId: string;
  carrierId: string;
  pickupLocation: string;
  deliveryLocation: string;
  scheduledPickupDate: string;
  scheduledDeliveryDate: string;
  cost: number;
  notes?: string;
}

export interface UpdateTransportRequest {
  status?: 'scheduled' | 'in_transit' | 'delivered' | 'cancelled';
  actualPickupDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  cost?: number;
}

export interface TransportsResponse {
  transports: Transport[];
  total: number;
  page: number;
  totalPages: number;
}

const API_BASE_URL = process.env.REACT_APP_TRANSPORT_SERVICE_URL || 'http://localhost:3003';

class TransportService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  async getTransports(page: number = 1, limit: number = 10): Promise<TransportsResponse> {
    const response = await this.axios.get(`/transports?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getTransport(id: string): Promise<Transport> {
    const response = await this.axios.get(`/transports/${id}`);
    return response.data;
  }

  async createTransport(transport: CreateTransportRequest): Promise<Transport> {
    const response = await this.axios.post('/transports', transport);
    return response.data;
  }

  async updateTransport(id: string, transport: UpdateTransportRequest): Promise<Transport> {
    const response = await this.axios.patch(`/transports/${id}`, transport);
    return response.data;
  }

  async cancelTransport(id: string): Promise<Transport> {
    const response = await this.axios.post(`/transports/${id}/cancel`);
    return response.data;
  }

  async startTransport(id: string): Promise<Transport> {
    const response = await this.axios.post(`/transports/${id}/start`);
    return response.data;
  }

  async completeTransport(id: string): Promise<Transport> {
    const response = await this.axios.post(`/transports/${id}/complete`);
    return response.data;
  }

  async getTransportsByCarrier(carrierId: string): Promise<Transport[]> {
    const response = await this.axios.get(`/transports/carrier/${carrierId}`);
    return response.data;
  }

  async getTransportsByPurchase(purchaseId: string): Promise<Transport[]> {
    const response = await this.axios.get(`/transports/purchase/${purchaseId}`);
    return response.data;
  }

  async getTransportsByStatus(status: string): Promise<Transport[]> {
    const response = await this.axios.get(`/transports/status/${status}`);
    return response.data;
  }

  async getTransportsStatistics(): Promise<any> {
    const response = await this.axios.get('/transports/statistics');
    return response.data;
  }

  async trackTransport(trackingNumber: string): Promise<Transport> {
    const response = await this.axios.get(`/transports/track/${trackingNumber}`);
    return response.data;
  }
}

export const transportService = new TransportService();
export default TransportService;