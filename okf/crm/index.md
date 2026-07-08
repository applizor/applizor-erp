---
type: Module
title: CRM Module
description: Complete CRM — clients, leads, quotations, invoices, contracts, sales targets
tags: [crm, clients, leads, quotations, invoices, contracts]
timestamp: 2026-07-08T20:00:00Z
---

# CRM Module

## Models (17)

### Client Management
| Model | Description |
|-------|-------------|
| **Client** | Customer/vendor/partner with tax info (GSTIN/PAN/TAN), portal access, credit limit, category |
| **ClientCategory** | Customer categorization (e.g., Enterprise, SME, Startup) |
| **ClientSubCategory** | Sub-categories under each category |

### Lead Management
| Model | Description |
|-------|-------------|
| **Lead** | Sales leads with source, priority, stage (lead/proposal/negotiation/closed), value, tags, follow-up scheduling |
| **LeadActivity** | Activities/tasks on leads (call, email, meeting, note, task) with scheduled dates and assignment |

### Sales Documents
| Model | Description |
|-------|-------------|
| **Quotation** | Auto-numbered (`QTN-{year}-{seq}`), items with HSN/SAC, multi-tax, discounts, public token sharing, e-signature |
| **QuotationItem** | Line items with quantity, rate, discount, tax breakdown |
| **QuotationActivity** | Audit trail (views, email opens, signs) with IP + user agent |
| **QuotationTemplate** | Reusable templates by category |
| **Estimate** | Rough estimates convertible to quotations |
| **Invoice** | Auto-numbered (`INV-{year}-{seq}`), recurring support, multi-currency, public token |
| **InvoiceItem** | Line items with tax breakdown |
| **InvoiceActivity** | Audit trail with device/browser info |
| **Payment** | Invoice payments with method, transaction ID, status |
| **Contract** | Rich HTML content with variable substitution, e-signature (company + client), IP logging |
| **ContractActivity** | Audit trail (views, signs, emails) |
| **ContractTemplate** | Reusable contract templates with variables |

### Sales Performance
| Model | Description |
|-------|-------------|
| **SalesTarget** | Employee sales targets with period, target/achieved, commission rate |
| **TaxRate** | Tax configurations (CGST/SGST/IGST/GST/Cess) |
| **UnitType** | Measurement units (pcs, hrs, days, etc.) |

## Key Features

### Lead Pipeline
- Kanban board with drag-and-drop stages
- Activity timeline (calls, emails, meetings, notes)
- Follow-up scheduling with reminders
- Lead → Client conversion
- Re-engagement for cold leads
- Lead analytics

### Quotations
- Scope description + line items with HSN/SAC
- Multi-tax breakdown (CGST/SGST/IGST)
- Item-level discounts
- Public shareable link with e-signature
- Analytics (views, email opens, client activity)
- Convert to invoice or duplicate
- PDF generation with letterhead/logo/signature

### Invoices
- Recurring invoices (daily/monthly/quarterly/yearly)
- Multi-currency support
- Public shareable link
- Payment recording (manual or via gateway)
- Batch status updates and email sending
- Email delivery with tracking
- Invoice statistics and activity log

### Contracts
- Rich HTML content with variable substitution: `[COMPANY_NAME]`, `[CLIENT_NAME]`, `[CONTRACT_VALUE]`, `[SIGNATURE]`, etc.
- Dual e-signature (company + client) with IP logging
- Client portal access for review and signing
- Auto-expiry reminders via scheduler
- PDF generation with letterhead

### Client Portal
Clients can:
- View quotations, invoices, contracts
- Sign contracts and accept/reject quotations
- View project milestones and task boards
- Upload documents and communicate via comments
- Download PDFs

## Frontend Pages
| Route | Description |
|-------|-------------|
| `/clients` | Client list with filters, categories |
| `/clients/create` | Create client |
| `/clients/[id]` | Client detail with related docs |
| `/leads` | Lead kanban board |
| `/leads/list` | Lead table view |
| `/leads/kanban` | Drag-and-drop kanban |
| `/invoices` | Invoice list with filters, stats |
| `/quotations` | Quotation list |
| `/crm` | CRM overview |
| `/crm/contracts` | Contract management |

## Shared Patterns
- Multi-tax breakdown (CGST/SGST/IGST) across all documents
- Item-level discount percentage
- Generic PDF generation via Gotenberg + letterhead overlay
- Auto-expiry reminders via scheduler (quotations)
- Digital signature capture + IP logging
- Public token-based sharing for quotations and invoices
- Email delivery with activity tracking
