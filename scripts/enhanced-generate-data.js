#!/usr/bin/env node

const axios = require('axios');
const { Client } = require('pg');
const { Kafka } = require('kafkajs');

// ============================================================================
// ENHANCED SCALABLE DATA GENERATOR
// ============================================================================

class EnhancedDataGenerator {
  constructor() {
    this.services = {
      users: 'http://localhost:3005/users',
      offers: 'http://localhost:3001/offers', 
      purchases: 'http://localhost:3002/purchases',
      transports: 'http://localhost:3003/transports',
      search: 'http://localhost:3004/search',
      elasticsearch: 'http://localhost:9200'
    };

    // Enhanced realistic data sets
    this.data = {
      carMakes: [
        'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 
        'Hyundai', 'Kia', 'Mazda', 'Subaru', 'Volkswagen', 'Lexus', 'Acura',
        'Infiniti', 'Cadillac', 'Buick', 'GMC', 'Chevrolet', 'Dodge', 'Jeep',
        'Ram', 'Chrysler', 'Lincoln', 'Volvo', 'Jaguar', 'Land Rover', 'Porsche',
        'Tesla', 'Genesis', 'Alfa Romeo', 'Maserati', 'Bentley', 'Rolls-Royce',
        'Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin', 'Maruti Suzuki',
        'Tata Motors', 'Mahindra', 'Bajaj Auto'
      ],
      carModels: {
        'Toyota': ['Camry', 'Corolla', 'Prius', 'RAV4', 'Highlander', 'Sienna', 'Tacoma', 'Tundra'],
        'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit', 'HR-V', 'Passport', 'City'],
        'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Expedition', 'Ranger', 'Bronco'],
        'BMW': ['3 Series', '5 Series', 'X3', 'X5', 'i3', 'i8', 'Z4', '7 Series'],
        'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLC', 'A-Class', 'CLA'],
        'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'],
        'Maruti Suzuki': ['Swift', 'Baleno', 'Dzire', 'Alto', 'Wagon R', 'Vitara Brezza', 'Ertiga', 'Ciaz']
      },
      indianCities: [
        'Mumbai, Maharashtra', 'Delhi, Delhi', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
        'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Pune, Maharashtra', 'Ahmedabad, Gujarat',
        'Surat, Gujarat', 'Jaipur, Rajasthan', 'Lucknow, Uttar Pradesh', 'Kanpur, Uttar Pradesh',
        'Nagpur, Maharashtra', 'Visakhapatnam, Andhra Pradesh', 'Indore, Madhya Pradesh',
        'Thane, Maharashtra', 'Bhopal, Madhya Pradesh', 'Pimpri-Chinchwad, Maharashtra',
        'Patna, Bihar', 'Vadodara, Gujarat', 'Ghaziabad, Uttar Pradesh', 'Ludhiana, Punjab',
        'Coimbatore, Tamil Nadu', 'Agra, Uttar Pradesh', 'Madurai, Tamil Nadu'
      ],
      usaCities: [
        'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
        'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
        'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
        'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Boston, MA'
      ],
      indianNames: [
        { first: 'Rajesh', last: 'Kumar' }, { first: 'Priya', last: 'Sharma' },
        { first: 'Arjun', last: 'Singh' }, { first: 'Anita', last: 'Gupta' },
        { first: 'Vikram', last: 'Patel' }, { first: 'Sunita', last: 'Reddy' },
        { first: 'Ravi', last: 'Agarwal' }, { first: 'Kavya', last: 'Nair' },
        { first: 'Suresh', last: 'Joshi' }, { first: 'Meera', last: 'Iyer' },
        { first: 'Amit', last: 'Verma' }, { first: 'Pooja', last: 'Mishra' },
        { first: 'Rahul', last: 'Chopra' }, { first: 'Neha', last: 'Bansal' }
      ],
      americanNames: [
        { first: 'John', last: 'Smith' }, { first: 'Jane', last: 'Johnson' },
        { first: 'Michael', last: 'Williams' }, { first: 'Sarah', last: 'Brown' },
        { first: 'David', last: 'Jones' }, { first: 'Emily', last: 'Garcia' },
        { first: 'Chris', last: 'Miller' }, { first: 'Jessica', last: 'Davis' },
        { first: 'Matthew', last: 'Rodriguez' }, { first: 'Ashley', last: 'Martinez' }
      ]
    };

    // Kafka setup with correct broker
    this.kafka = new Kafka({
      clientId: 'enhanced-data-generator',
      brokers: ['localhost:9092'], // External broker for scripts
      retry: {
        retries: 3,
        initialRetryTime: 1000
      }
    });

    // Batch processing configuration
    this.batchSize = 50;
    this.delayBetweenBatches = 1000; // 1 second delay
  }

  /**
   * Generate realistic VIN numbers
   */
  generateVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ123456789'; // Valid VIN characters (no I, O, Q)
    const digits = '0123456789';
    
    // VIN format: WMI(3) + VDS(6) + VIS(8) = 17 characters
    let vin = '';
    
    // World Manufacturer Identifier (3 chars)
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
    
    // Vehicle Descriptor Section (6 chars)
    for (let i = 0; i < 6; i++) {
      vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Vehicle Identifier Section (8 chars)
    for (let i = 0; i < 8; i++) {
      if (i === 0) { // 10th position: year code
        vin += chars.charAt(Math.floor(Math.random() * chars.length));
      } else {
        vin += Math.random() > 0.5 ? 
          chars.charAt(Math.floor(Math.random() * chars.length)) :
          digits.charAt(Math.floor(Math.random() * digits.length));
      }
    }
    
    return vin;
  }

  /**
   * Generate phone numbers by region
   */
  generatePhoneNumber(region = 'US') {
    if (region === 'IN') {
      // Indian mobile numbers: +91-XXXXX-XXXXX
      const num = Math.floor(Math.random() * 900000000) + 100000000;
      return `+91-${num.toString().substring(0, 5)}-${num.toString().substring(5)}`;
    } else {
      // US phone numbers: +1-XXX-XXX-XXXX
      const area = Math.floor(Math.random() * 800) + 200;
      const exchange = Math.floor(Math.random() * 800) + 200;
      const number = Math.floor(Math.random() * 9000) + 1000;
      return `+1-${area}-${exchange}-${number}`;
    }
  }

  /**
   * Enhanced user generation with regional data
   */
  async generateUsers(count = 100, region = 'mixed') {
    console.log(`🎯 Generating ${count} users (${region})...`);
    
    const userTypes = ['BUYER', 'SELLER', 'CARRIER', 'AGENT'];
    const users = [];

    for (let i = 0; i < count; i++) {
      let name, phoneNumber, location;

      if (region === 'IN' || (region === 'mixed' && Math.random() > 0.6)) {
        // Indian users
        name = this.data.indianNames[Math.floor(Math.random() * this.data.indianNames.length)];
        phoneNumber = this.generatePhoneNumber('IN');
        location = this.data.indianCities[Math.floor(Math.random() * this.data.indianCities.length)];
      } else {
        // US users
        name = this.data.americanNames[Math.floor(Math.random() * this.data.americanNames.length)];
        phoneNumber = this.generatePhoneNumber('US');
        location = this.data.usaCities[Math.floor(Math.random() * this.data.usaCities.length)];
      }

      const user = {
        firstName: name.first,
        lastName: name.last,
        email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}${i + Date.now().toString().slice(-4)}@example.com`,
        phone: phoneNumber,
        userType: userTypes[Math.floor(Math.random() * userTypes.length)],
        isActive: true,
        address: {
          street: `${Math.floor(Math.random() * 999) + 1} ${['Main St', 'Oak Ave', 'Park Rd', 'First St'][Math.floor(Math.random() * 4)]}`,
          city: location.split(', ')[0],
          state: location.split(', ')[1],
          zipCode: Math.floor(Math.random() * 90000) + 10000
        }
      };

      users.push(user);
    }

    // Batch create users
    await this.createInBatches(users, 'users', this.services.users);
    return users;
  }

  /**
   * Enhanced offer generation with realistic data
   */
  async generateOffers(count = 100, sellersPool = null) {
    console.log(`🚗 Generating ${count} offers...`);

    if (!sellersPool) {
      sellersPool = await this.getUsers('SELLER');
      if (sellersPool.length === 0) {
        console.log('⚠️  No sellers found, generating sellers first...');
        await this.generateUsers(Math.max(50, Math.ceil(count / 2)));
        sellersPool = await this.getUsers('SELLER');
      }
    }

    if (sellersPool.length === 0) {
      throw new Error('Could not create sellers for offers');
    }

    const conditions = ['NEW', 'USED', 'CERTIFIED_PRE_OWNED'];
    const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Gray', 'Green', 'Brown', 'Yellow', 'Orange'];
    const fuelTypes = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'];
    const transmissions = ['MANUAL', 'AUTOMATIC', 'CVT'];

    const offers = [];

    for (let i = 0; i < count; i++) {
      const seller = sellersPool[Math.floor(Math.random() * sellersPool.length)];
      const make = this.data.carMakes[Math.floor(Math.random() * this.data.carMakes.length)];
      const models = this.data.carModels[make] || ['Model'];
      const model = models[Math.floor(Math.random() * models.length)];
      const year = 2015 + Math.floor(Math.random() * 10); // 2015-2024
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      // Price based on year and condition
      let basePrice = 15000 + Math.floor(Math.random() * 50000);
      if (condition === 'NEW') basePrice *= 1.5;
      if (year > 2020) basePrice *= 1.2;
      
      const offer = {
        sellerId: seller.userId,
        vin: this.generateVIN(),
        make,
        model,
        year,
        price: Math.round(basePrice),
        location: Math.random() > 0.4 ? 
          this.data.indianCities[Math.floor(Math.random() * this.data.indianCities.length)] :
          this.data.usaCities[Math.floor(Math.random() * this.data.usaCities.length)],
        condition,
        description: `${year} ${make} ${model} in ${condition.toLowerCase().replace('_', ' ')} condition. ${
          condition === 'NEW' ? 'Brand new vehicle with warranty.' : 
          condition === 'CERTIFIED_PRE_OWNED' ? 'Certified pre-owned with extended warranty.' :
          'Well-maintained vehicle with service history.'
        }`,
        mileage: condition === 'NEW' ? 0 : Math.floor(Math.random() * 150000),
        color: colors[Math.floor(Math.random() * colors.length)],
        fuelType: fuelTypes[Math.floor(Math.random() * fuelTypes.length)],
        transmission: transmissions[Math.floor(Math.random() * transmissions.length)],
        engineCapacity: 1000 + Math.floor(Math.random() * 3000),
        features: this.generateFeatures()
      };

      offers.push(offer);
    }

    await this.createInBatches(offers, 'offers', this.services.offers);
    return offers;
  }

  /**
   * Generate realistic car features
   */
  generateFeatures() {
    const allFeatures = [
      'Air Conditioning', 'Power Steering', 'Power Windows', 'ABS', 'Airbags',
      'Central Locking', 'Music System', 'Bluetooth', 'Navigation', 'Sunroof',
      'Leather Seats', 'Alloy Wheels', 'Fog Lights', 'Rear Camera', 'Parking Sensors',
      'Cruise Control', 'Keyless Entry', 'Push Start', 'Climate Control', 'Heated Seats',
      'Xenon Headlights', 'LED DRL', 'Auto Headlights', 'Rain Sensors', 'USB Ports'
    ];

    const featureCount = 3 + Math.floor(Math.random() * 8); // 3-10 features
    const features = [];
    const shuffled = [...allFeatures].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < featureCount && i < shuffled.length; i++) {
      features.push(shuffled[i]);
    }

    return features;
  }

  /**
   * Create data in batches for better performance
   */
  async createInBatches(items, type, endpoint) {
    const totalBatches = Math.ceil(items.length / this.batchSize);
    let created = 0;
    let failed = 0;

    for (let i = 0; i < totalBatches; i++) {
      const batch = items.slice(i * this.batchSize, (i + 1) * this.batchSize);
      
      console.log(`   Batch ${i + 1}/${totalBatches}: Creating ${batch.length} ${type}...`);

      // Create items concurrently within batch
      const promises = batch.map(async (item, index) => {
        try {
          const response = await axios.post(endpoint, item, {
            timeout: 10000, // 10 second timeout
            headers: { 'Content-Type': 'application/json' }
          });
          return { success: true, data: response.data, index };
        } catch (error) {
          console.log(`     Warning: Failed to create ${type} ${index + 1}: ${error.response?.data?.message || error.message}`);
          return { success: false, error: error.message, index };
        }
      });

      const results = await Promise.all(promises);
      const batchCreated = results.filter(r => r.success).length;
      const batchFailed = results.filter(r => !r.success).length;
      
      created += batchCreated;
      failed += batchFailed;

      console.log(`     ✅ Created: ${batchCreated}, ❌ Failed: ${batchFailed}`);

      // Delay between batches to prevent overwhelming the API
      if (i < totalBatches - 1) {
        await this.delay(this.delayBetweenBatches);
      }
    }

    console.log(`📊 ${type.toUpperCase()} Summary: ✅ ${created} created, ❌ ${failed} failed`);
    return { created, failed };
  }

  /**
   * Utility delay function
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get users by type with caching
   */
  async getUsers(userType = null) {
    try {
      const response = await axios.get(this.services.users, { timeout: 5000 });
      const users = Array.isArray(response.data) ? response.data : response.data.data || [];
      return userType ? users.filter(u => u.userType === userType) : users;
    } catch (error) {
      console.log(`Warning: Could not fetch users: ${error.message}`);
      return [];
    }
  }

  /**
   * Verify all services are running
   */
  async verifyServices() {
    console.log('🔍 Verifying services...');
    
    const services = [
      { name: 'User Service', url: `${this.services.users.replace('/users', '')}/health` },
      { name: 'Offer Service', url: `${this.services.offers.replace('/offers', '')}/health` },
      { name: 'Purchase Service', url: `${this.services.purchases.replace('/purchases', '')}/health` },
      { name: 'Transport Service', url: `${this.services.transports.replace('/transports', '')}/health` },
      { name: 'Search Service', url: `${this.services.search}/health` },
      { name: 'Elasticsearch', url: `${this.services.elasticsearch}/_cluster/health` }
    ];

    const results = [];
    
    for (const service of services) {
      try {
        const response = await axios.get(service.url, { timeout: 3000 });
        results.push({ ...service, status: '✅ Running', response: response.status });
      } catch (error) {
        results.push({ ...service, status: '❌ Down', error: error.message });
      }
    }

    results.forEach(service => {
      console.log(`   ${service.name}: ${service.status}`);
    });

    const allRunning = results.every(s => s.status.includes('✅'));
    if (!allRunning) {
      console.log('\n⚠️  Some services are down. Data generation may fail.');
      console.log('💡 Make sure all Docker services are running: docker-compose up -d');
    }

    return allRunning;
  }

  /**
   * Enhanced main execution with configuration options
   */
  async run(config = {}) {
    const {
      users = 100,
      offers = 200,
      region = 'mixed', // 'US', 'IN', 'mixed'
      verifyServices = true
    } = config;

    console.log('🚀 Enhanced Scalable Data Generator');
    console.log('=' .repeat(60));
    console.log(`📋 Configuration:`);
    console.log(`   Users: ${users} (${region})`);
    console.log(`   Offers: ${offers}`);
    console.log(`   Batch Size: ${this.batchSize}`);
    console.log(`   Delay: ${this.delayBetweenBatches}ms between batches`);
    console.log('=' .repeat(60));

    // Verify services if requested
    if (verifyServices && !(await this.verifyServices())) {
      console.log('\n❌ Service verification failed. Continuing anyway...\n');
    }

    const startTime = Date.now();

    try {
      // Generate users
      console.log('\n🎯 Phase 1: Generating Users');
      const userResults = await this.generateUsers(users, region);
      
      // Generate offers
      console.log('\n🚗 Phase 2: Generating Offers');
      const sellers = await this.getUsers('SELLER');
      await this.generateOffers(offers, sellers);

      // Wait for Kafka sync
      console.log('\n⏳ Waiting for Elasticsearch sync...');
      await this.delay(5000);

      // Final status
      console.log('\n📊 Final Status:');
      await this.displayFinalStatus();

      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`\n✅ Data generation completed in ${duration} seconds!`);
      
    } catch (error) {
      console.error('\n❌ Data generation failed:', error.message);
      console.error('💡 Check service logs and try again');
      process.exit(1);
    }
  }

  /**
   * Display comprehensive final status
   */
  async displayFinalStatus() {
    try {
      // Get database counts
      const [users, offers] = await Promise.all([
        this.getUsers(),
        axios.get(this.services.offers).then(r => Array.isArray(r.data) ? r.data : r.data.data || [])
      ]);

      // Get Elasticsearch count
      const esResponse = await axios.get(`${this.services.elasticsearch}/global_search/_count`);
      const esCount = esResponse.data.count || 0;

      console.log(`   Users: ${users.length}`);
      console.log(`   Offers: ${offers.length}`);
      console.log(`   Elasticsearch: ${esCount} documents`);

      // User type breakdown
      const userTypes = users.reduce((acc, user) => {
        acc[user.userType] = (acc[user.userType] || 0) + 1;
        return acc;
      }, {});

      console.log('\n   User Types:');
      Object.entries(userTypes).forEach(([type, count]) => {
        console.log(`     ${type}: ${count}`);
      });

    } catch (error) {
      console.log('   Status check failed:', error.message);
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  const config = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key === 'users') config.users = parseInt(value) || 100;
    if (key === 'offers') config.offers = parseInt(value) || 200;
    if (key === 'region') config.region = value || 'mixed';
    if (key === 'no-verify') config.verifyServices = false;
  }

  // Show usage if help requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Enhanced Data Generator

Usage: node enhanced-generate-data.js [options]

Options:
  --users <number>     Number of users to generate (default: 100)
  --offers <number>    Number of offers to generate (default: 200)
  --region <region>    Region for users: US, IN, mixed (default: mixed)
  --no-verify         Skip service verification
  --help              Show this help message

Examples:
  node enhanced-generate-data.js --users 500 --offers 1000 --region IN
  node enhanced-generate-data.js --users 200 --offers 300 --region US
  node enhanced-generate-data.js --users 1000 --offers 2000 --region mixed
    `);
    process.exit(0);
  }

  const generator = new EnhancedDataGenerator();
  generator.run(config).catch(console.error);
}

module.exports = EnhancedDataGenerator;