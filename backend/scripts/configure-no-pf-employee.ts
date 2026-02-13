import { PrismaClient } from '@prisma/client';
import { PayrollService } from '../src/services/payroll.service';

const prisma = new PrismaClient();

async function main() {
    console.log('⚙️ Configuring Employee 2 (No PF) Structure...');

    // 1. Get Company
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found');

    // 2. Disable PF in Configuration (Set rates to 0 as requested "pf nahi ayyega")
    console.log('🚫 Disabling Provident Fund (PF)...');
    await prisma.statutoryConfig.update({
        where: { companyId: company.id },
        data: {
            pfEmployeeRate: 0,
            pfEmployerRate: 0,
            pfBasicLimit: 0, // Ensure no wage base
            // Keep PT enabled
            professionalTaxEnabled: true
        }
    });

    // 3. Create or Update Employee 2 (Sanket)
    // CTC: 144,000 (12k/month)
    const empData = {
        firstName: 'Sanket',
        lastName: 'Patil', // Assuming generic last name if not provided
        email: 'sanket.patil@example.com',
        ctc: 144000
    };

    let emp = await prisma.employee.findFirst({
        where: { email: empData.email, companyId: company.id }
    });

    if (!emp) {
        // Search by name if email not found (from previous script)
        emp = await prisma.employee.findFirst({
            where: { firstName: 'Sanket', companyId: company.id }
        });
    }

    if (!emp) {
        // Fetch a department to link
        const department = await prisma.department.findFirst({ where: { companyId: company.id } });

        emp = await prisma.employee.create({
            data: {
                companyId: company.id,
                firstName: empData.firstName,
                lastName: empData.lastName,
                email: empData.email,
                dateOfJoining: new Date(),
                status: 'active',
                employeeId: `EMP-${Math.floor(Math.random() * 10000)}`,
                departmentId: department?.id
            }
        });
        console.log(`Created Employee: ${emp.firstName}`);
    } else {
        console.log(`Found Employee: ${emp.firstName} (${emp.email})`);
    }

    // 4. Set Salary Structure
    // Components: Basic (6000), HRA (3000), Conveyance (1600), Special (1400)
    console.log('💰 Configuring Salary Structure...');

    // Clear existing
    try {
        await prisma.employeeSalaryStructure.delete({ where: { employeeId: emp.id } });
    } catch (e) { }

    const structure = await prisma.employeeSalaryStructure.create({
        data: {
            employeeId: emp.id,
            ctc: empData.ctc,
            netSalary: 0 // Will auto-calc
        }
    });

    const components = {
        'Basic Salary': 6000,
        'House Rent Allowance (HRA)': 3000,
        'Conveyance Allowance': 1600,
        'Special Allowance': 1400
    };

    let totalGross = 0;

    for (const [name, amount] of Object.entries(components)) {
        const comp = await prisma.salaryComponent.findFirst({
            where: { companyId: company.id, name: name }
        });

        if (comp) {
            await prisma.employeeSalaryComponent.create({
                data: {
                    structureId: structure.id,
                    componentId: comp.id,
                    monthlyAmount: amount
                }
            });
            totalGross += amount;
            console.log(`   - Added ${name}: ₹${amount}`);
        } else {
            console.warn(`   ⚠️ Component not found: ${name}`);
        }
    }

    console.log(`Total Gross: ₹${totalGross}`);

    // 5. Verify Calculation
    const statutory = await PayrollService.calculateStatutoryDeductions(company.id, components['Basic Salary'], totalGross);

    const pt = statutory.pt; // Should be 300 in Feb, 200 otherwise
    const pf = statutory.pf.employee; // Should be 0
    const net = totalGross - pt - pf; // Should match user request (11800/11700)

    console.log('\n------------------------------------------------');
    console.log(`VERIFICATION RESULT FOR ${emp.firstName.toUpperCase()}`);
    console.log('------------------------------------------------');
    console.log(`Gross Salary:       ₹${totalGross.toLocaleString()}`);
    console.log(`PF (Employee):      ₹${pf} (Target: 0)`);
    console.log(`Professional Tax:   ₹${pt} (Target: 200/300)`);
    console.log(`Net Salary:         ₹${net.toLocaleString()} (Target: 11800/11700)`);
    console.log('------------------------------------------------');

    if (pf !== 0) {
        console.error('❌ FAILURE: PF is not 0!');
    } else {
        console.log('✅ SUCCESS: PF is disabled.');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
