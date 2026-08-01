-- AlterTable
ALTER TABLE "Task" ADD COLUMN "externalId" TEXT,
ADD COLUMN "externalProvider" TEXT,
ADD COLUMN "externalThreadId" TEXT,
ADD COLUMN "externalChannelId" TEXT;
