-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_jobOpeningId_fkey";

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "planId" TEXT;

-- CreateTable
CREATE TABLE "CMSPortal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "domain" TEXT,
    "subdomain" TEXT,
    "name" TEXT,
    "logo" TEXT,
    "planId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "themeLayout" TEXT NOT NULL DEFAULT 'classic',
    "themeColor" TEXT NOT NULL DEFAULT '#0f172a',
    "themeConfig" JSONB,
    "socialLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSPortal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSPost" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "CMSPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSPage" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSMenu" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSCategory" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSTag" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSSEO" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "focusKeywords" TEXT,
    "schemaJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSSEO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CMSAdSettings" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "headerAd" TEXT,
    "inArticleAd" TEXT,
    "sidebarAd" TEXT,
    "revenueShare" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CMSAdSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "portalId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interval" TEXT NOT NULL DEFAULT 'monthly',
    "features" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CMSPostTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CMSPortal_clientId_key" ON "CMSPortal"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSPortal_projectId_key" ON "CMSPortal"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSPortal_domain_key" ON "CMSPortal"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "CMSPortal_subdomain_key" ON "CMSPortal"("subdomain");

-- CreateIndex
CREATE INDEX "CMSPortal_companyId_idx" ON "CMSPortal"("companyId");

-- CreateIndex
CREATE INDEX "CMSPortal_clientId_idx" ON "CMSPortal"("clientId");

-- CreateIndex
CREATE INDEX "CMSPortal_projectId_idx" ON "CMSPortal"("projectId");

-- CreateIndex
CREATE INDEX "CMSPost_portalId_idx" ON "CMSPost"("portalId");

-- CreateIndex
CREATE INDEX "CMSPost_authorId_idx" ON "CMSPost"("authorId");

-- CreateIndex
CREATE INDEX "CMSPost_status_idx" ON "CMSPost"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CMSPost_portalId_slug_key" ON "CMSPost"("portalId", "slug");

-- CreateIndex
CREATE INDEX "CMSPage_portalId_idx" ON "CMSPage"("portalId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSPage_portalId_slug_key" ON "CMSPage"("portalId", "slug");

-- CreateIndex
CREATE INDEX "CMSMenu_portalId_idx" ON "CMSMenu"("portalId");

-- CreateIndex
CREATE INDEX "CMSCategory_portalId_idx" ON "CMSCategory"("portalId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSCategory_portalId_slug_key" ON "CMSCategory"("portalId", "slug");

-- CreateIndex
CREATE INDEX "CMSTag_portalId_idx" ON "CMSTag"("portalId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSTag_portalId_slug_key" ON "CMSTag"("portalId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CMSSEO_postId_key" ON "CMSSEO"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "CMSAdSettings_portalId_key" ON "CMSAdSettings"("portalId");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_portalId_idx" ON "NewsletterSubscriber"("portalId");

-- CreateIndex
CREATE INDEX "NewsletterSubscriber_email_idx" ON "NewsletterSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscriber_portalId_email_key" ON "NewsletterSubscriber"("portalId", "email");

-- CreateIndex
CREATE INDEX "SubscriptionPlan_companyId_idx" ON "SubscriptionPlan"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_companyId_code_key" ON "SubscriptionPlan"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "_CMSPostTags_AB_unique" ON "_CMSPostTags"("A", "B");

-- CreateIndex
CREATE INDEX "_CMSPostTags_B_index" ON "_CMSPostTags"("B");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES "JobOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSPortal" ADD CONSTRAINT "CMSPortal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSPortal" ADD CONSTRAINT "CMSPortal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSPortal" ADD CONSTRAINT "CMSPortal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSPortal" ADD CONSTRAINT "CMSPortal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSPost" ADD CONSTRAINT "CMSPost_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "CMSPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSPost" ADD CONSTRAINT "CMSPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSPost" ADD CONSTRAINT "CMSPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CMSCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSPage" ADD CONSTRAINT "CMSPage_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "CMSPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSMenu" ADD CONSTRAINT "CMSMenu_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "CMSPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSCategory" ADD CONSTRAINT "CMSCategory_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "CMSPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSTag" ADD CONSTRAINT "CMSTag_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "CMSPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSSEO" ADD CONSTRAINT "CMSSEO_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CMSPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CMSAdSettings" ADD CONSTRAINT "CMSAdSettings_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "CMSPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_portalId_fkey" FOREIGN KEY ("portalId") REFERENCES "CMSPortal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT "SubscriptionPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CMSPostTags" ADD CONSTRAINT "_CMSPostTags_A_fkey" FOREIGN KEY ("A") REFERENCES "CMSPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CMSPostTags" ADD CONSTRAINT "_CMSPostTags_B_fkey" FOREIGN KEY ("B") REFERENCES "CMSTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
