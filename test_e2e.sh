#!/bin/bash

BASE_URL="http://localhost:8000"

echo "=== COMPREHENSIVE E2E TEST ==="

# Test 1: Register Owner
echo "Test 1: Register Owner..."
OWNER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Owner",
    "username": "owner_test",
    "mobileNumber": "+919999999999",
    "email": "owner_test@example.com",
    "password": "Password@123",
    "role": "owner"
  }')

OWNER_TOKEN=$(echo $OWNER_RESPONSE | jq -r '.access_token')
echo " Owner token: ${OWNER_TOKEN:0:20}..."

# Test 2: Register Player
echo "Test 2: Register Player..."
PLAYER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Player",
    "username": "player_test",
    "mobileNumber": "+919999999998",
    "email": "player_test@example.com",
    "password": "Password@123",
    "role": "player"
  }')

PLAYER_TOKEN=$(echo $PLAYER_RESPONSE | jq -r '.access_token')
echo " Player token: ${PLAYER_TOKEN:0:20}..."

# Test 3: Create Venue
echo "Test 3: Create Venue..."
VENUE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/owner/venues" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d '{
    "name": "Test Venue",
    "location": "Test Location",
    "city": "Test City",
    "image_url": "https://example.com/image.jpg"
  }')

VENUE_ID=$(echo $VENUE_RESPONSE | jq -r '.id')
echo " Venue ID: $VENUE_ID"

# Test 4: Create Ground
echo "Test 4: Create Ground..."
GROUND_RESPONSE=$(curl -s -X POST "$BASE_URL/api/owner/grounds" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{
    \"venue_id\": \"$VENUE_ID\",
    \"name\": \"Test Ground\"
  }")

GROUND_ID=$(echo $GROUND_RESPONSE | jq -r '.id')
echo " Ground ID: $GROUND_ID"

# Test 5: Create Slot
echo "Test 5: Create Slot..."
SLOT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/owner/slots" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{
    \"ground_id\": \"$GROUND_ID\",
    \"slot_date\": \"2026-02-01\",
    \"start_time\": \"10:00\",
    \"end_time\": \"11:00\",
    \"price\": 500
  }")

SLOT_ID=$(echo $SLOT_RESPONSE | jq -r '.id')
echo " Slot ID: $SLOT_ID"

# Test 6: Create Booking
echo "Test 6: Create Booking..."
BOOKING_RESPONSE=$(curl -s -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PLAYER_TOKEN" \
  -d "{
    \"slot_id\": \"$SLOT_ID\"
  }")

echo "Booking Response:"
echo $BOOKING_RESPONSE | jq '.'

BOOKING_ID=$(echo $BOOKING_RESPONSE | jq -r '.id')
VERIFICATION_CODE=$(echo $BOOKING_RESPONSE | jq -r '.verification_code')
STATUS=$(echo $BOOKING_RESPONSE | jq -r '.status')

echo " Booking ID: $BOOKING_ID"
echo " Verification Code: $VERIFICATION_CODE"
echo " Status: $STATUS"

# Test 7: Verify Code
echo "Test 7: Verify Code..."
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/api/bookings/verify-code" \
  -H "Content-Type: application/json" \
  -d "{
    \"verification_code\": \"$VERIFICATION_CODE\"
  }")

echo "Verify Code Response:"
echo $VERIFY_RESPONSE | jq '.'

# Test 8: Confirm Verification
echo "Test 8: Confirm Verification..."
CONFIRM_RESPONSE=$(curl -s -X POST "$BASE_URL/api/bookings/confirm-verification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -d "{
    \"verification_code\": \"$VERIFICATION_CODE\"
  }")

echo "Confirm Response:"
echo $CONFIRM_RESPONSE | jq '.'
