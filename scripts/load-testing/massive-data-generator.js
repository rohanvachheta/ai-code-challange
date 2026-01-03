const { faker } = require('@faker-js/faker');
const axios = require('axios');
const cluster = require('cluster');
const { cpus } = require('os');
const ProgressBar = require('progress');
const colors = require('colors');

class MassiveDataGenerator {
  constructor(config = {}) {
    this.config = {
      totalRecords: config.totalRecords || 1000000, // Default 1M records
      batchSize: config.batchSize || 100,
      concurrentWorkers: config.concurrentWorkers || cpus().length,
      services: {
        offerService: config.offerService || 'http://localhost:3001',
        purchaseService: config.purchaseService || 'http://localhost:3002',
        transportService: config.transportService || 'http://localhost:3003',
        userService: config.userService || 'http://localhost:3004'
      },
      realisticData: config.realisticData !== false
    };

    this.stats = {
      created: 0,
      errors: 0,
      startTime: Date.now(),
      offers: 0,
      purchases: 0,
      transports: 0,
      users: 0
    };
  }

  async generate() {
    if (cluster.isPrimary) {
      console.log('🚀 MASSIVE DATA GENERATOR'.green.bold);
      console.log('================================'.cyan);
      console.log(`📊 Target Records: ${this.config.totalRecords.toLocaleString()}`.yellow);
      console.log(`👥 Workers: ${this.config.concurrentWorkers}`.yellow);
      console.log(`📦 Batch Size: ${this.config.batchSize}`.yellow);
      console.log('================================\n'.cyan);
      
      await this.orchestrateWorkers();
    } else {
      await this.workerProcess();
    }
  }

  async orchestrateWorkers() {
    const recordsPerWorker = Math.ceil(this.config.totalRecords / this.config.concurrentWorkers);
    const workers = [];
    
    // Initialize progress tracking
    this.progressBar = new ProgressBar('📈 Progress [:bar] :percent (:current/:total) ETA: :etas', {
      complete: '█',
      incomplete: '░',
      width: 40,
      total: this.config.totalRecords
    });

    // Spawn workers
    for (let i = 0; i < this.config.concurrentWorkers; i++) {
      const worker = cluster.fork({
        WORKER_ID: i,
        RECORDS_PER_WORKER: recordsPerWorker,
        BATCH_SIZE: this.config.batchSize,
        SERVICES: JSON.stringify(this.config.services)
      });

      workers.push(worker);

      worker.on('message', (msg) => {
        if (msg.type === 'stats') {
          this.updateStats(msg.data);
          this.progressBar.tick(msg.data.created);
        } else if (msg.type === 'error') {
          console.error(`❌ Worker ${msg.workerId} error:`.red, msg.error);
        }
      });
    }

    // Wait for all workers to complete
    await Promise.all(workers.map(w => new Promise(resolve => w.on('exit', resolve))));
    
    this.printFinalSummary();
  }

  async workerProcess() {
    const workerId = parseInt(process.env.WORKER_ID || '0');
    const recordsToCreate = parseInt(process.env.RECORDS_PER_WORKER || '0');
    const batchSize = parseInt(process.env.BATCH_SIZE || '100');
    const services = JSON.parse(process.env.SERVICES || '{}');

    let created = 0;
    let errors = 0;

    try {
      // Generate users first
      console.log(`🏭 Worker ${workerId}: Starting with ${recordsToCreate} records`);
      const users = await this.generateUsers(Math.ceil(recordsToCreate * 0.1), workerId);
      
      for (let i = 0; i < recordsToCreate; i += batchSize) {
        const currentBatch = Math.min(batchSize, recordsToCreate - i);
        
        try {
          // Generate realistic entity distribution
          const offersCount = Math.floor(currentBatch * 0.6); // 60% offers
          const purchasesCount = Math.floor(currentBatch * 0.25); // 25% purchases  
          const transportsCount = Math.floor(currentBatch * 0.15); // 15% transports

          // Generate interdependent data
          const offers = await this.generateRealisticOffers(offersCount, workerId, users);
          const purchases = await this.generateRealisticPurchases(purchasesCount, offers, users);
          const transports = await this.generateRealisticTransports(transportsCount, purchases, offers, users);

          // Create via APIs in parallel
          await Promise.allSettled([
            this.createBatchViaAPI('offers', offers, services.offerService),
            this.createBatchViaAPI('purchases', purchases, services.purchaseService),
            this.createBatchViaAPI('transports', transports, services.transportService)
          ]);

          const batchTotal = offers.length + purchases.length + transports.length;
          created += batchTotal;
          
          // Report progress
          if (process.send) {
            process.send({ 
              type: 'stats', 
              data: { 
                created: batchTotal, 
                errors: 0,
                offers: offers.length,
                purchases: purchases.length,
                transports: transports.length
              } 
            });
          }

        } catch (error) {
          errors++;
          if (process.send) {
            process.send({ type: 'error', workerId, error: error.message });
          }
        }

        // Memory management
        if (i % (batchSize * 10) === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (global.gc) global.gc();
        }
      }

    } catch (error) {
      if (process.send) {
        process.send({ type: 'error', workerId, error: error.message });
      }
    }

    console.log(`✅ Worker ${workerId} completed: ${created} records, ${errors} errors`);
    process.exit(0);
  }

  async generateUsers(count, workerId) {
    const users = [];
    const userTypes = ['SELLER', 'BUYER', 'CARRIER', 'AGENT'];
    
    for (let i = 0; i < count; i++) {
      users.push({
        userId: `user-${workerId}-${faker.string.uuid()}`,
        userType: faker.helpers.arrayElement(userTypes),
        accountId: `account-${workerId}-${faker.number.int({ min: 1000, max: 9999 })}`,
        email: faker.internet.email(),
        fullName: faker.person.fullName(),
        phone: faker.phone.number(),
        createdAt: faker.date.past(),
      });
    }
    
    return users;
  }

  async generateRealisticOffers(count, workerId, users) {
    const offers = [];
    
    // Realistic automotive data distributions
    const makeDistribution = {
      'Toyota': 0.14, 'Honda': 0.10, 'Ford': 0.13, 'Chevrolet': 0.12,
      'Nissan': 0.08, 'BMW': 0.06, 'Mercedes-Benz': 0.05, 'Audi': 0.04,
      'Hyundai': 0.07, 'Kia': 0.06, 'Tesla': 0.03, 'Lexus': 0.03,
      'Volkswagen': 0.02, 'Subaru': 0.04, 'Mazda': 0.03
    };

    const sellers = users.filter(u => u.userType === 'SELLER' || Math.random() < 0.4);

    for (let i = 0; i < count; i++) {
      const make = this.weightedRandom(makeDistribution);
      const model = this.getRealisticModel(make);
      const year = this.getRealisticYear();
      const seller = faker.helpers.arrayElement(sellers);
      
      offers.push({
        sellerId: seller.userId,
        vin: this.generateRealisticVIN(make, year),
        make,
        model,
        year,
        price: this.calculateRealisticPrice(make, model, year),
        location: this.getRealisticLocation(),
        condition: faker.helpers.weightedArrayElement([
          { weight: 0.6, value: 'USED' },
          { weight: 0.25, value: 'NEW' },
          { weight: 0.15, value: 'CERTIFIED_PRE_OWNED' }
        ]),
        status: faker.helpers.weightedArrayElement([
          { weight: 0.7, value: 'ACTIVE' },
          { weight: 0.2, value: 'SOLD' },
          { weight: 0.1, value: 'PENDING' }
        ]),
        description: `${year} ${make} ${model} in excellent condition`,
        mileage: this.getRealisticMileage(year),
        features: this.generateRealisticFeatures(),
        createdAt: faker.date.past({ years: 1 }),
        validUntil: faker.date.future({ years: 1 })
      });
    }
    
    return offers;
  }

  async generateRealisticPurchases(count, offers, users) {
    const purchases = [];
    const buyers = users.filter(u => u.userType === 'BUYER' || Math.random() < 0.3);
    const availableOffers = offers.filter(o => o.status === 'ACTIVE');
    
    for (let i = 0; i < Math.min(count, availableOffers.length); i++) {
      const offer = faker.helpers.arrayElement(availableOffers);
      const buyer = faker.helpers.arrayElement(buyers);
      
      purchases.push({
        buyerId: buyer.userId,
        offerId: offer.offerId || `offer-${faker.string.uuid()}`,
        purchaseDate: faker.date.recent(),
        amount: offer.price * faker.number.float({ min: 0.95, max: 1.05 }),
        status: faker.helpers.weightedArrayElement([
          { weight: 0.8, value: 'COMPLETED' },
          { weight: 0.15, value: 'PENDING' },
          { weight: 0.05, value: 'CANCELLED' }
        ]),
        paymentMethod: faker.helpers.arrayElement(['FINANCING', 'CASH', 'TRADE_IN', 'LEASE']),
        deliveryAddress: faker.location.streetAddress(),
        buyerDetails: {
          fullName: buyer.fullName,
          email: buyer.email,
          phone: buyer.phone
        }
      });
    }
    
    return purchases;
  }

  async generateRealisticTransports(count, purchases, offers, users) {
    const transports = [];
    const carriers = users.filter(u => u.userType === 'CARRIER' || Math.random() < 0.2);
    const completedPurchases = purchases.filter(p => p.status === 'COMPLETED');
    
    for (let i = 0; i < Math.min(count, completedPurchases.length); i++) {
      const purchase = faker.helpers.arrayElement(completedPurchases);
      const carrier = faker.helpers.arrayElement(carriers);
      const offer = offers.find(o => o.offerId === purchase.offerId) || faker.helpers.arrayElement(offers);
      
      transports.push({
        carrierId: carrier.userId,
        purchaseId: purchase.purchaseId || `purchase-${faker.string.uuid()}`,
        pickupLocation: offer.location || this.getRealisticLocation(),
        deliveryLocation: purchase.deliveryAddress || this.getRealisticLocation(),
        scheduledPickupDate: faker.date.future({ days: 30 }),
        scheduledDeliveryDate: faker.date.future({ days: 45 }),
        actualPickupDate: Math.random() < 0.3 ? faker.date.recent() : null,
        actualDeliveryDate: Math.random() < 0.1 ? faker.date.recent() : null,
        status: faker.helpers.weightedArrayElement([
          { weight: 0.4, value: 'SCHEDULED' },
          { weight: 0.3, value: 'IN_TRANSIT' },
          { weight: 0.2, value: 'DELIVERED' },
          { weight: 0.1, value: 'CANCELLED' }
        ]),
        transportCost: faker.number.int({ min: 500, max: 2500 }),
        vehicleDetails: {
          vin: offer.vin,
          make: offer.make,
          model: offer.model,
          year: offer.year
        }
      });
    }
    
    return transports;
  }

  async createBatchViaAPI(entityType, data, serviceUrl) {
    if (data.length === 0) return;

    const chunkSize = 20; // Smaller chunks to avoid timeouts
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      await Promise.allSettled(chunk.map(async (item) => {
        try {
          await axios.post(`${serviceUrl}/${entityType.slice(0, -1)}`, item, {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          // Log but don't fail - some duplicates expected
          if (!error.response || error.response.status !== 409) {
            console.error(`API Error for ${entityType}:`, error.message);
          }
        }
      }));
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Helper methods for realistic data generation
  weightedRandom(weights) {
    const random = Math.random();
    let cumulative = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (random <= cumulative) return key;
    }
    
    return Object.keys(weights)[0];
  }

  getRealisticModel(make) {
    const modelsByMake = {
      'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius', 'Tacoma', 'Tundra'],
      'Honda': ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey', 'Ridgeline'],
      'Ford': ['F-150', 'Escape', 'Explorer', 'Mustang', 'Focus', 'Fusion'],
      'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'i3', 'i8'],
      'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE'],
      'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
      // Add more as needed...
    };
    
    return faker.helpers.arrayElement(modelsByMake[make] || ['Base Model', 'Standard', 'Limited']);
  }

  getRealisticYear() {
    const currentYear = new Date().getFullYear();
    // Weight towards recent years
    const yearWeights = {};
    for (let year = currentYear; year >= currentYear - 20; year--) {
      const age = currentYear - year;
      yearWeights[year] = Math.max(0.01, 0.25 - (age * 0.01));
    }
    return parseInt(this.weightedRandom(yearWeights));
  }

  calculateRealisticPrice(make, model, year) {
    const basePrices = {
      'Toyota': 25000, 'Honda': 24000, 'Ford': 22000,
      'BMW': 45000, 'Mercedes-Benz': 50000, 'Tesla': 55000,
      'Chevrolet': 23000, 'Nissan': 22000
    };
    
    const basePrice = basePrices[make] || 20000;
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    const depreciationFactor = Math.max(0.3, 1 - (age * 0.08));
    
    return Math.round(basePrice * depreciationFactor * faker.number.float({ min: 0.8, max: 1.2 }));
  }

  generateRealisticVIN(make, year) {
    const wmi = { 'Toyota': '4T1', 'Honda': '1HG', 'Ford': '1FT', 'BMW': 'WBA' };
    const prefix = wmi[make] || '1AA';
    return prefix + faker.string.alphanumeric(14).toUpperCase();
  }

  getRealisticLocation() {
    const cities = [
      'Los Angeles, CA', 'New York, NY', 'Chicago, IL', 'Houston, TX',
      'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
      'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Jacksonville, FL'
    ];
    return faker.helpers.arrayElement(cities);
  }

  getRealisticMileage(year) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    const averageMilesPerYear = 12000;
    const baseMileage = age * averageMilesPerYear;
    return Math.max(0, baseMileage + faker.number.int({ min: -5000, max: 10000 }));
  }

  generateRealisticFeatures() {
    const possibleFeatures = [
      'Air Conditioning', 'Power Windows', 'Power Steering', 'Cruise Control',
      'Bluetooth', 'Navigation System', 'Backup Camera', 'Heated Seats',
      'Leather Interior', 'Sunroof', 'All-Wheel Drive', 'Remote Start'
    ];
    
    const count = faker.number.int({ min: 3, max: 8 });
    return faker.helpers.arrayElements(possibleFeatures, count);
  }

  updateStats(data) {
    this.stats.created += data.created;
    this.stats.errors += data.errors || 0;
    this.stats.offers += data.offers || 0;
    this.stats.purchases += data.purchases || 0;
    this.stats.transports += data.transports || 0;
  }

  printFinalSummary() {
    const duration = (Date.now() - this.stats.startTime) / 1000;
    
    console.log('\n🎉 MASSIVE DATA GENERATION COMPLETE!'.green.bold);
    console.log('=========================================='.cyan);
    console.log(`📊 Total Records: ${this.stats.created.toLocaleString()}`.yellow);
    console.log(`🏪 Offers: ${this.stats.offers.toLocaleString()}`.blue);
    console.log(`💰 Purchases: ${this.stats.purchases.toLocaleString()}`.blue);  
    console.log(`🚛 Transports: ${this.stats.transports.toLocaleString()}`.blue);
    console.log(`❌ Errors: ${this.stats.errors.toLocaleString()}`.red);
    console.log(`⏱️  Duration: ${(duration / 60).toFixed(2)} minutes`.green);
    console.log(`🚀 Rate: ${(this.stats.created / duration).toFixed(2)} records/sec`.green);
    console.log('==========================================\n'.cyan);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const config = {};
  
  // Parse CLI arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'records') config.totalRecords = parseInt(value);
    if (key === 'workers') config.concurrentWorkers = parseInt(value);
    if (key === 'batch') config.batchSize = parseInt(value);
  }
  
  console.log('🚀 Starting Massive Data Generator...'.green.bold);
  const generator = new MassiveDataGenerator(config);
  generator.generate().catch(console.error);
}

module.exports = MassiveDataGenerator;