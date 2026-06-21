import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log("Checking roles in ERP database...");
  const roles = await prisma.role.findMany({
    include: {
      permissions: true
    }
  });

  console.log(`Found ${roles.length} roles:`);
  for (const r of roles) {
    console.log(`\n- Role: ${r.name} (isSystem: ${r.isSystem})`);
    console.log(`  Permissions (non-none):`);
    const activePerms = r.permissions.filter((p: any) => 
      p.createLevel !== 'none' || p.readLevel !== 'none' || p.updateLevel !== 'none' || p.deleteLevel !== 'none'
    );
    for (const p of activePerms) {
      console.log(`    * Module: ${p.module} | C: ${p.createLevel} | R: ${p.readLevel} | U: ${p.updateLevel} | D: ${p.deleteLevel}`);
    }
  }

  console.log("\nChecking Admin / ChiefOfStaff users in ERP...");
  const users = await prisma.user.findMany({
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  for (const u of users) {
    const roleNames = u.roles.map((ur: any) => ur.role.name).join(', ');
    console.log(`- User: ${u.email} | Roles: ${roleNames}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
