# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Production Stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma (runtime)
RUN apk add --no-cache openssl

# Copy artifacts from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "dist/src/server.js"]
