#!/bin/bash

echo "🔐 Testing Admin Login..."
echo ""

# Login API call
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@applizor.com",
    "password": "admin123"
  }')

# Check if login successful
if echo "$RESPONSE" | grep -q "Login successful"; then
  echo "✅ Login Successful!"
  echo ""
  echo "User Details:"
  echo "$RESPONSE" | grep -o '"email":"[^"]*"' | head -1
  echo "$RESPONSE" | grep -o '"firstName":"[^"]*"' | head -1
  echo "$RESPONSE" | grep -o '"lastName":"[^"]*"' | head -1
  echo ""
  echo "Company:"
  echo "$RESPONSE" | grep -o '"name":"[^"]*"' | head -1
  echo ""
  echo "Token generated successfully!"
  echo ""
  echo "🌐 Now you can:"
  echo "   1. Open browser: http://localhost:3000/login"
  echo "   2. Login with: admin@applizor.com / admin123"
  echo "   3. Access dashboard after login"
else
  echo "❌ Login Failed"
  echo "$RESPONSE"
fi
