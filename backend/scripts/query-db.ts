import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const companies = await prisma.company.findMany();
  console.log('--- COMPANY STATES ---');
  console.log(companies.map(c => ({ company: c.name, stateId: c.stateId })));

  const employees = await prisma.employee.findMany();
  console.log('--- EMPLOYEE STATES ---');
  console.log(employees.map(e => ({ employee: `${e.firstName} ${e.lastName}`, stateId: e.ptState })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
