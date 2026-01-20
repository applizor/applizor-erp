import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

const SYSTEM_MODULES = [
  'Dashboard', 'Company', 'User', 'Role',
  'Client', 'Lead', 'Invoice', 'Payment', 'Subscription',
  'Department', 'Position', 'Employee', 'Attendance', 'Leave', 'Shift', 'Payroll', 'Asset',
  'Recruitment', 'Document'
];

async function main() {
  console.log('🌱 Starting seed...');

  // Create default company
  const company = await prisma.company.upsert({
    where: { id: 'b81a0e3f-9301-43f7-a633-6db7e5fa54b0' },
    update: {},
    create: {
      id: 'b81a0e3f-9301-43f7-a633-6db7e5fa54b0',
      name: 'Applizor Softech LLP',
      legalName: 'Applizor Softech LLP',
      email: 'admin@applizor.com',
      phone: '+91-1234567890',
      address: '123 Business Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      gstin: '27AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      isActive: true,
    },
  });

  console.log('✅ Company created:', company.name);

  // Create default admin user
  const hashedPassword = await hashPassword('admin123'); // Default password

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@applizor.com' },
    update: {
      companyId: company.id, // Ensure Admin belongs to the correct company on re-seed
      password: hashedPassword, // Optional: Reset password to known default if needed
    },
    create: {
      email: 'admin@applizor.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+91-1234567890',
      isActive: true,
      companyId: company.id,
      roles: {
        create: [] // Will assign role relation manually below if not exists, but simpler to use userRole upsert
      }
    },
  });

  console.log('✅ Admin user created:', adminUser.email);
  console.log('   Default password: admin123');

  // Create Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Full system access',
      isSystem: true,
    },
  });

  console.log('✅ Admin role created');

  // Assign admin role to user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Admin role assigned to user');

  // Assign all permissions to admin role
  // Using SYSTEM_MODULES logic instead of Permission model
  for (const module of SYSTEM_MODULES) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_module: {
          roleId: adminRole.id,
          module: module
        }
      },
      update: {
        createLevel: 'all',
        readLevel: 'all',
        updateLevel: 'all',
        deleteLevel: 'all'
      },
      create: {
        roleId: adminRole.id,
        module: module,
        createLevel: 'all',
        readLevel: 'all',
        updateLevel: 'all',
        deleteLevel: 'all'
      }
    });
  }

  console.log('✅ All permissions assigned to admin role');

  // Create Default Employee Role
  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: {
      name: 'Employee',
      description: 'Standard employee access',
      isSystem: false,
    },
  });

  const employeePermissions = [
    { module: 'Dashboard', read: 'all' },
    { module: 'Employee', read: 'owned', update: 'owned' },
    { module: 'Leave', create: 'owned', read: 'owned', update: 'owned', delete: 'owned' },
    { module: 'Attendance', create: 'owned', read: 'owned' },
    { module: 'Payroll', read: 'owned' },
    { module: 'Shift', read: 'owned' },
    { module: 'Document', read: 'owned', create: 'owned' }, // Upload docs
  ];

  for (const p of employeePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_module: {
          roleId: employeeRole.id,
          module: p.module
        }
      },
      update: {},
      create: {
        roleId: employeeRole.id,
        module: p.module,
        createLevel: (p as any).create || 'none',
        readLevel: (p as any).read || 'none',
        updateLevel: (p as any).update || 'none',
        deleteLevel: (p as any).delete || 'none'
      }
    });
  }

  console.log('✅ Employee role and permissions created');

  // Create some default leave types
  const leaveTypes = [
    { name: 'Casual Leave', days: 12, isPaid: true },
    { name: 'Sick Leave', days: 12, isPaid: true },
    { name: 'Earned Leave', days: 15, isPaid: true },
    { name: 'Unpaid Leave', days: 0, isPaid: false },
  ];

  for (const leaveType of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: leaveType.name },
      update: {},
      create: leaveType,
    });
  }

  console.log('✅ Leave types created');

  // Create some default departments
  const departments = [
    { name: 'Engineering', description: 'Software Development Team' },
    { name: 'Sales', description: 'Sales and Business Development' },
    { name: 'HR', description: 'Human Resources' },
    { name: 'Accounts', description: 'Finance and Accounting' },
    { name: 'Management', description: 'Management Team' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: {
        companyId_name: {
          companyId: company.id,
          name: dept.name,
        },
      },
      update: {},
      create: {
        companyId: company.id,
        name: dept.name,
        description: dept.description,
        isActive: true,
      },
    });
  }

  console.log('✅ Departments created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Default Credentials:');
  console.log('   Email: admin@applizor.com');
  console.log('   Password: admin123');
  console.log('\n⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
