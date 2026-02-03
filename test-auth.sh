#!/bin/bash

# HealthSync Authentication Test Script
# Tests the complete authentication flow

set -e

API_URL="${1:-http://localhost:4000}"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="testpass123"

echo "=========================================="
echo "HealthSync Authentication Test"
echo "=========================================="
echo "API URL: $API_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}[1/5] Testing health endpoint...${NC}"
HEALTH=$(curl -s "$API_URL/health")
if echo "$HEALTH" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "$HEALTH"
    exit 1
fi
echo ""

# Test 2: Signup
echo -e "${YELLOW}[2/5] Testing user signup...${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"role\":\"doctor\",\"profile\":{\"name\":\"Test Doctor\"}}")

TOKEN=$(echo "$SIGNUP_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Signup successful${NC}"
    echo "  Token: ${TOKEN:0:50}..."
else
    echo -e "${RED}✗ Signup failed${NC}"
    echo "$SIGNUP_RESPONSE"
    exit 1
fi
echo ""

# Test 3: Login
echo -e "${YELLOW}[3/5] Testing user login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$LOGIN_TOKEN" ]; then
    echo -e "${GREEN}✓ Login successful${NC}"
    echo "  Token: ${LOGIN_TOKEN:0:50}..."
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Get Current User (/me endpoint)
echo -e "${YELLOW}[4/5] Testing /me endpoint with token...${NC}"
ME_RESPONSE=$(curl -s "$API_URL/api/auth/me" \
    -H "Authorization: Bearer $LOGIN_TOKEN")

USER_EMAIL=$(echo "$ME_RESPONSE" | grep -o '"email":"[^"]*"' | cut -d'"' -f4)
if [ "$USER_EMAIL" = "$TEST_EMAIL" ]; then
    echo -e "${GREEN}✓ Token validation successful${NC}"
    echo "  Email: $USER_EMAIL"
else
    echo -e "${RED}✗ Token validation failed${NC}"
    echo "$ME_RESPONSE"
    exit 1
fi
echo ""

# Test 5: Invalid Login
echo -e "${YELLOW}[5/5] Testing invalid login...${NC}"
INVALID_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}")

if echo "$INVALID_RESPONSE" | grep -q '"error"'; then
    echo -e "${GREEN}✓ Invalid login properly rejected${NC}"
else
    echo -e "${RED}✗ Invalid login test failed${NC}"
    echo "$INVALID_RESPONSE"
    exit 1
fi
echo ""

echo "=========================================="
echo -e "${GREEN}All tests passed! ✓${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - Health check: OK"
echo "  - User signup: OK"
echo "  - User login: OK"
echo "  - Token validation: OK"
echo "  - Invalid credentials rejected: OK"
