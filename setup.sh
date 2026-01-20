#!/bin/bash

echo "🚀 Setting up Applizor ERP Project..."

# Create backend .env if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env file..."
    cat > backend/.env << 'EOF'
# Database
DATABASE_URL="postgresql://applizor:applizor123@postgres:5432/applizor_erp?schema=public"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Payment Gateways
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
EOF
    echo "✅ Backend .env created"
else
    echo "ℹ️  Backend .env already exists"
fi

# Create frontend .env if it doesn't exist
if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend/.env file..."
    cat > frontend/.env << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF
    echo "✅ Frontend .env created"
else
    echo "ℹ️  Frontend .env already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure Docker Desktop is running"
echo "2. Run: docker-compose up --build"
echo "3. In another terminal, run migrations:"
echo "   docker-compose exec backend npm run prisma:generate"
echo "   docker-compose exec backend npm run prisma:migrate"
echo ""
echo "Then access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
