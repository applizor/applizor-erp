/*
  Warnings:

  - You are about to drop the `ActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AdUnit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CMSAdSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CMSCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CMSMenu` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CMSPage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CMSPortal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CMSPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CMSSEO` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CMSTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Media` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NewsletterSubscriber` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PortalUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SocialMediaAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SocialPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ThemeSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_CMSPostTags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "AdUnit" DROP CONSTRAINT "AdUnit_portalId_fkey";

-- DropForeignKey
ALTER TABLE "CMSAdSettings" DROP CONSTRAINT "CMSAdSettings_portalId_fkey";

-- DropForeignKey
ALTER TABLE "CMSCategory" DROP CONSTRAINT "CMSCategory_portalId_fkey";

-- DropForeignKey
ALTER TABLE "CMSMenu" DROP CONSTRAINT "CMSMenu_portalId_fkey";

-- DropForeignKey
ALTER TABLE "CMSPage" DROP CONSTRAINT "CMSPage_portalId_fkey";

-- DropForeignKey
ALTER TABLE "CMSPortal" DROP CONSTRAINT "CMSPortal_clientId_fkey";

-- DropForeignKey
ALTER TABLE "CMSPortal" DROP CONSTRAINT "CMSPortal_companyId_fkey";

-- DropForeignKey
ALTER TABLE "CMSPortal" DROP CONSTRAINT "CMSPortal_planId_fkey";

-- DropForeignKey
ALTER TABLE "CMSPortal" DROP CONSTRAINT "CMSPortal_projectId_fkey";

-- DropForeignKey
ALTER TABLE "CMSPost" DROP CONSTRAINT "CMSPost_authorId_fkey";

-- DropForeignKey
ALTER TABLE "CMSPost" DROP CONSTRAINT "CMSPost_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CMSPost" DROP CONSTRAINT "CMSPost_portalId_fkey";

-- DropForeignKey
ALTER TABLE "CMSSEO" DROP CONSTRAINT "CMSSEO_postId_fkey";

-- DropForeignKey
ALTER TABLE "CMSTag" DROP CONSTRAINT "CMSTag_portalId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_portalId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_uploadedBy_fkey";

-- DropForeignKey
ALTER TABLE "NewsletterSubscriber" DROP CONSTRAINT "NewsletterSubscriber_portalId_fkey";

-- DropForeignKey
ALTER TABLE "PortalUser" DROP CONSTRAINT "PortalUser_portalId_fkey";

-- DropForeignKey
ALTER TABLE "SocialMediaAccount" DROP CONSTRAINT "SocialMediaAccount_portalId_fkey";

-- DropForeignKey
ALTER TABLE "SocialPost" DROP CONSTRAINT "SocialPost_accountId_fkey";

-- DropForeignKey
ALTER TABLE "ThemeSettings" DROP CONSTRAINT "ThemeSettings_portalId_fkey";

-- DropForeignKey
ALTER TABLE "_CMSPostTags" DROP CONSTRAINT "_CMSPostTags_A_fkey";

-- DropForeignKey
ALTER TABLE "_CMSPostTags" DROP CONSTRAINT "_CMSPostTags_B_fkey";

-- DropTable
DROP TABLE "ActivityLog";

-- DropTable
DROP TABLE "AdUnit";

-- DropTable
DROP TABLE "CMSAdSettings";

-- DropTable
DROP TABLE "CMSCategory";

-- DropTable
DROP TABLE "CMSMenu";

-- DropTable
DROP TABLE "CMSPage";

-- DropTable
DROP TABLE "CMSPortal";

-- DropTable
DROP TABLE "CMSPost";

-- DropTable
DROP TABLE "CMSSEO";

-- DropTable
DROP TABLE "CMSTag";

-- DropTable
DROP TABLE "Comment";

-- DropTable
DROP TABLE "Media";

-- DropTable
DROP TABLE "NewsletterSubscriber";

-- DropTable
DROP TABLE "PortalUser";

-- DropTable
DROP TABLE "SocialMediaAccount";

-- DropTable
DROP TABLE "SocialPost";

-- DropTable
DROP TABLE "ThemeSettings";

-- DropTable
DROP TABLE "_CMSPostTags";
