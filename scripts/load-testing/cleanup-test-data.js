const axios = require('axios');
const colors = require('colors');

class TestDataCleanup {
  constructor(config = {}) {
    this.config = {
      services: {
        offerService: config.offerService || 'http://localhost:3001',
        purchaseService: config.purchaseService || 'http://localhost:3002',
        transportService: config.transportService || 'http://localhost:3003',
        userService: config.userService || 'http://localhost:3004',
        searchService: config.searchService || 'http://localhost:3000'
      },
      elasticsearchUrl: config.elasticsearchUrl || 'http://localhost:9200',
      batchSize: config.batchSize || 100,
      dryRun: config.dryRun || false
    };
  }

  async cleanup() {
    console.log('🧹 STARTING TEST DATA CLEANUP'.green.bold);
    console.log('================================'.cyan);
    
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN MODE - No data will be deleted'.yellow.bold);
    }
    
    try {
      // 1. Get counts before cleanup
      await this.reportCurrentState();
      
      if (!this.config.dryRun) {
        // Confirm with user
        const confirmed = await this.confirmCleanup();
        if (!confirmed) {
          console.log('❌ Cleanup cancelled by user'.yellow);
          return;
        }
      }
      
      // 2. Clean Elasticsearch first
      await this.cleanElasticsearch();
      
      // 3. Clean service databases
      await this.cleanServices();
      
      // 4. Verify cleanup
      await this.verifyCleanup();
      
      console.log('\n✅ CLEANUP COMPLETED SUCCESSFULLY!'.green.bold);
      
    } catch (error) {
      console.error('❌ Cleanup failed:'.red, error.message);
      process.exit(1);
    }
  }

  async reportCurrentState() {
    console.log('\n📊 CURRENT DATA STATE'.blue.bold);
    console.log('---------------------'.cyan);
    
    try {
      // Elasticsearch stats
      const esResponse = await axios.get(`${this.config.elasticsearchUrl}/global_search/_count`);
      console.log(`🔍 Elasticsearch Documents: ${esResponse.data.count.toLocaleString()}`);
      
      // Service stats
      const services = [
        { name: 'Offers', url: `${this.config.services.offerService}/offers/count` },
        { name: 'Purchases', url: `${this.config.services.purchaseService}/purchases/count` },
        { name: 'Transports', url: `${this.config.services.transportService}/transports/count` },
        { name: 'Users', url: `${this.config.services.userService}/users/count` }
      ];
      
      for (const service of services) {
        try {
          const response = await axios.get(service.url);
          console.log(`📊 ${service.name}: ${response.data.count?.toLocaleString() || 'N/A'}`);
        } catch (error) {
          console.log(`📊 ${service.name}: Unable to fetch count (${error.response?.status || 'Error'})`);
        }
      }
      
    } catch (error) {
      console.log('⚠️ Could not retrieve current state:', error.message);
    }
  }

  async confirmCleanup() {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('\n⚠️  This will DELETE ALL test data. Are you sure? (type "DELETE" to confirm): ', (answer) => {
        readline.close();
        resolve(answer === 'DELETE');
      });
    });
  }

  async cleanElasticsearch() {
    console.log('\n🔍 CLEANING ELASTICSEARCH'.blue.bold);
    console.log('-------------------------'.cyan);
    
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN: Would delete global_search index'.yellow);
      return;
    }
    
    try {
      // Delete the search index
      await axios.delete(`${this.config.elasticsearchUrl}/global_search`);
      console.log('✅ Deleted global_search index');
      
      // Wait a moment for deletion to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recreate the index with proper mappings
      console.log('🔧 Recreating search index...');
      // Note: In a real implementation, you'd call your search service to recreate the index
      // await axios.post(`${this.config.services.searchService}/index/recreate`);
      
      console.log('✅ Elasticsearch cleanup completed');
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ Search index already deleted or does not exist');
      } else {
        throw error;
      }
    }
  }

  async cleanServices() {
    console.log('\n🏭 CLEANING SERVICE DATABASES'.blue.bold);
    console.log('------------------------------'.cyan);
    
    const cleanupTasks = [
      { name: 'Transports', url: `${this.config.services.transportService}/transports/cleanup` },
      { name: 'Purchases', url: `${this.config.services.purchaseService}/purchases/cleanup` },
      { name: 'Offers', url: `${this.config.services.offerService}/offers/cleanup` },
      { name: 'Users', url: `${this.config.services.userService}/users/cleanup` }
    ];
    
    for (const task of cleanupTasks) {
      try {
        console.log(`🧹 Cleaning ${task.name}...`);
        
        if (this.config.dryRun) {
          console.log(`🔍 DRY RUN: Would clean ${task.name}`.yellow);
          continue;
        }
        
        // Try cleanup endpoint first
        try {
          await axios.delete(task.url);
          console.log(`✅ ${task.name} cleanup completed via API`);
        } catch (error) {
          // If cleanup endpoint doesn't exist, try bulk delete
          console.log(`⚠️ Cleanup endpoint not available for ${task.name}, trying alternative...`);
          await this.bulkDeleteFromService(task);
        }
        
      } catch (error) {
        console.log(`❌ Failed to clean ${task.name}:`, error.message);
      }
    }
  }

  async bulkDeleteFromService(task) {
    // Alternative cleanup method if dedicated cleanup endpoints don't exist
    const serviceName = task.name.toLowerCase();
    const baseUrl = task.url.replace('/cleanup', '');
    
    try {
      // Get all records in batches and delete
      let page = 1;
      let totalDeleted = 0;
      
      while (true) {
        const response = await axios.get(`${baseUrl}?page=${page}&limit=${this.config.batchSize}`);
        const records = response.data.results || response.data || [];
        
        if (records.length === 0) break;
        
        // Delete records in parallel
        const deletePromises = records.map(record => {
          const id = record.id || record[`${serviceName.slice(0, -1)}Id`] || record.entityId;
          return axios.delete(`${baseUrl}/${id}`).catch(() => {
            // Ignore individual delete failures
          });
        });
        
        await Promise.allSettled(deletePromises);
        totalDeleted += records.length;
        
        console.log(`   Deleted batch of ${records.length} records (total: ${totalDeleted})`);
        page++;
        
        // Prevent infinite loops
        if (page > 1000) {
          console.log(`⚠️ Stopped at page ${page} to prevent infinite loop`);
          break;
        }
      }
      
      console.log(`✅ Bulk deleted ${totalDeleted} ${task.name}`);
      
    } catch (error) {
      console.log(`⚠️ Bulk delete partially completed for ${task.name}`);
    }
  }

  async verifyCleanup() {
    console.log('\n🔍 VERIFYING CLEANUP'.blue.bold);
    console.log('--------------------'.cyan);
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for cleanup to propagate
    
    // Check Elasticsearch
    try {
      const esResponse = await axios.get(`${this.config.elasticsearchUrl}/global_search/_count`);
      const docCount = esResponse.data.count;
      
      if (docCount === 0) {
        console.log('✅ Elasticsearch: Clean (0 documents)');
      } else {
        console.log(`⚠️ Elasticsearch: ${docCount} documents remaining`);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Elasticsearch: Index deleted');
      } else {
        console.log('⚠️ Elasticsearch: Could not verify cleanup');
      }
    }
    
    // Check services
    const services = [
      { name: 'Offers', url: `${this.config.services.offerService}/offers/count` },
      { name: 'Purchases', url: `${this.config.services.purchaseService}/purchases/count` },
      { name: 'Transports', url: `${this.config.services.transportService}/transports/count` },
      { name: 'Users', url: `${this.config.services.userService}/users/count` }
    ];
    
    for (const service of services) {
      try {
        const response = await axios.get(service.url);
        const count = response.data.count || 0;
        
        if (count === 0) {
          console.log(`✅ ${service.name}: Clean (0 records)`);
        } else {
          console.log(`⚠️ ${service.name}: ${count} records remaining`);
        }
      } catch (error) {
        console.log(`⚠️ ${service.name}: Could not verify cleanup`);
      }
    }
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
    
    if (key === 'dry-run') {
      config.dryRun = true;
      i--; // No value for this flag
    }
    if (key === 'batch-size') config.batchSize = parseInt(value);
  }
  
  // Display help if requested
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Test Data Cleanup Utility

Usage: node cleanup-test-data.js [OPTIONS]

Options:
  --dry-run         Show what would be deleted without actually deleting
  --batch-size NUM  Number of records to process per batch (default: 100)
  --help           Show this help message

Examples:
  node cleanup-test-data.js --dry-run
  node cleanup-test-data.js --batch-size 50
    `);
    process.exit(0);
  }
  
  console.log('🚀 Starting Test Data Cleanup...'.green.bold);
  const cleanup = new TestDataCleanup(config);
  cleanup.cleanup().catch(console.error);
}

module.exports = TestDataCleanup;