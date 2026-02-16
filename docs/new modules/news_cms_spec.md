# GLOBAL MULTI-PORTAL NEWS CMS (ENTERPRISE SPECIFICATION)

Technical specification for an integrated News CMS module within the Applizor ERP ecosystem.

## 1. System Architecture
- **ERP Backend (Existing)**: 
    - Node.js Monolith.
    - PostgreSQL + Prisma.
    - Central Authentication.
    - Shared Billing/Invoice system.
- **CMS Module**: 
    - Internal module within the ERP backend.
    - Multi-tenant (Portal) architecture.
- **Separate Frontend**: 
    - Independent Next.js Application.
    - High-performance rendering (ISR/SSR).

## 2. Billing & Provisioning Flow
1. **Client Creation**: Client is registered in the ERP.
2. **Project Setup**: Project created with `type = 'news_portal'`.
3. **Billing Activation**: Recurring invoice triggered.
4. **Auto-Provisioning**: CMS portal is initialized upon successful billing/activation.
5. **Domain Management**: Subdomain/Domain mapping.
6. **Lifecycle Management**: Daily cron job to suspend/activate portals based on payment status.

## 3. Database Schema (Prisma Implementation)

### CMSPortal
- `id`: UUID (PK)
- `clientId`: UUID (Relation to Client)
- `projectId`: UUID (Relation to Project)
- `domain`: String (Unique)
- `subdomain`: String
- `planType`: String
- `status`: String (active, suspended)
- `createdAt`: DateTime

### CMSPost
- `id`: UUID (PK)
- `portalId`: UUID (Relation to CMSPortal)
- `authorId`: UUID (Relation to User)
- `title`: String
- `slug`: String (Unique index)
- `content`: Text
- `featuredImage`: String
- `status`: String (draft, published)
- `publishedAt`: DateTime
- `createdAt`: DateTime

### CMSPage
- `id`: UUID (PK)
- `portalId`: UUID (Relation to CMSPortal)
- `title`: String
- `slug`: String (Unique index per portal)
- `content`: Text
- `status`: String (draft, published)
- `createdAt`: DateTime

### CMSMenu
- `id`: UUID (PK)
- `portalId`: UUID (Relation to CMSPortal)
- `name`: String (e.g., "Main Header", "Footer")
- `items`: Json (Array of links: {label, url, type: internal/external})

### CMSCategory & Tags
- `CMSCategory`: id, portalId, name, slug.
- `CMSTag`: id, portalId, name.
- `CMSPostTag`: Junction for posts and tags.

### CMSSEO
- `postId`: UUID (One-to-one with CMSPost)
- `metaTitle`: String(160)
- `metaDescription`: String(255)
- `focusKeywords`: String[]
- `schemaJson`: Json

### CMSAdSettings
- `portalId`: UUID (Relation to CMSPortal)
- `headerAd`: Text
- `inArticleAd`: Text
- `sidebarAd`: Text
- `revenueShare`: Int

## 4. Role Permission Matrix
- **Client Admin**: Full control over portal, domain, ads, team, and publishing.
- **Manager**: Manage editorial team, view analytics, publish.
- **News Editor**: Edit, publish, manage taxonomies, and SEO.
- **News Reporter**: Create content and upload assets; cannot publish.

## 5. API Documentation

### Management (ERP-Side)
- `POST /api/cms/portal/create`
- `POST /api/cms/portal/suspend`
- `POST /api/cms/portal/reactivate`

### Editorial (Portal-Side Admin)
- `POST /api/cms/post/create`
- `PUT  /api/cms/post/update/:id`
- `GET  /api/cms/post/list`
- `DELETE /api/cms/post/delete/:id`

### Taxonomies & Utilities
- `POST /api/cms/category/create`
- `GET  /api/cms/category/list`
- `POST /api/cms/seo/generate` (AI-powered)

### Public API (Public Frontend)
- `GET /api/public/:domain/home`
- `GET /api/public/:domain/category/:slug`
- `GET /api/public/:domain/post/:slug`

## 6. Advanced Enterprise Features

### AI Content Intelligence
- **AI Rewriter**: Rewrite headlines for better CTR.
- **Summarization**: Generate 'TL;DR' summaries for long articles.
- **Smart Tagging**: AI-driven automatic tagging based on content analysis.

### Newsletter & Engagement
- **Auto-Highlights**: Weekly/Daily automated email newsletters to portal subscribers using the ERP's email service.
- **Push Notifications**: Real-time "Breaking News" alerts for desktop/mobile.
- **RSS/Atom Feeds**: Standard feeds for news aggregators.

### Monetization & Analytics
- **Smart Ad Injector**: Context-aware ad placement within articles.
- **Internal Analytics**: Track views, unique visitors, and ad clicks per portal without third-party dependencies.
- **Revenue Dashboard**: Dashboard for clients to see their projected earnings.

### Dynamic Theming & Layouts
- **Theme Templates**: Multiple pre-built layout designs (e.g., "Classic Magazine", "Minimalist Blog", "Modern Grid", "Video-First").
- **Visual Customizer**: Real-time preview of brand identity changes (Colors, Typography, Logo).
- **Dark/Light Mode**: Full theme switching support.
- **Custom CSS/JS**: Advanced option for custom styling per portal.

## 7. AI Logic Specification
- **SEO Tooling**: Expert SEO specialist persona for metadata.
- **Content Helper**: General journalist persona for summaries and headlines.
- **Schema**: Automatic generation of `NewsArticle` and `Organization` JSON-LD.

## 8. Performance & Scalability Targets
- **Page Load**: < 1.2s (Optimized from 1.5s)
- **LCP**: < 1.8s
- **Infrastructure**: 
    - **Edge Caching**: Cloudflare Workers for global content delivery.
    - **Image Optimization**: On-the-fly WebP conversion and resizing.
    - **DB Sharding Ready**: Architecture supports horizontal scaling for large portal volumes.

## 9. Deployment Timeline (50 Days - Extended for Advanced Features)
1. **Days 1-12**: Core CMS, DB Schema, Provisioning logic.
2. **Days 13-22**: Advanced Permissions, AI Engine (SEO + Rewriter).
3. **Days 23-35**: High-Performance Frontend Rendering (Dynamic Themes).
4. **Days 36-42**: Newsletter Automation & Push Notifications.
5. **Days 43-50**: Final QA, Stress Testing, and Production Launch.
