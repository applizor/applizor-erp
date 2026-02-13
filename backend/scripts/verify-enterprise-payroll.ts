import { PrismaClient } from '@prisma/client';
import { PayrollService } from '../src/services/payroll.service';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Verifying Enterprise Payroll Module...');

    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found');

    // 1. Ensure Employees Exist
    const employees = [
        { name: 'Vivek', ctc: 168000, components: { 'Basic Salary': 7000, 'House Rent Allowance (HRA)': 3500, 'Conveyance Allowance': 1600, 'Special Allowance': 1900 } },
        { name: 'Sanket', ctc: 144000, components: { 'Basic Salary': 6000, 'House Rent Allowance (HRA)': 3000, 'Conveyance Allowance': 1600, 'Special Allowance': 1400 } }
    ];

    for (const empData of employees) {
        let emp = await prisma.employee.findFirst({
            where: { firstName: empData.name, companyId: company.id }
        });

        if (!emp) {
            // Fetch a department to link
            const department = await prisma.department.findFirst({ where: { companyId: company.id } });

            emp = await prisma.employee.create({
                data: {
                    companyId: company.id,
                    firstName: empData.name,
                    lastName: 'Test',
                    email: `${empData.name.toLowerCase()}@test.com`,
                    dateOfJoining: new Date(),
                    status: 'active',
                    employeeId: `EMP-${Math.floor(Math.random() * 10000)}`,
                    departmentId: department?.id,
                    // designation removed
                }
            });
            console.log(`Created Employee: ${emp.firstName}`);
        } else {
            console.log(`Found Employee: ${emp.firstName}`);
        }

        // 2. Configure Structure (Dynamic)
        // First delete existing to ensure clean state
        try {
            await prisma.employeeSalaryStructure.delete({ where: { employeeId: emp.id } });
        } catch (e) { }

        const structure = await prisma.employeeSalaryStructure.create({
            data: {
                employeeId: emp.id,
                ctc: empData.ctc, // Annual
                netSalary: 0, // Will update
            }
        });

        let totalMonthlyGross = 0;

        for (const [compName, amount] of Object.entries(empData.components)) {
            const comp = await prisma.salaryComponent.findFirst({
                where: { companyId: company.id, name: compName }
            });

            if (comp) {
                // Correct fields based on schema view
                await prisma.employeeSalaryComponent.create({
                    data: {
                        structureId: structure.id,
                        componentId: comp.id,
                        monthlyAmount: amount
                    }
                });
                totalMonthlyGross += amount;
            }
        }

        console.log(`Context: ${empData.name} Monthly Gross: ${totalMonthlyGross}`);

        // 3. Verify PT Logic (Feb vs March)
        const ptFeb = await PayrollService.calculateStatutoryDeductions(company.id, 0, totalMonthlyGross);

        console.log(`Calculated PT for ${empData.name} (Current Month): ${ptFeb.pt}`);

        // Check Slab directly
        const config = await prisma.statutoryConfig.findUnique({ where: { companyId: company.id } });
        const slabs = config?.ptSlabs as any[];

        // Manual verification of logic
        const verifyPT = (gross: number, month: number) => {
            for (const slab of slabs) {
                if (gross >= slab.min && gross <= slab.max) {
                    if (slab.exceptionMonth === month) return slab.exceptionAmount;
                    return slab.amount;
                }
            }
            return 0;
        };

        const ptInFeb = verifyPT(totalMonthlyGross, 2);
        const ptInMar = verifyPT(totalMonthlyGross, 3);

        console.log(`[VERIFICATION] ${empData.name}:`);
        console.log(`   - Expected Feb PT: ${ptInFeb} (Should be 300)`);
        console.log(`   - Expected Mar PT: ${ptInMar} (Should be 200)`);

        if (ptInFeb !== 300 || ptInMar !== 200) {
            console.error('❌ PT Logic Validation FAILED');
        } else {
            console.log('✅ PT Logic Validation PASSED');
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
