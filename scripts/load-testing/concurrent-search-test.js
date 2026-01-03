import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for detailed monitoring
const searchErrorRate = new Rate('search_errors');
const searchDuration = new Trend('search_duration');
const searchCount = new Counter('search_requests');
const concurrentUsers = new Trend('concurrent_users');
const autocompleteRate = new Rate('autocomplete_success');
const crossEntitySearchRate = new Rate('cross_entity_success');

// Advanced load test configuration
export const options = {
  scenarios: {
    // Gradual ramp-up scenario
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 50 },   // Gradual ramp to 50 users
        { duration: '10m', target: 100 }, // Scale to 100 users
        { duration: '15m', target: 200 }, // Scale to 200 users
        { duration: '10m', target: 500 }, // Stress test with 500 users
        { duration: '5m', target: 200 },  // Scale back down
        { duration: '10m', target: 0 },   // Graceful shutdown
      ],
    },
    
    // Sustained load scenario
    sustained_load: {
      executor: 'constant-vus',
      vus: 150,
      duration: '30m',
      startTime: '45m', // Start after ramp-up completes
    },
    
    // Spike testing scenario
    spike_test: {
      executor: 'constant-arrival-rate',
      rate: 1000, // 1000 requests per second
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 200,
      maxVUs: 1000,
      startTime: '75m',
    },
    
    // Stress testing scenario
    stress_test: {
      executor: 'ramping-arrival-rate',
      startRate: 100,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 2000,
      stages: [
        { duration: '5m', target: 200 },  // 200 RPS
        { duration: '10m', target: 500 }, // 500 RPS
        { duration: '5m', target: 1000 }, // 1000 RPS (high stress)
        { duration: '5m', target: 2000 }, // 2000 RPS (extreme stress)
        { duration: '5m', target: 500 },  // Recovery
        { duration: '5m', target: 100 },  // Normal load
      ],
      startTime: '85m',
    }
  },
  
  // Performance thresholds
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    'http_req_failed': ['rate<0.05'], // Error rate under 5%
    'search_errors': ['rate<0.03'],   // Search errors under 3%
    'search_duration': ['p(95)<1000', 'p(99)<2000'], // Search performance
    'search_requests': ['rate>10'],   // Minimum throughput
  }
};

// Configuration
const BASE_URL = __ENV.SEARCH_SERVICE_URL || 'http://localhost:3000';

// Realistic search query patterns based on automotive marketplace usage
const REALISTIC_QUERIES = [
  // VIN searches (high precision)
  '1HGBH41JXMN109186', 'WBA3B1C50DF123456', '5NPE34AF4HH123456', 
  '2HGFC2F59JH123456', '1FTFW1ET8DFC123456', '5YFBU4EE8EP123456',
  
  // Popular make/model combinations
  'Toyota Camry', 'Honda Accord', 'Ford F-150', 'BMW 3 Series',
  'Mercedes C-Class', 'Tesla Model 3', 'Chevrolet Silverado',
  'Nissan Altima', 'Hyundai Elantra', 'Kia Optima', 'Audi A4',
  
  // Year-specific searches
  '2023', '2022', '2021', '2020', '2019', '2018', '2024',
  
  // Location-based searches
  'California', 'Texas', 'New York', 'Florida', 'Illinois',
  'Los Angeles', 'Houston', 'Chicago', 'Phoenix', 'San Diego',
  'Miami', 'Dallas', 'Atlanta', 'Seattle', 'Denver',
  
  // Vehicle type searches
  'sedan', 'SUV', 'truck', 'pickup', 'coupe', 'convertible',
  'hatchback', 'wagon', 'crossover', 'minivan', 'sports car',
  
  // Price range searches
  '$20000', '$30000', '$25,000', '15000-25000', 'under 30000',
  
  // Condition searches
  'new', 'used', 'certified', 'pre-owned',
  
  // Mixed natural language queries
  'reliable family car', 'fuel efficient sedan', 'luxury SUV',
  'pickup truck Texas', 'BMW California', '2022 Toyota reliable',
  'sports car red', 'truck for work', 'electric vehicle',
  'hybrid sedan', 'all wheel drive SUV', 'manual transmission',
  
  // Phone number searches (for agents/carriers)
  '(555) 123-4567', '555-987-6543', '+1-555-246-8135',
  '1-800-555-0123', '(214) 555-7890', '(310) 555-4321',
  
  // Partial/typo searches (realistic user behavior)
  'toyot', 'hond', 'frd', 'bmv', 'mercede', 'tesle', 'chevrolet',
  'camy', 'accrd', 'silvrdo', 'pckup', 'convertble',
  
  // Status searches
  'ACTIVE', 'SOLD', 'PENDING', 'available', 'for sale',
  
  // Feature-based searches
  'leather seats', 'sunroof', 'navigation', 'backup camera',
  'heated seats', 'bluetooth', 'cruise control', 'all wheel drive'
];

// User types with realistic distribution
const USER_TYPES = ['SELLER', 'BUYER', 'CARRIER', 'AGENT'];
const USER_TYPE_WEIGHTS = {
  'BUYER': 0.5,    // 50% - most common
  'SELLER': 0.25,  // 25% - active sellers
  'AGENT': 0.15,   // 15% - support staff
  'CARRIER': 0.1   // 10% - transport companies
};

// Account IDs for realistic user distribution
const ACCOUNT_IDS = Array.from({length: 500}, (_, i) => `account-${i + 1}`);

export default function() {
  // Track concurrent users
  concurrentUsers.add(__VU);
  
  // Select realistic user type based on weights
  const userType = selectWeightedUserType();
  const accountId = ACCOUNT_IDS[Math.floor(Math.random() * ACCOUNT_IDS.length)];
  
  // Perform different types of searches based on realistic user behavior
  const searchBehavior = Math.random();
  
  if (searchBehavior < 0.4) {
    // 40% - Basic keyword searches
    performBasicSearch(userType, accountId);
  } else if (searchBehavior < 0.65) {
    // 25% - Filtered/advanced searches
    performFilteredSearch(userType, accountId);
  } else if (searchBehavior < 0.8) {
    // 15% - Autocomplete searches
    performAutocompleteSearch();
  } else if (searchBehavior < 0.9) {
    // 10% - Cross-entity searches (mainly agents)
    performCrossEntitySearch(userType, accountId);
  } else {
    // 10% - Multi-step search sessions
    performSearchSession(userType, accountId);
  }
  
  // Realistic user pause between actions
  sleep(Math.random() * 4 + 1); // 1-5 second pause
}

function selectWeightedUserType() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const [userType, weight] of Object.entries(USER_TYPE_WEIGHTS)) {
    cumulative += weight;
    if (random <= cumulative) {
      return userType;
    }
  }
  return 'BUYER'; // fallback
}

function performBasicSearch(userType, accountId) {
  const query = REALISTIC_QUERIES[Math.floor(Math.random() * REALISTIC_QUERIES.length)];
  
  const searchPayload = {
    userType,
    accountId,
    searchText: query,
    page: Math.random() < 0.8 ? 1 : Math.floor(Math.random() * 5) + 1, // 80% search first page
    limit: getRealisticPageSize()
  };

  const startTime = Date.now();
  const response = http.post(`${BASE_URL}/search/${userType.toLowerCase()}`, JSON.stringify(searchPayload), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '15s',
    tags: { search_type: 'basic', user_type: userType }
  });
  
  const duration = Date.now() - startTime;
  searchDuration.add(duration);
  searchCount.add(1);

  const success = check(response, {
    'basic search status 200': (r) => r.status === 200,
    'basic search has results structure': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('results') && body.hasOwnProperty('total');
      } catch {
        return false;
      }
    },
    'basic search response time acceptable': (r) => r.timings.duration < 3000,
  });

  searchErrorRate.add(!success);

  // Simulate realistic user interaction with results
  if (success && Math.random() < 0.3) {
    try {
      const results = JSON.parse(response.body);
      if (results.results && results.results.length > 0) {
        sleep(Math.random() * 2 + 0.5); // User reads results
        
        // User clicks on a result (simulate detail view)
        const randomResult = results.results[Math.floor(Math.random() * Math.min(3, results.results.length))];
        simulateDetailView(randomResult, userType);
      }
    } catch (e) {
      // Handle parsing errors gracefully
    }
  }
}

function performFilteredSearch(userType, accountId) {
  const baseQuery = REALISTIC_QUERIES[Math.floor(Math.random() * REALISTIC_QUERIES.length)];
  const filters = generateRealisticFilters(userType);
  
  const searchPayload = {
    userType,
    accountId,
    searchText: baseQuery,
    ...filters,
    page: 1,
    limit: getRealisticPageSize()
  };

  const response = http.post(`${BASE_URL}/search/${userType.toLowerCase()}`, JSON.stringify(searchPayload), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '20s', // Filtered searches may take longer
    tags: { search_type: 'filtered', user_type: userType }
  });

  const success = check(response, {
    'filtered search status 200': (r) => r.status === 200,
    'filtered search returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('results');
      } catch {
        return false;
      }
    }
  });

  searchCount.add(1);
  searchErrorRate.add(!success);
}

function performAutocompleteSearch() {
  // Simulate autocomplete as user types
  const fullQuery = REALISTIC_QUERIES[Math.floor(Math.random() * REALISTIC_QUERIES.length)];
  const partialQueries = [];
  
  // Generate realistic typing pattern
  for (let i = 1; i <= fullQuery.length; i++) {
    partialQueries.push(fullQuery.substring(0, i));
    if (i >= 3 && Math.random() < 0.3) break; // User stops typing sometimes
  }
  
  partialQueries.forEach((partialQuery, index) => {
    if (partialQuery.length >= 2) { // Only autocomplete after 2 characters
      const autocompleteResponse = http.get(`${BASE_URL}/autocomplete?query=${encodeURIComponent(partialQuery)}`, {
        timeout: '5s',
        tags: { search_type: 'autocomplete' }
      });
      
      const autocompleteSuccess = check(autocompleteResponse, {
        'autocomplete responds quickly': (r) => r.timings.duration < 500,
        'autocomplete status 200': (r) => r.status === 200
      });
      
      autocompleteRate.add(autocompleteSuccess);
      
      // Realistic typing delay
      sleep(0.1 + Math.random() * 0.2);
    }
  });
}

function performCrossEntitySearch(userType, accountId) {
  if (userType !== 'AGENT') {
    // Non-agents have limited cross-entity capabilities
    performBasicSearch(userType, accountId);
    return;
  }
  
  const queries = [
    // Agent searching across entities
    'transport status', 'purchase history', 'offer details',
    'carrier assignments', 'delivery schedule', 'payment status'
  ];
  
  const query = queries[Math.floor(Math.random() * queries.length)];
  
  const crossEntityPayload = {
    userType,
    accountId,
    searchText: query,
    entityTypes: ['offer', 'purchase', 'transport'], // Agent can search all
    page: 1,
    limit: 20
  };

  const response = http.post(`${BASE_URL}/search/agent`, JSON.stringify(crossEntityPayload), {
    headers: { 'Content-Type': 'application/json' },
    timeout: '25s', // Cross-entity searches are more complex
    tags: { search_type: 'cross_entity', user_type: 'AGENT' }
  });

  const success = check(response, {
    'cross-entity search works': (r) => r.status === 200,
    'cross-entity returns mixed results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.results);
      } catch {
        return false;
      }
    }
  });

  crossEntitySearchRate.add(success);
  searchCount.add(1);
  searchErrorRate.add(!success);
}

function performSearchSession(userType, accountId) {
  // Simulate realistic user search session (multiple related searches)
  const sessionQueries = generateRelatedSearches();
  
  sessionQueries.forEach((query, index) => {
    const searchPayload = {
      userType,
      accountId,
      searchText: query,
      page: 1,
      limit: getRealisticPageSize()
    };

    const response = http.post(`${BASE_URL}/search/${userType.toLowerCase()}`, JSON.stringify(searchPayload), {
      headers: { 'Content-Type': 'application/json' },
      timeout: '15s',
      tags: { search_type: 'session', user_type: userType, session_step: index + 1 }
    });

    searchCount.add(1);
    
    const success = check(response, {
      [`session search ${index + 1} successful`]: (r) => r.status === 200
    });
    
    searchErrorRate.add(!success);
    
    // Realistic pause between searches in session
    if (index < sessionQueries.length - 1) {
      sleep(Math.random() * 3 + 2); // 2-5 seconds between searches
    }
  });
}

function generateRelatedSearches() {
  const searchPatterns = [
    ['Toyota', 'Toyota Camry', '2022 Toyota Camry'],
    ['BMW', 'BMW 3 Series', 'BMW California'],
    ['truck', 'pickup truck', 'Ford F-150'],
    ['sedan', 'family sedan', 'reliable sedan'],
    ['SUV', 'luxury SUV', 'BMW X5']
  ];
  
  return searchPatterns[Math.floor(Math.random() * searchPatterns.length)];
}

function generateRealisticFilters(userType) {
  const filters = {};
  
  // Year filters (common)
  if (Math.random() < 0.4) {
    const currentYear = new Date().getFullYear();
    filters.minYear = currentYear - Math.floor(Math.random() * 8) - 2;
    filters.maxYear = currentYear - Math.floor(Math.random() * 2);
  }
  
  // Price filters (very common)
  if (Math.random() < 0.5) {
    const budgets = [
      { min: 15000, max: 25000 },
      { min: 20000, max: 35000 },
      { min: 30000, max: 50000 },
      { min: 10000, max: 20000 },
      { min: 50000, max: 100000 }
    ];
    const budget = budgets[Math.floor(Math.random() * budgets.length)];
    filters.minPrice = budget.min;
    filters.maxPrice = budget.max;
  }
  
  // Make filter (less common but specific)
  if (Math.random() < 0.2) {
    const makes = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes-Benz', 'Chevrolet', 'Nissan'];
    filters.make = makes[Math.floor(Math.random() * makes.length)];
  }
  
  // Location filter (regional searches)
  if (Math.random() < 0.15) {
    const locations = ['California', 'Texas', 'New York', 'Florida', 'Illinois'];
    filters.location = locations[Math.floor(Math.random() * locations.length)];
  }
  
  // Condition filter
  if (Math.random() < 0.25) {
    const conditions = ['NEW', 'USED', 'CERTIFIED_PRE_OWNED'];
    filters.condition = conditions[Math.floor(Math.random() * conditions.length)];
  }
  
  return filters;
}

function getRealisticPageSize() {
  // Realistic page size distribution
  const pageSizes = [
    { size: 10, weight: 0.1 },
    { size: 20, weight: 0.6 }, // Most common
    { size: 50, weight: 0.25 },
    { size: 100, weight: 0.05 }
  ];
  
  const random = Math.random();
  let cumulative = 0;
  
  for (const { size, weight } of pageSizes) {
    cumulative += weight;
    if (random <= cumulative) return size;
  }
  
  return 20; // fallback
}

function simulateDetailView(result, userType) {
  // Simulate clicking on search result for details
  if (result && result.entityId) {
    const detailUrl = `${BASE_URL}/${result.entityType}/${result.entityId}`;
    
    const detailResponse = http.get(detailUrl, {
      timeout: '10s',
      tags: { action: 'detail_view', user_type: userType }
    });
    
    check(detailResponse, {
      'detail view loads successfully': (r) => r.status === 200 || r.status === 404 // 404 acceptable for test data
    });
  }
}

// Custom summary function for detailed reporting
export function handleSummary(data) {
  const summary = {
    testDuration: data.state.testRunDurationMs,
    totalRequests: data.metrics.search_requests?.values?.count || 0,
    errorRate: (data.metrics.search_errors?.values?.rate || 0) * 100,
    averageResponseTime: data.metrics.search_duration?.values?.avg,
    p95ResponseTime: data.metrics.search_duration?.values['p(95)'],
    p99ResponseTime: data.metrics.search_duration?.values['p(99)'],
    maxConcurrentUsers: data.metrics.concurrent_users?.values?.max,
    requestsPerSecond: (data.metrics.search_requests?.values?.count || 0) / (data.state.testRunDurationMs / 1000),
    thresholdResults: data.thresholds
  };
  
  return {
    'concurrent-load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.json': JSON.stringify(summary, null, 2),
    'load-test-report.txt': generateTextReport(summary, data)
  };
}

function generateTextReport(summary, fullData) {
  return `
========================================
CONCURRENT LOAD TEST RESULTS
========================================
Test Duration: ${(summary.testDuration / 1000 / 60).toFixed(2)} minutes
Total Requests: ${summary.totalRequests.toLocaleString()}
Requests/Second: ${summary.requestsPerSecond.toFixed(2)}

PERFORMANCE METRICS:
- Error Rate: ${summary.errorRate.toFixed(2)}%
- Average Response Time: ${summary.averageResponseTime?.toFixed(2)}ms
- 95th Percentile: ${summary.p95ResponseTime?.toFixed(2)}ms
- 99th Percentile: ${summary.p99ResponseTime?.toFixed(2)}ms
- Max Concurrent Users: ${summary.maxConcurrentUsers}

THRESHOLD RESULTS:
${Object.entries(summary.thresholdResults || {}).map(([key, result]) => 
  `- ${key}: ${result.ok ? '✅ PASS' : '❌ FAIL'} (${result.ok ? 'Met' : 'Failed'} criteria)`
).join('\n')}

DETAILED BREAKDOWN:
${Object.entries(fullData.metrics)
  .filter(([key]) => key.includes('search') || key.includes('http'))
  .map(([key, metric]) => 
    `- ${key}: ${JSON.stringify(metric.values, null, 2)}`
  ).join('\n')}
========================================
  `;
}