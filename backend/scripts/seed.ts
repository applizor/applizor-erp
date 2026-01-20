import prisma from '../src/prisma/client';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Starting database seed...\n');

    try {
        // 1. Create Company
        console.log('📦 Creating company...');
        const company = await prisma.company.create({
            data: {
                name: 'Applizor Softech',
                legalName: 'Applizor Softech Private Limited',
                email: 'info@applizor.com',
                phone: '+91-1234567890',
                address: '123 Tech Park',
                city: 'Indore',
                state: 'Madhya Pradesh',
                country: 'India',
                pincode: '452001',
                gstin: '23XXXXX1234X1ZX',
                pan: 'AAACA1234A',
                enabledModules: ['HRMS', 'CRM', 'PAYROLL', 'PROJECTS']
            }
        });
        console.log(`✅ Company created: ${company.name}\n`);

        // 2. Create Admin User
        console.log('👤 Creating admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = await prisma.user.create({
            data: {
                companyId: company.id,
                email: 'admin@applizor.com',
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                roles: ['Admin'],
                isActive: true,
                permissions: {
                    Employee: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Department: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Position: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Leave: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    LeaveType: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    LeaveBalance: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Attendance: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Shift: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    ShiftRoster: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Holiday: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Asset: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                }
            }
        });
        console.log(`✅ Admin user created: ${adminUser.email}\n`);

        // 3. Create Departments
        console.log('🏢 Creating departments...');
        const hrDept = await prisma.department.create({
            data: {
                companyId: company.id,
                name: 'Human Resources',
                description: 'HR Department'
            }
        });

        const itDept = await prisma.department.create({
            data: {
                companyId: company.id,
                name: 'Information Technology',
                description: 'IT Department'
            }
        });
        console.log(`✅ Departments created: HR, IT\n`);

        // 4. Create Positions
        console.log('💼 Creating positions...');
        const hrManagerPos = await prisma.position.create({
            data: {
                companyId: company.id,
                title: 'HR Manager',
                description: 'Human Resources Manager'
            }
        });

        const developerPos = await prisma.position.create({
            data: {
                companyId: company.id,
                title: 'Software Developer',
                description: 'Software Development Engineer'
            }
        });
        console.log(`✅ Positions created: HR Manager, Software Developer\n`);

        // 5. Create Shifts
        console.log('⏰ Creating shifts...');
        const generalShift = await prisma.shift.create({
            data: {
                companyId: company.id,
                name: 'General Shift',
                startTime: '09:00',
                endTime: '18:00',
                workingHours: 9,
                isActive: true
            }
        });
        console.log(`✅ Shift created: General Shift (9 AM - 6 PM)\n`);

        // 6. Create HR User & Employee
        console.log('👔 Creating HR user and employee...');
        const hrPassword = await bcrypt.hash('hr123', 10);
        const hrUser = await prisma.user.create({
            data: {
                companyId: company.id,
                email: 'hr@applizor.com',
                password: hrPassword,
                firstName: 'HR',
                lastName: 'Manager',
                roles: ['HR Manager'],
                isActive: true,
                permissions: {
                    Employee: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Department: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Position: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Leave: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    LeaveType: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    LeaveBalance: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Attendance: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Shift: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    ShiftRoster: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Holiday: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                    Asset: { readLevel: 'all', createLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
                }
            }
        });

        const hrEmployee = await prisma.employee.create({
            data: {
                companyId: company.id,
                userId: hrUser.id,
                employeeId: 'EMP001',
                firstName: 'HR',
                lastName: 'Manager',
                email: 'hr@applizor.com',
                phone: '+91-9876543210',
                gender: 'Male',
                dateOfBirth: new Date('1985-01-15'),
                dateOfJoining: new Date('2020-01-01'),
                departmentId: hrDept.id,
                positionId: hrManagerPos.id,
                shiftId: generalShift.id,
                salary: 80000,
                employmentType: 'Permanent',
                status: 'active',
                currentAddress: 'Indore, MP',
                permanentAddress: 'Indore, MP',
                createdById: adminUser.id
            }
        });
        console.log(`✅ HR Manager created: ${hrEmployee.email}\n`);

        // 7. Create Test Employee
        console.log('👨‍💻 Creating test employee...');
        const empPassword = await bcrypt.hash('emp123', 10);
        const empUser = await prisma.user.create({
            data: {
                companyId: company.id,
                email: 'employee@applizor.com',
                password: empPassword,
                firstName: 'Test',
                lastName: 'Employee',
                roles: ['Employee'],
                isActive: true,
                permissions: {
                    Employee: { readLevel: 'owned', createLevel: 'none', updateLevel: 'none', deleteLevel: 'none' },
                    Leave: { readLevel: 'owned', createLevel: 'owned', updateLevel: 'owned', deleteLevel: 'none' },
                    LeaveBalance: { readLevel: 'owned', createLevel: 'none', updateLevel: 'none', deleteLevel: 'none' },
                    Attendance: { readLevel: 'owned', createLevel: 'owned', updateLevel: 'owned', deleteLevel: 'none' },
                }
            }
        });

        const testEmployee = await prisma.employee.create({
            data: {
                companyId: company.id,
                userId: empUser.id,
                employeeId: 'EMP002',
                firstName: 'Test',
                lastName: 'Employee',
                email: 'employee@applizor.com',
                phone: '+91-9876543211',
                gender: 'Male',
                dateOfBirth: new Date('1995-06-20'),
                dateOfJoining: new Date('2023-01-15'),
                departmentId: itDept.id,
                positionId: developerPos.id,
                shiftId: generalShift.id,
                salary: 50000,
                employmentType: 'Permanent',
                status: 'active',
                currentAddress: 'Indore, MP',
                permanentAddress: 'Indore, MP',
                createdById: adminUser.id
            }
        });
        console.log(`✅ Test Employee created: ${testEmployee.email}\n`);

        // 8. Create Leave Types
        console.log('🏖️ Creating leave types...');

        // Earned Leave (Monthly Accrual)
        const earnedLeave = await prisma.leaveType.create({
            data: {
                name: 'Earned Leave',
                days: 18,
                isPaid: true,
                description: 'Earned leaves that accrue monthly',
                frequency: 'yearly',
                carryForward: true,
                maxCarryForward: 5,
                accrualType: 'monthly',
                accrualRate: 1.5,
                accrualStartMonth: 1,
                maxAccrual: 18,
                color: '#10B981',
                departmentIds: [],
                positionIds: [],
                employmentStatus: []
            }
        });

        // Casual Leave
        const casualLeave = await prisma.leaveType.create({
            data: {
                name: 'Casual Leave',
                days: 6,
                isPaid: true,
                description: 'Casual leave for personal reasons',
                frequency: 'yearly',
                carryForward: false,
                accrualType: 'yearly',
                color: '#3B82F6',
                departmentIds: [],
                positionIds: [],
                employmentStatus: []
            }
        });

        // Sick Leave
        const sickLeave = await prisma.leaveType.create({
            data: {
                name: 'Sick Leave',
                days: 8,
                isPaid: true,
                description: 'Leave for medical reasons',
                frequency: 'yearly',
                carryForward: false,
                proofRequired: true,
                accrualType: 'yearly',
                color: '#EF4444',
                departmentIds: [],
                positionIds: [],
                employmentStatus: []
            }
        });

        console.log(`✅ Leave types created: Earned (18), Casual (6), Sick (8)\n`);

        // 9. Create Leave Balances for current year
        console.log('💰 Creating leave balances...');
        const currentYear = new Date().getFullYear();

        // HR Manager balances
        await prisma.employeeLeaveBalance.createMany({
            data: [
                {
                    employeeId: hrEmployee.id,
                    leaveTypeId: earnedLeave.id,
                    year: currentYear,
                    allocated: 18,
                    used: 0,
                    carriedOver: 0
                },
                {
                    employeeId: hrEmployee.id,
                    leaveTypeId: casualLeave.id,
                    year: currentYear,
                    allocated: 6,
                    used: 0,
                    carriedOver: 0
                },
                {
                    employeeId: hrEmployee.id,
                    leaveTypeId: sickLeave.id,
                    year: currentYear,
                    allocated: 8,
                    used: 0,
                    carriedOver: 0
                }
            ]
        });

        // Test Employee balances
        await prisma.employeeLeaveBalance.createMany({
            data: [
                {
                    employeeId: testEmployee.id,
                    leaveTypeId: earnedLeave.id,
                    year: currentYear,
                    allocated: 18,
                    used: 0,
                    carriedOver: 0
                },
                {
                    employeeId: testEmployee.id,
                    leaveTypeId: casualLeave.id,
                    year: currentYear,
                    allocated: 6,
                    used: 0,
                    carriedOver: 0
                },
                {
                    employeeId: testEmployee.id,
                    leaveTypeId: sickLeave.id,
                    year: currentYear,
                    allocated: 8,
                    used: 0,
                    carriedOver: 0
                }
            ]
        });

        console.log(`✅ Leave balances created for both employees\n`);

        // 10. Create some holidays
        console.log('🎉 Creating holidays...');
        await prisma.holiday.createMany({
            data: [
                {
                    name: 'Republic Day',
                    date: new Date('2026-01-26'),
                    type: 'national',
                    isActive: true
                },
                {
                    name: 'Holi',
                    date: new Date('2026-03-14'),
                    type: 'national',
                    isActive: true
                },
                {
                    name: 'Independence Day',
                    date: new Date('2026-08-15'),
                    type: 'national',
                    isActive: true
                },
                {
                    name: 'Gandhi Jayanti',
                    date: new Date('2026-10-02'),
                    type: 'national',
                    isActive: true
                },
                {
                    name: 'Diwali',
                    date: new Date('2026-10-24'),
                    type: 'national',
                    isActive: true
                }
            ]
        });
        console.log(`✅ Holidays created\n`);

        console.log('='.repeat(60));
        console.log('✅ Database seeding completed successfully!');
        console.log('='.repeat(60));
        console.log('\n📋 Login Credentials:\n');
        console.log('Admin:');
        console.log('  Email: admin@applizor.com');
        console.log('  Password: admin123\n');
        console.log('HR Manager:');
        console.log('  Email: hr@applizor.com');
        console.log('  Password: hr123\n');
        console.log('Employee:');
        console.log('  Email: employee@applizor.com');
        console.log('  Password: emp123\n');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed()
    .then(() => {
        console.log('\n✨ Seed script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Seed script failed:', error);
        process.exit(1);
    });
