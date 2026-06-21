import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log("Debugging role permissions in database...");
  const role = await prisma.role.findFirst({
    where: { name: 'BusinessAnalystAgent' },
    include: {
      permissions: {
        where: {
          module: { in: ['Project', 'ProjectTask', 'Timesheet'] }
        }
      }
    }
  });

  console.log("BusinessAnalystAgent Role:", JSON.stringify(role, null, 2));

  const rolePM = await prisma.role.findFirst({
    where: { name: 'ProjectManagerAgent' },
    include: {
      permissions: {
        where: {
          module: { in: ['Project', 'ProjectTask', 'Timesheet'] }
        }
      }
    }
  });

  console.log("ProjectManagerAgent Role:", JSON.stringify(rolePM, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
