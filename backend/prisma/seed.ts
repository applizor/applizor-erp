import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Create Company
    console.log('📊 Creating company...');
    let company = await prisma.company.findFirst({
        where: { name: 'Applizor Softech LLP' }
    });

    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'Applizor Softech LLP',
                legalName: 'Applizor Softech LLP',
                email: 'connect@applizor.com',
                phone: '9130309480',
                address: '209, WARD NO 7, VISHWAKARMA MUHALLA, GARROLI',
                city: 'Chhatarpur',
                state: 'Madhya Pradesh',
                country: 'India',
                pincode: '471201',
                currency: 'INR',
                isActive: true
            }
        });
        console.log(`✅ Company created: ${company.name}`);
    } else {
        console.log(`✅ Company already exists: ${company.name}`);
    }

    // 2. Create Roles
    console.log('👥 Creating roles...');
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'Full system access',
            isSystem: true
        }
    });

    const hrRole = await prisma.role.upsert({
        where: { name: 'HR' },
        update: {},
        create: {
            name: 'HR',
            description: 'Human Resources Manager',
            isSystem: false
        }
    });

    const employeeRole = await prisma.role.upsert({
        where: { name: 'Employee' },
        update: {},
        create: {
            name: 'Employee',
            description: 'Regular Employee',
            isSystem: false
        }
    });
    console.log('✅ Roles created: Admin, HR, Employee');

    // 3. Create Admin Permissions (Full Access)
    console.log('🔐 Creating admin permissions...');
    const modules = [
        'Dashboard', 'Company', 'User', 'Role',
        'Client', 'Lead', 'LeadActivity',
        'Quotation', 'Invoice', 'Payment', 'Subscription',
        'Department', 'Position', 'Employee', 'Attendance', 'Leave',
        'LeaveType', 'LeaveBalance', 'Shift', 'ShiftRoster', 'Payroll', 'Asset',
        'Recruitment', 'Document', 'Holiday'
    ];

    for (const module of modules) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_module: {
                    roleId: adminRole.id,
                    module: module
                }
            },
            update: {},
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
    console.log(`✅ Admin permissions created for ${modules.length} modules`);

    // 4. Create HR Permissions (HR-specific access)
    console.log('🔐 Creating HR permissions...');
    const hrModules = {
        'Employee': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'Department': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'Position': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'Attendance': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'Leave': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'LeaveType': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'LeaveBalance': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'Shift': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'Recruitment': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'Payroll': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'Asset': { create: 'all', read: 'all', update: 'all', delete: 'all' },
        'Document': { create: 'all', read: 'all', update: 'all', delete: 'all' }
    };

    for (const [module, perms] of Object.entries(hrModules)) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_module: {
                    roleId: hrRole.id,
                    module: module
                }
            },
            update: {},
            create: {
                roleId: hrRole.id,
                module: module,
                createLevel: perms.create,
                readLevel: perms.read,
                updateLevel: perms.update,
                deleteLevel: perms.delete
            }
        });
    }
    console.log(`✅ HR permissions created for ${Object.keys(hrModules).length} modules`);

    // 5. Create Employee Permissions (Limited access)
    console.log('🔐 Creating employee permissions...');
    const empModules = {
        'Dashboard': { create: 'none', read: 'all', update: 'none', delete: 'none' },
        'Attendance': { create: 'owned', read: 'owned', update: 'owned', delete: 'none' },
        'Leave': { create: 'owned', read: 'owned', update: 'owned', delete: 'owned' },
        'Document': { create: 'owned', read: 'owned', update: 'owned', delete: 'none' }
    };

    for (const [module, perms] of Object.entries(empModules)) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_module: {
                    roleId: employeeRole.id,
                    module: module
                }
            },
            update: {},
            create: {
                roleId: employeeRole.id,
                module: module,
                createLevel: perms.create,
                readLevel: perms.read,
                updateLevel: perms.update,
                deleteLevel: perms.delete
            }
        });
    }
    console.log(`✅ Employee permissions created for ${Object.keys(empModules).length} modules`);

    // 6. Create Users
    console.log('👤 Creating users...');

    // Admin User
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@applizor.com' },
        update: {},
        create: {
            email: 'admin@applizor.com',
            password: hashedAdminPassword,
            firstName: 'Admin',
            lastName: 'User',
            companyId: company.id,
            isActive: true
        }
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id
            }
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: adminRole.id
        }
    });
    console.log('✅ Admin user created: admin@applizor.com / admin123');

    // HR User
    const hashedHRPassword = await bcrypt.hash('hr2@123', 10);
    const hrUser = await prisma.user.upsert({
        where: { email: 'hr@applizor.com' },
        update: {},
        create: {
            email: 'hr@applizor.com',
            password: hashedHRPassword,
            firstName: 'HR',
            lastName: 'Manager',
            companyId: company.id,
            isActive: true
        }
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: hrUser.id,
                roleId: hrRole.id
            }
        },
        update: {},
        create: {
            userId: hrUser.id,
            roleId: hrRole.id
        }
    });
    console.log('✅ HR user created: hr@applizor.com / hr2@123');

    // Employee User
    const hashedEmpPassword = await bcrypt.hash('emp1', 10);
    const empUser = await prisma.user.upsert({
        where: { email: 'emp1@test.com' },
        update: {},
        create: {
            email: 'emp1@test.com',
            password: hashedEmpPassword,
            firstName: 'Employee',
            lastName: 'One',
            companyId: company.id,
            isActive: true
        }
    });

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: empUser.id,
                roleId: employeeRole.id
            }
        },
        update: {},
        create: {
            userId: empUser.id,
            roleId: employeeRole.id
        }
    });
    console.log('✅ Employee user created: emp1@test.com / emp1');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Company: Applizor Softech LLP');
    console.log('   - Roles: Admin, HR, Employee');
    console.log('   - Users: 3 (admin, hr, employee)');
    console.log('   - Permissions: Configured for all roles');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
