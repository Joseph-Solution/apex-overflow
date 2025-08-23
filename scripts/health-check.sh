#!/bin/bash

# Health check script for Supabase containerized services
# This script verifies that all Supabase services are running and accessible

set -e

echo "🔍 Checking Supabase containerized services health..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default ports (can be overridden by environment variables)
SUPABASE_API_PORT=${SUPABASE_API_PORT:-54321}
SUPABASE_DB_PORT=${SUPABASE_DB_PORT:-54322}
SUPABASE_STUDIO_PORT=${SUPABASE_STUDIO_PORT:-54323}
SUPABASE_AUTH_PORT=${SUPABASE_AUTH_PORT:-9999}

# Function to check if a service is responding
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Function to check database connection
check_database() {
    echo -n "Checking PostgreSQL database... "
    
    if docker exec apex-overflow-supabase-db-1 pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Check all services
failed_checks=0

# Check database
check_database || ((failed_checks++))

# Check PostgREST API
check_service "PostgREST API" "http://localhost:$SUPABASE_API_PORT" || ((failed_checks++))

# Check Auth service
check_service "Auth Service" "http://localhost:$SUPABASE_AUTH_PORT/health" || ((failed_checks++))

# Check Studio (might return 404 but should be accessible)
check_service "Supabase Studio" "http://localhost:$SUPABASE_STUDIO_PORT" "200\|404" || ((failed_checks++))

# Summary
echo ""
if [ $failed_checks -eq 0 ]; then
    echo -e "${GREEN}🎉 All Supabase services are healthy!${NC}"
    echo ""
    echo "Service URLs:"
    echo "  📊 Supabase Studio: http://localhost:$SUPABASE_STUDIO_PORT"
    echo "  🔌 PostgREST API: http://localhost:$SUPABASE_API_PORT"
    echo "  🔐 Auth Service: http://localhost:$SUPABASE_AUTH_PORT"
    echo "  🗄️  PostgreSQL: localhost:$SUPABASE_DB_PORT"
    exit 0
else
    echo -e "${RED}❌ $failed_checks service(s) failed health check${NC}"
    echo ""
    echo "Troubleshooting tips:"
    echo "  1. Make sure Docker Compose is running: docker-compose ps"
    echo "  2. Check service logs: docker-compose logs [service-name]"
    echo "  3. Restart services: docker-compose restart"
    exit 1
fi