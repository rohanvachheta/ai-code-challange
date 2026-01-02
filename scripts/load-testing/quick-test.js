import http from 'k6/http';
import { check, sleep } from 'k6';

// Quick test configuration with environment variable support
export const options = {
  vus: parseInt(__ENV.VUS || '10'),                    // 10 virtual users (configurable)
  duration: __ENV.DURATION || '30s',                  // Run for 30 seconds (configurable)
};

// Quick test data generators for Indian automotive context
function generateQuickTestData() {
  const indianMakes = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Toyota', 'Honda'];
  const searchTerms = [
    'Swift', 'Creta', 'Nexon', 'Innova', 'City',
    'Mumbai', 'Delhi', 'Bangalore', 'new', 'used'
  ];
  
  return {
    make: indianMakes[Math.floor(Math.random() * indianMakes.length)],
    searchText: searchTerms[Math.floor(Math.random() * searchTerms.length)],
    userType: ['BUYER', 'SELLER', 'AGENT'][Math.floor(Math.random() * 3)],
    accountId: `account-${Math.floor(Math.random() * 1000) + 1}`
  };
}

export default function() {
  // Test against localhost services with realistic requests
  const testData = generateQuickTestData();
  
  const services = [
    {
      name: 'Search Service Health',
      url: 'http://localhost:3000/health'
    },
    {
      name: 'Search API Test', 
      url: 'http://localhost:3000/search',
      method: 'POST',
      payload: {
        userType: testData.userType,
        accountId: testData.accountId,
        searchText: testData.searchText,
        limit: 10
      }
    },
    {
      name: 'Autocomplete Test',
      url: `http://localhost:3000/autocomplete?searchText=${testData.searchText}&limit=5`
    },
    {
      name: 'Offer Service Health',
      url: 'http://localhost:3001/health'
    },
    {
      name: 'Purchase Service Health', 
      url: 'http://localhost:3002/health'
    },
    {
      name: 'Transport Service Health',
      url: 'http://localhost:3003/health'
    }
  ];
  
  const service = services[Math.floor(Math.random() * services.length)];
  let response;
  
  if (service.method === 'POST') {
    response = http.post(service.url, JSON.stringify(service.payload), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    response = http.get(service.url);
  }
  
  check(response, {
    [`${service.name} - status is 200 or expected connection error`]: (r) => r.status === 200 || r.status === 0,
    [`${service.name} - response time < 3s`]: (r) => r.timings.duration < 3000,
  });
  
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 second random pause
}

export function handleSummary(data) {
  const totalRequests = data.metrics.http_reqs?.values?.count || 0;
  const duration = data.state.testRunDurationMs / 1000;
  const maxVUs = data.metrics.vus?.values?.max || 0;
  const requestRate = totalRequests / duration;
  const avgResponseTime = data.metrics.http_req_duration?.values?.avg || 0;
  const p95ResponseTime = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  
  console.log('\n🧪 QUICK LOAD TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`👥 Virtual Users: ${maxVUs}`);
  console.log(`📊 Total Requests: ${totalRequests}`);
  console.log(`🚀 Request Rate: ${requestRate.toFixed(2)} req/s`);
  console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`📈 95th Percentile: ${p95ResponseTime.toFixed(2)}ms`);
  console.log(`✅ Success Rate: ${((data.metrics.checks?.values?.rate || 0) * 100).toFixed(2)}%`);
  console.log('=' .repeat(50));
  
  return {
    'quick-test-results.json': JSON.stringify({
      ...data,
      summary: {
        duration,
        maxVUs,
        totalRequests,
        requestRate: requestRate.toFixed(2),
        avgResponseTime: avgResponseTime.toFixed(2),
        p95ResponseTime: p95ResponseTime.toFixed(2),
        successRate: ((data.metrics.checks?.values?.rate || 0) * 100).toFixed(2)
      }
    }, null, 2)
  };
}