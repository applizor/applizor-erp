---
type: Module
title: Backend Architecture
description: Express.js + Prisma + PostgreSQL REST API server
tags: [backend, architecture, express, prisma]
timestamp: 2026-06-29T23:00:00Z
---

# Backend Architecture

Express.js REST API with Prisma ORM on PostgreSQL.

## Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **ORM**: Prisma
- **DB**: PostgreSQL 15
- **Auth**: JWT + bcryptjs
- **PDF**: Gotenberg (external service)
- **Email**: Nodemailer (SMTP or Microsoft Graph)

## Structure
```
src/
├── server.ts              # Entry point
├── routes/                # Route definitions
├── controllers/           # Request handlers
├── services/              # Business logic
├── middleware/            # Auth, validation
├── prisma/
│   ├── schema.prisma      # Data model
│   └── client.ts          # Prisma client singleton
└── utils/                 # Helpers (jwt, upload)
```

## Key Patterns
- Controllers handle HTTP req/res, delegate logic to Services
- Services contain business logic, use Prisma directly
- Auth middleware attaches `req.userId`, `req.user` with permissions
- All routes protected by `authenticate` middleware by default

## Enterprise Infrastructure
- **Error Handling**: Global error handler middleware catches all errors, AppError class for operational errors, asyncHandler wrapper for async routes
- **Validation**: Zod schema validation middleware (`validate()`) for request bodies
- **Security**: Helmet.js headers, CORS with strict origin whitelist, rate limiting (100 req/15min API, 10 req/15min auth)
- **Environment**: Config module validates required env vars on startup, exits with clear message if missing
- **Graceful Shutdown**: SIGTERM/SIGINT handlers close HTTP server, disconnect Prisma, force-exit after 10s timeout
