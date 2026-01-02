import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const searchErrorRate = new Rate('search_errors');
const searchResponseTime = new Trend('search_response_time');
const autocompleteResponseTime = new Trend('autocomplete_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '3m', target: 0 },    // Ramp down to 0 users over 3 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should complete within 2s
    search_errors: ['rate<0.05'],      // Error rate should be less than 5%
    search_response_time: ['p(95)<1500'], // 95% of search requests under 1.5s
  },
};

// Configuration
const BASE_URL = __ENV.SEARCH_SERVICE_URL || 'http://localhost:3000';

// Sample search queries for realistic load testing
const searchQueries = [
  'Toyota Camry',
  'Honda Civic',
  'Ford F-150',
  'BMW 3 Series',
  'Mercedes C-Class',
  'Chevrolet Silverado',
  '2020 Tesla Model 3',
  'Truck',
  'SUV',
  'Sedan',
  'New York',
  'California',
  'Texas',
  'ACTIVE',
  'SOLD',
  'VIN',
  'Red Toyota',
  'Blue Honda',
  'Black BMW',
  'Used Cars',
  'New Vehicles',
  'Financing',
  'Transport',
  'Delivery',
  'Pickup',
];

// User types for role-based testing
const userTypes = ['SELLER', 'BUYER', 'CARRIER', 'AGENT'];

// Generate random UUIDs for account IDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Get random search parameters
function getRandomSearchParams() {
  return {
    userType: userTypes[Math.floor(Math.random() * userTypes.length)],
    accountId: generateUUID(),
    searchText: searchQueries[Math.floor(Math.random() * searchQueries.length)],
    page: Math.floor(Math.random() * 5) + 1, // Pages 1-5
    limit: [10, 20, 50][Math.floor(Math.random() * 3)],
  };
}

export default function() {
  const testCases = [
    testBasicSearch,
    testAdvancedSearch,
    testAutocomplete,
    testPagination,
    testRoleBasedSearch,
    testStatistics,
  ];
  
  // Run a random test case
  const testCase = testCases[Math.floor(Math.random() * testCases.length)];
  testCase();
  
  sleep(Math.random() * 3 + 1); // Random sleep between 1-4 seconds
}

function testBasicSearch() {
  const params = getRandomSearchParams();
  
  const payload = JSON.stringify(params);
  const headers = { 'Content-Type': 'application/json' };
  
  const startTime = new Date();
  const response = http.post(`${BASE_URL}/search`, payload, { headers });
  const endTime = new Date();
  
  const responseTime = endTime - startTime;
  searchResponseTime.add(responseTime);
  
  const success = check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('results') && body.hasOwnProperty('total');
      } catch {
        return false;
      }
    },
    'search response time < 2s': () => responseTime < 2000,
  });
  
  searchErrorRate.add(!success);
}

function testAdvancedSearch() {
  const params = getRandomSearchParams();
  
  // Add advanced filters
  params.entityTypes = ['offer', 'purchase'][Math.floor(Math.random() * 2)] ? ['offer'] : ['purchase', 'transport'];
  params.minYear = 2015 + Math.floor(Math.random() * 8);
  params.maxPrice = 50000 + Math.floor(Math.random() * 50000);
  params.status = ['ACTIVE', 'SOLD', 'COMPLETED'][Math.floor(Math.random() * 3)];
  
  const payload = JSON.stringify(params);
  const headers = { 'Content-Type': 'application/json' };
  
  const startTime = new Date();
  const response = http.post(`${BASE_URL}/search`, payload, { headers });
  const endTime = new Date();
  
  const responseTime = endTime - startTime;
  searchResponseTime.add(responseTime);
  
  const success = check(response, {
    'advanced search status is 200': (r) => r.status === 200,
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

function testAutocomplete() {
  const searchText = searchQueries[Math.floor(Math.random() * searchQueries.length)].substring(0, 3);
  
  const startTime = new Date();
  const response = http.get(`${BASE_URL}/search/autocomplete?searchText=${encodeURIComponent(searchText)}&limit=10`);
  const endTime = new Date();
  
  const responseTime = endTime - startTime;
  autocompleteResponseTime.add(responseTime);
  
  check(response, {
    'autocomplete status is 200': (r) => r.status === 200,
    'autocomplete has suggestions': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('suggestions') && Array.isArray(body.suggestions);
      } catch {
        return false;
      }
    },
    'autocomplete response time < 500ms': () => responseTime < 500,
  });
}

function testPagination() {
  const params = getRandomSearchParams();
  params.page = Math.floor(Math.random() * 10) + 1; // Pages 1-10
  params.limit = 20;
  
  const payload = JSON.stringify(params);
  const headers = { 'Content-Type': 'application/json' };
  
  const response = http.post(`${BASE_URL}/search`, payload, { headers });
  
  check(response, {
    'pagination status is 200': (r) => r.status === 200,
    'pagination has correct structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.page === params.page && body.limit === params.limit && 
               typeof body.pages === 'number' && typeof body.total === 'number';
      } catch {
        return false;
      }
    },
  });
}

function testRoleBasedSearch() {
  const userType = userTypes[Math.floor(Math.random() * userTypes.length)];
  const accountId = generateUUID();
  const searchText = searchQueries[Math.floor(Math.random() * searchQueries.length)];
  
  const endpoint = `/search/${userType.toLowerCase()}`;
  const payload = JSON.stringify({
    accountId,
    searchText,
    page: 1,
    limit: 20,
  });
  const headers = { 'Content-Type': 'application/json' };
  
  const response = http.post(`${BASE_URL}${endpoint}`, payload, { headers });
  
  check(response, {
    'role-based search status is 200': (r) => r.status === 200,
    'role-based search returns results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('results');
      } catch {
        return false;
      }
    },
  });
}

function testStatistics() {
  const response = http.get(`${BASE_URL}/search/statistics`);
  
  check(response, {
    'statistics status is 200': (r) => r.status === 200,
    'statistics has total count': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.total === 'number';
      } catch {
        return false;
      }
    },
  });
}

// Test setup
export function setup() {
  console.log('🚀 Starting Search Service Load Test');
  console.log(`📡 Target URL: ${BASE_URL}`);
  
  // Warm up the service
  const warmupResponse = http.get(`${BASE_URL}/search/statistics`);
  if (warmupResponse.status !== 200) {
    throw new Error(`Service not available: ${warmupResponse.status}`);
  }
  
  console.log('✅ Service is available, starting test...');
}

// Test teardown
export function teardown(data) {
  console.log('🏁 Load test completed');
}