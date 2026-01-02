const { faker } = require('@faker-js/faker');
const axios = require('axios');
const cluster = require('cluster');
const { cpus } = require('os');
const ProgressBar = require('progress');

class TargetedDataGenerator {
  constructor(config = {}) {
    this.config = {
      users: config.users || 10000,
      offers: config.offers || 30000,
      purchases: config.purchases || 30000,
      transports: config.transports || 30000,
      batchSize: config.batchSize || 200,
      workers: config.workers || 16,
      services: {
        offerService: 'http://localhost:3001',
        purchaseService: 'http://localhost:3002',
        transportService: 'http://localhost:3003',
        userService: 'http://localhost:3005',
        searchService: 'http://localhost:3004'
      }
    };

    this.stats = {
      users: { created: 0, errors: 0 },
      offers: { created: 0, errors: 0 },
      purchases: { created: 0, errors: 0 },
      transports: { created: 0, errors: 0 },
      startTime: Date.now()
    };

    // Indian automotive data
    this.indianCarMakes = [
      'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda',
      'Kia', 'Nissan', 'Ford', 'Mercedes-Benz', 'BMW', 'Audi', 'Volkswagen',
      'Skoda', 'Jeep', 'MG', 'Renault'
    ];

    this.modelsByMake = {
      'Maruti Suzuki': ['Swift', 'Baleno', 'Wagon R', 'Alto', 'Dzire', 'Vitara Brezza', 'Ertiga', 'Ciaz'],
      'Hyundai': ['i20', 'Creta', 'Verna', 'Venue', 'Santro', 'Grand i10', 'Elantra', 'Tucson'],
      'Tata': ['Nexon', 'Harrier', 'Safari', 'Altroz', 'Tigor', 'Tiago', 'Punch'],
      'Toyota': ['Innova', 'Fortuner', 'Camry', 'Corolla', 'Urban Cruiser', 'Glanza'],
      'Honda': ['City', 'Amaze', 'Jazz', 'WR-V', 'Civic', 'CR-V'],
      'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'A-Class'],
      'BMW': ['3 Series', 'X1', 'X3', 'X5', '5 Series'],
      'Audi': ['A4', 'A6', 'Q3', 'Q5', 'Q7']
    };

    this.indianCities = [
      'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
      'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Pune, Maharashtra', 'Ahmedabad, Gujarat',
      'Jaipur, Rajasthan', 'Surat, Gujarat', 'Lucknow, Uttar Pradesh', 'Kanpur, Uttar Pradesh',
      'Nagpur, Maharashtra', 'Indore, Madhya Pradesh', 'Bhopal, Madhya Pradesh', 'Visakhapatnam, Andhra Pradesh',
      'Vadodara, Gujarat', 'Faridabad, Haryana', 'Ghaziabad, Uttar Pradesh', 'Coimbatore, Tamil Nadu'
    ];

    this.indianNames = [
      'Rajesh Kumar', 'Priya Sharma', 'Amit Singh', 'Sneha Gupta', 'Vikram Patel',
      'Kavya Nair', 'Rohit Verma', 'Anita Reddy', 'Arjun Singh', 'Sunita Reddy',
      'Deepak Agarwal', 'Meera Joshi', 'Sanjay Mehta', 'Pooja Iyer', 'Rahul Khanna'
    ];
  }

  generateVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
      vin += chars[Math.floor(Math.random() * chars.length)];
    }
    return vin;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  generateUser() {
    const name = this.indianNames[Math.floor(Math.random() * this.indianNames.length)];
    const [firstName, lastName] = name.split(' ');
    const timestamp = Date.now();
    
    return {
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}@example.com`,
      phone: `+91-${faker.string.numeric('##########')}`,
      address: this.indianCities[Math.floor(Math.random() * this.indianCities.length)],
      userType: faker.helpers.arrayElement(['BUYER', 'SELLER', 'AGENT'])
    };
  }

  generateOffer() {
    const make = this.indianCarMakes[Math.floor(Math.random() * this.indianCarMakes.length)];
    const models = this.modelsByMake[make] || ['Sedan', 'Hatchback'];
    const model = models[Math.floor(Math.random() * models.length)];
    const year = 2015 + Math.floor(Math.random() * 9);
    
    let basePrice = 500000; // 5 lakh base
    if (['Mercedes-Benz', 'BMW', 'Audi'].includes(make)) {
      basePrice = 3000000; // 30 lakh for luxury
    } else if (['Toyota', 'Honda'].includes(make)) {
      basePrice = 1000000; // 10 lakh for premium
    }
    
    const ageFactor = (2024 - year) * 0.1;
    const price = Math.round(basePrice * (1 - ageFactor) * (0.8 + Math.random() * 0.4));
    
    return {
      sellerId: this.generateUUID(),
      vin: this.generateVIN(),
      make,
      model,
      year,
      price: price.toString(),
      location: this.indianCities[Math.floor(Math.random() * this.indianCities.length)],
      condition: faker.helpers.arrayElement(['NEW', 'USED', 'CERTIFIED_PRE_OWNED']),
      status: faker.helpers.arrayElement(['ACTIVE', 'SOLD', 'PENDING']),
      description: `${make} ${model} in excellent condition with premium features`,
      mileage: Math.floor(Math.random() * 100000),
      color: faker.helpers.arrayElement(['Red', 'Blue', 'White', 'Black', 'Silver', 'Grey'])
    };
  }

  generatePurchase() {
    return {
      buyerId: this.generateUUID(),
      sellerId: this.generateUUID(),
      offerId: this.generateUUID(),
      purchasePrice: Math.floor(Math.random() * 2000000) + 300000, // 3L to 23L
      paymentMethod: faker.helpers.arrayElement(['CASH', 'FINANCING', 'BANK_TRANSFER', 'CREDIT_CARD']),
      status: faker.helpers.arrayElement(['PENDING', 'COMPLETED', 'CANCELLED'])
    };
  }

  generateTransport() {
    return {
      purchaseId: this.generateUUID(),
      carrierId: this.generateUUID(),
      pickupLocation: this.indianCities[Math.floor(Math.random() * this.indianCities.length)],
      deliveryLocation: this.indianCities[Math.floor(Math.random() * this.indianCities.length)],
      transportType: faker.helpers.arrayElement(['TRUCK', 'TRAILER', 'CARRIER']),
      status: faker.helpers.arrayElement(['PENDING', 'IN_TRANSIT', 'DELIVERED']),
      estimatedDelivery: faker.date.future().toISOString(),
      cost: Math.floor(Math.random() * 50000) + 5000 // 5K to 55K
    };
  }

  async createBatch(type, data) {
    const { services } = this.config;
    
    try {
      let endpoint;
      switch (type) {
        case 'users':
          endpoint = `${services.userService}/users`;
          break;
        case 'offers':
          endpoint = `${services.offerService}/offers`;
          break;
        case 'purchases':
          endpoint = `${services.purchaseService}/purchases`;
          break;
        case 'transports':
          endpoint = `${services.transportService}/transports`;
          break;
        default:
          throw new Error(`Unknown type: ${type}`);
      }

      const responses = await Promise.allSettled(
        data.map(item => 
          axios.post(endpoint, item, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          })
        )
      );

      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status < 400).length;
      const failed = responses.length - successful;

      this.stats[type].created += successful;
      this.stats[type].errors += failed;

      return { successful, failed };
    } catch (error) {
      console.error(`❌ Batch ${type} error:`, error.message);
      this.stats[type].errors += data.length;
      return { successful: 0, failed: data.length };
    }
  }

  async generateType(type, total) {
    console.log(`🚀 Generating ${total.toLocaleString()} ${type}...`);
    
    const bar = new ProgressBar(
      `${type.toUpperCase()} [:bar] :current/:total (:percent) ETA: :etas`,
      {
        complete: '█',
        incomplete: '░',
        width: 40,
        total
      }
    );

    let created = 0;
    while (created < total) {
      const remaining = total - created;
      const batchSize = Math.min(this.config.batchSize, remaining);
      
      let batch = [];
      for (let i = 0; i < batchSize; i++) {
        switch (type) {
          case 'users':
            batch.push(this.generateUser());
            break;
          case 'offers':
            batch.push(this.generateOffer());
            break;
          case 'purchases':
            batch.push(this.generatePurchase());
            break;
          case 'transports':
            batch.push(this.generateTransport());
            break;
        }
      }

      const result = await this.createBatch(type, batch);
      created += batchSize;
      bar.tick(batchSize);

      // Small delay to prevent overwhelming the services
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ ${type.toUpperCase()}: ${this.stats[type].created}/${total} successful, ${this.stats[type].errors} errors\n`);
  }

  async syncElasticsearch() {
    console.log('🔄 Syncing with Elasticsearch...');
    
    try {
      const response = await axios.post(`${this.config.services.searchService}/index/reindex`, {}, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 300000 // 5 minutes timeout
      });
      
      console.log('✅ Elasticsearch reindex triggered successfully');
      
      // Wait a bit for reindexing to complete
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Check document count
      const countResponse = await axios.get('http://localhost:9200/global_search/_count');
      console.log(`📊 Total documents in Elasticsearch: ${countResponse.data.count.toLocaleString()}`);
      
    } catch (error) {
      console.error('❌ Elasticsearch sync error:', error.message);
    }
  }

  async generate() {
    console.log('🚀 TARGETED DATA GENERATOR FOR INDIAN AUTOMOTIVE MARKETPLACE');
    console.log('================================================================');
    console.log(`👥 Users: ${this.config.users.toLocaleString()}`);
    console.log(`🏪 Offers: ${this.config.offers.toLocaleString()}`);
    console.log(`💰 Purchases: ${this.config.purchases.toLocaleString()}`);
    console.log(`🚛 Transports: ${this.config.transports.toLocaleString()}`);
    console.log(`📦 Batch Size: ${this.config.batchSize}`);
    console.log(`📊 Total Records: ${(this.config.users + this.config.offers + this.config.purchases + this.config.transports).toLocaleString()}`);
    console.log('================================================================\n');

    // Generate each type sequentially to avoid overwhelming the database
    await this.generateType('users', this.config.users);
    await this.generateType('offers', this.config.offers);
    await this.generateType('purchases', this.config.purchases);
    await this.generateType('transports', this.config.transports);

    // Sync with Elasticsearch
    await this.syncElasticsearch();

    const duration = (Date.now() - this.stats.startTime) / 1000 / 60; // minutes
    const totalCreated = this.stats.users.created + this.stats.offers.created + 
                        this.stats.purchases.created + this.stats.transports.created;
    const totalErrors = this.stats.users.errors + this.stats.offers.errors + 
                       this.stats.purchases.errors + this.stats.transports.errors;

    console.log('\n🎉 GENERATION COMPLETE!');
    console.log('==========================================');
    console.log(`👥 Users: ${this.stats.users.created}/${this.config.users} (${this.stats.users.errors} errors)`);
    console.log(`🏪 Offers: ${this.stats.offers.created}/${this.config.offers} (${this.stats.offers.errors} errors)`);
    console.log(`💰 Purchases: ${this.stats.purchases.created}/${this.config.purchases} (${this.stats.purchases.errors} errors)`);
    console.log(`🚛 Transports: ${this.stats.transports.created}/${this.config.transports} (${this.stats.transports.errors} errors)`);
    console.log(`📊 Total Created: ${totalCreated.toLocaleString()}`);
    console.log(`❌ Total Errors: ${totalErrors.toLocaleString()}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} minutes`);
    console.log(`🚀 Rate: ${(totalCreated / duration).toFixed(0)} records/min`);
    console.log('==========================================');
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};

  args.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[index + 1];
      if (value && !value.startsWith('--')) {
        config[key] = isNaN(value) ? value : parseInt(value);
      }
    }
  });

  const generator = new TargetedDataGenerator({
    users: config.users || 10000,
    offers: config.offers || 30000,
    purchases: config.purchases || 30000,
    transports: config.transports || 30000,
    batchSize: config.batch || 200,
    workers: config.workers || 16
  });

  generator.generate().catch(console.error);
}

module.exports = TargetedDataGenerator;