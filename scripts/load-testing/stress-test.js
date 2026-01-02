import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Stress test - designed to push the system to its limits
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    // Immediate stress - no warm-up
    { duration: '2m', target: 100 },   // Quick ramp to 100 users
    { duration: '5m', target: 500 },   // Scale to 500 users
    { duration: '5m', target: 1000 },  // Push to 1000 users
    { duration: '3m', target: 2000 },  // Extreme load - 2000 users
    { duration: '5m', target: 1000 },  // Step back down
    { duration: '2m', target: 0 },     // Cool down
  ],
  
  thresholds: {
    errors: ['rate<0.1'],              // Allow higher error rate for stress test
    response_time: ['p(95)<5000'],     // Allow slower responses under stress
    http_req_failed: ['rate<0.15'],    // 15% failure acceptable during stress
  },
};

const BASE_URL = __ENV.SEARCH_SERVICE_URL || 'http://localhost:3000';

// Stress test queries - mix of simple and complex
const STRESS_QUERIES = [
  'Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Tesla',
  '2022', '2023', 'SUV', 'sedan', 'truck',
  'California', 'Texas', 'New York',
  '$30000', 'used', 'new', 'ACTIVE'
];

const USER_TYPES = ['SELLER', 'BUYER', 'CARRIER', 'AGENT'];

export default function() {
  const userType = USER_TYPES[Math.floor(Math.random() * USER_TYPES.length)];
  const accountId = `stress-account-${Math.floor(Math.random() * 1000)}`;
  const query = STRESS_QUERIES[Math.floor(Math.random() * STRESS_QUERIES.length)];
  
  const payload = {
    userType,
    accountId,
    searchText: query,
    page: 1,
    limit: 20
  };

  const response = http.post(
    `${BASE_URL}/search/${userType.toLowerCase()}`,
    JSON.stringify(payload),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '30s', // Longer timeout for stress conditions
      tags: { test_type: 'stress', user_type: userType }
    }
  );

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 10s': (r) => r.timings.duration < 10000,
  });

  errorRate.add(!success);
  responseTime.add(response.timings.duration);

  // Shorter sleep during stress test
  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds
}

export function handleSummary(data) {
  return {
    'stress-test-results.json': JSON.stringify(data, null, 2),
    'stress-test-summary.txt': `
STRESS TEST RESULTS
===================
Test Duration: ${(data.state.testRunDurationMs / 1000 / 60).toFixed(2)} minutes
Max VUs: ${data.metrics.vus?.values?.max || 'N/A'}
Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
Error Rate: ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%
Avg Response Time: ${(data.metrics.response_time?.values?.avg || 0).toFixed(2)}ms
95th Percentile: ${(data.metrics.response_time?.values['p(95)'] || 0).toFixed(2)}ms

System survived stress test: ${(data.metrics.errors?.values?.rate || 0) < 0.15 ? 'YES' : 'NO'}
    `
  };
}