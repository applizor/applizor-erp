-- CreateTable
CREATE TABLE "EmployeeTeam" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTeam_companyId_name_key" ON "EmployeeTeam"("companyId", "name");

-- CreateIndex
CREATE INDEX "EmployeeTeam_companyId_idx" ON "EmployeeTeam"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTeamMember_teamId_employeeId_key" ON "EmployeeTeamMember"("teamId", "employeeId");

-- CreateIndex
CREATE INDEX "EmployeeTeamMember_teamId_idx" ON "EmployeeTeamMember"("teamId");

-- CreateIndex
CREATE INDEX "EmployeeTeamMember_employeeId_idx" ON "EmployeeTeamMember"("employeeId");

-- AddForeignKey
ALTER TABLE "EmployeeTeam" ADD CONSTRAINT "EmployeeTeam_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeamMember" ADD CONSTRAINT "EmployeeTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "EmployeeTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeamMember" ADD CONSTRAINT "EmployeeTeamMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
