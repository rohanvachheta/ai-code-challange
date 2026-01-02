import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface PurchaseResponse {
  purchaseId: string;
  status: string;
  offerId: string;
  buyerId: string;
  sellerId: string;
  purchasePrice: number;
}

@Injectable()
export class PurchaseService {
  private readonly purchaseServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.purchaseServiceUrl = this.configService.get('PURCHASE_SERVICE_URL', 'http://localhost:3002');
  }

  async getPurchase(purchaseId: string): Promise<PurchaseResponse | null> {
    try {
      const response = await axios.get(`${this.purchaseServiceUrl}/purchases/${purchaseId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching purchase ${purchaseId}:`, error.message);
      return null;
    }
  }
}