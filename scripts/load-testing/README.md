# Load Testing Suite for Indian Automotive Marketplace

A comprehensive load testing solution designed to test the Indian automotive marketplace platform at scale with realistic Indian automotive data patterns and concurrent user simulation.

## 🇮🇳 Indian Market Focus

This load testing suite is specifically designed for the Indian automotive marketplace with:

- **Indian Car Brands**: Maruti Suzuki, Hyundai, Tata, Mahindra, Toyota, Honda, etc.
- **Realistic Models**: Swift, Creta, Nexon, Innova, City, Baleno, i20, etc.
- **Indian Pricing**: INR-based pricing with realistic market values (2 lakh to 30+ lakh)
- **Indian Cities**: Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune, etc.
- **Local Features**: CNG cars, manual/automatic transmission preferences, Indian phone formats
- **Market Patterns**: Hatchback preference, diesel vs petrol, compact vs premium segments

## 🚀 Features

- **Massive Data Generation**: Create millions of realistic Indian automotive records
- **Concurrent Load Testing**: Simulate thousands of concurrent Indian users  
- **Performance Monitoring**: Real-time system and service monitoring
- **Cross-Entity Testing**: Test complex searches across offers, purchases, and transports
- **Realistic User Behavior**: Simulate actual Indian user search patterns and behaviors
- **Indian Context**: VIN generation, INR pricing, Indian cities, local car preferences
- **Comprehensive Reporting**: Detailed performance analysis and recommendations
- **Dynamic Configuration**: Configurable user counts and data generation volumes

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Docker** and Docker Compose
- **k6** (load testing tool) - will be auto-installed
- **bc** (calculator for shell scripts) - usually pre-installed
- **curl** - for API calls and health checks

### macOS Setup
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install k6
brew install k6
```

### Linux Setup
```bash
# Install k6
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 🏗️ Project Structure

```
scripts/load-testing/
├── package.json                    # Dependencies and scripts
├── massive-data-generator.js       # Multi-worker data generation
├── concurrent-search-test.js       # k6 concurrent testing
├── monitor-performance.sh          # System performance monitoring
├── run-full-load-test.sh          # Orchestration script
├── cleanup-test-data.js           # Data cleanup utility
└── README.md                      # This file
```

## 🎯 Quick Start

### 1. Full Load Test (Recommended)
```bash
# Run complete load test with 1M records
./run-full-load-test.sh

# Run with custom configuration
./run-full-load-test.sh --records 5000000 --workers 8

# Help and options
./run-full-load-test.sh --help
```

### 2. Individual Components

#### Generate Massive Test Data
```bash
# Generate 1 million records with 4 workers
node massive-data-generator.js --records 1000000 --workers 4

# Generate 10 million records with 8 workers (enterprise scale)
node massive-data-generator.js --records 10000000 --workers 8
```

#### Run Concurrent Load Tests
```bash
# Basic concurrent test
npm run concurrent-test

# Custom k6 configuration
k6 run --vus 500 --duration 30m concurrent-search-test.js
```

#### Monitor Performance
```bash
# Start monitoring (runs until Ctrl+C)
./monitor-performance.sh
```

#### Cleanup Test Data
```bash
# Preview what would be deleted
node cleanup-test-data.js --dry-run

# Actually delete all test data
node cleanup-test-data.js
```

## 📊 Load Test Scenarios

### Scenario 1: Gradual Ramp-Up
- 0 → 50 → 100 → 200 → 500 users
- Duration: 45 minutes
- **Purpose**: Find breaking point gradually

### Scenario 2: Sustained Load
- 150 constant users
- Duration: 30 minutes  
- **Purpose**: Test stability under normal load

### Scenario 3: Spike Testing
- 1,000 requests/second spike
- Duration: 5 minutes
- **Purpose**: Test system resilience to sudden traffic

### Scenario 4: Stress Testing
- Ramp up to 2,000 requests/second
- Duration: 30 minutes
- **Purpose**: Find absolute system limits

## 🎭 Realistic User Behaviors

The load tests simulate actual user behaviors:

### User Type Distribution
- **Buyers**: 50% (most common users)
- **Sellers**: 25% (active marketplace participants)
- **Agents**: 15% (customer support staff)
- **Carriers**: 10% (transport companies)

### Search Patterns
- **Basic Searches**: 40% (simple keyword searches)
- **Filtered Searches**: 25% (advanced filters)
- **Autocomplete**: 15% (as-you-type suggestions)
- **Cross-Entity**: 10% (complex agent searches)
- **Search Sessions**: 10% (multiple related searches)

### Realistic Query Types
- VIN lookups: `1HGBH41JXMN109186`
- Make/Model: `Toyota Camry`, `BMW 3 Series`
- Natural language: `reliable family car`, `fuel efficient sedan`
- Typos: `toyot`, `bmv`, `mercede` (tests fuzzy matching)
- Location: `California`, `Los Angeles`, `Texas`
- Price ranges: `$25,000`, `15000-30000`

## 📈 Performance Monitoring

The monitoring system tracks:

### System Resources
- **CPU Usage**: Real-time processor utilization
- **Memory Usage**: RAM consumption and availability
- **Disk Usage**: Storage utilization
- **Load Average**: System load indicators

### Elasticsearch Metrics
- **Cluster Health**: Green/Yellow/Red status
- **Document Count**: Total indexed documents
- **Index Size**: Storage consumption
- **Query Performance**: Average search times

### Service Health
- **Response Times**: API endpoint performance
- **Error Rates**: Failed request percentages
- **Availability**: Service uptime status
- **Connection Counts**: Active network connections

### Performance Alerts
- 🚨 CPU usage > 80%
- 🚨 Memory usage > 85%  
- 🚨 Disk usage > 90%
- 🚨 Search errors > 3%
- 🚨 Response time > 2000ms

## 🎯 Performance Thresholds

### Response Time Targets
- **95th percentile**: < 2 seconds
- **99th percentile**: < 5 seconds
- **Average search**: < 1 second

### Error Rate Targets
- **HTTP errors**: < 5%
- **Search errors**: < 3%
- **Service availability**: > 99%

### Throughput Targets
- **Concurrent users**: 500+
- **Requests/second**: 1000+
- **Search rate**: > 10 searches/second

## 🏭 Data Generation Details

### Realistic Automotive Data
- **Market-accurate distributions**: Toyota (14%), Honda (10%), Ford (13%)
- **Realistic pricing**: Based on make, model, year with depreciation
- **Geographic distribution**: Major US cities and states
- **Temporal patterns**: Recent years weighted higher
- **Cross-entity relationships**: Purchases linked to offers, transports to purchases

### Scale Capabilities
- **1M records**: ~5-10 minutes with 4 workers
- **10M records**: ~45-60 minutes with 8 workers
- **100M records**: ~8-12 hours with 16 workers (enterprise scale)

### Data Quality Features
- **No duplicates**: Unique VINs and IDs
- **Realistic relationships**: 60% offers, 25% purchases, 15% transports
- **Market patterns**: Seasonal trends, regional preferences
- **User behaviors**: Realistic seller/buyer/carrier distributions

## 📊 Results Analysis

### Generated Files
- `concurrent-test-results.json`: Raw k6 metrics
- `load-test-summary.json`: Processed summary data
- `load-test-report.txt`: Human-readable report
- `performance-monitor.log`: System monitoring log
- `load-test-summary.md`: Executive summary

### Key Metrics to Review
1. **Request Rate**: Requests processed per second
2. **Error Rates**: Failed requests by type
3. **Response Times**: P50, P95, P99 percentiles  
4. **Resource Usage**: CPU, memory, disk during peak load
5. **Search Performance**: Query times and success rates

### Optimization Recommendations
Based on results, the system will suggest:
- **Database optimizations**: Index improvements, query optimization
- **Caching strategies**: Redis implementation, CDN usage
- **Scaling strategies**: Horizontal vs vertical scaling
- **Service improvements**: Bottleneck identification

## 🔧 Configuration Options

### Environment Variables
```bash
export SEARCH_SERVICE_URL=http://localhost:3000
export ELASTICSEARCH_URL=http://localhost:9200
export TOTAL_RECORDS=1000000
export CONCURRENT_WORKERS=4
```

### CLI Options
```bash
# Data generation
node massive-data-generator.js --records 5000000 --workers 8 --batch 200

# Full test suite
./run-full-load-test.sh --records 10000000 --workers 8 --no-monitoring --cleanup

# Individual tests
k6 run --vus 1000 --duration 1h concurrent-search-test.js
```

## 🐛 Troubleshooting

### Common Issues

#### "k6 not found"
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6
```

#### "Services not responding"
```bash
# Check service status
docker-compose ps

# Restart services
docker-compose restart
```

#### "Elasticsearch connection refused"
```bash
# Check Elasticsearch status
curl http://localhost:9200/_cluster/health

# Restart Elasticsearch
docker-compose restart elasticsearch
```

#### "Out of memory during data generation"
```bash
# Reduce batch size and workers
node massive-data-generator.js --records 1000000 --workers 2 --batch 50

# Increase Docker memory limits
# Edit docker-compose.yml to add memory limits
```

### Performance Issues

#### High CPU Usage
- Reduce concurrent workers: `--workers 2`
- Increase batch processing delay
- Scale horizontally with more containers

#### High Memory Usage  
- Reduce batch sizes: `--batch 50`
- Enable garbage collection: `node --expose-gc script.js`
- Monitor container memory limits

#### Slow Elasticsearch
- Increase heap size in docker-compose.yml
- Add more Elasticsearch nodes
- Optimize index settings

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* node massive-data-generator.js

# Run with performance profiling
node --prof massive-data-generator.js
```

## 🔮 Advanced Features

### Custom Test Scenarios
Create custom k6 scenarios by modifying `concurrent-search-test.js`:

```javascript
export const options = {
  scenarios: {
    my_custom_scenario: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
    }
  }
};
```

### Integration with CI/CD
```yaml
# GitHub Actions example
- name: Run Load Tests
  run: |
    cd scripts/load-testing
    ./run-full-load-test.sh --records 100000 --no-monitoring
```

### Monitoring Integration
- **Grafana**: Import k6 metrics for visualization
- **Prometheus**: Export custom metrics
- **Slack**: Send alerts for threshold breaches

## 🤝 Contributing

1. **Add new test scenarios** in `concurrent-search-test.js`
2. **Improve data realism** in `massive-data-generator.js`  
3. **Enhance monitoring** in `monitor-performance.sh`
4. **Submit pull requests** with performance improvements

## 📄 License

MIT License - see LICENSE file for details.

---

## 📞 Support

For issues and questions:
1. Check troubleshooting section above
2. Review generated log files
3. Open GitHub issue with:
   - System specifications
   - Command used
   - Error logs
   - Performance metrics

**Happy Load Testing! 🚀**