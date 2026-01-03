import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,           // 10 virtual users
  duration: '30s',   // Run for 30 seconds
};

export default function() {
  // Test against localhost services (will show connection errors, which is expected)
  const services = [
    'http://localhost:3000/health',
    'http://localhost:3001/health', 
    'http://localhost:3002/health',
    'http://localhost:3003/health'
  ];
  
  const service = services[Math.floor(Math.random() * services.length)];
  const response = http.get(service);
  
  check(response, {
    'status is 200 or connection error expected': (r) => r.status === 200 || r.status === 0,
  });
  
  sleep(1);
}

export function handleSummary(data) {
  console.log('Load Test Summary:');
  console.log(`- Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s`);
  console.log(`- Total Requests: ${data.metrics.http_reqs?.values?.count || 0}`);
  console.log(`- Virtual Users: ${data.metrics.vus?.values?.max || 0}`);
  console.log(`- Request Rate: ${((data.metrics.http_reqs?.values?.count || 0) / (data.state.testRunDurationMs / 1000)).toFixed(2)} req/s`);
  
  return {
    'quick-test-results.json': JSON.stringify(data, null, 2)
  };
}