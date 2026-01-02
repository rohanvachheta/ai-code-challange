import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface OfferResponse {
  offerId: string;
  status: string;
  sellerId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  price: number;
}

@Injectable()
export class OfferService {
  private readonly offerServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.offerServiceUrl = this.configService.get('OFFER_SERVICE_URL', 'http://localhost:3001');
  }

  async getOffer(offerId: string): Promise<OfferResponse | null> {
    try {
      const response = await axios.get(`${this.offerServiceUrl}/offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching offer ${offerId}:`, error.message);
      return null;
    }
  }
}