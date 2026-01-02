import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for mixed workload
const indexingErrorRate = new Rate('indexing_errors');
const searchErrorRate = new Rate('search_errors');
const overallResponseTime = new Trend('overall_response_time');
const concurrentOperationsRate = new Rate('concurrent_operations_success');

// Aggressive load test configuration to simulate production traffic
export const options = {
  scenarios: {
    // Heavy search load simulation
    search_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },   // Ramp up search users
        { duration: '5m', target: 50 },   // Peak search load
        { duration: '3m', target: 80 },   // Stress test search
        { duration: '5m', target: 80 },   // Sustain high search load
        { duration: '2m', target: 0 },    // Cool down
      ],
      exec: 'searchWorkload',
    },
    
    // Continuous data indexing simulation
    indexing_load: {
      executor: 'constant-vus',
      vus: 15,
      duration: '17m', // Runs for the entire test duration
      exec: 'indexingWorkload',
    },
    
    // Mixed operations simulation (realistic user behavior)
    mixed_operations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '3m', target: 10 },   // Gradual user ramp up
        { duration: '8m', target: 25 },   // Peak mixed operations
        { duration: '3m', target: 35 },   // Stress mixed operations
        { duration: '3m', target: 0 },    // Cool down
      ],
      exec: 'mixedWorkload',
    },
  },
  
  thresholds: {
    // Performance thresholds for production readiness
    http_req_duration: ['p(95)<3000', 'p(99)<5000'], // 95% under 3s, 99% under 5s
    indexing_errors: ['rate<0.02'],     // Less than 2% indexing errors
    search_errors: ['rate<0.05'],       // Less than 5% search errors
    concurrent_operations_success: ['rate>0.95'], // 95%+ concurrent operations success
    overall_response_time: ['p(90)<2000'], // 90% of operations under 2s
  },
};

// Service URLs
const OFFER_SERVICE_URL = __ENV.OFFER_SERVICE_URL || 'http://localhost:3001';
const PURCHASE_SERVICE_URL = __ENV.PURCHASE_SERVICE_URL || 'http://localhost:3002';
const TRANSPORT_SERVICE_URL = __ENV.TRANSPORT_SERVICE_URL || 'http://localhost:3003';
const SEARCH_SERVICE_URL = __ENV.SEARCH_SERVICE_URL || 'http://localhost:3000';

// Enhanced data generators for more realistic load testing
const vehicleDatabase = {
  makes: [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Nissan', 
    'Hyundai', 'Kia', 'Volkswagen', 'Subaru', 'Mazda', 'Lexus', 'Acura', 'Infiniti',
    'Cadillac', 'Lincoln', 'Buick', 'GMC', 'Ram', 'Jeep', 'Chrysler', 'Dodge',
    'Tesla', 'Porsche', 'Land Rover', 'Jaguar', 'Volvo', 'Mini', 'Mitsubishi'
  ],
  models: [
    'Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Convertible', 'Wagon', 'Crossover',
    'Pickup', 'Van', 'Minivan', 'Sports Car', 'Luxury', 'Compact', 'Mid-size', 'Full-size'
  ],
  conditions: ['NEW', 'USED', 'CERTIFIED_PRE_OWNED'],
  statuses: ['ACTIVE', 'SOLD', 'PENDING', 'RESERVED'],
  colors: ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown', 'Gold', 'Yellow'],
  cities: [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
    'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
    'Charlotte', 'Seattle', 'Denver', 'Boston', 'El Paso', 'Detroit', 'Nashville', 'Portland',
    'Memphis', 'Oklahoma City', 'Las Vegas', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque'
  ]
};

// Realistic search queries based on automotive marketplace behavior
const searchQueries = [
  // Make-based searches
  'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Chevrolet', 'Tesla',
  
  // Model-specific searches
  'Toyota Camry', 'Honda Civic', 'Ford F-150', 'BMW 3 Series', 'Tesla Model 3',
  'Chevrolet Silverado', 'Honda Accord', 'Toyota RAV4', 'Ford Escape', 'Nissan Altima',
  
  // Year-specific searches
  '2022 Toyota', '2021 Honda', '2020 BMW', '2023 Ford', '2019 Mercedes',
  
  // Category searches
  'SUV', 'Truck', 'Sedan', 'Crossover', 'Luxury', 'Sports Car', 'Compact',
  
  // Location-based searches
  'cars in New York', 'vehicles in California', 'trucks in Texas',
  
  // Condition searches
  'new cars', 'used vehicles', 'certified pre-owned',
  
  // Price-range searches (simulated with generic terms)
  'affordable', 'luxury', 'budget', 'premium', 'economy',
  
  // Color searches
  'black BMW', 'white Toyota', 'red Ford', 'blue Honda',
  
  // Status searches
  'available', 'for sale', 'in stock',
  
  // Partial matches for autocomplete testing
  'Toy', 'Hon', 'For', 'BM', 'Mer', 'Che', 'Tes',
];

function generateVIN() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const excludeChars = 'IOQ'; // VIN standard excludes I, O, Q
  const validChars = chars.split('').filter(c => !excludeChars.includes(c)).join('');
  
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += validChars[Math.floor(Math.random() * validChars.length)];
  }
  return vin;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateRealisticOfferData() {
  const make = vehicleDatabase.makes[Math.floor(Math.random() * vehicleDatabase.makes.length)];
  const modelType = vehicleDatabase.models[Math.floor(Math.random() * vehicleDatabase.models.length)];
  const year = 2015 + Math.floor(Math.random() * 9); // 2015-2023
  
  // Price based on year and make (more realistic pricing)
  let basePrice = 15000;
  if (['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Tesla', 'Porsche'].includes(make)) {
    basePrice = 35000;
  } else if (['Toyota', 'Honda', 'Mazda', 'Subaru'].includes(make)) {
    basePrice = 20000;
  }
  
  const yearMultiplier = (year - 2015) * 0.1 + 1; // Newer cars cost more
  const price = Math.floor(basePrice * yearMultiplier + (Math.random() * 20000));
  
  return {
    sellerId: generateUUID(),
    vin: generateVIN(),
    make: make,
    model: `${modelType} ${Math.floor(Math.random() * 10) + 1}`,
    year: year,
    price: price,
    condition: vehicleDatabase.conditions[Math.floor(Math.random() * vehicleDatabase.conditions.length)],
    status: vehicleDatabase.statuses[Math.floor(Math.random() * vehicleDatabase.statuses.length)],
    description: `${year} ${make} ${modelType} - Excellent condition with low mileage. Perfect for daily commuting or weekend adventures.`,
    location: vehicleDatabase.cities[Math.floor(Math.random() * vehicleDatabase.cities.length)],
    color: vehicleDatabase.colors[Math.floor(Math.random() * vehicleDatabase.colors.length)],
    mileage: Math.floor(Math.random() * 100000) + 1000,
    transmission: Math.random() > 0.7 ? 'Manual' : 'Automatic',
    fuelType: ['Gasoline', 'Diesel', 'Hybrid', 'Electric'][Math.floor(Math.random() * 4)],
  };
}

// Search workload - focuses on search service performance
export function searchWorkload() {
  const searchTypes = [
    performBasicSearch,
    performAdvancedSearch,
    performAutocompleteSearch,
    performRoleBasedSearch,
    performPaginatedSearch,
    performFilteredSearch,
  ];
  
  const searchType = searchTypes[Math.floor(Math.random() * searchTypes.length)];
  searchType();
  
  sleep(Math.random() * 1 + 0.2); // 0.2-1.2 second intervals
}

// Indexing workload - focuses on data creation and indexing
export function indexingWorkload() {
  const indexingOperations = [
    createOfferAndIndex,
    createPurchaseAndIndex,
    createTransportAndIndex,
    bulkCreateOffersAndIndex,
  ];
  
  const operation = indexingOperations[Math.floor(Math.random() * indexingOperations.length)];
  operation();
  
  sleep(Math.random() * 2 + 1); // 1-3 second intervals for indexing operations
}

// Mixed workload - simulates real user behavior
export function mixedWorkload() {
  const mixedOperations = [
    simulateUserBrowsing,
    simulateSellerActivity,
    simulateCarrierActivity,
    simulateBuyerJourney,
    performConcurrentOperations,
  ];
  
  const operation = mixedOperations[Math.floor(Math.random() * mixedOperations.length)];
  operation();
  
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 second intervals
}

// Individual test functions
function performBasicSearch() {
  const searchText = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  const userTypes = ['SELLER', 'BUYER', 'CARRIER', 'AGENT'];
  
  const params = {
    userType: userTypes[Math.floor(Math.random() * userTypes.length)],
    accountId: generateUUID(),
    searchText: searchText,
    page: Math.floor(Math.random() * 5) + 1,
    limit: [10, 20, 50][Math.floor(Math.random() * 3)],
  };
  
  const startTime = new Date();
  const response = http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify(params), {
    headers: { 'Content-Type': 'application/json' }
  });
  const responseTime = new Date() - startTime;
  
  overallResponseTime.add(responseTime);
  
  const success = check(response, {
    'basic search status 200': (r) => r.status === 200,
    'basic search has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('results') && body.hasOwnProperty('total');
      } catch {
        return false;
      }
    },
  });
  
  searchErrorRate.add(!success);
}

function performAdvancedSearch() {
  const params = {
    userType: 'BUYER',
    accountId: generateUUID(),
    searchText: vehicleDatabase.makes[Math.floor(Math.random() * vehicleDatabase.makes.length)],
    entityTypes: ['offer'],
    minYear: 2018,
    maxYear: 2023,
    minPrice: 20000,
    maxPrice: 60000,
    condition: 'NEW',
    page: 1,
    limit: 20,
  };
  
  const response = http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify(params), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  const success = check(response, {
    'advanced search status 200': (r) => r.status === 200,
    'advanced search has aggregations': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('aggregations');
      } catch {
        return false;
      }
    },
  });
  
  searchErrorRate.add(!success);
}

function performAutocompleteSearch() {
  const partialQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)].substring(0, 3);
  
  const response = http.get(`${SEARCH_SERVICE_URL}/search/autocomplete?searchText=${encodeURIComponent(partialQuery)}&limit=10`);
  
  const success = check(response, {
    'autocomplete status 200': (r) => r.status === 200,
    'autocomplete has suggestions': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('suggestions');
      } catch {
        return false;
      }
    },
  });
  
  searchErrorRate.add(!success);
}

function performRoleBasedSearch() {
  const userType = ['SELLER', 'BUYER', 'CARRIER', 'AGENT'][Math.floor(Math.random() * 4)];
  
  const response = http.post(`${SEARCH_SERVICE_URL}/search/${userType.toLowerCase()}`, JSON.stringify({
    accountId: generateUUID(),
    searchText: vehicleDatabase.makes[Math.floor(Math.random() * vehicleDatabase.makes.length)],
    page: 1,
    limit: 15,
  }), { headers: { 'Content-Type': 'application/json' } });
  
  check(response, {
    'role-based search status 200': (r) => r.status === 200,
  });
}

function performPaginatedSearch() {
  const response = http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify({
    userType: 'BUYER',
    accountId: generateUUID(),
    searchText: 'Toyota',
    page: Math.floor(Math.random() * 10) + 1,
    limit: 25,
  }), { headers: { 'Content-Type': 'application/json' } });
  
  check(response, {
    'paginated search status 200': (r) => r.status === 200,
  });
}

function performFilteredSearch() {
  const response = http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify({
    userType: 'BUYER',
    accountId: generateUUID(),
    searchText: '',
    entityTypes: ['offer', 'purchase'],
    location: vehicleDatabase.cities[Math.floor(Math.random() * vehicleDatabase.cities.length)],
    status: 'ACTIVE',
    page: 1,
    limit: 30,
  }), { headers: { 'Content-Type': 'application/json' } });
  
  check(response, {
    'filtered search status 200': (r) => r.status === 200,
  });
}

function createOfferAndIndex() {
  const offerData = generateRealisticOfferData();
  
  const startTime = new Date();
  const response = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), {
    headers: { 'Content-Type': 'application/json' }
  });
  const responseTime = new Date() - startTime;
  
  overallResponseTime.add(responseTime);
  
  const success = check(response, {
    'offer creation status 201': (r) => r.status === 201,
  });
  
  indexingErrorRate.add(!success);
}

function createPurchaseAndIndex() {
  // Create offer first, then purchase
  const offerData = generateRealisticOfferData();
  const offerResponse = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (offerResponse.status === 201) {
    const offerId = JSON.parse(offerResponse.body).id;
    
    const purchaseData = {
      buyerId: generateUUID(),
      offerId: offerId,
      totalAmount: offerData.price + Math.floor(Math.random() * 5000), // Add some fees
      paymentMethod: ['CASH', 'FINANCING', 'LEASE'][Math.floor(Math.random() * 3)],
      status: 'PENDING',
    };
    
    const response = http.post(`${PURCHASE_SERVICE_URL}/purchases`, JSON.stringify(purchaseData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const success = check(response, {
      'purchase creation status 201': (r) => r.status === 201,
    });
    
    indexingErrorRate.add(!success);
  } else {
    indexingErrorRate.add(1);
  }
}

function createTransportAndIndex() {
  // Create offer, purchase, then transport
  const offerData = generateRealisticOfferData();
  const offerResponse = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (offerResponse.status === 201) {
    const offerId = JSON.parse(offerResponse.body).id;
    
    const purchaseData = {
      buyerId: generateUUID(),
      offerId: offerId,
      totalAmount: offerData.price + 2000,
      paymentMethod: 'FINANCING',
      status: 'COMPLETED',
    };
    
    const purchaseResponse = http.post(`${PURCHASE_SERVICE_URL}/purchases`, JSON.stringify(purchaseData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (purchaseResponse.status === 201) {
      const purchaseId = JSON.parse(purchaseResponse.body).id;
      
      const transportData = {
        carrierId: generateUUID(),
        purchaseId: purchaseId,
        pickupLocation: offerData.location,
        deliveryLocation: vehicleDatabase.cities[Math.floor(Math.random() * vehicleDatabase.cities.length)],
        scheduledPickup: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledDelivery: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SCHEDULED',
      };
      
      const response = http.post(`${TRANSPORT_SERVICE_URL}/transports`, JSON.stringify(transportData), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const success = check(response, {
        'transport creation status 201': (r) => r.status === 201,
      });
      
      indexingErrorRate.add(!success);
    } else {
      indexingErrorRate.add(1);
    }
  } else {
    indexingErrorRate.add(1);
  }
}

function bulkCreateOffersAndIndex() {
  const batchSize = Math.floor(Math.random() * 3) + 2; // 2-4 offers
  let successCount = 0;
  
  for (let i = 0; i < batchSize; i++) {
    const offerData = generateRealisticOfferData();
    const response = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 201) {
      successCount++;
    }
    
    sleep(0.1); // Small delay between batch items
  }
  
  indexingErrorRate.add(successCount < batchSize);
}

// Realistic user behavior simulations
function simulateUserBrowsing() {
  // User browses -> searches -> views details -> refines search
  
  // 1. Initial browse with statistics
  http.get(`${SEARCH_SERVICE_URL}/search/statistics`);
  
  // 2. Perform search
  const searchResponse = http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify({
    userType: 'BUYER',
    accountId: generateUUID(),
    searchText: vehicleDatabase.makes[Math.floor(Math.random() * vehicleDatabase.makes.length)],
    page: 1,
    limit: 20,
  }), { headers: { 'Content-Type': 'application/json' } });
  
  // 3. If results found, simulate viewing details
  if (searchResponse.status === 200) {
    const results = JSON.parse(searchResponse.body);
    if (results.results && results.results.length > 0) {
      // Simulate user clicking on first few results
      for (let i = 0; i < Math.min(3, results.results.length); i++) {
        const item = results.results[i];
        if (item.entityType === 'offer') {
          http.get(`${OFFER_SERVICE_URL}/offers/${item.id}`);
        }
      }
    }
  }
  
  // 4. Refine search with filters
  http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify({
    userType: 'BUYER',
    accountId: generateUUID(),
    searchText: 'SUV',
    minPrice: 25000,
    maxPrice: 50000,
    condition: 'NEW',
    page: 1,
    limit: 15,
  }), { headers: { 'Content-Type': 'application/json' } });
}

function simulateSellerActivity() {
  // Seller creates offers, checks their listings, updates prices
  
  const sellerId = generateUUID();
  
  // 1. Create new offer
  const offerData = generateRealisticOfferData();
  offerData.sellerId = sellerId;
  
  const createResponse = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), {
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (createResponse.status === 201) {
    const offerId = JSON.parse(createResponse.body).id;
    
    // 2. Check seller's own listings
    http.post(`${SEARCH_SERVICE_URL}/search/seller`, JSON.stringify({
      accountId: sellerId,
      searchText: '',
      page: 1,
      limit: 20,
    }), { headers: { 'Content-Type': 'application/json' } });
    
    // 3. Update offer (price adjustment)
    const updateData = { ...offerData, price: offerData.price + 1000 };
    http.put(`${OFFER_SERVICE_URL}/offers/${offerId}`, JSON.stringify(updateData), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function simulateCarrierActivity() {
  const carrierId = generateUUID();
  
  // 1. Search for available transport jobs
  http.post(`${SEARCH_SERVICE_URL}/search/carrier`, JSON.stringify({
    accountId: carrierId,
    searchText: 'transport',
    entityTypes: ['transport'],
    status: 'SCHEDULED',
    page: 1,
    limit: 15,
  }), { headers: { 'Content-Type': 'application/json' } });
  
  // 2. Check transport statistics
  http.get(`${TRANSPORT_SERVICE_URL}/transports/statistics`);
  
  // 3. Search by location
  http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify({
    userType: 'CARRIER',
    accountId: carrierId,
    location: vehicleDatabase.cities[Math.floor(Math.random() * vehicleDatabase.cities.length)],
    page: 1,
    limit: 10,
  }), { headers: { 'Content-Type': 'application/json' } });
}

function simulateBuyerJourney() {
  const buyerId = generateUUID();
  
  // 1. Start with autocomplete search
  http.get(`${SEARCH_SERVICE_URL}/search/autocomplete?searchText=Toy&limit=5`);
  
  // 2. Perform detailed search
  const searchResponse = http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify({
    userType: 'BUYER',
    accountId: buyerId,
    searchText: 'Toyota Camry',
    minYear: 2020,
    maxPrice: 35000,
    condition: 'NEW',
    page: 1,
    limit: 20,
  }), { headers: { 'Content-Type': 'application/json' } });
  
  // 3. If offers found, simulate purchase interest
  if (searchResponse.status === 200) {
    const results = JSON.parse(searchResponse.body);
    if (results.results && results.results.length > 0) {
      const offer = results.results.find(r => r.entityType === 'offer');
      if (offer) {
        // View offer details
        http.get(`${OFFER_SERVICE_URL}/offers/${offer.id}`);
        
        // Simulate purchase (might fail due to business rules, which is realistic)
        http.post(`${PURCHASE_SERVICE_URL}/purchases`, JSON.stringify({
          buyerId: buyerId,
          offerId: offer.id,
          totalAmount: offer.price,
          paymentMethod: 'FINANCING',
          status: 'PENDING',
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    }
  }
}

function performConcurrentOperations() {
  // Test concurrent search + indexing to validate system under mixed load
  
  const promises = [];
  
  // Concurrent search operations
  for (let i = 0; i < 3; i++) {
    promises.push(() => {
      const response = http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify({
        userType: 'BUYER',
        accountId: generateUUID(),
        searchText: vehicleDatabase.makes[Math.floor(Math.random() * vehicleDatabase.makes.length)],
        page: 1,
        limit: 10,
      }), { headers: { 'Content-Type': 'application/json' } });
      
      return response.status === 200;
    });
  }
  
  // Concurrent indexing operations
  for (let i = 0; i < 2; i++) {
    promises.push(() => {
      const offerData = generateRealisticOfferData();
      const response = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.status === 201;
    });
  }
  
  // Execute all operations
  let successCount = 0;
  promises.forEach(operation => {
    if (operation()) {
      successCount++;
    }
  });
  
  const overallSuccess = successCount === promises.length;
  concurrentOperationsRate.add(overallSuccess);
}

// Test setup
export function setup() {
  console.log('🚀 Starting Mixed Workload Performance Test');
  console.log('🎯 This test simulates production-level concurrent search + indexing operations');
  console.log(`📡 Services: Offer(${OFFER_SERVICE_URL}), Purchase(${PURCHASE_SERVICE_URL}), Transport(${TRANSPORT_SERVICE_URL}), Search(${SEARCH_SERVICE_URL})`);
  
  // Verify all services are available
  const services = [
    { name: 'Offer', url: `${OFFER_SERVICE_URL}/health` },
    { name: 'Purchase', url: `${PURCHASE_SERVICE_URL}/health` },
    { name: 'Transport', url: `${TRANSPORT_SERVICE_URL}/health` },
    { name: 'Search', url: `${SEARCH_SERVICE_URL}/health` },
  ];
  
  services.forEach(service => {
    const response = http.get(service.url);
    if (response.status !== 200) {
      throw new Error(`${service.name} service not available: ${response.status}`);
    }
    console.log(`✅ ${service.name} service is ready`);
  });
  
  // Pre-seed some data for more realistic testing
  console.log('🌱 Pre-seeding test data...');
  const seedData = [];
  for (let i = 0; i < 10; i++) {
    const offerData = generateRealisticOfferData();
    const response = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), {
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.status === 201) {
      seedData.push(JSON.parse(response.body).id);
    }
  }
  
  console.log(`✅ Pre-seeded ${seedData.length} offers for realistic testing`);
  console.log('🏁 Starting mixed workload scenarios...');
  
  return { seedOfferIds: seedData };
}

// Test teardown
export function teardown(data) {
  console.log('🏁 Mixed workload performance test completed');
  console.log('📊 Performance Summary:');
  console.log('   - Search operations tested under concurrent indexing load');
  console.log('   - Indexing operations tested under heavy search traffic');
  console.log('   - User behavior simulations completed');
  console.log('   - Concurrent operations stress tested');
  console.log('📈 Check the detailed metrics for performance analysis');
  
  if (data && data.seedOfferIds) {
    console.log(`🧹 Test completed with ${data.seedOfferIds.length} seed records`);
  }
}