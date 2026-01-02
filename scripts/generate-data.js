#!/usr/bin/env node

const axios = require('axios');
const { Client } = require('pg');
const { Kafka } = require('kafkajs');

// ============================================================================
// SIMPLE DATA GENERATOR - DB + ELASTICSEARCH
// ============================================================================

class SimpleDataGenerator {
  constructor() {
    this.services = {
      users: 'http://localhost:3005/users',
      offers: 'http://localhost:3001/offers',
      purchases: 'http://localhost:3002/purchases',
      transports: 'http://localhost:3003/transports',
      elasticsearch: 'http://localhost:9200'
    };

    // Database configs
    this.dbConfigs = {
      users: { host: 'localhost', port: 5435, database: 'user_db', user: 'postgres', password: 'password' },
      offers: { host: 'localhost', port: 5432, database: 'offer_db', user: 'postgres', password: 'password' },
      purchases: { host: 'localhost', port: 5433, database: 'purchase_db', user: 'postgres', password: 'password' },
      transports: { host: 'localhost', port: 5434, database: 'transport_db', user: 'postgres', password: 'password' }
    };

    // Kafka setup
    this.kafka = new Kafka({
      clientId: 'data-generator',
      brokers: ['localhost:9092']
    });
  }

  /**
   * Generate sample users
   */
  async generateUsers(count = 100) {
    console.log(`🎯 Generating ${count} users...`);
    
    const userTypes = ['BUYER', 'SELLER', 'CARRIER', 'AGENT'];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Anna'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      
      const user = {
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        userType: userTypes[Math.floor(Math.random() * userTypes.length)],
        isActive: true
      };

      try {
        await axios.post(this.services.users, user);
      } catch (error) {
        console.log(`Warning: Could not create user ${i + 1}`);
      }
    }
  }

  /**
   * Generate sample offers
   */
  async generateOffers(count = 50) {
    console.log(`🚗 Generating ${count} offers...`);
    
    // Get existing sellers
    const sellers = await this.getUsers('SELLER');
    if (sellers.length === 0) {
      console.log('⚠️  No sellers found, generating some first...');
      await this.generateUsers(20);
      const newSellers = await this.getUsers('SELLER');
      if (newSellers.length === 0) return;
    }

    const makes = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Nissan', 'Hyundai'];
    const models = ['Camry', 'Accord', 'F-150', 'X3', 'C-Class', 'A4', 'Altima', 'Elantra'];
    const conditions = ['NEW', 'USED', 'CERTIFIED_PRE_OWNED'];
    const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'];

    for (let i = 0; i < count; i++) {
      const seller = sellers[Math.floor(Math.random() * sellers.length)];
      
      const offer = {
        sellerId: seller.userId,
        vin: `VIN${Date.now()}${i}`.substring(0, 17).padEnd(17, '0'),
        make: makes[Math.floor(Math.random() * makes.length)],
        model: models[Math.floor(Math.random() * models.length)],
        year: 2018 + Math.floor(Math.random() * 7),
        price: 15000 + Math.floor(Math.random() * 50000),
        location: locations[Math.floor(Math.random() * locations.length)],
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        description: 'Great vehicle in excellent condition',
        mileage: Math.floor(Math.random() * 100000)
      };

      try {
        await axios.post(this.services.offers, offer);
      } catch (error) {
        console.log(`Warning: Could not create offer ${i + 1}`);
      }
    }
  }

  /**
   * Get users by type
   */
  async getUsers(userType = null) {
    try {
      const response = await axios.get(this.services.users);
      const users = Array.isArray(response.data) ? response.data : response.data.data || [];
      return userType ? users.filter(u => u.userType === userType) : users;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get database record counts
   */
  async getDatabaseStatus() {
    const status = {};
    
    for (const [name, config] of Object.entries(this.dbConfigs)) {
      try {
        const client = new Client(config);
        await client.connect();
        
        let tableName;
        switch (name) {
          case 'users': tableName = 'users'; break;
          case 'offers': tableName = 'offers'; break;
          case 'purchases': tableName = 'purchases'; break;
          case 'transports': tableName = 'transports'; break;
        }
        
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        status[name] = parseInt(result.rows[0].count);
        await client.end();
      } catch (error) {
        status[name] = 0;
      }
    }
    
    return status;
  }

  /**
   * Check Elasticsearch status
   */
  async checkElasticsearch() {
    try {
      const response = await axios.get(`${this.services.elasticsearch}/global_search/_count`);
      return response.data.count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Sync data to Elasticsearch via Kafka
   */
  async syncToElasticsearch() {
    console.log('📋 Syncing data to Elasticsearch...');
    
    try {
      const producer = this.kafka.producer();
      await producer.connect();
      
      // Fetch and sync offers
      const offersResponse = await axios.get(this.services.offers);
      const offers = Array.isArray(offersResponse.data) ? offersResponse.data : offersResponse.data.data || [];
      
      for (const offer of offers.slice(0, 100)) { // Limit to prevent overwhelming
        const event = {
          eventType: 'OfferCreated',
          entityType: 'offer',
          entityId: offer.offerId,
          timestamp: new Date().toISOString(),
          payload: offer
        };
        
        await producer.send({
          topic: 'offer-events',
          messages: [{ value: JSON.stringify(event) }]
        });
      }
      
      await producer.disconnect();
      console.log(`✅ Synced ${Math.min(offers.length, 100)} offers to Elasticsearch`);
    } catch (error) {
      console.log('⚠️  Elasticsearch sync failed:', error.message);
    }
  }

  /**
   * Main execution
   */
  async run() {
    console.log('🎯 Simple Data Generator\n');
    console.log('=' .repeat(50));
    
    // Generate data
    await this.generateUsers(50);
    await this.generateOffers(30);
    
    // Check status
    console.log('\n📊 Current Status:');
    const dbStatus = await this.getDatabaseStatus();
    const esCount = await this.checkElasticsearch();
    
    console.log(`   Users: ${dbStatus.users || 0}`);
    console.log(`   Offers: ${dbStatus.offers || 0}`);
    console.log(`   Purchases: ${dbStatus.purchases || 0}`);
    console.log(`   Transports: ${dbStatus.transports || 0}`);
    console.log(`   Elasticsearch: ${esCount} documents`);
    
    // Sync to Elasticsearch
    await this.syncToElasticsearch();
    
    console.log('\n✅ Data generation completed!');
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new SimpleDataGenerator();
  generator.run().catch(console.error);
}

module.exports = SimpleDataGenerator;