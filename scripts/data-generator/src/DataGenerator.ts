import axios from 'axios';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

export interface ServiceUrls {
  offerService: string;
  purchaseService: string;
  transportService: string;
  searchService: string;
}

export interface GeneratedOffer {
  sellerId: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location: string;
  condition: string;
  description?: string;
  mileage?: number;
  color?: string;
}

export interface GeneratedPurchase {
  offerId: string;
  buyerId: string;
  sellerId: string;
  purchasePrice: number;
  paymentMethod: string;
  notes?: string;
  taxRate?: number;
}

export interface GeneratedTransport {
  purchaseId: string;
  carrierId: string;
  offerId: string;
  buyerId: string;
  pickupLocation: string;
  deliveryLocation: string;
  scheduledPickupDate: string;
  scheduledDeliveryDate: string;
  transportType: string;
  transportCost: number;
  distanceKm?: number;
  specialInstructions?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}

export class DataGenerator {
  private urls: ServiceUrls;
  private axios: typeof axios;
  
  // Realistic automotive data
  private carMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes-Benz',
    'Audi', 'Volkswagen', 'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Lexus',
    'Acura', 'Infiniti', 'Cadillac', 'Lincoln', 'Buick', 'GMC', 'Ram',
    'Jeep', 'Dodge', 'Chrysler', 'Mitsubishi', 'Volvo', 'Jaguar', 'Land Rover'
  ];

  private modelsByMake: Record<string, string[]> = {
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Tacoma', 'Tundra', 'Sienna', 'Avalon', '4Runner'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit', 'HR-V', 'Passport', 'Ridgeline', 'Insight'],
    'Ford': ['F-150', 'Explorer', 'Escape', 'Fusion', 'Mustang', 'Edge', 'Expedition', 'Ranger', 'Bronco', 'Maverick'],
    'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Suburban', 'Traverse', 'Camaro', 'Corvette', 'Cruze', 'Impala'],
    'BMW': ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'Z4', 'i3', 'i8', 'M3'],
    'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'A-Class', 'CLA', 'AMG GT', 'G-Class'],
  };

  private conditions = ['NEW', 'USED', 'CERTIFIED_PRE_OWNED', 'DAMAGED'];
  private paymentMethods = ['CREDIT_CARD', 'BANK_TRANSFER', 'FINANCING', 'CASH', 'TRADE_IN'];
  private transportTypes = ['OPEN_TRAILER', 'ENCLOSED_TRAILER', 'FLATBED', 'SINGLE_CAR'];

  private locations = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
    'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
    'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
    'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Washington, DC',
    'Boston, MA', 'El Paso, TX', 'Nashville, TN', 'Detroit, MI', 'Oklahoma City, OK',
    'Portland, OR', 'Las Vegas, NV', 'Memphis, TN', 'Louisville, KY', 'Baltimore, MD',
    'Milwaukee, WI', 'Albuquerque, NM', 'Tucson, AZ', 'Fresno, CA', 'Sacramento, CA',
    'Mesa, AZ', 'Kansas City, MO', 'Atlanta, GA', 'Long Beach, CA', 'Colorado Springs, CO'
  ];

  constructor(urls: ServiceUrls) {
    this.urls = urls;
    this.axios = axios.create({ timeout: 10000 });
  }

  generateVIN(): string {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
      vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
  }

  generateOffer(): GeneratedOffer {
    const make = faker.helpers.arrayElement(this.carMakes);
    const models = this.modelsByMake[make] || ['Model'];
    const model = faker.helpers.arrayElement(models);
    const year = faker.date.between({ from: '2000-01-01', to: new Date() }).getFullYear();
    const basePrice = faker.number.int({ min: 8000, max: 150000 });
    
    // Adjust price based on year and condition
    const currentYear = new Date().getFullYear();
    const ageMultiplier = Math.max(0.3, 1 - (currentYear - year) * 0.08);
    const condition = faker.helpers.arrayElement(this.conditions);
    const conditionMultiplier = condition === 'NEW' ? 1.2 : condition === 'CERTIFIED_PRE_OWNED' ? 1.1 : condition === 'DAMAGED' ? 0.6 : 1;
    
    return {
      sellerId: uuidv4(),
      vin: this.generateVIN(),
      make,
      model,
      year,
      price: Math.round(basePrice * ageMultiplier * conditionMultiplier),
      location: faker.helpers.arrayElement(this.locations),
      condition,
      description: faker.lorem.sentences(2),
      mileage: condition === 'NEW' ? faker.number.int({ min: 0, max: 50 }) : faker.number.int({ min: 5000, max: 200000 }),
      color: faker.color.human(),
    };
  }

  generatePurchase(offer: any): GeneratedPurchase {
    const discount = faker.number.float({ min: 0.85, max: 0.98 });
    return {
      offerId: offer.offerId,
      buyerId: uuidv4(),
      sellerId: offer.sellerId,
      purchasePrice: Math.round(offer.price * discount),
      paymentMethod: faker.helpers.arrayElement(this.paymentMethods),
      notes: faker.lorem.sentence(),
      taxRate: faker.number.float({ min: 6, max: 10, fractionDigits: 2 }),
    };
  }

  generateTransport(purchase: any, offer: any): GeneratedTransport {
    const pickupDate = faker.date.future({ years: 0.5 });
    const deliveryDate = new Date(pickupDate);
    deliveryDate.setDate(pickupDate.getDate() + faker.number.int({ min: 2, max: 14 }));
    
    const distance = faker.number.int({ min: 50, max: 3000 });
    const costPerKm = faker.number.float({ min: 0.8, max: 2.5 });

    return {
      purchaseId: purchase.purchaseId,
      carrierId: uuidv4(),
      offerId: offer.offerId,
      buyerId: purchase.buyerId,
      pickupLocation: offer.location || faker.helpers.arrayElement(this.locations),
      deliveryLocation: faker.helpers.arrayElement(this.locations),
      scheduledPickupDate: pickupDate.toISOString(),
      scheduledDeliveryDate: deliveryDate.toISOString(),
      transportType: faker.helpers.arrayElement(this.transportTypes),
      transportCost: Math.round(distance * costPerKm),
      distanceKm: distance,
      specialInstructions: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
      driverName: faker.person.fullName(),
      driverPhone: faker.phone.number('###-###-####'),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }),
    };
  }

  async createOffer(offer: GeneratedOffer): Promise<any> {
    try {
      const response = await this.axios.post(`${this.urls.offerService}/offers`, offer);
      return response.data;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async createPurchase(purchase: GeneratedPurchase): Promise<any> {
    try {
      const response = await this.axios.post(`${this.urls.purchaseService}/purchases`, purchase);
      return response.data;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  }

  async createTransport(transport: GeneratedTransport): Promise<any> {
    try {
      const response = await this.axios.post(`${this.urls.transportService}/transports`, transport);
      return response.data;
    } catch (error) {
      console.error('Error creating transport:', error);
      throw error;
    }
  }

  async generateDataset(options: {
    offers: number;
    purchaseRatio: number; // 0.0 to 1.0
    transportRatio: number; // 0.0 to 1.0 (of purchases)
    batchSize: number;
  }): Promise<void> {
    console.log(`🚀 Starting data generation:`);
    console.log(`  - ${options.offers} offers`);
    console.log(`  - ${Math.round(options.offers * options.purchaseRatio)} purchases (${Math.round(options.purchaseRatio * 100)}% of offers)`);
    console.log(`  - ${Math.round(options.offers * options.purchaseRatio * options.transportRatio)} transports (${Math.round(options.transportRatio * 100)}% of purchases)`);
    console.log(`  - Batch size: ${options.batchSize}\n`);

    const createdOffers: any[] = [];
    const createdPurchases: any[] = [];

    // Generate offers in batches
    for (let i = 0; i < options.offers; i += options.batchSize) {
      const batchEnd = Math.min(i + options.batchSize, options.offers);
      const batchSize = batchEnd - i;
      
      console.log(`📦 Creating offers ${i + 1}-${batchEnd}...`);
      
      const offerPromises = [];
      for (let j = 0; j < batchSize; j++) {
        const offer = this.generateOffer();
        offerPromises.push(this.createOffer(offer));
      }

      try {
        const batchOffers = await Promise.all(offerPromises);
        createdOffers.push(...batchOffers);
        console.log(`✅ Created ${batchSize} offers`);
      } catch (error) {
        console.error(`❌ Failed to create offers in batch ${i + 1}-${batchEnd}:`, error);
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Created ${createdOffers.length} offers total\n`);

    // Generate purchases
    const targetPurchases = Math.round(createdOffers.length * options.purchaseRatio);
    const offersForPurchase = faker.helpers.shuffle(createdOffers).slice(0, targetPurchases);

    for (let i = 0; i < offersForPurchase.length; i += options.batchSize) {
      const batchEnd = Math.min(i + options.batchSize, offersForPurchase.length);
      const batchOffers = offersForPurchase.slice(i, batchEnd);
      
      console.log(`💰 Creating purchases ${i + 1}-${batchEnd}...`);
      
      const purchasePromises = batchOffers.map(offer => {
        const purchase = this.generatePurchase(offer);
        return this.createPurchase(purchase);
      });

      try {
        const batchPurchases = await Promise.all(purchasePromises);
        createdPurchases.push(...batchPurchases);
        console.log(`✅ Created ${batchPurchases.length} purchases`);
      } catch (error) {
        console.error(`❌ Failed to create purchases in batch ${i + 1}-${batchEnd}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n💳 Created ${createdPurchases.length} purchases total\n`);

    // Generate transports
    const targetTransports = Math.round(createdPurchases.length * options.transportRatio);
    const purchasesForTransport = faker.helpers.shuffle(createdPurchases).slice(0, targetTransports);

    for (let i = 0; i < purchasesForTransport.length; i += options.batchSize) {
      const batchEnd = Math.min(i + options.batchSize, purchasesForTransport.length);
      const batchPurchases = purchasesForTransport.slice(i, batchEnd);
      
      console.log(`🚛 Creating transports ${i + 1}-${batchEnd}...`);
      
      const transportPromises = batchPurchases.map(purchase => {
        const relatedOffer = createdOffers.find(o => o.offerId === purchase.offerId);
        const transport = this.generateTransport(purchase, relatedOffer);
        return this.createTransport(transport);
      });

      try {
        const batchTransports = await Promise.all(transportPromises);
        console.log(`✅ Created ${batchTransports.length} transports`);
      } catch (error) {
        console.error(`❌ Failed to create transports in batch ${i + 1}-${batchEnd}:`, error);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Data generation completed!`);
    console.log(`📈 Final counts:`);
    console.log(`  - Offers: ${createdOffers.length}`);
    console.log(`  - Purchases: ${createdPurchases.length}`);
    console.log(`  - Transports: ${targetTransports}`);
  }

  async waitForSearchIndex(expectedCount: number, maxRetries = 30): Promise<void> {
    console.log(`⏳ Waiting for search index to update (expecting ~${expectedCount} documents)...`);
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.axios.get(`${this.urls.searchService}/search/statistics`);
        const total = response.data.total || 0;
        
        console.log(`   Indexed: ${total}/${expectedCount} documents`);
        
        if (total >= expectedCount * 0.9) { // Allow 90% threshold
          console.log(`✅ Search index updated successfully!`);
          return;
        }
      } catch (error) {
        console.log(`   Error checking index: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`⚠️  Search index may not be fully updated, continuing...`);
  }
}