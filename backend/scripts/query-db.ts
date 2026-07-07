import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const states = await prisma.state.findMany();
  console.log('--- STATES ---');
  console.log(states.map(s => ({ id: s.id, name: s.name, countryId: s.countryId, isActive: s.isActive })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
