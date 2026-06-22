-- AlterTable: Make projectId optional in Task
ALTER TABLE "Task" ALTER COLUMN "projectId" DROP NOT NULL;
