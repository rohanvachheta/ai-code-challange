#!/usr/bin/env node

const axios = require('axios');
const { Client } = require('pg');

// ============================================================================
// SIMPLE SYSTEM TESTER - CHECK IF EVERYTHING IS RUNNING SMOOTH
// ============================================================================

class SimpleSystemTester {
  constructor() {
    this.services = {
      'User Service': 'http://localhost:3005/users',
      'Offer Service': 'http://localhost:3001/offers', 
      'Purchase Service': 'http://localhost:3002/purchases',
      'Transport Service': 'http://localhost:3003/transports',
      'Search Service': 'http://localhost:3004/search/statistics',
      'Elasticsearch': 'http://localhost:9200'
    };

    this.databases = {
      'User DB': { host: 'localhost', port: 5435, database: 'user_db', user: 'postgres', password: 'password' },
      'Offer DB': { host: 'localhost', port: 5432, database: 'offer_db', user: 'postgres', password: 'password' },
      'Purchase DB': { host: 'localhost', port: 5433, database: 'purchase_db', user: 'postgres', password: 'password' },
      'Transport DB': { host: 'localhost', port: 5434, database: 'transport_db', user: 'postgres', password: 'password' }
    };

    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Log test result
   */
  logTest(name, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}`);
    if (message) console.log(`   ${message}`);
    
    this.results.tests.push({ name, passed, message });
    if (passed) this.results.passed++;
    else this.results.failed++;
  }

  /**
   * Test all services
   */
  async testServices() {
    console.log('🔍 Testing Services...\n');
    
    for (const [name, url] of Object.entries(this.services)) {
      try {
        const response = await axios.get(url, { timeout: 5000 });
        this.logTest(`${name}`, response.status === 200, `Status: ${response.status}`);
      } catch (error) {
        this.logTest(`${name}`, false, `Error: ${error.message}`);
      }
    }
  }

  /**
   * Test all databases
   */
  async testDatabases() {
    console.log('\n🗄️  Testing Databases...\n');
    
    for (const [name, config] of Object.entries(this.databases)) {
      try {
        const client = new Client(config);
        await client.connect();
        await client.query('SELECT 1');
        await client.end();
        this.logTest(`${name}`, true, 'Connected successfully');
      } catch (error) {
        this.logTest(`${name}`, false, `Connection failed: ${error.message}`);
      }
    }
  }

  /**
   * Test data existence
   */
  async testDataExistence() {
    console.log('\n📊 Testing Data Existence...\n');
    
    const tableChecks = {
      'User DB': 'users',
      'Offer DB': 'offers', 
      'Purchase DB': 'purchases',
      'Transport DB': 'transports'
    };

    for (const [dbName, tableName] of Object.entries(tableChecks)) {
      try {
        const config = this.databases[dbName];
        const client = new Client(config);
        await client.connect();
        
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        const count = parseInt(result.rows[0].count);
        
        await client.end();
        this.logTest(`${tableName} table`, count > 0, `${count} records found`);
      } catch (error) {
        this.logTest(`${tableName} table`, false, `Query failed: ${error.message}`);
      }
    }
  }

  /**
   * Test Elasticsearch
   */
  async testElasticsearch() {
    console.log('\n🔍 Testing Elasticsearch...\n');
    
    try {
      // Test connectivity
      const healthResponse = await axios.get(`${this.services.Elasticsearch}/_cluster/health`);
      this.logTest('Elasticsearch connectivity', healthResponse.status === 200, 'Cluster accessible');
      
      // Test index
      const indexResponse = await axios.get(`${this.services.Elasticsearch}/global_search`);
      this.logTest('Search index exists', indexResponse.status === 200, 'Index available');
      
      // Test document count
      const countResponse = await axios.get(`${this.services.Elasticsearch}/global_search/_count`);
      const docCount = countResponse.data.count || 0;
      this.logTest('Documents indexed', docCount > 0, `${docCount} documents found`);
      
      // Test search
      const searchResponse = await axios.get(`${this.services.Elasticsearch}/global_search/_search?size=1`);
      const hasResults = searchResponse.data.hits && searchResponse.data.hits.total.value > 0;
      this.logTest('Search functionality', hasResults, 'Search working');
      
    } catch (error) {
      this.logTest('Elasticsearch', false, `Error: ${error.message}`);
    }
  }

  /**
   * Test basic API operations
   */
  async testAPIOperations() {
    console.log('\n🔧 Testing API Operations...\n');
    
    try {
      // Test user creation
      const testUser = {
        firstName: 'Test',
        lastName: 'User',
        email: `test.${Date.now()}@example.com`,
        phone: '+1234567890',
        userType: 'BUYER',
        isActive: true
      };
      
      const userResponse = await axios.post(this.services['User Service'], testUser);
      this.logTest('Create User API', userResponse.status === 201, 'User created successfully');
      
      // Test reading users
      const usersResponse = await axios.get(this.services['User Service']);
      this.logTest('Read Users API', usersResponse.status === 200, 'Users fetched successfully');
      
    } catch (error) {
      this.logTest('API Operations', false, `Error: ${error.message}`);
    }
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 SYSTEM TEST REPORT');
    console.log('='.repeat(60));
    
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${this.results.passed} ✅`);
    console.log(`   Failed: ${this.results.failed} ❌`);
    console.log(`   Success Rate: ${successRate}%`);
    
    if (this.results.failed > 0) {
      console.log(`\n🔍 Failed Tests:`);
      this.results.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`   ❌ ${t.name}: ${t.message}`));
    }
    
    console.log(`\n🎯 Overall Status: ${successRate >= 80 ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION'} (${successRate}%)`);
    
    return { total, passed: this.results.passed, failed: this.results.failed, successRate };
  }

  /**
   * Run all tests
   */
  async run() {
    console.log('🎯 Simple System Tester\n');
    console.log('Checking if everything is running smooth...\n');
    console.log('='.repeat(50));
    
    try {
      await this.testServices();
      await this.testDatabases(); 
      await this.testDataExistence();
      await this.testElasticsearch();
      await this.testAPIOperations();
      
      const report = this.generateReport();
      return report;
      
    } catch (error) {
      console.error('\n💥 Fatal error during testing:', error.message);
      return { total: 0, passed: 0, failed: 1, successRate: 0 };
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new SimpleSystemTester();
  tester.run().then(report => {
    process.exit(report.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SimpleSystemTester;