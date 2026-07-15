import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Restoring Sanket Jamdade...");
  
  // 1. Delete the temp employee if it exists
  await prisma.employee.deleteMany({
    where: { email: 'sanket.sunil@safalcode.com' }
  });
  console.log("Deleted any temporary employee records for Sanket.");

  // 2. Re-create the employee with the original IDs and link to the user record
  const restored = await prisma.employee.create({
    data: {
      id: '6ec45e5c-1c90-4743-9287-73ef4e524a0f',
      companyId: 'b81a0e3f-9301-43f7-a633-6db7e5fa54b0',
      userId: '0d7a9a66-3d72-4651-9622-a30a6271ccca',
      employeeId: 'EMP-0004',
      firstName: 'Sanket',
      lastName: 'Sunil Jamdade',
      email: 'sanket.sunil@safalcode.com',
      phone: '8208351508',
      gender: 'Male',
      departmentId: 'a9e50298-d5db-4b87-8ab6-a8e12194321d',
      positionId: '020858a5-3766-4388-99cb-39f9af2c2879',
      status: 'active',
      employmentType: 'full-time',
      workLocation: 'Head Office',
      createdById: 'b4c0ba54-4a92-48fc-8a99-b27dd9de46f9'
    }
  });

  console.log("Sanket employee profile successfully restored!", restored);
}

main()
  .catch(err => console.error("Error restoring:", err))
  .finally(() => prisma.$disconnect());
