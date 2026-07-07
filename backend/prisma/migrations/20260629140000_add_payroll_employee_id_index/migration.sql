-- Add index on Payroll.employeeId for faster queries by employee
CREATE INDEX IF NOT EXISTS "Payroll_employeeId_idx" ON "Payroll" ("employeeId");
