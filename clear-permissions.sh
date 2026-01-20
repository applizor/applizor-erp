#!/bin/bash

# Script to clear browser localStorage and force fresh login
# This helps when permissions are updated in database but localStorage has stale data

echo "🔧 Clearing browser localStorage for fresh permissions..."
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Open your browser (http://localhost:3000)"
echo "2. Press F12 to open Developer Tools"
echo "3. Go to 'Application' or 'Storage' tab"
echo "4. Click on 'Local Storage' → 'http://localhost:3000'"
echo "5. Right-click and select 'Clear'"
echo "6. Refresh the page (F5)"
echo "7. Login again"
echo ""
echo "OR simply:"
echo "1. Logout from the application"
echo "2. Login again"
echo ""
echo "This will load fresh permissions from the database!"
