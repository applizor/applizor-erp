---
type: Documentation
title: Authentication & Authorization
description: JWT auth, RBAC, multi-tenant, SSO, and API security
tags: [auth, jwt, permissions, rbac, sso]
timestamp: 2026-07-08T20:00:00Z
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

## Middleware Stack

### `authenticate` (middleware/auth.ts)
- Required for all protected routes
- Verifies JWT, loads user + company
- `req.user` contains: `{ userId, companyId, role, permissions }`
- `req.userId` shorthand for authenticated user ID

### `authenticateClient` (middleware/client.auth.ts)
- Client portal authentication via separate JWT
- Verifies client portal access credentials
- Attaches `req.clientId`

## RBAC (Role-Based Access Control)
- **Roles**: Custom roles per company (Admin, HR Manager, etc.)
- **Permissions**: Granular CRUD per module via `RolePermission` model
  - Level values: `none`, `own`, `department`, `all`
  - Actions: `create`, `read`, `update`, `delete`
- **UserRole**: Many-to-many User ↔ Role
- **Scope**: `PermissionService.getScopedWhereClause()` generates Prisma WHERE clauses for data scoping
- **Project Access**: `checkProjectAccess()` and `isProjectManager()` for project-level permissions

### Permission Modules
45+ permission modules: Dashboard, Clients, Leads, Invoices, Employees, Projects, Tasks, Payroll, Attendance, Leaves, Recruitment, Accounting, Documents, Contracts, Tickets, Assets, Expenses, Settings, Roles, Notifications, etc.

## SSO (Single Sign-On)
- **Google OAuth**: `GET /api/auth/sso/google` → redirect → callback
- **SAML 2.0**: Configurable per company (`SamlConfig` model)
  - `POST /api/auth/sso/saml/config` — save config
  - `GET /api/auth/sso/saml/login` — initiate SAML login
  - `POST /api/auth/sso/saml/callback` — ACS endpoint
- **Microsoft Auth**: Graph API integration for email

## Super Admin
- `requireSuperAdmin` middleware for platform-level operations
- Super admin bypasses all permission checks
- Can manage tenants, platform plans, statutory rules, COA templates

## Plan Enforcement
- `enforcePlanLimit(limit)` middleware checks SaaS subscription limits
- Limits: `maxUsers`, `maxStorageGb`, etc.
- Configured via `TenantPlan.features` JSON

## Socket.io CORS
```typescript
// Production: blocks unauthorized origins
// Development: allows localhost:3000, localhost:3001, devtunnels, local IPs
if (isProduction && !allowed) callback(new Error('Not allowed by CORS'));
else callback(null, true);
```

## Security Measures
- **Password Hashing**: bcryptjs
- **Rate Limiting**: 100 req/15min API, 10 req/15min auth
- **CORS**: Strict origin whitelist
- **Helmet**: Secure HTTP headers
- **Environment**: All secrets via env vars, validated on startup
