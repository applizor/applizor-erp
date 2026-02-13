-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "canManageTasks" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "canManageTeam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canViewBudget" BOOLEAN NOT NULL DEFAULT false;
