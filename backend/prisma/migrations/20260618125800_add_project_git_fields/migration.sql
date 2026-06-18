-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "gitBranch" TEXT DEFAULT 'main',
ADD COLUMN     "gitRepoUrl" TEXT,
ADD COLUMN     "systemPath" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AiAgent_role_key" ON "AiAgent"("role");
