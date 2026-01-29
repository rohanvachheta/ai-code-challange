#!/usr/bin/env node

/**
 * Test script for the enhanced progressive massive data generator
 * This demonstrates the new features: UUID usage, specific user types, and progressive record generation
 */

const MassiveDataGenerator = require('./massive-data-generator');

async function testProgressiveGeneration() {
  console.log('🧪 Testing Progressive Data Generator'.cyan.bold);
  console.log('=====================================\n'.cyan);

  // Test configuration for small scale
  const config = {
    startingRecords: 2,      // Start with just 2 records
    maxRecords: 8,           // Go up to 8 records
    increment: 2,            // Increment by 2 each time (2, 4, 6, 8)
    concurrentWorkers: 1,    // Use single worker for testing
    batchSize: 5,           // Small batch size
    stopOnError: true,      // Stop on errors for testing
    services: {
      offerService: 'http://localhost:3001',
      purchaseService: 'http://localhost:3002', 
      transportService: 'http://localhost:3003',
      userService: 'http://localhost:3005'
    }
  };

  try {
    const generator = new MassiveDataGenerator(config);
    await generator.generate();
    
    console.log('\n✅ Progressive generation test completed successfully!'.green.bold);
    
  } catch (error) {
    console.error('\n❌ Test failed:'.red.bold, error.message);
    process.exit(1);
  }
}

// Test user generation specifically
async function testUserGeneration() {
  console.log('\n👥 Testing User Generation with Different Types'.cyan.bold);
  console.log('===============================================\n'.cyan);
  
  const generator = new MassiveDataGenerator();
  
  try {
    // Generate 15 users to see distribution
    const users = await generator.generateUsers(15, 'test');
    
    // Count user types
    const userCounts = users.reduce((acc, user) => {
      acc[user.userType] = (acc[user.userType] || 0) + 1;
      return acc;
    }, {});
    
    console.log('🎯 User Distribution:'.yellow.bold);
    Object.entries(userCounts).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} users`);
    });
    
    // Show sample users
    console.log('\n📋 Sample Users:'.yellow.bold);
    users.slice(0, 3).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.userType})`);
      console.log(`      ID: ${user.userId}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Phone: ${user.phone}`);
      console.log('');
    });
    
    console.log('✅ User generation test passed!'.green);
    
  } catch (error) {
    console.error('❌ User generation test failed:'.red, error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Enhanced Data Generator Tests\n'.green.bold);
  
  // Test 1: User generation with types and UUIDs
  await testUserGeneration();
  
  // Test 2: Check if services are running before full test
  console.log('\n🔍 Checking if services are running...'.cyan.bold);
  const axios = require('axios');
  
  const services = [
    'http://localhost:3001', // offer-service
    'http://localhost:3002', // purchase-service  
    'http://localhost:3003', // transport-service
    'http://localhost:3005'  // user-service
  ];
  
  let servicesRunning = 0;
  for (const service of services) {
    try {
      await axios.get(`${service}/health`, { timeout: 2000 });
      console.log(`   ✅ ${service} - Running`);
      servicesRunning++;
    } catch (error) {
      console.log(`   ❌ ${service} - Not running`);
    }
  }
  
  if (servicesRunning === services.length) {
    console.log('\n🎉 All services running! Running full test...\n'.green.bold);
    
    // Test 3: Progressive generation (only if all services are up)
    await testProgressiveGeneration();
  } else {
    console.log(`\n⚠️ Only ${servicesRunning}/${services.length} services running.`.yellow.bold);
    console.log('🚀 To run full test, start all services with:'.cyan);
    console.log('   docker-compose up -d\n');
  }
  
  console.log('🏁 All tests completed!'.green.bold);
}

// Run if called directly
if (require.main === module) {
  const colors = require('colors');
  runTests().catch((error) => {
    console.error('💥 Test runner failed:'.red.bold, error.message);
    process.exit(1);
  });
}

module.exports = { testUserGeneration, testProgressiveGeneration, runTests };