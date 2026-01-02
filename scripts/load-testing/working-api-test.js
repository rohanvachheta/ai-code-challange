import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const apiErrorRate = new Rate('api_errors');
const offerResponseTime = new Trend('offer_response_time');
const searchResponseTime = new Trend('search_response_time');

// Test configuration for working API endpoints
export const options = {
  stages: [
    { duration: '30s', target: 5 },    // Ramp up to 5 users
    { duration: '1m', target: 10 },    // Ramp up to 10 users  
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should complete within 2s
    api_errors: ['rate<0.05'],         // Error rate should be less than 5%
    offer_response_time: ['p(90)<1000'], // 90% of offer API calls under 1s
    search_response_time: ['p(90)<1000'], // 90% of search API calls under 1s
  },
};

// Service URLs
const OFFER_SERVICE_URL = __ENV.OFFER_SERVICE_URL || 'http://localhost:3001';
const SEARCH_SERVICE_URL = __ENV.SEARCH_SERVICE_URL || 'http://localhost:3004';

console.log('🚀 Services Configuration:');
console.log(`📡 Offer Service: ${OFFER_SERVICE_URL}`);
console.log(`🔍 Search Service: ${SEARCH_SERVICE_URL}`);

// Indian automotive data
const searchTerms = [
  'maruti', 'swift', 'hyundai', 'creta', 'tata', 'nexon', 'toyota', 'innova',
  'honda', 'city', 'mahindra', 'xuv', 'kia', 'seltos', 'delhi', 'mumbai',
  'bangalore', 'pune', 'chennai', 'kolkata'
];

// Setup function
export function setup() {
  console.log('🔥 Starting Indian Automotive Market Load Test...');
  
  // Test offer service
  const offerTestResponse = http.get(`${OFFER_SERVICE_URL}/offers?limit=1`);
  if (offerTestResponse.status !== 200) {
    throw new Error(`Offer service not available: ${offerTestResponse.status}`);
  }
  console.log('✅ Offer service is available');
  
  // Test search service 
  const searchTestResponse = http.get(`${SEARCH_SERVICE_URL}/search/autocomplete?searchText=car&limit=1`);
  if (searchTestResponse.status !== 200) {
    console.log('⚠️  Search service autocomplete not available, proceeding with offers only');
  } else {
    console.log('✅ Search service is available');
  }
  
  console.log('🎯 Starting realistic Indian automotive load test...');
}

// Main test function
export default function () {
  // Test offer listing (primary endpoint being used)
  testOfferListing();
  
  // Test search autocomplete
  testSearchAutocomplete();
  
  // Brief pause between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function testOfferListing() {
  const params = {
    page: Math.floor(Math.random() * 5) + 1,      // Random page 1-5
    limit: Math.floor(Math.random() * 20) + 5,    // Random limit 5-25
  };
  
  const startTime = new Date();
  const response = http.get(`${OFFER_SERVICE_URL}/offers?page=${params.page}&limit=${params.limit}`);
  const responseTime = new Date() - startTime;
  
  offerResponseTime.add(responseTime);
  
  const success = check(response, {
    'offer listing status is 200': (r) => r.status === 200,
    'offer listing returns offers array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.offers && Array.isArray(body.offers);
      } catch (e) {
        return false;
      }
    },
    'offer listing has pagination info': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.total === 'number' && typeof body.pages === 'number';
      } catch (e) {
        return false;
      }
    },
    'offer listing response time < 1s': (r) => responseTime < 1000,
  });
  
  if (!success) {
    apiErrorRate.add(1);
  }
}

function testSearchAutocomplete() {
  const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  const limit = Math.floor(Math.random() * 10) + 5; // 5-15 suggestions
  
  const startTime = new Date();
  const response = http.get(`${SEARCH_SERVICE_URL}/search/autocomplete?searchText=${searchTerm}&limit=${limit}`);
  const responseTime = new Date() - startTime;
  
  searchResponseTime.add(responseTime);
  
  const success = check(response, {
    'search autocomplete status is 200': (r) => r.status === 200,
    'search autocomplete returns suggestions': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.suggestions && Array.isArray(body.suggestions);
      } catch (e) {
        return false;
      }
    },
    'search autocomplete response time < 500ms': (r) => responseTime < 500,
  });
  
  if (!success) {
    apiErrorRate.add(1);
  }
}

// Test statistics endpoint
export function testStatistics() {
  const offerStatsResponse = http.get(`${OFFER_SERVICE_URL}/offers/statistics`);
  check(offerStatsResponse, {
    'offer statistics status is 200': (r) => r.status === 200,
  });
  
  const searchStatsResponse = http.get(`${SEARCH_SERVICE_URL}/search/statistics`);
  check(searchStatsResponse, {
    'search statistics available': (r) => r.status === 200 || r.status === 404, // 404 is acceptable
  });
}

// Enhanced summary with Indian automotive context
export function handleSummary(data) {
  const results = [
    '🚗 Indian Automotive Marketplace Load Test Results',
    '='.repeat(60),
    '',
    '📊 Overall Performance:',
    `Total HTTP Requests: ${data.metrics.http_reqs.values.count}`,
    `Average Request Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`,
    `95th Percentile Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`,
    `Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s`,
    '',
    '🏪 Offer Service Performance:',
    `Offer API Average Response Time: ${data.metrics.offer_response_time ? data.metrics.offer_response_time.values.avg.toFixed(2) : 'N/A'}ms`,
    `Offer API 90th Percentile: ${data.metrics.offer_response_time ? data.metrics.offer_response_time.values['p(90)'].toFixed(2) : 'N/A'}ms`,
    '',
    '🔍 Search Service Performance:',
    `Search API Average Response Time: ${data.metrics.search_response_time ? data.metrics.search_response_time.values.avg.toFixed(2) : 'N/A'}ms`,
    `Search API 90th Percentile: ${data.metrics.search_response_time ? data.metrics.search_response_time.values['p(90)'].toFixed(2) : 'N/A'}ms`,
    '',
    '❌ Error Analysis:',
    `API Error Rate: ${data.metrics.api_errors ? (data.metrics.api_errors.values.rate * 100).toFixed(2) : 'N/A'}%`,
    `Failed Requests: ${data.metrics.http_req_failed ? data.metrics.http_req_failed.values.count : 'N/A'}`,
    `Success Rate: ${data.metrics.http_req_failed ? ((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2) : 'N/A'}%`,
    '',
    '🎯 Performance Thresholds:',
    `95% Response Time < 2s: ${data.metrics.http_req_duration.values['p(95)'] < 2000 ? 'PASSED' : 'FAILED'}`,
    `Error Rate < 5%: ${data.metrics.api_errors && data.metrics.api_errors.values.rate < 0.05 ? 'PASSED' : 'FAILED'}`,
    `Offer API 90% < 1s: ${data.metrics.offer_response_time && data.metrics.offer_response_time.values['p(90)'] < 1000 ? 'PASSED' : 'FAILED'}`,
    '',
    '🇮🇳 Test Context: Indian automotive marketplace with realistic traffic patterns',
    '📈 Data: Testing Maruti Suzuki, Hyundai, Tata, Toyota, and other popular Indian car brands',
    '='.repeat(80),
  ];
  
  return {
    'stdout': results.join('\n'),
  };
}

// Teardown
export function teardown(data) {
  console.log('🏁 Indian Automotive Load Test Completed');
  console.log('📊 Results show performance of offers and search services under realistic load');
  console.log('🚗 Test included typical Indian automotive marketplace queries and browsing patterns');
}