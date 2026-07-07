---
type: Module
title: CRM Module
description: Client management, quotations, invoices, contracts
tags: [crm, clients, quotations, invoices, contracts]
timestamp: 2026-06-29T23:00:00Z
---

# CRM Module

## Models

### Client
- Core fields: name, email, phone, address
- Tax: GSTIN, PAN, TAN
- Portal access: `portalAccess` boolean, `password` for client portal login
- Welcome email sent automatically when `portalAccess = true` (via `sendEmail`)

### Quotation
- Fields: number, title, description (scope), validUntil
- Items with HSN/SAC, quantity, rate, discount, multi-tax support
- Tax breakdown aggregation from item-level `appliedTaxes`
- Status: draft → sent → accepted/declined
- Signature: client signs via public link, digital signature overlay
- Public token for sharing

### Invoice
- Fields: number, dueDate, bank details
- Same item structure as quotations
- Payment terms, delivery terms
- Supports letterhead overlay (PDF backdrop)

### Contract
- Rich HTML content with variable substitution
- Signature: company + client digital signatures
- Variables: `[COMPANY_NAME]`, `[CLIENT_NAME]`, `[DATE]`, etc.
- Auto-calculated: contract value, validity dates

## Shared Patterns
- All three support multi-tax breakdown (CGST/SGST/IGST)
- Item-level discount percentage
- Generic PDF generation via Gotenberg
- Letterhead/continuation sheet PDF overlay in production
- Auto-expiry reminders via scheduler
- Digital signature capture + IP logging

## Standard Template Variables
| Variable | Description |
|----------|-------------|
| `[COMPANY_NAME]` | Organization name |
| `[CLIENT_NAME]` | Client/person name |
| `[DATE]` | Current date |
| `[CONTRACT_VALUE]` | Contract amount |
| `[SIGNATURE]` | Base64 digital signature image |
