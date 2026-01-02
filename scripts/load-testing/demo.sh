#!/bin/bash

# Quick Load Testing Demo Script
# Demonstrates load testing capabilities without requiring full service stack

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m' 
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 LOAD TESTING DEMO${NC}"
echo -e "${BLUE}===================${NC}"
echo ""

# 1. Install dependencies if needed
echo -e "${BLUE}1. Installing Dependencies...${NC}"
npm install

# 2. Demo data generation (small scale)
echo -e "\n${BLUE}2. Demo Data Generation (100 records)...${NC}"
echo "Note: API errors are expected since services aren't running"
node massive-data-generator.js --records 100 --workers 2

# 3. Demo performance monitoring
echo -e "\n${BLUE}3. Demo Performance Monitoring (5 seconds)...${NC}"
timeout 5s ./monitor-performance.sh || true

# 4. Demo k6 installation check
echo -e "\n${BLUE}4. Checking k6 Installation...${NC}"
if command -v k6 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ k6 is installed${NC}"
    k6 version
else
    echo -e "${YELLOW}⚠️  k6 not found. Install with:${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  brew install k6"
    else
        echo "  sudo apt-get install k6  # or download from https://k6.io"
    fi
fi

# 5. Demo load test (if k6 available)
if command -v k6 >/dev/null 2>&1; then
    echo -e "\n${BLUE}5. Demo Load Test (10 seconds with 5 users)...${NC}"
    echo "Note: This will fail without running services, but shows k6 configuration"
    
    # Create a simple demo test
    cat > demo-test.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '10s',
};

export default function() {
  const response = http.get('http://localhost:3000/health');
  check(response, {
    'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  sleep(1);
}
EOF
    
    k6 run demo-test.js || echo -e "${YELLOW}Test completed (errors expected without services)${NC}"
    rm demo-test.js
fi

echo -e "\n${GREEN}✅ Load Testing Demo Complete!${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Start your services with: docker-compose up -d"
echo "2. Run full load test with: ./run-full-load-test.sh"
echo "3. Generate 10M records with: node massive-data-generator.js --records 10000000 --workers 8"
echo "4. Run stress test with: npm run stress-test"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "- Read README.md for complete guide"
echo "- Check scripts for individual testing components"
echo "- Monitor performance with ./monitor-performance.sh"