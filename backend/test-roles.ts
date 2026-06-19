import prisma from './src/prisma/client';

async function main() {
  console.log("=== ALL ROLES ===");
  const roles = await prisma.role.findMany({
    include: {
      permissions: {
        where: { module: 'Timesheet' }
      }
    }
  });

  roles.forEach(role => {
    console.log(`Role: "${role.name}" (isSystem: ${role.isSystem})`);
    if (role.permissions.length === 0) {
      console.log("  No Timesheet permissions assigned.");
    } else {
      role.permissions.forEach(perm => {
        console.log(`  Timesheet: read=${perm.readLevel}, create=${perm.createLevel}, update=${perm.updateLevel}, delete=${perm.deleteLevel}`);
      });
    }
  });
  
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
