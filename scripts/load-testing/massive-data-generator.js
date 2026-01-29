const { faker } = require('@faker-js/faker');
const axios = require('axios');
const cluster = require('cluster');
const { cpus } = require('os');
const ProgressBar = require('progress');
const colors = require('colors');
const { v4: uuidv4 } = require('uuid');

class MassiveDataGenerator {
  constructor(config = {}) {
    this.config = {
      startingRecords: config.startingRecords || 5, // Start with 5 records
      maxRecords: config.maxRecords || 10000, // Go up to 10,000 records
      increment: config.increment || 5, // Increment by 5 each time
      batchSize: config.batchSize || 10, // Process in smaller batches
      concurrentWorkers: config.concurrentWorkers || 2, // Use 2 workers for better performance
      services: {
        offerService: config.offerService || 'http://localhost:3001',
        purchaseService: config.purchaseService || 'http://localhost:3002',
        transportService: config.transportService || 'http://localhost:3003',
        userService: config.userService || 'http://localhost:3005' // Fixed port mapping
      },
      realisticData: config.realisticData !== false,
      stopOnError: config.stopOnError !== false // Stop on API errors by default
    };

    this.stats = {
      created: 0,
      errors: 0,
      startTime: Date.now(),
      offers: 0,
      purchases: 0,
      transports: 0,
      users: 0,
      totalRuns: 0,
      failedRuns: 0
    };
    
    this.userPool = {
      sellers: [],
      buyers: [],
      carriers: []
    };
    
    this.shouldStop = false;
  }

  async generate() {
    if (cluster.isPrimary) {
      console.log('🚀 MASSIVE DATA GENERATOR WITH PROGRESSION'.green.bold);
      console.log('=========================================='.cyan);
      console.log(`🎯 Starting Records: ${this.config.startingRecords.toLocaleString()}`.yellow);
      console.log(`🏁 Maximum Records: ${this.config.maxRecords.toLocaleString()}`.yellow);
      console.log(`📈 Increment: ${this.config.increment.toLocaleString()}`.yellow);
      console.log(`👥 Workers: ${this.config.concurrentWorkers}`.yellow);
      console.log(`📦 Batch Size: ${this.config.batchSize}`.yellow);
      console.log('==========================================\n'.cyan);
      
      await this.generateProgressively();
    } else {
      await this.workerProcess();
    }
  }

  async generateProgressively() {
    let currentRecords = this.config.startingRecords;
    
    while (currentRecords <= this.config.maxRecords && !this.shouldStop) {
      console.log(`\n🔄 Generating ${currentRecords} records...`.cyan.bold);
      
      try {
        await this.orchestrateWorkers(currentRecords);
        
        this.stats.totalRuns++;
        console.log(`✅ Successfully generated ${currentRecords} records`.green);
        
        // Increment for next iteration
        currentRecords += this.config.increment;
        
        // Short pause between runs to avoid overwhelming services
        if (currentRecords <= this.config.maxRecords) {
          console.log(`⏳ Waiting 2 seconds before next batch...`.yellow);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        this.stats.failedRuns++;
        console.error(`❌ Failed to generate ${currentRecords} records:`.red, error.message);
        
        if (this.config.stopOnError) {
          console.log(`🛑 Stopping due to error (stopOnError = true)`.red.bold);
          this.shouldStop = true;
          break;
        } else {
          console.log(`⚠️ Continuing despite error (stopOnError = false)`.yellow);
          currentRecords += this.config.increment;
        }
      }
    }
    
    this.printFinalSummary();
  }

  async orchestrateWorkers(totalRecords) {
    const recordsPerWorker = Math.ceil(totalRecords / this.config.concurrentWorkers);
    const workers = [];
    let workerErrors = 0;
    
    // Initialize progress tracking
    this.progressBar = new ProgressBar('📈 Progress [:bar] :percent (:current/:total) ETA: :etas', {
      complete: '█',
      incomplete: '░',
      width: 40,
      total: totalRecords
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
      // Generate users first (need a good pool of users for realistic data)
      console.log(`🏭 Worker ${workerId}: Starting with ${recordsToCreate} records total`);
      const usersToCreate = Math.max(20, Math.ceil(recordsToCreate / 10)); // Create enough users for realistic data
      const users = await this.generateUsers(usersToCreate, workerId);
      
      console.log(`📝 Generated ${users.length} users`);
      
      // Create users via API first
      console.log(`🔄 Creating ${users.length} users via API...`);
      const createdUsers = await this.createBatchViaAPI('users', users, services.userService);
      
      if (createdUsers.length === 0) {
        throw new Error('Failed to create any users. Cannot proceed without users.');
      }
      
      console.log(`✅ Created ${createdUsers.length} user(s)`);
      
      // Organize users by type for easier access
      const userPool = {
        sellers: createdUsers.filter(u => u.userType === 'SELLER'),
        buyers: createdUsers.filter(u => u.userType === 'BUYER'),
        carriers: createdUsers.filter(u => u.userType === 'CARRIER')
      };
      
      console.log(`👥 User pool: ${userPool.sellers.length} sellers, ${userPool.buyers.length} buyers, ${userPool.carriers.length} carriers`);
      
      const recordsPerBatch = Math.ceil(recordsToCreate / 10); // Divide into 10 batches
      const numberOfBatches = Math.min(10, Math.ceil(recordsToCreate / recordsPerBatch));
      
      for (let batch = 0; batch < numberOfBatches; batch++) {
        
        try {
          console.log(`\n🔄 Processing batch ${batch + 1}/10...`);
          
          // Generate realistic batch of offers, purchases, and transports
          console.log(`🏪 Generating ${recordsPerBatch} offers...`);
          const offers = await this.generateRealisticOffers(recordsPerBatch, workerId, createdUsers);
          
          // Create offers via API first
          console.log(`🔄 Creating ${offers.length} offers via API...`);
          const createdOffers = await this.createBatchViaAPI('offers', offers, services.offerService);
          
          if (createdOffers.length > 0) {
            // Generate purchases for the created offers
            console.log(`💰 Generating ${createdOffers.length} purchases...`);
            const purchasesWithCorrectIds = createdOffers.map(offer => {
              const buyer = faker.helpers.arrayElement(userPool.buyers.length > 0 ? userPool.buyers : createdUsers);
              return {
                purchaseId: uuidv4(),
                buyerId: buyer.userId,
                offerId: offer.offerId || offer.id,
                sellerId: offer.sellerId,
                purchasePrice: Math.round(offer.price * faker.number.float({ min: 0.95, max: 1.05 })),
                paymentMethod: faker.helpers.arrayElement(['CREDIT_CARD', 'BANK_TRANSFER', 'FINANCING', 'CASH', 'TRADE_IN']),
                notes: `Purchase of ${offer.year} ${offer.make} ${offer.model}`,
                taxRate: faker.number.float({ min: 5.0, max: 15.0, fractionDigits: 1 }),
                buyerInfo: {
                  name: `${buyer.firstName} ${buyer.lastName}`,
                  phone: buyer.phone
                }
              };
            });
            
            console.log(`🔄 Creating ${purchasesWithCorrectIds.length} purchases via API...`);
            const createdPurchases = await this.createBatchViaAPI('purchases', purchasesWithCorrectIds, services.purchaseService);
            
            if (createdPurchases.length > 0) {
              // Complete purchases so transports can be created
              console.log(`🔄 Completing ${createdPurchases.length} purchases...`);
              const completedPurchases = [];
              for (const purchase of createdPurchases) {
                try {
                  await axios.patch(`${services.purchaseService}/purchases/${purchase.purchaseId}`, {
                    status: 'COMPLETED'
                  }, {
                    timeout: 30000,
                    headers: { 'Content-Type': 'application/json' }
                  });
                  completedPurchases.push(purchase);
                } catch (error) {
                  console.error(`⚠️ Error completing purchase ${purchase.purchaseId}:`, error.message);
                  // Continue with other purchases
                }
              }
              
              console.log(`✅ Completed ${completedPurchases.length} purchases`);
              
              if (completedPurchases.length > 0) {
                // Generate transports for completed purchases
                console.log(`🚛 Generating ${completedPurchases.length} transports...`);
                const transportsWithCorrectIds = completedPurchases.map(purchase => {
                  const offer = createdOffers.find(o => o.offerId === purchase.offerId);
                  const carrier = faker.helpers.arrayElement(userPool.carriers.length > 0 ? userPool.carriers : createdUsers);
                  return {
                    transportId: uuidv4(),
                    purchaseId: purchase.purchaseId || purchase.id,
                    carrierId: carrier.userId,
                    offerId: purchase.offerId,
                    buyerId: purchase.buyerId,
                    pickupLocation: offer?.location || 'Mumbai, Maharashtra',
                    deliveryLocation: `${faker.location.streetAddress()}, ${faker.helpers.arrayElement(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'])}`,
                    scheduledPickupDate: faker.date.future({ days: 30 }).toISOString(),
                    scheduledDeliveryDate: faker.date.future({ days: 45 }).toISOString(),
                    transportType: faker.helpers.arrayElement(['OPEN_TRAILER', 'ENCLOSED_TRAILER', 'FLATBED', 'SINGLE_CAR']),
                    transportCost: faker.number.int({ min: 5000, max: 25000 }),
                    estimatedDistance: faker.number.float({ min: 10, max: 500, fractionDigits: 1 }),
                    carrierInfo: {
                      name: `${carrier.firstName} ${carrier.lastName}`,
                      phone: carrier.phone,
                      licenseNumber: carrier.carrierDetails?.licenseNumber,
                      vehicleCapacity: carrier.carrierDetails?.vehicleCapacity
                    }
                  };
                });

                console.log(`🔄 Creating ${transportsWithCorrectIds.length} transports via API...`);
                const createdTransports = await this.createBatchViaAPI('transports', transportsWithCorrectIds, services.transportService);
                
                const batchTotal = createdOffers.length + createdPurchases.length + createdTransports.length;
                created += batchTotal;
                
                console.log(`✅ Batch ${batch + 1} completed: ${createdOffers.length} offers, ${createdPurchases.length} purchases, ${createdTransports.length} transports`);
                
                // Report progress
                if (process.send) {
                  process.send({ 
                    type: 'stats', 
                    data: { 
                      created: batchTotal, 
                      errors: 0,
                      offers: createdOffers.length,
                      purchases: createdPurchases.length,
                      transports: createdTransports.length
                    } 
                  });
                }
              } else {
                console.log(`⚠️ No purchases completed in batch ${batch + 1}, skipping transports`);
              }
            } else {
              console.log(`⚠️ No purchases created in batch ${batch + 1}, skipping transports`);
            }
          } else {
            console.log(`⚠️ No offers created in batch ${batch + 1}, skipping purchases and transports`);
          }

        } catch (error) {
          errors++;
          console.error(`❌ Batch ${batch + 1} error:`, error.message);
          
          // Send error to main process
          if (process.send) {
            process.send({ type: 'error', workerId, error: error.message });
          }
          
          // If stopOnError is true and this is a critical error, send critical error
          const stopOnError = process.env.STOP_ON_ERROR === 'true';
          if (stopOnError && (error.message.includes('Critical:') || error.message.includes('Failed to create any'))) {
            if (process.send) {
              process.send({ type: 'critical_error', workerId, error: error.message });
            }
            throw error;
          }
          
          // Continue with next batch for non-critical errors
          console.log(`⏭️ Continuing to next batch despite error...`);
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
    const indianNames = [
      'Rajesh Kumar', 'Priya Sharma', 'Amit Singh', 'Sneha Gupta', 'Vikram Patel',
      'Kavya Nair', 'Rohit Verma', 'Anita Reddy', 'Suresh Jain', 'Pooja Agarwal',
      'Arjun Singh', 'Deepika Rao', 'Manish Choudhary', 'Ritu Bansal',
      'Kiran Joshi', 'Meera Das', 'Sanjay Chopra', 'Nikita Malhotra'
    ];
    
    // Calculate distribution for user types
    const sellersCount = Math.ceil(count * 0.3); // 30% sellers
    const buyersCount = Math.ceil(count * 0.4); // 40% buyers 
    const carriersCount = Math.ceil(count * 0.3); // 30% carriers/transporters
    
    // Generate sellers
    for (let i = 0; i < sellersCount; i++) {
      const nameArr = faker.helpers.arrayElement(indianNames).split(' ');
      const firstName = nameArr[0];
      const lastName = nameArr[1] || 'Singh';
      const userId = uuidv4();
      const timestamp = Date.now() + i; // Add incremental delay to ensure uniqueness
      const randomSuffix = faker.number.int({ min: 100000, max: 999999 });
      
      users.push({
        userId,
        userType: 'SELLER',
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${randomSuffix}.seller@example.com`,
        phone: `+91${faker.number.int({ min: 7000000000, max: 9999999999 })}`,
        address: `${faker.location.streetAddress()}, Mumbai, Maharashtra`,
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: faker.location.zipCode(),
        isVerified: true,
        businessType: 'DEALER' // Sellers are typically dealers
      });
    }
    
    // Generate buyers
    for (let i = 0; i < buyersCount; i++) {
      const nameArr = faker.helpers.arrayElement(indianNames).split(' ');
      const firstName = nameArr[0];
      const lastName = nameArr[1] || 'Singh';
      const userId = uuidv4();
      const timestamp = Date.now() + sellersCount + i; // Add offset and incremental delay
      const randomSuffix = faker.number.int({ min: 100000, max: 999999 });
      
      users.push({
        userId,
        userType: 'BUYER',
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${randomSuffix}.buyer@example.com`,
        phone: `+91${faker.number.int({ min: 7000000000, max: 9999999999 })}`,
        address: `${faker.location.streetAddress()}, Delhi, NCR`,
        city: 'Delhi',
        state: 'Delhi',
        zipCode: faker.location.zipCode(),
        isVerified: true,
        preferences: {
          maxBudget: faker.number.int({ min: 500000, max: 5000000 }),
          preferredBrands: faker.helpers.arrayElements(['Toyota', 'Honda', 'Hyundai', 'Maruti Suzuki'], { min: 1, max: 3 })
        }
      });
    }
    
    // Generate carriers/transporters
    for (let i = 0; i < carriersCount; i++) {
      const nameArr = faker.helpers.arrayElement(indianNames).split(' ');
      const firstName = nameArr[0];
      const lastName = nameArr[1] || 'Singh';
      const userId = uuidv4();
      const timestamp = Date.now() + sellersCount + buyersCount + i; // Add offset and incremental delay
      const randomSuffix = faker.number.int({ min: 100000, max: 999999 });
      
      users.push({
        userId,
        userType: 'CARRIER',
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${randomSuffix}.carrier@example.com`,
        phone: `+91${faker.number.int({ min: 7000000000, max: 9999999999 })}`,
        address: `${faker.location.streetAddress()}, Bangalore, Karnataka`,
        city: 'Bangalore',
        state: 'Karnataka',
        zipCode: faker.location.zipCode(),
        isVerified: true,
        carrierDetails: {
          licenseNumber: `KA${faker.number.int({ min: 1000000, max: 9999999 })}`,
          vehicleCapacity: faker.helpers.arrayElement([1, 2, 4, 6, 8]),
          transportTypes: faker.helpers.arrayElements(['SINGLE_CAR', 'OPEN_TRAILER', 'ENCLOSED_TRAILER', 'FLATBED'], { min: 1, max: 2 })
        }
      });
    }
    
    console.log(`👥 Generated ${users.length} users: ${sellersCount} sellers, ${buyersCount} buyers, ${carriersCount} carriers`);
    return users;
  }

  async generateRealisticOffers(count, workerId, users) {
    const offers = [];
    
    // Realistic Indian automotive data distributions
    const indianCarMakes = [
      'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Toyota', 'Honda',
      'Kia', 'Nissan', 'Ford', 'Volkswagen', 'Skoda', 'Mercedes-Benz',
      'BMW', 'Audi', 'Jeep', 'MG', 'Renault', 'Datsun'
    ];
    
    const modelsByMake = {
      'Maruti Suzuki': ['Swift', 'Baleno', 'Wagon R', 'Alto', 'Dzire', 'Ertiga', 'Vitara Brezza'],
      'Hyundai': ['i20', 'Creta', 'Verna', 'Venue', 'Santro', 'Grand i10', 'Tucson', 'Elantra'],
      'Tata': ['Nexon', 'Harrier', 'Safari', 'Altroz', 'Tigor', 'Punch'],
      'Mahindra': ['XUV700', 'Scorpio', 'Thar', 'Bolero', 'XUV300'],
      'Toyota': ['Innova', 'Fortuner', 'Camry', 'Corolla', 'Glanza', 'Urban Cruiser'],
      'Honda': ['City', 'Amaze', 'Jazz', 'WR-V', 'Civic', 'CR-V'],
      'Kia': ['Seltos', 'Sonet', 'Carens'],
      'Ford': ['EcoSport', 'Endeavour', 'Figo', 'Aspire'],
      'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE'],
      'BMW': ['3 Series', '5 Series', 'X1', 'X3', 'X5'],
      'Audi': ['A4', 'A6', 'Q3', 'Q5', 'Q7']
    };
    
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
      'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
      'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad'
    ];
    
    const indianNames = [
      'Rajesh Kumar', 'Priya Sharma', 'Amit Singh', 'Sneha Gupta', 'Vikram Patel',
      'Kavya Nair', 'Rohit Verma', 'Anita Reddy', 'Suresh Jain', 'Pooja Agarwal',
      'Arjun Singh', 'Deepika Rao', 'Manish Choudhary', 'Ritu Bansal'
    ];

    const sellers = users.filter(u => u.userType === 'SELLER');
    if (sellers.length === 0) {
      throw new Error('No sellers found in user pool. Need sellers to create offers.');
    }

    for (let i = 0; i < count; i++) {
      const make = faker.helpers.arrayElement(indianCarMakes);
      const models = modelsByMake[make] || ['Sedan', 'Hatchback', 'SUV'];
      const model = faker.helpers.arrayElement(models);
      const year = 2015 + Math.floor(Math.random() * 9); // 2015-2023
      const seller = faker.helpers.arrayElement(sellers);
      
      const offerId = uuidv4();
      const vin = this.generateRealisticVIN();
      const basePrice = this.getBasePriceForMake(make);
      const ageFactor = (2024 - year) * 0.1;
      const price = Math.round(basePrice * (1 - ageFactor) * (0.8 + Math.random() * 0.4));
      
      offers.push({
        offerId,
        sellerId: seller.userId,
        vin,
        make,
        model,
        year,
        price: Math.max(price, 100000), // Minimum 1 lakh
        location: faker.helpers.arrayElement(indianCities),
        condition: faker.helpers.weightedArrayElement([
          { weight: 0.6, value: 'USED' },
          { weight: 0.25, value: 'NEW' },
          { weight: 0.15, value: 'CERTIFIED_PRE_OWNED' }
        ]),
        status: 'ACTIVE', // Always active for test
        description: `${year} ${make} ${model} in excellent condition`,
        mileage: this.getRealisticMileage(year),
        features: this.generateRealisticFeatures(),
        sellerInfo: {
          name: `${seller.firstName} ${seller.lastName}`,
          businessType: seller.businessType,
          phone: seller.phone
        }
      });
    }
    
    return offers;
  }

  async generateRealisticPurchases(count, offers, users) {
    const purchases = [];
    const buyers = users.filter(u => u.userType === 'BUYER').length > 0
      ? users.filter(u => u.userType === 'BUYER')
      : users; // Fallback to all users if no buyers
    const availableOffers = offers.filter(o => o.status === 'ACTIVE');
    
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
      'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur'
    ];
    
    for (let i = 0; i < Math.min(count, availableOffers.length); i++) {
      const offer = faker.helpers.arrayElement(availableOffers);
      const buyer = faker.helpers.arrayElement(buyers);
      
      purchases.push({
        buyerId: buyer.userId || buyer.id || `buyer-${i}`,
        offerId: offer.offerId || offer.id || `offer-${faker.string.uuid()}`,
        sellerId: offer.sellerId || `seller-${i}`, // Required field
        purchasePrice: Math.round(offer.price * faker.number.float({ min: 0.95, max: 1.05 })),
        paymentMethod: faker.helpers.arrayElement(['CREDIT_CARD', 'BANK_TRANSFER', 'FINANCING', 'CASH', 'TRADE_IN']),
        notes: `Purchase of ${offer.year} ${offer.make} ${offer.model}`,
        taxRate: 8.5
      });
    }
    
    return purchases;
  }

  async generateRealisticTransports(count, purchases, offers, users) {
    const transports = [];
    const carriers = users.filter(u => u.userType === 'CARRIER').length > 0
      ? users.filter(u => u.userType === 'CARRIER')
      : users; // Fallback to all users if no carriers
    const completedPurchases = purchases.filter(p => p.status === 'COMPLETED');
    
    const transportTypes = ['SINGLE_CAR', 'OPEN_TRAILER', 'ENCLOSED_TRAILER', 'FLATBED'];
    const indianCities = [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
      'Pune', 'Ahmedabad', 'Jaipur', 'Surat'
    ];
    
    for (let i = 0; i < Math.min(count, completedPurchases.length); i++) {
      const purchase = faker.helpers.arrayElement(completedPurchases);
      const carrier = faker.helpers.arrayElement(carriers);
      const offer = offers.find(o => (o.offerId || o.id) === (purchase.offerId || purchase.id)) || faker.helpers.arrayElement(offers);
      
      transports.push({
        carrierId: carrier.userId || carrier.id || `carrier-${i}`,
        purchaseId: purchase.purchaseId || purchase.id || `purchase-${faker.string.uuid()}`,
        pickupLocation: offer.location || faker.helpers.arrayElement(indianCities),
        deliveryLocation: purchase.deliveryAddress || faker.helpers.arrayElement(indianCities),
        scheduledPickupDate: faker.date.future({ days: 30 }).toISOString(),
        scheduledDeliveryDate: faker.date.future({ days: 45 }).toISOString(),
        actualPickupDate: null,
        actualDeliveryDate: null,
        status: 'SCHEDULED', // Always scheduled for test
        transportType: faker.helpers.arrayElement(transportTypes),
        transportCost: faker.number.int({ min: 5000, max: 25000 }), // INR
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
    const createdItems = [];
    if (data.length === 0) return createdItems;

    console.log(`🔗 Creating ${data.length} ${entityType} via API: ${serviceUrl}`);
    
    const endpoint = entityType === 'offers' ? 'offers' : 
                   entityType === 'purchases' ? 'purchases' : 
                   entityType === 'transports' ? 'transports' :
                   entityType === 'users' ? 'users' : entityType;
    
    let errorCount = 0;
    const maxErrors = Math.ceil(data.length * 0.2); // Allow 20% failure rate
    
    // Process in smaller chunks for better reliability
    const chunkSize = 3; // Reduced chunk size for better error handling
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      // Process chunk sequentially to avoid overwhelming the API
      for (const item of chunk) {
        let retries = 3;
        let success = false;
        
        while (retries > 0 && !success) {
          try {
            const response = await axios.post(`${serviceUrl}/${endpoint}`, item, {
              timeout: 30000,
              headers: { 'Content-Type': 'application/json' },
              validateStatus: (status) => status < 500 // Don't reject on client errors
            });
            
            if (response.status >= 200 && response.status < 300) {
              createdItems.push(response.data);
              success = true;
            } else if (response.status === 409) {
              console.log(`⚠️ Duplicate ${entityType.slice(0, -1)} - skipping...`);
              success = true; // Skip duplicates but don't count as error
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
          } catch (error) {
            retries--;
            errorCount++;
            
            console.error(`❌ API Error for ${entityType} (${3-retries}/3):`, error.message);
            
            if (errorCount > maxErrors) {
              console.error(`🚨 Too many errors (${errorCount}/${maxErrors}), aborting...`.red.bold);
              const stopOnError = process.env.STOP_ON_ERROR === 'true';
              if (stopOnError) {
                throw new Error(`Critical: Too many API failures for ${entityType}`);
              } else {
                console.log(`⚠️ Continuing despite errors (stopOnError = false)`.yellow);
                break;
              }
            }
            
            if (retries > 0) {
              const backoffDelay = (4 - retries) * 1000; // Progressive backoff
              console.log(`⏳ Retrying in ${backoffDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
          }
        }
        
        // Rate limiting between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const successRate = ((createdItems.length / data.length) * 100).toFixed(1);
    console.log(`🎯 Successfully created ${createdItems.length}/${data.length} ${entityType} (${successRate}% success rate)`);
    
    if (createdItems.length === 0 && data.length > 0) {
      throw new Error(`Failed to create any ${entityType}`);
    }
    
    return createdItems;
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

  generateRealisticVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
      vin += chars[Math.floor(Math.random() * chars.length)];
    }
    return vin;
  }
  
  getBasePriceForMake(make) {
    const priceMap = {
      'Maruti Suzuki': 600000,
      'Hyundai': 800000,
      'Tata': 700000,
      'Mahindra': 900000,
      'Toyota': 1200000,
      'Honda': 1000000,
      'Mercedes-Benz': 4000000,
      'BMW': 3500000,
      'Audi': 3800000
    };
    return priceMap[make] || 800000;
  }
  
  generateRealisticFeatures() {
    const possibleFeatures = [
      'Air Conditioning', 'Power Windows', 'Power Steering', 'Cruise Control',
      'Bluetooth', 'Navigation System', 'Backup Camera', 'ABS',
      'Airbags', 'Central Locking', 'Music System', 'Alloy Wheels'
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
    
    console.log('\n🎉 PROGRESSIVE DATA GENERATION COMPLETE!'.green.bold);
    console.log('=========================================='.cyan);
    console.log(`📊 Total Records Created: ${this.stats.created.toLocaleString()}`.yellow);
    console.log(`🏪 Offers: ${this.stats.offers.toLocaleString()}`.blue);
    console.log(`💰 Purchases: ${this.stats.purchases.toLocaleString()}`.blue);  
    console.log(`🚛 Transports: ${this.stats.transports.toLocaleString()}`.blue);
    console.log(`👥 Users: ${this.stats.users.toLocaleString()}`.blue);
    console.log(`✅ Successful Runs: ${this.stats.totalRuns.toLocaleString()}`.green);
    console.log(`❌ Failed Runs: ${this.stats.failedRuns.toLocaleString()}`.red);
    console.log(`❌ Total Errors: ${this.stats.errors.toLocaleString()}`.red);
    console.log(`⏱️  Total Duration: ${(duration / 60).toFixed(2)} minutes`.green);
    console.log(`🚀 Average Rate: ${(this.stats.created / duration).toFixed(2)} records/sec`.green);
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
    
    if (key === 'start') config.startingRecords = parseInt(value);
    if (key === 'max') config.maxRecords = parseInt(value);
    if (key === 'increment') config.increment = parseInt(value);
    if (key === 'workers') config.concurrentWorkers = parseInt(value);
    if (key === 'batch') config.batchSize = parseInt(value);
    if (key === 'stop-on-error') config.stopOnError = value === 'true';
  }
  
  console.log('🚀 Starting Progressive Massive Data Generator...'.green.bold);
  console.log(`📋 Configuration:`.cyan);
  console.log(`   • Starting records: ${config.startingRecords || 5}`);
  console.log(`   • Maximum records: ${config.maxRecords || 10000}`);
  console.log(`   • Increment: ${config.increment || 5}`);
  console.log(`   • Stop on error: ${config.stopOnError !== false}`);
  console.log('');
  
  const generator = new MassiveDataGenerator(config);
  generator.generate().catch((error) => {
    console.error('❌ Generator failed:'.red.bold, error.message);
    process.exit(1);
  });
}

module.exports = MassiveDataGenerator;