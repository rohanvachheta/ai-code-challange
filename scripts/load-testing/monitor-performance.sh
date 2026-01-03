#!/bin/bash

# Performance monitoring script for automotive marketplace load testing
# Monitors system resources, Elasticsearch, and service health during load tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOG_FILE="performance-monitor.log"
ELASTICSEARCH_URL="http://localhost:9200"
SERVICES=("localhost:3001" "localhost:3002" "localhost:3003" "localhost:3000" "localhost:3004")
SERVICE_NAMES=("offer-service" "purchase-service" "transport-service" "search-service" "user-service")
MONITOR_INTERVAL=30 # seconds

echo -e "${GREEN}🔧 PERFORMANCE MONITORING STARTED${NC}"
echo -e "${CYAN}======================================${NC}"
echo -e "Monitor interval: ${MONITOR_INTERVAL}s"
echo -e "Logging to: ${LOG_FILE}"
echo -e "${CYAN}======================================${NC}\n"

# Function to log with timestamp
log_with_timestamp() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check system resources
check_system_resources() {
    echo -e "${BLUE}📊 SYSTEM RESOURCES${NC}"
    echo -e "${CYAN}--------------------${NC}"
    
    # CPU Usage
    if command -v top >/dev/null 2>&1; then
        CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
        echo -e "💻 CPU Usage: ${CPU_USAGE}%"
    elif command -v iostat >/dev/null 2>&1; then
        CPU_USAGE=$(iostat -c 1 1 | tail -n +4 | awk '{print 100-$6}' | head -1)
        echo -e "💻 CPU Usage: ${CPU_USAGE}%"
    else
        echo -e "💻 CPU Usage: ${YELLOW}Unable to determine${NC}"
    fi
    
    # Memory Usage
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        MEMORY_PRESSURE=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print 100-$5}' | sed 's/%//' || echo "N/A")
        MEMORY_USAGE=$(vm_stat | awk '
            /Pages free/ {free = $3}
            /Pages active/ {active = $3} 
            /Pages inactive/ {inactive = $3}
            /Pages speculative/ {speculative = $3}
            /Pages wired/ {wired = $3}
            END {
                gsub(/[^0-9]/, "", free); gsub(/[^0-9]/, "", active); 
                gsub(/[^0-9]/, "", inactive); gsub(/[^0-9]/, "", speculative); gsub(/[^0-9]/, "", wired)
                total = (free + active + inactive + speculative + wired) * 4096 / 1024 / 1024
                used = (active + inactive + speculative + wired) * 4096 / 1024 / 1024
                printf "%.1f", (used/total)*100
            }'
        )
    else
        # Linux
        MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    fi
    echo -e "🧠 Memory Usage: ${MEMORY_USAGE}%"
    
    # Disk Usage
    DISK_USAGE=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
    echo -e "💾 Disk Usage: ${DISK_USAGE}%"
    
    # Load Average (Unix systems)
    if command -v uptime >/dev/null 2>&1; then
        LOAD_AVG=$(uptime | awk -F'load averages?:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        echo -e "📈 Load Average: ${LOAD_AVG}"
    fi
    
    echo ""
}

# Function to check Elasticsearch performance
check_elasticsearch() {
    echo -e "${BLUE}🔍 ELASTICSEARCH METRICS${NC}"
    echo -e "${CYAN}--------------------------${NC}"
    
    # Cluster Health
    CLUSTER_HEALTH=$(curl -s "$ELASTICSEARCH_URL/_cluster/health?pretty" 2>/dev/null || echo "ERROR")
    if [[ "$CLUSTER_HEALTH" != "ERROR" ]]; then
        STATUS=$(echo "$CLUSTER_HEALTH" | grep '"status"' | awk -F'"' '{print $4}')
        NODES=$(echo "$CLUSTER_HEALTH" | grep '"number_of_nodes"' | awk -F':' '{print $2}' | awk '{print $1}' | sed 's/,//')
        SHARDS=$(echo "$CLUSTER_HEALTH" | grep '"active_primary_shards"' | awk -F':' '{print $2}' | awk '{print $1}' | sed 's/,//')
        
        case $STATUS in
            "green")  echo -e "🟢 Cluster Status: ${GREEN}$STATUS${NC}" ;;
            "yellow") echo -e "🟡 Cluster Status: ${YELLOW}$STATUS${NC}" ;;
            "red")    echo -e "🔴 Cluster Status: ${RED}$STATUS${NC}" ;;
            *)        echo -e "⚪ Cluster Status: $STATUS" ;;
        esac
        
        echo -e "🏢 Active Nodes: $NODES"
        echo -e "🔧 Primary Shards: $SHARDS"
    else
        echo -e "❌ ${RED}Elasticsearch unreachable${NC}"
    fi
    
    # Index Statistics
    INDEX_STATS=$(curl -s "$ELASTICSEARCH_URL/global_search/_stats?pretty" 2>/dev/null || echo "ERROR")
    if [[ "$INDEX_STATS" != "ERROR" ]]; then
        DOC_COUNT=$(echo "$INDEX_STATS" | grep '"count"' | head -1 | awk -F':' '{print $2}' | awk '{print $1}' | sed 's/,//')
        INDEX_SIZE=$(echo "$INDEX_STATS" | grep '"size_in_bytes"' | head -1 | awk -F':' '{print $2}' | awk '{print $1}' | sed 's/,//')
        
        # Convert bytes to MB
        if [[ "$INDEX_SIZE" =~ ^[0-9]+$ ]]; then
            INDEX_SIZE_MB=$(echo "scale=2; $INDEX_SIZE / 1024 / 1024" | bc -l 2>/dev/null || echo "N/A")
            echo -e "📚 Documents: ${DOC_COUNT:-N/A}"
            echo -e "💽 Index Size: ${INDEX_SIZE_MB:-N/A} MB"
        fi
    fi
    
    # Search Performance
    SEARCH_STATS=$(curl -s "$ELASTICSEARCH_URL/_nodes/stats/indices/search?pretty" 2>/dev/null || echo "ERROR")
    if [[ "$SEARCH_STATS" != "ERROR" ]]; then
        QUERY_TOTAL=$(echo "$SEARCH_STATS" | grep '"query_total"' | head -1 | awk -F':' '{print $2}' | awk '{print $1}' | sed 's/,//')
        QUERY_TIME=$(echo "$SEARCH_STATS" | grep '"query_time_in_millis"' | head -1 | awk -F':' '{print $2}' | awk '{print $1}' | sed 's/,//')
        
        if [[ "$QUERY_TOTAL" =~ ^[0-9]+$ ]] && [[ "$QUERY_TIME" =~ ^[0-9]+$ ]] && [[ $QUERY_TOTAL -gt 0 ]]; then
            AVG_QUERY_TIME=$(echo "scale=2; $QUERY_TIME / $QUERY_TOTAL" | bc -l 2>/dev/null || echo "N/A")
            echo -e "🔍 Total Queries: ${QUERY_TOTAL}"
            echo -e "⚡ Avg Query Time: ${AVG_QUERY_TIME}ms"
        fi
    fi
    
    echo ""
}

# Function to check service health
check_services() {
    echo -e "${BLUE}🏥 SERVICE HEALTH${NC}"
    echo -e "${CYAN}------------------${NC}"
    
    for i in "${!SERVICES[@]}"; do
        SERVICE_URL="${SERVICES[$i]}"
        SERVICE_NAME="${SERVICE_NAMES[$i]}"
        
        # Try health endpoint first, then root endpoint
        HEALTH_CHECK=$(curl -s -f -m 5 "http://${SERVICE_URL}/health" 2>/dev/null || curl -s -f -m 5 "http://${SERVICE_URL}/" 2>/dev/null || echo "DOWN")
        
        if [[ "$HEALTH_CHECK" != "DOWN" ]]; then
            echo -e "✅ ${SERVICE_NAME}: ${GREEN}UP${NC}"
        else
            echo -e "❌ ${SERVICE_NAME}: ${RED}DOWN${NC}"
        fi
    done
    
    echo ""
}

# Function to check Docker container status
check_docker_containers() {
    if command -v docker >/dev/null 2>&1; then
        echo -e "${BLUE}🐳 DOCKER CONTAINERS${NC}"
        echo -e "${CYAN}--------------------${NC}"
        
        CONTAINERS=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "ERROR")
        if [[ "$CONTAINERS" != "ERROR" ]]; then
            echo "$CONTAINERS" | while IFS= read -r line; do
                if [[ "$line" != *"NAMES"* ]]; then
                    echo -e "📦 $line"
                fi
            done
        else
            echo -e "❌ ${RED}Docker not available or no containers running${NC}"
        fi
        
        echo ""
    fi
}

# Function to monitor network connections
check_network_stats() {
    echo -e "${BLUE}🌐 NETWORK STATS${NC}"
    echo -e "${CYAN}------------------${NC}"
    
    if command -v netstat >/dev/null 2>&1; then
        # Count established connections
        ESTABLISHED_CONNECTIONS=$(netstat -an 2>/dev/null | grep -c "ESTABLISHED" || echo "0")
        echo -e "🔗 Established Connections: $ESTABLISHED_CONNECTIONS"
        
        # Check for connections on service ports
        for port in 3000 3001 3002 3003 3004 9200; do
            CONNECTIONS=$(netstat -an 2>/dev/null | grep ":$port " | grep -c "ESTABLISHED" || echo "0")
            if [[ $CONNECTIONS -gt 0 ]]; then
                echo -e "📡 Port $port: $CONNECTIONS connections"
            fi
        done
    elif command -v ss >/dev/null 2>&1; then
        # Use ss if netstat not available (newer systems)
        ESTABLISHED_CONNECTIONS=$(ss -an 2>/dev/null | grep -c "ESTAB" || echo "0")
        echo -e "🔗 Established Connections: $ESTABLISHED_CONNECTIONS"
    fi
    
    echo ""
}

# Function to generate performance alert
check_performance_alerts() {
    echo -e "${BLUE}⚠️  PERFORMANCE ALERTS${NC}"
    echo -e "${CYAN}---------------------${NC}"
    
    local alerts_found=false
    
    # CPU Alert (if > 80%)
    if [[ "$CPU_USAGE" =~ ^[0-9]+\.?[0-9]*$ ]] && (( $(echo "$CPU_USAGE > 80" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "🚨 ${RED}HIGH CPU USAGE: ${CPU_USAGE}%${NC}"
        alerts_found=true
    fi
    
    # Memory Alert (if > 85%)
    if [[ "$MEMORY_USAGE" =~ ^[0-9]+\.?[0-9]*$ ]] && (( $(echo "$MEMORY_USAGE > 85" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "🚨 ${RED}HIGH MEMORY USAGE: ${MEMORY_USAGE}%${NC}"
        alerts_found=true
    fi
    
    # Disk Alert (if > 90%)
    if [[ "$DISK_USAGE" =~ ^[0-9]+$ ]] && [[ $DISK_USAGE -gt 90 ]]; then
        echo -e "🚨 ${RED}HIGH DISK USAGE: ${DISK_USAGE}%${NC}"
        alerts_found=true
    fi
    
    if [[ "$alerts_found" == false ]]; then
        echo -e "✅ ${GREEN}No performance alerts${NC}"
    fi
    
    echo ""
}

# Main monitoring loop
main() {
    # Initialize log file
    echo "Performance monitoring started at $(date)" > "$LOG_FILE"
    
    # Handle graceful shutdown
    trap 'echo -e "\n${YELLOW}Monitoring stopped at $(date)${NC}"; exit 0' SIGINT SIGTERM
    
    while true; do
        clear
        echo -e "${GREEN}🔧 AUTOMOTIVE MARKETPLACE - PERFORMANCE MONITOR${NC}"
        echo -e "${CYAN}=================================================${NC}"
        echo -e "⏰ $(date)"
        echo -e "${CYAN}=================================================${NC}\n"
        
        # Log timestamp
        log_with_timestamp "=== Performance Check ==="
        
        # Run all checks
        check_system_resources
        check_elasticsearch
        check_services
        check_docker_containers
        check_network_stats
        check_performance_alerts
        
        echo -e "${CYAN}=================================================${NC}"
        echo -e "Next update in ${MONITOR_INTERVAL} seconds... (Ctrl+C to stop)"
        echo -e "${CYAN}=================================================${NC}"
        
        sleep "$MONITOR_INTERVAL"
    done
}

# Run main function
main "$@"