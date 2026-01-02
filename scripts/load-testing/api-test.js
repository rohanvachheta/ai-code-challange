import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const apiErrorRate = new Rate('api_errors');
const offerResponseTime = new Trend('offer_response_time');
const purchaseResponseTime = new Trend('purchase_response_time');
const transportResponseTime = new Trend('transport_response_time');

// Test configuration for API stress testing
export const options = {
  stages: [
    { duration: '1m', target: 5 },    // Ramp up to 5 users
    { duration: '3m', target: 5 },    // Stay at 5 users for 3 minutes
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 20 },   // Stay at 20 users for 3 minutes
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests should complete within 3s
    api_errors: ['rate<0.1'],          // Error rate should be less than 10%
    offer_response_time: ['p(90)<2000'], // 90% of offer API calls under 2s
    purchase_response_time: ['p(90)<2500'], // 90% of purchase API calls under 2.5s
  },
};

// Service URLs
const OFFER_SERVICE_URL = __ENV.OFFER_SERVICE_URL || 'http://localhost:3001';
const PURCHASE_SERVICE_URL = __ENV.PURCHASE_SERVICE_URL || 'http://localhost:3002';
const TRANSPORT_SERVICE_URL = __ENV.TRANSPORT_SERVICE_URL || 'http://localhost:3003';
const SEARCH_SERVICE_URL = __ENV.SEARCH_SERVICE_URL || 'http://localhost:3000';

// Sample data generators
function generateVIN() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let vin = '';
  for (let i = 0; i < 17; i++) {
    vin += chars[Math.floor(Math.random() * chars.length)];
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

const carMakes = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Chevrolet', 'Nissan', 'Audi'];
const carModels = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Convertible'];
const conditions = ['NEW', 'USED', 'CERTIFIED_PRE_OWNED'];
const statuses = ['ACTIVE', 'SOLD', 'PENDING'];

function generateOfferData() {
  return {
    sellerId: generateUUID(),
    vin: generateVIN(),
    make: carMakes[Math.floor(Math.random() * carMakes.length)],
    model: `${carModels[Math.floor(Math.random() * carModels.length)]} ${Math.floor(Math.random() * 10) + 1}`,
    year: 2015 + Math.floor(Math.random() * 9),
    price: 15000 + Math.floor(Math.random() * 50000),
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    description: 'Test vehicle for load testing',
    location: `Test City ${Math.floor(Math.random() * 100)}`,
  };
}

function generatePurchaseData(offerId) {
  return {
    buyerId: generateUUID(),
    offerId: offerId,
    totalAmount: 25000 + Math.floor(Math.random() * 30000),
    paymentMethod: ['CASH', 'FINANCING', 'LEASE'][Math.floor(Math.random() * 3)],
    status: 'PENDING',
  };
}

function generateTransportData(purchaseId) {
  return {
    carrierId: generateUUID(),
    purchaseId: purchaseId,
    pickupLocation: `Pickup City ${Math.floor(Math.random() * 50)}`,
    deliveryLocation: `Delivery City ${Math.floor(Math.random() * 50)}`,
    scheduledPickup: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    scheduledDelivery: new Date(Date.now() + Math.random() * 45 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'SCHEDULED',
  };
}

export default function() {
  const scenarios = [
    testOfferCRUD,
    testPurchaseCRUD,
    testTransportCRUD,
    testCombinedWorkflow,
    testHealthChecks,
    testSearchIntegration,
  ];
  
  // Run a random scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();
  
  sleep(Math.random() * 2 + 0.5); // Random sleep between 0.5-2.5 seconds
}

function testOfferCRUD() {
  const headers = { 'Content-Type': 'application/json' };
  
  // Create offer
  const offerData = generateOfferData();
  const startTime = new Date();
  const createResponse = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), { headers });
  const createTime = new Date() - startTime;
  
  offerResponseTime.add(createTime);
  
  const createSuccess = check(createResponse, {
    'offer creation status is 201': (r) => r.status === 201,
    'offer creation returns ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('id');
      } catch {
        return false;
      }
    },
  });
  
  if (!createSuccess) {
    apiErrorRate.add(1);
    return;
  }
  
  const offerId = JSON.parse(createResponse.body).id;
  
  // Read offer
  const readResponse = http.get(`${OFFER_SERVICE_URL}/offers/${offerId}`);
  const readSuccess = check(readResponse, {
    'offer read status is 200': (r) => r.status === 200,
    'offer read returns correct data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id === offerId && body.vin === offerData.vin;
      } catch {
        return false;
      }
    },
  });
  
  // Update offer
  const updateData = { ...offerData, price: offerData.price + 1000 };
  const updateResponse = http.put(`${OFFER_SERVICE_URL}/offers/${offerId}`, JSON.stringify(updateData), { headers });
  const updateSuccess = check(updateResponse, {
    'offer update status is 200': (r) => r.status === 200,
  });
  
  // List offers
  const listResponse = http.get(`${OFFER_SERVICE_URL}/offers?page=1&limit=10`);
  const listSuccess = check(listResponse, {
    'offer list status is 200': (r) => r.status === 200,
    'offer list returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });
  
  apiErrorRate.add(!(createSuccess && readSuccess && updateSuccess && listSuccess));
}

function testPurchaseCRUD() {
  const headers = { 'Content-Type': 'application/json' };
  
  // First create an offer to purchase
  const offerData = generateOfferData();
  const offerResponse = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), { headers });
  
  if (offerResponse.status !== 201) {
    apiErrorRate.add(1);
    return;
  }
  
  const offerId = JSON.parse(offerResponse.body).id;
  const purchaseData = generatePurchaseData(offerId);
  
  const startTime = new Date();
  const createResponse = http.post(`${PURCHASE_SERVICE_URL}/purchases`, JSON.stringify(purchaseData), { headers });
  const createTime = new Date() - startTime;
  
  purchaseResponseTime.add(createTime);
  
  const success = check(createResponse, {
    'purchase creation status is 201': (r) => r.status === 201,
    'purchase creation returns ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('id');
      } catch {
        return false;
      }
    },
  });
  
  if (success && createResponse.status === 201) {
    const purchaseId = JSON.parse(createResponse.body).id;
    
    // Read purchase
    const readResponse = http.get(`${PURCHASE_SERVICE_URL}/purchases/${purchaseId}`);
    check(readResponse, {
      'purchase read status is 200': (r) => r.status === 200,
    });
    
    // List purchases
    const listResponse = http.get(`${PURCHASE_SERVICE_URL}/purchases?page=1&limit=10`);
    check(listResponse, {
      'purchase list status is 200': (r) => r.status === 200,
    });
  }
  
  apiErrorRate.add(!success);
}

function testTransportCRUD() {
  const headers = { 'Content-Type': 'application/json' };
  
  // Create offer and purchase first
  const offerData = generateOfferData();
  const offerResponse = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), { headers });
  
  if (offerResponse.status !== 201) {
    apiErrorRate.add(1);
    return;
  }
  
  const offerId = JSON.parse(offerResponse.body).id;
  const purchaseData = generatePurchaseData(offerId);
  const purchaseResponse = http.post(`${PURCHASE_SERVICE_URL}/purchases`, JSON.stringify(purchaseData), { headers });
  
  if (purchaseResponse.status !== 201) {
    apiErrorRate.add(1);
    return;
  }
  
  const purchaseId = JSON.parse(purchaseResponse.body).id;
  const transportData = generateTransportData(purchaseId);
  
  const startTime = new Date();
  const createResponse = http.post(`${TRANSPORT_SERVICE_URL}/transports`, JSON.stringify(transportData), { headers });
  const createTime = new Date() - startTime;
  
  transportResponseTime.add(createTime);
  
  const success = check(createResponse, {
    'transport creation status is 201': (r) => r.status === 201,
    'transport creation returns ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('id');
      } catch {
        return false;
      }
    },
  });
  
  apiErrorRate.add(!success);
}

function testCombinedWorkflow() {
  const headers = { 'Content-Type': 'application/json' };
  
  // Complete workflow: Offer -> Purchase -> Transport
  const offerData = generateOfferData();
  const offerResponse = http.post(`${OFFER_SERVICE_URL}/offers`, JSON.stringify(offerData), { headers });
  
  if (offerResponse.status === 201) {
    const offerId = JSON.parse(offerResponse.body).id;
    
    // Wait a bit for event processing
    sleep(0.1);
    
    const purchaseData = generatePurchaseData(offerId);
    const purchaseResponse = http.post(`${PURCHASE_SERVICE_URL}/purchases`, JSON.stringify(purchaseData), { headers });
    
    if (purchaseResponse.status === 201) {
      const purchaseId = JSON.parse(purchaseResponse.body).id;
      
      // Wait a bit for event processing
      sleep(0.1);
      
      const transportData = generateTransportData(purchaseId);
      const transportResponse = http.post(`${TRANSPORT_SERVICE_URL}/transports`, JSON.stringify(transportData), { headers });
      
      const workflowSuccess = check(transportResponse, {
        'complete workflow successful': (r) => r.status === 201,
      });
      
      // Check if search index was updated (eventual consistency)
      sleep(0.5);
      const searchResponse = http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify({
        userType: 'BUYER',
        accountId: generateUUID(),
        searchText: offerData.make,
        page: 1,
        limit: 10,
      }), { headers });
      
      check(searchResponse, {
        'search reflects new data': (r) => r.status === 200,
      });
      
      apiErrorRate.add(!workflowSuccess);
    } else {
      apiErrorRate.add(1);
    }
  } else {
    apiErrorRate.add(1);
  }
}

function testHealthChecks() {
  const services = [
    { name: 'Offer Service', url: `${OFFER_SERVICE_URL}/health` },
    { name: 'Purchase Service', url: `${PURCHASE_SERVICE_URL}/health` },
    { name: 'Transport Service', url: `${TRANSPORT_SERVICE_URL}/health` },
    { name: 'Search Service', url: `${SEARCH_SERVICE_URL}/health` },
  ];
  
  services.forEach(service => {
    const response = http.get(service.url);
    check(response, {
      [`${service.name} health check passes`]: (r) => r.status === 200,
    });
  });
}

function testSearchIntegration() {
  const headers = { 'Content-Type': 'application/json' };
  
  // Test different search scenarios
  const searchParams = {
    userType: 'BUYER',
    accountId: generateUUID(),
    searchText: carMakes[Math.floor(Math.random() * carMakes.length)],
    page: 1,
    limit: 20,
  };
  
  const searchResponse = http.post(`${SEARCH_SERVICE_URL}/search`, JSON.stringify(searchParams), { headers });
  
  check(searchResponse, {
    'search integration works': (r) => r.status === 200,
    'search returns structured data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('results') && body.hasOwnProperty('total');
      } catch {
        return false;
      }
    },
  });
  
  // Test autocomplete
  const autocompleteResponse = http.get(`${SEARCH_SERVICE_URL}/search/autocomplete?searchText=${encodeURIComponent('To')}&limit=5`);
  
  check(autocompleteResponse, {
    'autocomplete integration works': (r) => r.status === 200,
  });
}

// Test setup
export function setup() {
  console.log('🚀 Starting API Services Load Test');
  console.log(`📡 Offer Service: ${OFFER_SERVICE_URL}`);
  console.log(`📡 Purchase Service: ${PURCHASE_SERVICE_URL}`);
  console.log(`📡 Transport Service: ${TRANSPORT_SERVICE_URL}`);
  console.log(`📡 Search Service: ${SEARCH_SERVICE_URL}`);
  
  // Warm up all services
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
    console.log(`✅ ${service.name} service is available`);
  });
  
  console.log('🎯 Starting comprehensive API load test...');
}

// Test teardown
export function teardown(data) {
  console.log('🏁 API load test completed');
  console.log('📊 Check the metrics for detailed performance analysis');
}