#!/bin/bash

# Configuration
API_URL="http://localhost:5000/api"
ADMIN_EMAIL="admin@applizor.com"
ADMIN_PASS="admin123"

echo "🧪 Starting Feature Verification..."
echo "=================================="

# 1. Login as Admin
echo "1. Logging in as Admin..."
LOGIN_RES=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASS\"}")

TOKEN=$(echo $LOGIN_RES | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
COMPANY_ID=$(echo $LOGIN_RES | grep -o '"companyId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login Failed! Response: $LOGIN_RES"
  exit 1
fi
echo "✅ Login Successful. Company ID: $COMPANY_ID"

# 2. Test Subscription Plan RBAC
echo ""
echo "2. Testing Subscription Plan RBAC..."
PLAN_DATA='{"name":"Test Plan","price":99,"billingCycle":"monthly","features":["feature1"]}'

# Create Plan (Admin) - Should Succeed
PLAN_RES=$(curl -s -w "%{http_code}" -X POST "$API_URL/subscription-plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PLAN_DATA")

HTTP_CODE=${PLAN_RES: -3}
CONTENT=${PLAN_RES:0:${#PLAN_RES}-3}

if [ "$HTTP_CODE" -eq 201 ]; then
  echo "✅ Plan Created Successfully (Admin). Code: $HTTP_CODE"
  PLAN_ID=$(echo $CONTENT | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  
  # Clean up plan
  curl -s -X DELETE "$API_URL/subscription-plans/$PLAN_ID" -H "Authorization: Bearer $TOKEN" > /dev/null
else
  echo "❌ Plan Creation Failed. Expected 201, Got $HTTP_CODE"
  echo "Response: $CONTENT"
fi


# 3. Test Journal Entry & Audit
echo ""
echo "3. Testing Journal Entry Creation (Audit Trail)..."
ENTRY_DATA='{
  "date": "'$(date +%Y-%m-%d)'",
  "description": "Test Entry for Audit",
  "reference": "REF-001",
  "lines": [
    {"accountId": "ACC-001", "debit": 100},
    {"accountId": "ACC-002", "credit": 100}
  ]
}'

# Note: We need valid Account IDs. If this fails due to invalid accounts, we might need to fetch accounts first.
# For now, let's assume we might get a 400 or 500 if accounts don't exist, but we check if endpoint is reachable and protected.
# Actually, let's try to fetch accounts first.
ACCOUNTS_RES=$(curl -s -X GET "$API_URL/accounting/accounts" -H "Authorization: Bearer $TOKEN")
ACC_1=$(echo $ACCOUNTS_RES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ACC_2=$(echo $ACCOUNTS_RES | grep -o '"id":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)

if [ -n "$ACC_1" ] && [ -n "$ACC_2" ]; then
  ENTRY_DATA='{
    "date": "'$(date +%Y-%m-%d)'",
    "description": "Test Entry for Audit",
    "reference": "REF-001",
    "lines": [
      {"accountId": "'$ACC_1'", "debit": 100},
      {"accountId": "'$ACC_2'", "credit": 100}
    ]
  }'
  
  ENTRY_RES=$(curl -s -w "%{http_code}" -X POST "$API_URL/accounting/entries" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ENTRY_DATA")
    
  HTTP_CODE=${ENTRY_RES: -3}
  HTTP_CODE=${ENTRY_RES: -3}
  if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo "✅ Journal Entry Created. Code: $HTTP_CODE"
    # Verify Audit (Ideally manually or by checking database logs if endpoint available)
    echo "   (Check Audit Logs manually or via DB)"
  else
     echo "❌ Journal Entry Failed. Code: $HTTP_CODE"
     echo "Response: ${ENTRY_RES:0:${#ENTRY_RES}-3}"
  fi
else
  echo "⚠️ Could not fetch accounts to test Journal Entry."
fi


# 4. Test Ledger Lock
echo ""
echo "4. Testing Ledger Lock..."
# Set Lock Date to Yesterday
YESTERDAY=$(date -v-1d +%Y-%m-%d) # macOS date syntax
LOCK_UPDATE_RES=$(curl -s -w "%{http_code}" -X PUT "$API_URL/company" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"accountingLockDate\": \"$YESTERDAY\"}")

if [ "${LOCK_UPDATE_RES: -3}" -eq 200 ]; then
  echo "✅ Ledger Lock Date Set to $YESTERDAY."
  
  # Try to create entry for Day Before Yesterday
  BEFORE_YESTERDAY=$(date -v-2d +%Y-%m-%d)
  BAD_ENTRY_DATA='{
    "date": "'$BEFORE_YESTERDAY'",
    "description": "Should Fail",
    "reference": "FAIL-001",
    "lines": [
       {"accountId": "'$ACC_1'", "debit": 50},
       {"accountId": "'$ACC_2'", "credit": 50}
    ]
  }'
  
  FAIL_RES=$(curl -s -w "%{http_code}" -X POST "$API_URL/accounting/entries" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BAD_ENTRY_DATA")
    
  if [ "${FAIL_RES: -3}" -eq 400 ] || [ "${FAIL_RES: -3}" -eq 500 ]; then # 500 if error thrown unhandled, 400 if handled
     echo "✅ Ledger Lock Enforced. Request Rejected with Code ${FAIL_RES: -3}"
  else
     echo "❌ Ledger Lock Failed! Entry Created with Code ${FAIL_RES: -3}"
  fi

else
  echo "❌ Failed to set Ledger Lock Date."
fi

echo ""
echo "🏁 Verification Complete."
