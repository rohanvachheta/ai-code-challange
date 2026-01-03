#!/bin/bash

# Comprehensive Load Testing Script for Automotive Marketplace
# Orchestrates data generation, performance monitoring, and concurrent testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Default configuration
TOTAL_RECORDS=1000000
CONCURRENT_WORKERS=4
GENERATE_DATA=true
RUN_MONITORING=true
RUN_LOAD_TEST=true
CLEANUP_AFTER=false
ELASTICSEARCH_URL="http://localhost:9200"
RESULTS_DIR="load-test-results-$(date +%Y%m%d-%H%M%S)"

# Function to display usage
usage() {
    echo -e "${BOLD}Automotive Marketplace Load Testing Suite${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --records NUM        Number of records to generate (default: 1,000,000)"
    echo "  --workers NUM        Number of concurrent workers (default: 4)"
    echo "  --no-data           Skip data generation phase"
    echo "  --no-monitoring     Skip performance monitoring"
    echo "  --no-load-test      Skip load testing phase"
    echo "  --cleanup           Clean up test data after completion"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run with defaults"
    echo "  $0 --records 10000000 --workers 8    # 10M records with 8 workers"
    echo "  $0 --no-data --no-monitoring         # Only run load tests"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --records)
            TOTAL_RECORDS="$2"
            shift 2
            ;;
        --workers)
            CONCURRENT_WORKERS="$2"
            shift 2
            ;;
        --no-data)
            GENERATE_DATA=false
            shift
            ;;
        --no-monitoring)
            RUN_MONITORING=false
            shift
            ;;
        --no-load-test)
            RUN_LOAD_TEST=false
            shift
            ;;
        --cleanup)
            CLEANUP_AFTER=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            usage
            exit 1
            ;;
    esac
done

# Function to log with timestamp and color
log() {
    echo -e "[$(date '+%H:%M:%S')] ${1}"
}

log_info() {
    log "${BLUE}ℹ️  ${1}${NC}"
}

log_success() {
    log "${GREEN}✅ ${1}${NC}"
}

log_warning() {
    log "${YELLOW}⚠️  ${1}${NC}"
}

log_error() {
    log "${RED}❌ ${1}${NC}"
}

log_section() {
    echo ""
    echo -e "${CYAN}${BOLD}=================================================${NC}"
    echo -e "${CYAN}${BOLD} ${1}${NC}"
    echo -e "${CYAN}${BOLD}=================================================${NC}"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    log_section "🔍 CHECKING PREREQUISITES"
    
    local missing_deps=false
    
    # Check for required commands
    local required_commands=("node" "npm" "docker" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_error "Missing required command: $cmd"
            missing_deps=true
        else
            log_success "Found: $cmd"
        fi
    done
    
    # Check for k6 (install if missing)
    if ! command -v k6 >/dev/null 2>&1; then
        log_warning "k6 not found, attempting to install..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew >/dev/null 2>&1; then
                brew install k6
            else
                log_error "Please install k6 manually or install Homebrew"
                missing_deps=true
            fi
        else
            # Linux
            curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz --strip-components 1
            sudo mv k6 /usr/local/bin/
        fi
    else
        log_success "Found: k6"
    fi
    
    # Check if services are running
    local services=("localhost:3001" "localhost:3002" "localhost:3003" "localhost:3000")
    local service_names=("offer-service" "purchase-service" "transport-service" "search-service")
    
    log_info "Checking service availability..."
    for i in "${!services[@]}"; do
        if curl -s -f -m 5 "http://${services[$i]}/health" >/dev/null 2>&1; then
            log_success "${service_names[$i]} is running"
        else
            log_warning "${service_names[$i]} is not responding"
        fi
    done
    
    # Check Elasticsearch
    if curl -s -f "$ELASTICSEARCH_URL/_cluster/health" >/dev/null 2>&1; then
        log_success "Elasticsearch is running"
    else
        log_error "Elasticsearch is not accessible at $ELASTICSEARCH_URL"
        missing_deps=true
    fi
    
    if [[ "$missing_deps" == true ]]; then
        log_error "Prerequisites check failed. Please resolve the issues above."
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Function to install dependencies
install_dependencies() {
    log_section "📦 INSTALLING DEPENDENCIES"
    
    if [[ -f "package.json" ]]; then
        log_info "Installing npm dependencies..."
        npm install
        log_success "Dependencies installed"
    else
        log_error "package.json not found in current directory"
        exit 1
    fi
}

# Function to generate test data
generate_test_data() {
    if [[ "$GENERATE_DATA" == false ]]; then
        log_warning "Skipping data generation as requested"
        return
    fi
    
    log_section "🏭 GENERATING TEST DATA"
    
    log_info "Generating ${TOTAL_RECORDS} records with ${CONCURRENT_WORKERS} workers..."
    log_info "This may take a while depending on your system and network..."
    
    # Record start time
    local start_time=$(date +%s)
    
    # Run data generator
    if node massive-data-generator.js --records "$TOTAL_RECORDS" --workers "$CONCURRENT_WORKERS"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local rate=$((TOTAL_RECORDS / duration))
        
        log_success "Data generation completed!"
        log_info "Duration: ${duration}s"
        log_info "Rate: ${rate} records/second"
        
        # Wait for Elasticsearch to index the data
        log_info "Waiting for Elasticsearch indexing to complete..."
        sleep 60
        
        # Check index status
        local doc_count=$(curl -s "$ELASTICSEARCH_URL/global_search/_count" | grep -o '"count":[0-9]*' | cut -d':' -f2 || echo "0")
        log_info "Documents in search index: ${doc_count}"
        
    else
        log_error "Data generation failed"
        exit 1
    fi
}

# Function to start performance monitoring
start_monitoring() {
    if [[ "$RUN_MONITORING" == false ]]; then
        log_warning "Skipping performance monitoring as requested"
        return
    fi
    
    log_section "📊 STARTING PERFORMANCE MONITORING"
    
    # Make monitoring script executable
    chmod +x monitor-performance.sh
    
    # Start monitoring in background
    log_info "Starting performance monitoring..."
    ./monitor-performance.sh > "performance-monitor.log" 2>&1 &
    MONITOR_PID=$!
    
    log_success "Performance monitoring started (PID: $MONITOR_PID)"
    
    # Give monitoring a moment to initialize
    sleep 5
}

# Function to run load tests
run_load_tests() {
    if [[ "$RUN_LOAD_TEST" == false ]]; then
        log_warning "Skipping load testing as requested"
        return
    fi
    
    log_section "🚀 RUNNING LOAD TESTS"
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"
    
    log_info "Running concurrent search load test..."
    local start_time=$(date +%s)
    
    # Set environment variables for k6
    export SEARCH_SERVICE_URL="http://localhost:3000"
    
    # Run the concurrent search test
    if k6 run --out json="$RESULTS_DIR/concurrent-test-results.json" concurrent-search-test.js; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "Load test completed!"
        log_info "Duration: ${duration}s"
        log_info "Results saved to: $RESULTS_DIR/"
        
        # Generate summary report
        generate_summary_report
        
    else
        log_error "Load test failed"
        exit 1
    fi
}

# Function to generate summary report
generate_summary_report() {
    log_info "Generating summary report..."
    
    local report_file="$RESULTS_DIR/load-test-summary.md"
    
    cat > "$report_file" << EOF
# Load Test Summary Report

**Generated:** $(date)

## Configuration
- **Total Records Generated:** ${TOTAL_RECORDS}
- **Concurrent Workers:** ${CONCURRENT_WORKERS}
- **Results Directory:** ${RESULTS_DIR}

## Test Phases
1. ✅ Data Generation
2. ✅ Performance Monitoring
3. ✅ Concurrent Load Testing

## Files Generated
- \`concurrent-test-results.json\` - Detailed k6 results
- \`load-test-summary.json\` - Processed summary metrics
- \`load-test-report.txt\` - Human-readable report
- \`performance-monitor.log\` - System performance during test

## Key Metrics
EOF

    # Extract key metrics from results if available
    if [[ -f "$RESULTS_DIR/load-test-summary.json" ]]; then
        local summary=$(cat "$RESULTS_DIR/load-test-summary.json")
        echo "- **Total Requests:** $(echo "$summary" | grep -o '"totalRequests":[0-9]*' | cut -d':' -f2 || echo "N/A")" >> "$report_file"
        echo "- **Error Rate:** $(echo "$summary" | grep -o '"errorRate":[0-9.]*' | cut -d':' -f2 || echo "N/A")%" >> "$report_file"
        echo "- **Avg Response Time:** $(echo "$summary" | grep -o '"averageResponseTime":[0-9.]*' | cut -d':' -f2 || echo "N/A")ms" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

## Next Steps
1. Review detailed results in \`concurrent-test-results.json\`
2. Analyze performance graphs in k6 output
3. Check system performance in \`performance-monitor.log\`
4. Optimize bottlenecks identified in the test

## Recommendations
- Monitor Elasticsearch cluster health during peak load
- Consider horizontal scaling for services showing high response times
- Implement caching for frequently accessed data
- Optimize database queries based on load test patterns
EOF

    log_success "Summary report generated: $report_file"
}

# Function to cleanup monitoring processes
cleanup_monitoring() {
    if [[ -n "$MONITOR_PID" ]]; then
        log_info "Stopping performance monitoring..."
        kill "$MONITOR_PID" 2>/dev/null || true
        wait "$MONITOR_PID" 2>/dev/null || true
        log_success "Performance monitoring stopped"
    fi
}

# Function to cleanup test data
cleanup_test_data() {
    if [[ "$CLEANUP_AFTER" == false ]]; then
        log_warning "Keeping test data as requested"
        return
    fi
    
    log_section "🧹 CLEANING UP TEST DATA"
    
    log_info "This will delete all test data from the system..."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up test data..."
        
        # Delete Elasticsearch index
        curl -X DELETE "$ELASTICSEARCH_URL/global_search" 2>/dev/null || true
        
        # Note: In a real implementation, you'd call cleanup APIs for each service
        log_warning "Manual cleanup of service databases may be required"
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Function to handle script interruption
handle_interrupt() {
    log_warning "Received interrupt signal"
    cleanup_monitoring
    log_info "Load test interrupted"
    exit 1
}

# Main execution function
main() {
    # Set up interrupt handler
    trap handle_interrupt SIGINT SIGTERM
    
    # Print banner
    echo ""
    echo -e "${GREEN}${BOLD}🚀 AUTOMOTIVE MARKETPLACE LOAD TESTING SUITE${NC}"
    echo -e "${CYAN}=================================================${NC}"
    echo -e "Records to generate: ${YELLOW}${TOTAL_RECORDS}${NC}"
    echo -e "Concurrent workers: ${YELLOW}${CONCURRENT_WORKERS}${NC}"
    echo -e "Results directory: ${YELLOW}${RESULTS_DIR}${NC}"
    echo -e "${CYAN}=================================================${NC}"
    echo ""
    
    # Execute phases
    check_prerequisites
    install_dependencies
    generate_test_data
    start_monitoring
    run_load_tests
    
    # Cleanup
    cleanup_monitoring
    cleanup_test_data
    
    # Final summary
    log_section "🎉 LOAD TEST COMPLETE"
    log_success "All phases completed successfully!"
    log_info "Results available in: $RESULTS_DIR"
    
    if [[ -f "$RESULTS_DIR/load-test-summary.md" ]]; then
        echo ""
        echo -e "${BOLD}Quick Summary:${NC}"
        grep "Key Metrics" -A 10 "$RESULTS_DIR/load-test-summary.md" | tail -n +2
    fi
    
    echo ""
    echo -e "${GREEN}Thank you for using the Automotive Marketplace Load Testing Suite!${NC}"
    echo ""
}

# Change to script directory
cd "$(dirname "$0")"

# Run main function
main "$@"