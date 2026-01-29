#!/usr/bin/env node

const axios = require('axios');
const { Client } = require('pg');

// Database connection configs
const dbConfigs = {
  offers: {
    host: 'localhost',
    port: 5432,
    database: 'offer_db',
    user: 'postgres',
    password: 'password'
  },
  purchases: {
    host: 'localhost',
    port: 5433,
    database: 'purchase_db', 
    user: 'postgres',
    password: 'password'
  },
  transports: {
    host: 'localhost',
    port: 5434,
    database: 'transport_db',
    user: 'postgres',
    password: 'password'
  }
};

// API endpoints
const API_ENDPOINTS = {
  offers: 'http://localhost:3001/offers',
  purchases: 'http://localhost:3002/purchases',
  transports: 'http://localhost:3003/transports',
  search: 'http://localhost:3004/search'
};

async function connectToDatabase(config) {
  const client = new Client(config);
  await client.connect();
  return client;
}

async function fetchAllOffers() {
  const client = await connectToDatabase(dbConfigs.offers);
  
  try {
    const result = await client.query(`
      SELECT "offerId", "sellerId", vin, make, model, year, price, 
             location, condition, description, mileage, color, status,
             "createdAt", "updatedAt"
      FROM offers 
      WHERE status = 'ACTIVE'
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${result.rows.length} offers in database`);
    return result.rows;
  } finally {
    await client.end();
  }
}

async function fetchAllPurchases() {
  const client = await connectToDatabase(dbConfigs.purchases);
  
  try {
    const result = await client.query(`
      SELECT "purchaseId", "buyerId", "sellerId", "offerId", "purchasePrice",
             "paymentMethod", notes, "taxAmount", "totalAmount", status,
             "createdAt", "updatedAt"
      FROM purchases
      ORDER BY "createdAt" DESC  
    `);
    
    console.log(`Found ${result.rows.length} purchases in database`);
    return result.rows;
  } finally {
    await client.end();
  }
}

async function fetchAllTransports() {
  const client = await connectToDatabase(dbConfigs.transports);
  
  try {
    const result = await client.query(`
      SELECT "transportId", "purchaseId", "carrierId", "offerId", "buyerId",
             "pickupLocation", "deliveryLocation", "scheduledPickupDate", 
             "scheduledDeliveryDate", "transportType", "transportCost",
             "distanceKm", "specialInstructions", "driverName", "driverPhone",
             notes, status, "createdAt", "updatedAt"
      FROM transports
      ORDER BY "createdAt" DESC
    `);
    
    console.log(`Found ${result.rows.length} transports in database`);
    return result.rows;
  } finally {
    await client.end();
  }
}

async function reindexOffers(offers) {
  console.log('\n🔄 Re-indexing offers to Elasticsearch...');
  let successCount = 0;
  let errorCount = 0;

  for (const offer of offers) {
    try {
      // Generate unique 17-character VIN (standard VIN length)
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits
      const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase(); // Random chars
      let uniqueVin = `RIDX${timestamp}${randomSuffix}`;
      
      // Ensure exactly 17 characters
      if (uniqueVin.length > 17) {
        uniqueVin = uniqueVin.substring(0, 17);
      } else if (uniqueVin.length < 17) {
        uniqueVin = uniqueVin + '0'.repeat(17 - uniqueVin.length);
      }
      
      
      // Create a new offer via API to trigger Kafka event and Elasticsearch indexing
      const offerData = {
        sellerId: offer.sellerId,
        vin: uniqueVin,  // Use unique VIN
        make: offer.make,
        model: offer.model,
        year: offer.year,
        price: parseFloat(offer.price),
        location: offer.location,
        condition: offer.condition,
        description: `${offer.description} (Reindexed)`,
        mileage: offer.mileage
      };
      
      if (offer.color) {
        offerData.color = offer.color;
      }
      
      
      const response = await axios.post(API_ENDPOINTS.offers, offerData);
      
      successCount++;
      process.stdout.write(`\r✅ Offers: ${successCount}/${offers.length}`);
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errorCount++;
      console.log(`\n❌ Error indexing offer ${offer.vin}:`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Status Text: ${error.response?.statusText}`);
      console.log(`   Error Message: ${error.response?.data?.message || error.message}`);
      console.log(`   Full Error Response:`, error.response?.data);
    }
  }
  
  console.log(`\n📊 Offers: ${successCount} successful, ${errorCount} errors`);
}

async function reindexPurchases(purchases) {
  console.log('\n🔄 Re-indexing purchases to Elasticsearch...');
  let successCount = 0;
  let errorCount = 0;

  for (const purchase of purchases) {
    try {
      const purchaseData = {
        buyerId: purchase.buyerId,
        sellerId: purchase.sellerId,
        offerId: purchase.offerId,
        purchasePrice: parseFloat(purchase.purchasePrice),
        paymentMethod: purchase.paymentMethod
      };
      
      if (purchase.notes) {
        purchaseData.notes = purchase.notes;
      }
      
      await axios.post(API_ENDPOINTS.purchases, purchaseData);
      
      successCount++;
      process.stdout.write(`\r✅ Purchases: ${successCount}/${purchases.length}`);
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errorCount++;
      if (errorCount <= 3) {
        console.log(`\n❌ Error indexing purchase ${purchase.purchaseId}: ${error.response?.data?.message || error.message}`);
      }
    }
  }
  
  console.log(`\n📊 Purchases: ${successCount} successful, ${errorCount} errors`);
}

async function reindexTransports(transports) {
  console.log('\n🔄 Re-indexing transports to Elasticsearch...');
  let successCount = 0;
  let errorCount = 0;

  for (const transport of transports) {
    try {
      const transportData = {
        purchaseId: transport.purchaseId,
        carrierId: transport.carrierId,
        offerId: transport.offerId,
        buyerId: transport.buyerId,
        pickupLocation: transport.pickupLocation,
        deliveryLocation: transport.deliveryLocation,
        scheduledPickupDate: transport.scheduledPickupDate,
        scheduledDeliveryDate: transport.scheduledDeliveryDate,
        transportType: transport.transportType,
        transportCost: parseFloat(transport.transportCost)
      };
      
      if (transport.distanceKm) transportData.distanceKm = parseFloat(transport.distanceKm);
      if (transport.specialInstructions) transportData.specialInstructions = transport.specialInstructions;
      if (transport.driverName) transportData.driverName = transport.driverName;
      if (transport.driverPhone) transportData.driverPhone = transport.driverPhone;
      if (transport.notes) transportData.notes = transport.notes;
      
      await axios.post(API_ENDPOINTS.transports, transportData);
      
      successCount++;
      process.stdout.write(`\r✅ Transports: ${successCount}/${transports.length}`);
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errorCount++;
      if (errorCount <= 3) {
        console.log(`\n❌ Error indexing transport ${transport.transportId}: ${error.response?.data?.message || error.message}`);
      }
    }
  }
  
  console.log(`\n📊 Transports: ${successCount} successful, ${errorCount} errors`);
}

async function checkElasticsearchStatus() {
  try {
    const response = await axios.get('http://localhost:9200/_cat/indices/global_search?v');
    console.log('\n📈 Elasticsearch Status After Reindexing:');
    console.log(response.data);
    
    const countResponse = await axios.get('http://localhost:9200/global_search/_count');
    console.log(`\n📊 Total documents in global_search: ${countResponse.data.count}`);
    
  } catch (error) {
    console.log('❌ Could not fetch Elasticsearch status:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Elasticsearch Reindexing Process...\n');
  
  try {
    console.log('ℹ️  This script will fetch existing data from PostgreSQL databases');
    console.log('   and re-create it via API calls to trigger Elasticsearch indexing.\n');
    
    // Wait for services to be ready
    console.log('⏳ Waiting for services to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fetch all data from databases  
    console.log('📖 Fetching data from databases...');
    const [offers, purchases, transports] = await Promise.all([
      fetchAllOffers(),
      fetchAllPurchases(), 
      fetchAllTransports()
    ]);
    
    console.log(`\n📊 Found: ${offers.length} offers, ${purchases.length} purchases, ${transports.length} transports`);
    
    if (offers.length === 0 && purchases.length === 0 && transports.length === 0) {
      console.log('⚠️  No data found in databases. Nothing to reindex.');
      return;
    }
    
    // Reindex all data (this will create new records via API)
    if (offers.length > 0) await reindexOffers(offers);
    if (purchases.length > 0) await reindexPurchases(purchases);  
    if (transports.length > 0) await reindexTransports(transports);
    
    // Wait for indexing to complete
    console.log('\n⏳ Waiting for Elasticsearch indexing to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Show final status
    await checkElasticsearchStatus();
    
    console.log('\n🎉 Reindexing completed! You can now view your data at:');
    console.log('   🔍 DejaVu: http://localhost:1358');
    console.log('   🌐 Frontend: http://localhost:3006');
    
  } catch (error) {
    console.error('💥 Error during reindexing:', error.message);
    process.exit(1);
  }
}

// Handle script interruption gracefully
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Reindexing interrupted by user');
  process.exit(0);
});

main();