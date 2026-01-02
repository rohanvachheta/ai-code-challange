#!/usr/bin/env node

const axios = require('axios');

// ============================================================================
// DYNAMIC DATA GENERATOR - CONFIGURABLE COUNTS
// ============================================================================

class DynamicDataGenerator {
  constructor(config = {}) {
    this.services = {
      users: 'http://localhost:3005/users',
      offers: 'http://localhost:3001/offers',
      purchases: 'http://localhost:3002/purchases', 
      transports: 'http://localhost:3003/transports',
      search: 'http://localhost:3004/search',
      elasticsearch: 'http://localhost:9200'
    };

    this.config = {
      users: config.users || 3,
      offers: config.offers || 2,
      purchases: config.purchases || 1,
      transports: config.transports || 1,
      ...config
    };

    this.createdEntities = {
      sellers: [],
      buyers: [],
      carriers: [],
      offers: [],
      purchases: [],
      transports: []
    };

    this.data = {
      carMakes: ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Maruti Suzuki'],
      carModels: {
        'Toyota': ['Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander'],
        'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'City'],
        'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape'],
        'BMW': ['3 Series', '5 Series', 'X3', 'X5'],
        'Mercedes-Benz': ['C-Class', 'E-Class', 'GLE', 'GLC'],
        'Maruti Suzuki': ['Swift', 'Baleno', 'Dzire', 'Alto', 'Wagon R'],
        'Audi': ['A4', 'A6', 'Q5', 'Q7'],
        'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder'],
        'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe'],
        'Kia': ['Optima', 'Forte', 'Sorento', 'Sportage'],
        'Mazda': ['Mazda3', 'Mazda6', 'CX-5', 'CX-9']
      },
      locations: [
        'Mumbai, Maharashtra', 'Delhi, India', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
        'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Pune, Maharashtra', 'Ahmedabad, Gujarat',
        'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'
      ],
      names: [
        { first: 'Rajesh', last: 'Kumar' }, { first: 'Priya', last: 'Sharma' },
        { first: 'Arjun', last: 'Singh' }, { first: 'Anita', last: 'Gupta' },
        { first: 'Vikram', last: 'Patel' }, { first: 'Sunita', last: 'Reddy' },
        { first: 'Ravi', last: 'Agarwal' }, { first: 'Kavya', last: 'Nair' },
        { first: 'John', last: 'Smith' }, { first: 'Jane', last: 'Johnson' },
        { first: 'Michael', last: 'Williams' }, { first: 'Sarah', last: 'Brown' },
        { first: 'David', last: 'Jones' }, { first: 'Emily', last: 'Garcia' }
      ],
      conditions: ['NEW', 'USED', 'CERTIFIED_PRE_OWNED'],
      colors: ['White', 'Black', 'Silver', 'Red', 'Blue', 'Gray'],
      fuelTypes: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID'],
      transmissions: ['MANUAL', 'AUTOMATIC', 'CVT'],
      transportTypes: ['OPEN_TRAILER', 'ENCLOSED_TRAILER', 'FLATBED', 'SINGLE_CAR'],
      paymentMethods: ['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'FINANCING']
    };
  }

  /**
   * Generate a realistic VIN
   */
  generateVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
      vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
  }

  /**
   * Create test users with specified count
   */
  async createTestUsers() {
    console.log(`👥 Creating ${this.config.users} test users...`);

    const userTypes = ['SELLER', 'BUYER', 'CARRIER'];
    const usersPerType = Math.ceil(this.config.users / userTypes.length);

    let userIndex = 0;
    
    for (const userType of userTypes) {
      const countForType = Math.min(usersPerType, this.config.users - userIndex);
      
      console.log(`  Creating ${countForType} ${userType.toLowerCase()}(s)...`);
      
      for (let i = 0; i < countForType; i++) {
        const name = this.data.names[userIndex % this.data.names.length];
        const timestamp = Date.now() + userIndex;
        
        const user = {
          firstName: name.first,
          lastName: name.last,
          email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}.${timestamp}@example.com`,
          phone: `+91-${9876543210 + userIndex}`,
          userType,
          isActive: true
        };

        try {
          const response = await axios.post(this.services.users, user);
          const createdUser = response.data;
          
          // Store in appropriate array
          if (userType === 'SELLER') this.createdEntities.sellers.push(createdUser);
          else if (userType === 'BUYER') this.createdEntities.buyers.push(createdUser);
          else if (userType === 'CARRIER') this.createdEntities.carriers.push(createdUser);
          
          console.log(`    ✅ ${userType}: ${createdUser.userId}`);
          userIndex++;
        } catch (error) {
          console.log(`    ❌ Failed to create ${userType} ${i + 1}: ${error.response?.data?.message || error.message}`);
        }
        
        // Small delay to avoid overwhelming the API
        await this.delay(100);
      }
    }

    const totalCreated = this.createdEntities.sellers.length + 
                        this.createdEntities.buyers.length + 
                        this.createdEntities.carriers.length;
                        
    console.log(`  📊 Created ${totalCreated}/${this.config.users} users`);
    return totalCreated > 0;
  }

  /**
   * Create test offers with specified count
   */
  async createTestOffers() {
    if (this.createdEntities.sellers.length === 0) {
      console.log('  ⚠️  No sellers available for offers');
      return false;
    }

    console.log(`🚗 Creating ${this.config.offers} test offers...`);

    for (let i = 0; i < this.config.offers; i++) {
      const seller = this.createdEntities.sellers[i % this.createdEntities.sellers.length];
      const make = this.data.carMakes[Math.floor(Math.random() * this.data.carMakes.length)];
      const models = this.data.carModels[make] || [make + ' Model'];
      const model = models[Math.floor(Math.random() * models.length)];
      
      const offer = {
        sellerId: seller.userId,
        vin: this.generateVIN(),
        make,
        model,
        year: 2018 + Math.floor(Math.random() * 7),
        price: 500000 + Math.floor(Math.random() * 3000000),
        location: this.data.locations[Math.floor(Math.random() * this.data.locations.length)],
        condition: this.data.conditions[Math.floor(Math.random() * this.data.conditions.length)],
        description: `${make} ${model} in excellent condition with premium features`,
        mileage: Math.floor(Math.random() * 100000),
        color: this.data.colors[Math.floor(Math.random() * this.data.colors.length)],
        fuelType: this.data.fuelTypes[Math.floor(Math.random() * this.data.fuelTypes.length)],
        transmission: this.data.transmissions[Math.floor(Math.random() * this.data.transmissions.length)],
        engineCapacity: 1000 + Math.floor(Math.random() * 3000),
        features: ['Air Conditioning', 'Power Steering', 'ABS', 'Airbags', 'Music System']
      };

      try {
        const response = await axios.post(this.services.offers, offer);
        this.createdEntities.offers.push(response.data);
        console.log(`  ✅ Offer ${i + 1}: ${response.data.offerId} (${make} ${model} - ${offer.vin})`);
      } catch (error) {
        console.log(`  ❌ Failed to create offer ${i + 1}: ${error.response?.data?.message || error.message}`);
      }
      
      await this.delay(100);
    }

    console.log(`  📊 Created ${this.createdEntities.offers.length}/${this.config.offers} offers`);
    return this.createdEntities.offers.length > 0;
  }

  /**
   * Create test purchases with specified count
   */
  async createTestPurchases() {
    if (this.createdEntities.offers.length === 0 || this.createdEntities.buyers.length === 0) {
      console.log('  ⚠️  Need both offers and buyers for purchases');
      return false;
    }

    console.log(`💰 Creating ${this.config.purchases} test purchases...`);

    for (let i = 0; i < this.config.purchases; i++) {
      const offer = this.createdEntities.offers[i % this.createdEntities.offers.length];
      const buyer = this.createdEntities.buyers[i % this.createdEntities.buyers.length];
      
      const purchasePrice = Math.floor(offer.price * (0.85 + Math.random() * 0.1)); // 85-95% of offer price
      
      const purchase = {
        offerId: offer.offerId,
        sellerId: offer.sellerId,
        buyerId: buyer.userId,
        purchasePrice,
        paymentMethod: this.data.paymentMethods[Math.floor(Math.random() * this.data.paymentMethods.length)],
        notes: `Purchase ${i + 1} for workflow verification`
      };

      try {
        // Create purchase
        const response = await axios.post(this.services.purchases, purchase);
        let purchaseData = response.data;
        
        // Complete the purchase to allow transport creation
        const completePurchase = {
          status: 'COMPLETED',
          notes: `Purchase ${i + 1} completed for transport`
        };
        
        const completeResponse = await axios.patch(
          `${this.services.purchases}/${purchaseData.purchaseId}`,
          completePurchase
        );
        purchaseData = completeResponse.data;
        
        this.createdEntities.purchases.push(purchaseData);
        console.log(`  ✅ Purchase ${i + 1}: ${purchaseData.purchaseId} (₹${purchasePrice.toLocaleString()})`);
        
      } catch (error) {
        console.log(`  ❌ Failed to create purchase ${i + 1}: ${error.response?.data?.message || error.message}`);
      }
      
      await this.delay(150);
    }

    console.log(`  📊 Created ${this.createdEntities.purchases.length}/${this.config.purchases} purchases`);
    return this.createdEntities.purchases.length > 0;
  }

  /**
   * Create test transports with specified count
   */
  async createTestTransports() {
    if (this.createdEntities.purchases.length === 0 || this.createdEntities.carriers.length === 0) {
      console.log('  ⚠️  Need both completed purchases and carriers for transports');
      return false;
    }

    console.log(`🚚 Creating ${this.config.transports} test transports...`);

    for (let i = 0; i < this.config.transports; i++) {
      const purchase = this.createdEntities.purchases[i % this.createdEntities.purchases.length];
      const carrier = this.createdEntities.carriers[i % this.createdEntities.carriers.length];
      const offer = this.createdEntities.offers.find(o => o.offerId === purchase.offerId);
      
      const transport = {
        purchaseId: purchase.purchaseId,
        carrierId: carrier.userId,
        offerId: purchase.offerId,
        buyerId: purchase.buyerId,
        pickupLocation: offer?.location || 'Mumbai, Maharashtra',
        deliveryLocation: this.data.locations[Math.floor(Math.random() * this.data.locations.length)],
        scheduledPickupDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        scheduledDeliveryDate: new Date(Date.now() + (i + 3) * 24 * 60 * 60 * 1000).toISOString(),
        transportType: this.data.transportTypes[Math.floor(Math.random() * this.data.transportTypes.length)],
        transportCost: 15000 + Math.floor(Math.random() * 35000),
        specialInstructions: `Transport ${i + 1} - Handle with care`,
        driverName: `Driver ${i + 1}`,
        driverPhone: `+91-${9876543300 + i}`
      };

      try {
        const response = await axios.post(this.services.transports, transport);
        this.createdEntities.transports.push(response.data);
        console.log(`  ✅ Transport ${i + 1}: ${response.data.transportId} (${transport.transportType})`);
      } catch (error) {
        console.log(`  ❌ Failed to create transport ${i + 1}: ${error.response?.data?.message || error.message}`);
      }
      
      await this.delay(150);
    }

    console.log(`  📊 Created ${this.createdEntities.transports.length}/${this.config.transports} transports`);
    return this.createdEntities.transports.length > 0;
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for Kafka/Elasticsearch sync
   */
  async waitForSync(seconds = 5) {
    console.log(`⏳ Waiting ${seconds}s for Elasticsearch sync...`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  /**
   * Verify Elasticsearch data
   */
  async verifyElasticsearchData() {
    console.log('🔍 Verifying Elasticsearch data...');

    try {
      // Check total document count
      const countResponse = await axios.get(`${this.services.elasticsearch}/global_search/_count`);
      const totalDocs = countResponse.data.count;
      console.log(`  📊 Total documents in Elasticsearch: ${totalDocs}`);

      // Search for our specific entities
      const entities = [
        { type: 'offer', id: this.createdEntities.offer.offerId, expected: 'offer' },
        { type: 'purchase', id: this.createdEntities.purchase.purchaseId, expected: 'purchase' },
        { type: 'transport', id: this.createdEntities.transport.transportId, expected: 'transport' }
      ];

      let foundCount = 0;
      const verificationResults = [];

      for (const entity of entities) {
        try {
          const docResponse = await axios.get(
            `${this.services.elasticsearch}/global_search/_doc/${entity.expected}_${entity.id}`
          );
          
          if (docResponse.data.found) {
            foundCount++;
            const doc = docResponse.data._source;
            
            verificationResults.push({
              type: entity.expected,
              id: entity.id,
              found: true,
              vin: doc.vin || 'N/A',
              make: doc.make || 'N/A',
              model: doc.model || 'N/A',
              buyerEmail: doc.buyerDetails?.email || 'N/A',
              sellerEmail: doc.sellerDetails?.email || 'N/A',
              status: doc.status || 'N/A'
            });

            console.log(`  ✅ ${entity.expected.toUpperCase()} found in Elasticsearch:`);
            console.log(`     ID: ${entity.id}`);
            console.log(`     VIN: ${doc.vin || 'N/A'}`);
            console.log(`     Make/Model: ${doc.make || 'N/A'} ${doc.model || 'N/A'}`);
            console.log(`     Status: ${doc.status}`);
            if (doc.buyerDetails) console.log(`     Buyer: ${doc.buyerDetails.email}`);
            if (doc.sellerDetails) console.log(`     Seller: ${doc.sellerDetails.email}`);
            console.log('');
          }
        } catch (error) {
          verificationResults.push({
            type: entity.expected,
            id: entity.id,
            found: false,
            error: error.response?.status === 404 ? 'Not found' : error.message
          });
          console.log(`  ❌ ${entity.expected.toUpperCase()} not found: ${entity.id}`);
        }
      }

      // Test search functionality
      console.log('🔍 Testing search functionality...');
      await this.testSearchFunctionality();

      return {
        totalDocuments: totalDocs,
        entitiesFound: foundCount,
        expectedEntities: entities.length,
        verificationResults,
        success: foundCount === entities.length
      };

    } catch (error) {
      console.error('  ❌ Elasticsearch verification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test search functionality with our created data
   */
  async testSearchFunctionality() {
    const searchTests = [
      {
        name: 'Search as Buyer',
        query: {
          userType: 'BUYER',
          accountId: this.createdEntities.buyer.userId,
          searchText: 'Toyota'
        }
      },
      {
        name: 'Search as Seller', 
        query: {
          userType: 'SELLER',
          accountId: this.createdEntities.seller.userId,
          searchText: 'Camry'
        }
      },
      {
        name: 'Search as Carrier',
        query: {
          userType: 'CARRIER',
          accountId: this.createdEntities.carrier.userId
        }
      },
      {
        name: 'Search as Agent (all)',
        query: {
          userType: 'AGENT',
          searchText: this.createdEntities.offer.vin
        }
      }
    ];

    for (const test of searchTests) {
      try {
        console.log(`  🔎 ${test.name}...`);
        const response = await axios.post(this.services.search, test.query);
        const results = response.data.results || [];
        console.log(`     Found ${results.length} results`);
        
        if (results.length > 0) {
          results.forEach((result, index) => {
            console.log(`     ${index + 1}. ${result.entityType}: ${result.make || 'N/A'} ${result.model || 'N/A'} (${result.status})`);
          });
        }
      } catch (error) {
        console.log(`     ❌ Search failed: ${error.message}`);
      }
    }
  }

  /**
   * Verify Elasticsearch data for multiple entities
   */
  async verifyElasticsearchData() {
    console.log('🔍 Verifying Elasticsearch data...');

    try {
      // Check total document count
      const countResponse = await axios.get(`${this.services.elasticsearch}/global_search/_count`);
      const totalDocs = countResponse.data.count;
      console.log(`  📊 Total documents in Elasticsearch: ${totalDocs}`);

      // Sample verification - check first few entities of each type
      const sampleOffers = this.createdEntities.offers.slice(0, 2);
      const samplePurchases = this.createdEntities.purchases.slice(0, 2);
      const sampleTransports = this.createdEntities.transports.slice(0, 1);

      let foundCount = 0;
      let expectedCount = 0;

      // Check offers
      for (const offer of sampleOffers) {
        expectedCount++;
        try {
          const docResponse = await axios.get(
            `${this.services.elasticsearch}/global_search/_doc/offer_${offer.offerId}`
          );
          
          if (docResponse.data.found) {
            foundCount++;
            const doc = docResponse.data._source;
            console.log(`  ✅ OFFER: ${offer.make} ${offer.model} (${doc.vin}) - ${doc.status}`);
          }
        } catch (error) {
          console.log(`  ❌ Offer ${offer.offerId} not found in Elasticsearch`);
        }
      }

      // Check purchases
      for (const purchase of samplePurchases) {
        expectedCount++;
        try {
          const docResponse = await axios.get(
            `${this.services.elasticsearch}/global_search/_doc/purchase_${purchase.purchaseId}`
          );
          
          if (docResponse.data.found) {
            foundCount++;
            const doc = docResponse.data._source;
            console.log(`  ✅ PURCHASE: ${doc.make} ${doc.model} (${doc.vin}) - ${doc.status}`);
            console.log(`     Buyer: ${doc.buyerDetails?.email}, Seller: ${doc.sellerDetails?.email}`);
          }
        } catch (error) {
          console.log(`  ❌ Purchase ${purchase.purchaseId} not found in Elasticsearch`);
        }
      }

      // Check transports
      for (const transport of sampleTransports) {
        expectedCount++;
        try {
          const docResponse = await axios.get(
            `${this.services.elasticsearch}/global_search/_doc/transport_${transport.transportId}`
          );
          
          if (docResponse.data.found) {
            foundCount++;
            const doc = docResponse.data._source;
            console.log(`  ✅ TRANSPORT: ${transport.transportId} - ${doc.status}`);
          }
        } catch (error) {
          console.log(`  ❌ Transport ${transport.transportId} not found in Elasticsearch`);
        }
      }

      // Test search functionality with sample data
      await this.testSearchFunctionality();

      return {
        totalDocuments: totalDocs,
        sampleEntitiesFound: foundCount,
        sampleEntitiesExpected: expectedCount,
        success: foundCount >= Math.floor(expectedCount * 0.8) // 80% success rate
      };

    } catch (error) {
      console.error('  ❌ Elasticsearch verification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test search functionality with created data
   */
  async testSearchFunctionality() {
    console.log('🔍 Testing search functionality...');

    const sampleBuyer = this.createdEntities.buyers[0];
    const sampleSeller = this.createdEntities.sellers[0];
    const sampleCarrier = this.createdEntities.carriers[0];
    const sampleOffer = this.createdEntities.offers[0];

    const searchTests = [
      {
        name: 'Search as Buyer',
        query: {
          userType: 'BUYER',
          accountId: sampleBuyer?.userId,
          searchText: sampleOffer?.make
        },
        enabled: !!sampleBuyer && !!sampleOffer
      },
      {
        name: 'Search as Seller', 
        query: {
          userType: 'SELLER',
          accountId: sampleSeller?.userId,
          searchText: sampleOffer?.model
        },
        enabled: !!sampleSeller && !!sampleOffer
      },
      {
        name: 'Search as Carrier',
        query: {
          userType: 'CARRIER',
          accountId: sampleCarrier?.userId
        },
        enabled: !!sampleCarrier
      },
      {
        name: 'Search as Agent (VIN)',
        query: {
          userType: 'AGENT',
          searchText: sampleOffer?.vin
        },
        enabled: !!sampleOffer
      }
    ];

    for (const test of searchTests.filter(t => t.enabled)) {
      try {
        console.log(`  🔎 ${test.name}...`);
        const response = await axios.post(this.services.search, test.query);
        const results = response.data.results || [];
        console.log(`     Found ${results.length} results`);
        
        if (results.length > 0) {
          results.slice(0, 3).forEach((result, index) => { // Show first 3 results
            console.log(`     ${index + 1}. ${result.entityType}: ${result.make || 'N/A'} ${result.model || 'N/A'} (${result.status})`);
          });
        }
      } catch (error) {
        console.log(`     ❌ Search failed: ${error.message}`);
      }
    }
  }

  /**
   * Main workflow execution with dynamic counts
   */
  async run() {
    console.log('🧪 DYNAMIC DATA GENERATOR');
    console.log('=' .repeat(70));
    console.log(`📋 Configuration:`);
    console.log(`   Users: ${this.config.users} (distributed across SELLER, BUYER, CARRIER)`);
    console.log(`   Offers: ${this.config.offers}`);
    console.log(`   Purchases: ${this.config.purchases}`);
    console.log(`   Transports: ${this.config.transports}`);
    console.log('=' .repeat(70));
    
    const startTime = Date.now();

    try {
      // Step 1: Create users
      if (!(await this.createTestUsers())) {
        throw new Error('Failed to create test users');
      }

      // Step 2: Create offers (only if we have sellers)
      if (this.config.offers > 0 && !(await this.createTestOffers())) {
        console.log('⚠️  Offer creation failed or skipped');
      }

      // Step 3: Create purchases (only if we have offers and buyers)
      if (this.config.purchases > 0 && !(await this.createTestPurchases())) {
        console.log('⚠️  Purchase creation failed or skipped');
      }

      // Step 4: Create transports (only if we have purchases and carriers)
      if (this.config.transports > 0 && !(await this.createTestTransports())) {
        console.log('⚠️  Transport creation failed or skipped');
      }

      // Step 5: Wait for sync
      console.log('⏳ Waiting 8s for Elasticsearch sync...');
      await this.delay(8000);

      // Step 6: Verify Elasticsearch
      const verification = await this.verifyElasticsearchData();

      // Summary
      console.log('\n📊 DATA GENERATION SUMMARY');
      console.log('=' .repeat(70));
      console.log(`⏱️  Duration: ${Math.round((Date.now() - startTime) / 1000)}s`);
      console.log('📋 Created Entities:');
      console.log(`   Sellers: ${this.createdEntities.sellers.length}/${Math.ceil(this.config.users / 3)}`);
      console.log(`   Buyers: ${this.createdEntities.buyers.length}/${Math.ceil(this.config.users / 3)}`);
      console.log(`   Carriers: ${this.createdEntities.carriers.length}/${Math.ceil(this.config.users / 3)}`);
      console.log(`   Offers: ${this.createdEntities.offers.length}/${this.config.offers}`);
      console.log(`   Purchases: ${this.createdEntities.purchases.length}/${this.config.purchases}`);
      console.log(`   Transports: ${this.createdEntities.transports.length}/${this.config.transports}`);

      if (this.createdEntities.offers.length > 0) {
        console.log('\n📝 Sample VINs:');
        this.createdEntities.offers.slice(0, 3).forEach((offer, i) => {
          console.log(`   ${i + 1}. ${offer.make} ${offer.model}: ${offer.vin}`);
        });
      }

      console.log('\n🔍 Elasticsearch Verification:');
      if (verification.success) {
        console.log(`   ✅ SUCCESS: ${verification.sampleEntitiesFound}/${verification.sampleEntitiesExpected} sample entities verified`);
        console.log(`   📊 Total documents: ${verification.totalDocuments}`);
        console.log('   🎯 Data properly synced and searchable!');
      } else {
        console.log(`   ⚠️  PARTIAL: ${verification.sampleEntitiesFound}/${verification.sampleEntitiesExpected} sample entities found`);
        console.log('   💡 Some data may still be syncing. Check again in a few moments.');
      }

      return verification.success;

    } catch (error) {
      console.error('\n❌ DATA GENERATION FAILED:', error.message);
      console.error('💡 Check that all services are running: docker-compose up -d');
      return false;
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const config = {
    users: 3,      // Default: 1 seller, 1 buyer, 1 carrier
    offers: 1,     // Default: 1 offer
    purchases: 1,  // Default: 1 purchase
    transports: 1  // Default: 1 transport
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--users':
        config.users = parseInt(args[i + 1]) || config.users;
        i++;
        break;
      case '--offers':
        config.offers = parseInt(args[i + 1]) || config.offers;
        i++;
        break;
      case '--purchases':
        config.purchases = parseInt(args[i + 1]) || config.purchases;
        i++;
        break;
      case '--transports':
        config.transports = parseInt(args[i + 1]) || config.transports;
        i++;
        break;
      case '--help':
      case '-h':
        console.log('Dynamic Data Generator for Microservices Testing');
        console.log('\nUsage:');
        console.log('  node test-workflow.js [options]');
        console.log('\nOptions:');
        console.log('  --users <number>      Number of users to create (distributed across SELLER, BUYER, CARRIER)');
        console.log('  --offers <number>     Number of offers to create');
        console.log('  --purchases <number>  Number of purchases to create');
        console.log('  --transports <number> Number of transports to create');
        console.log('  --help, -h            Show this help message');
        console.log('\nExamples:');
        console.log('  node test-workflow.js                                    # Default: 3 users, 1 offer, 1 purchase, 1 transport');
        console.log('  node test-workflow.js --users 10 --offers 20             # 10 users, 20 offers');
        console.log('  node test-workflow.js --users 15 --offers 30 --purchases 25 --transports 20');
        console.log('\nNote: Users are distributed evenly across SELLER, BUYER, CARRIER roles');
        process.exit(0);
    }
  }

  // Validate configuration
  if (config.users < 1) {
    console.error('❌ Error: Must have at least 1 user');
    process.exit(1);
  }

  if (config.offers > 0 && Math.ceil(config.users / 3) === 0) {
    console.error('❌ Error: Need sellers to create offers');
    process.exit(1);
  }

  if (config.purchases > config.offers) {
    console.warn('⚠️  Warning: More purchases than offers requested. Limiting purchases to offer count.');
    config.purchases = config.offers;
  }

  if (config.transports > config.purchases) {
    console.warn('⚠️  Warning: More transports than purchases requested. Limiting transports to purchase count.');
    config.transports = config.purchases;
  }

  return config;
}

// Main execution
if (require.main === module) {
  (async () => {
    const config = parseArguments();
    const generator = new DynamicDataGenerator(config);
    const success = await generator.run();
    process.exit(success ? 0 : 1);
  })();
}

module.exports = DynamicDataGenerator;