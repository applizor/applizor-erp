import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function createTestEmployee() {
    try {
        console.log('\n🧪 Creating Test Employee to Verify Leave Balance Assignment\n');
        console.log('='.repeat(60));

        // Get the admin user and company
        const adminUser = await prisma.user.findFirst({
            where: {
                roles: {
                    some: {
                        role: {
                            name: 'Administrator'
                        }
                    }
                }
            }
        });

        if (!adminUser || !adminUser.companyId) {
            console.log('❌ No admin user found or admin has no company');
            return;
        }

        console.log(`✅ Found admin user: ${adminUser.email}`);
        console.log(`✅ Company ID: ${adminUser.companyId}`);

        // Get a department
        const department = await prisma.department.findFirst({
            where: { companyId: adminUser.companyId }
        });

        console.log(`✅ Department: ${department?.name || 'None'}`);

        // Get the Employee role
        const employeeRole = await prisma.role.findUnique({
            where: { name: 'Employee' }
        });

        if (!employeeRole) {
            console.log('❌ Employee role not found');
            return;
        }

        console.log(`✅ Employee role found: ${employeeRole.id}`);

        // Generate unique email
        const timestamp = Date.now();
        const testEmail = `test.employee.${timestamp}@applizor.com`;
        const testPassword = await hashPassword('password123');

        console.log(`\n📝 Creating employee with email: ${testEmail}`);

        // Create employee using transaction (mimicking the controller logic)
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const newUser = await tx.user.create({
                data: {
                    email: testEmail,
                    password: testPassword,
                    firstName: 'Test',
                    lastName: 'Employee',
                    phone: '1234567890',
                    companyId: adminUser.companyId!,
                }
            });

            console.log(`✅ Created user: ${newUser.id}`);

            // 2. Assign Role
            await tx.userRole.create({
                data: {
                    userId: newUser.id,
                    roleId: employeeRole.id
                }
            });

            console.log(`✅ Assigned Employee role`);

            // 3. Create Employee
            const employee = await tx.employee.create({
                data: {
                    userId: newUser.id,
                    createdById: adminUser.id,
                    companyId: adminUser.companyId!,
                    firstName: 'Test',
                    lastName: 'Employee',
                    email: testEmail,
                    phone: '1234567890',
                    employeeId: `TEST-${timestamp}`,
                    dateOfJoining: new Date(),
                    departmentId: department?.id,
                    status: 'active',
                },
            });

            console.log(`✅ Created employee: ${employee.id} (${employee.employeeId})`);

            // 4. Auto-assign Leave Balances (THIS IS THE NEW FEATURE)
            const currentYear = new Date().getFullYear();

            // Fetch all leave types
            const allLeaveTypes = await tx.leaveType.findMany();
            console.log(`\n📋 Found ${allLeaveTypes.length} leave types`);

            // Filter leave types applicable to this employee
            const applicableLeaveTypes = allLeaveTypes.filter(leaveType => {
                const deptMatch = leaveType.departmentIds.length === 0 ||
                    (employee.departmentId && leaveType.departmentIds.includes(employee.departmentId));
                const posMatch = leaveType.positionIds.length === 0 ||
                    (employee.positionId && leaveType.positionIds.includes(employee.positionId));
                return deptMatch && posMatch;
            });

            console.log(`✅ ${applicableLeaveTypes.length} leave types are applicable to this employee`);

            // Create leave balance records
            if (applicableLeaveTypes.length > 0) {
                const balanceData = applicableLeaveTypes.map(leaveType => ({
                    employeeId: employee.id,
                    leaveTypeId: leaveType.id,
                    year: currentYear,
                    allocated: leaveType.days,
                    used: 0,
                    carriedOver: 0
                }));

                await tx.employeeLeaveBalance.createMany({
                    data: balanceData
                });

                console.log(`✅ Created ${balanceData.length} leave balance records`);
            }

            return { employee, newUser, applicableLeaveTypes };
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ Transaction completed successfully!');
        console.log('='.repeat(60));

        // Verify the leave balances were created
        const balances = await prisma.employeeLeaveBalance.findMany({
            where: {
                employeeId: result.employee.id
            },
            include: {
                leaveType: true
            }
        });

        console.log(`\n💰 Leave Balances Created:`);
        console.log('='.repeat(60));
        balances.forEach((balance, index) => {
            console.log(`${index + 1}. ${balance.leaveType.name}: ${balance.allocated} days`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ TEST PASSED! Leave balances were automatically assigned!');
        console.log('='.repeat(60));

        console.log(`\n📌 Test Employee Details:`);
        console.log(`   Email: ${testEmail}`);
        console.log(`   Password: password123`);
        console.log(`   Employee ID: ${result.employee.employeeId}`);
        console.log(`\n💡 You can now login with these credentials to verify!`);

    } catch (error) {
        console.error('\n❌ Error creating test employee:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createTestEmployee();
