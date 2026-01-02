import axios from 'axios';

export enum UserType {
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  CARRIER = 'CARRIER',
  AGENT = 'AGENT'
}

export interface SearchRequest {
  userType: UserType;
  accountId: string;
  searchText: string;
  page?: number;
  limit?: number;
  entityTypes?: string[];
  status?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  make?: string;
  model?: string;
  location?: string;
}

export interface SearchDocument {
  entityType: string;
  entityId: string;
  vin?: string;
  sellerId?: string;
  buyerId?: string;
  carrierId?: string;
  offerId?: string;
  purchaseId?: string;
  status: string;
  searchableText: string;
  createdAt: string;
  updatedAt: string;
  permissions: {
    sellerIds: string[];
    buyerIds: string[];
    carrierIds: string[];
  };
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  location?: string;
  condition?: string;
  purchasePrice?: number;
  paymentMethod?: string;
  transportCost?: number;
  pickupLocation?: string;
  deliveryLocation?: string;
  scheduledPickupDate?: string;
  scheduledDeliveryDate?: string;
}

export interface SearchResponse {
  results: SearchDocument[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  aggregations?: any;
}

export interface AutocompleteResponse {
  suggestions: string[];
}

const API_BASE_URL = process.env.REACT_APP_SEARCH_SERVICE_URL || 'http://localhost:3004';

class SearchService {
  private axios = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  });

  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await this.axios.post('/search', request);
    return response.data;
  }

  async searchAsSeller(accountId: string, searchText: string, page = 1, limit = 20, filters: any = {}): Promise<SearchResponse> {
    const response = await this.axios.post('/search/seller', {
      accountId,
      searchText,
      page,
      limit,
      filters,
    });
    return response.data;
  }

  async searchAsBuyer(accountId: string, searchText: string, page = 1, limit = 20, filters: any = {}): Promise<SearchResponse> {
    const response = await this.axios.post('/search/buyer', {
      accountId,
      searchText,
      page,
      limit,
      filters,
    });
    return response.data;
  }

  async searchAsCarrier(accountId: string, searchText: string, page = 1, limit = 20, filters: any = {}): Promise<SearchResponse> {
    const response = await this.axios.post('/search/carrier', {
      accountId,
      searchText,
      page,
      limit,
      filters,
    });
    return response.data;
  }

  async searchAsAgent(accountId: string, searchText: string, page = 1, limit = 20, filters: any = {}): Promise<SearchResponse> {
    const response = await this.axios.post('/search/agent', {
      accountId,
      searchText,
      page,
      limit,
      filters,
    });
    return response.data;
  }

  async autocomplete(searchText: string, field?: string, limit = 10): Promise<AutocompleteResponse> {
    const params = new URLSearchParams({ searchText, limit: limit.toString() });
    if (field) params.append('field', field);
    
    const response = await this.axios.get(`/search/autocomplete?${params}`);
    return response.data;
  }

  async getStatistics(): Promise<any> {
    const response = await this.axios.get('/search/statistics');
    return response.data;
  }
}

export const searchService = new SearchService();