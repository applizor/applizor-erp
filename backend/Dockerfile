# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Development stage (stops here for fast builds)
FROM builder AS development
RUN npx prisma generate
# No build here, will run via volume + npm run dev

# Production Build
FROM builder AS build-prod
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
COPY --from=build-prod /app/package*.json ./
COPY --from=build-prod /app/node_modules ./node_modules
COPY --from=build-prod /app/dist ./dist
COPY --from=build-prod /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "dist/src/server.js"]
