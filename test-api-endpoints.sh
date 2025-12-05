#!/bin/bash

# Test script for Haunted Home API endpoints
# This script tests all deployed Lambda functions via API Gateway

API_URL="https://79zip4uoha.execute-api.us-east-1.amazonaws.com/prod"
USER_POOL_CLIENT_ID="7ig1529bls530elniuco32k1fj"

echo "=========================================="
echo "Haunted Home API Endpoint Tests"
echo "=========================================="
echo ""

# Create a test user
echo "1. Creating test user..."
TEST_EMAIL="apitest-$(date +%s)@example.com"
TEST_PASSWORD="TestPass123"

aws cognito-idp sign-up \
  --client-id $USER_POOL_CLIENT_ID \
  --username $TEST_EMAIL \
  --password $TEST_PASSWORD \
  --region us-east-1 > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✓ User created successfully"
else
  echo "✗ Failed to create user"
  exit 1
fi

# Authenticate and get token
echo ""
echo "2. Authenticating user..."
TOKEN=$(aws cognito-idp initiate-auth \
  --client-id $USER_POOL_CLIENT_ID \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=$TEST_EMAIL,PASSWORD=$TEST_PASSWORD \
  --region us-east-1 \
  --query 'AuthenticationResult.IdToken' \
  --output text)

if [ -n "$TOKEN" ]; then
  echo "✓ Authentication successful"
else
  echo "✗ Authentication failed"
  exit 1
fi

# Test POST /config
echo ""
echo "3. Testing POST /config..."
RESPONSE=$(curl -s -X POST $API_URL/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform":"alexa","mode":"simple"}')

if echo "$RESPONSE" | grep -q "userId"; then
  echo "✓ POST /config successful"
  echo "   Response: $RESPONSE"
else
  echo "✗ POST /config failed"
  echo "   Response: $RESPONSE"
fi

# Test GET /config
echo ""
echo "4. Testing GET /config..."
RESPONSE=$(curl -s -X GET $API_URL/config \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "platform"; then
  echo "✓ GET /config successful"
  echo "   Response: $RESPONSE"
else
  echo "✗ GET /config failed"
  echo "   Response: $RESPONSE"
fi

# Test GET /devices
echo ""
echo "5. Testing GET /devices..."
RESPONSE=$(curl -s -X GET $API_URL/devices \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "devices"; then
  echo "✓ GET /devices successful"
  echo "   Response: $RESPONSE"
else
  echo "✗ GET /devices failed"
  echo "   Response: $RESPONSE"
fi

# Test POST /devices/chat
echo ""
echo "6. Testing POST /devices/chat..."
RESPONSE=$(curl -s -X POST $API_URL/devices/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"I have a bedroom lamp"}')

if echo "$RESPONSE" | grep -q "response"; then
  echo "✓ POST /devices/chat successful"
  echo "   Response: $RESPONSE"
else
  echo "✗ POST /devices/chat failed"
  echo "   Response: $RESPONSE"
fi

# Test POST /haunting/start
echo ""
echo "7. Testing POST /haunting/start..."
RESPONSE=$(curl -s -X POST $API_URL/haunting/start \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "error"; then
  echo "✓ POST /haunting/start successful (expected error - no devices)"
  echo "   Response: $RESPONSE"
else
  echo "✗ POST /haunting/start failed"
  echo "   Response: $RESPONSE"
fi

# Test GET /haunting/command
echo ""
echo "8. Testing GET /haunting/command..."
RESPONSE=$(curl -s -X GET $API_URL/haunting/command \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "error"; then
  echo "✓ GET /haunting/command successful (expected error - no session)"
  echo "   Response: $RESPONSE"
else
  echo "✗ GET /haunting/command failed"
  echo "   Response: $RESPONSE"
fi

# Test POST /haunting/stop
echo ""
echo "9. Testing POST /haunting/stop..."
RESPONSE=$(curl -s -X POST $API_URL/haunting/stop \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q "error"; then
  echo "✓ POST /haunting/stop successful (expected error - no session)"
  echo "   Response: $RESPONSE"
else
  echo "✗ POST /haunting/stop failed"
  echo "   Response: $RESPONSE"
fi

echo ""
echo "=========================================="
echo "All API endpoint tests completed!"
echo "=========================================="
