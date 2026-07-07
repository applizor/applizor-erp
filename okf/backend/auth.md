---
type: Documentation
title: Authentication & Authorization
description: JWT auth, middleware, and permission system
tags: [auth, jwt, permissions, middleware]
timestamp: 2026-06-29T23:00:00Z
---

# Authentication & Authorization

## Auth Flow
1. User registers/logs in → receives JWT token
2. Client sends token in `Authorization: Bearer <token>` header
3. `authenticate` middleware decodes JWT, attaches `req.userId` and `req.user`
4. Controllers check permissions via `PermissionService`

## JWT Configuration
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
```

## Middleware (`middleware/auth.ts`)
- `authenticate`: Required for all protected routes; verifies JWT, loads user + company
- `req.user` contains: `{ userId, companyId, role, permissions }`
- `req.userId` is shorthand for authenticated user ID

## Permission System
```typescript
PermissionService.hasBasicPermission(user, module: string, action: 'create'|'read'|'update'|'delete')
```
- `user.role` is checked against module-action matrix
- Falls back to `user.permissions` JSON field if role-based check fails
- Module names match route resources: `'Client'`, `'Employee'`, `'Payroll'`, etc.

## Socket.io CORS
```typescript
// Production: blocks unauthorized origins
// Development: allows localhost:3000, localhost:3001, devtunnels, local IPs
if (isProduction && !allowed) callback(new Error('Not allowed by CORS'));
else callback(null, true);
```
