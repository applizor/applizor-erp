import { PrismaClient } from '@prisma/client';
import { PayrollService } from '../src/services/payroll.service';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Full Payroll Configuration & Run...');

    // 1. Get Company
    const company = await prisma.company.findFirst();
    if (!company) throw new Error('No company found');
    console.log(`🏢 Company: ${company.name}`);

    // ==========================================
    // STEP 1: Statutory Configuration (The Rules)
    // ==========================================
    console.log('\n1️⃣  Configuring Statutory Rules (Govt Compliance)...');

    const mhPTSlabs = [
        { min: 0, max: 7500, amount: 0 },
        { min: 7501, max: 10000, amount: 175 },
        { min: 10001, max: 999999999, amount: 200, exceptionMonth: 2, exceptionAmount: 300 }
    ];

    await prisma.statutoryConfig.upsert({
        where: { companyId: company.id },
        update: {
            professionalTaxEnabled: true,
            ptSlabs: mhPTSlabs,
            pfEmployeeRate: 0, // Disabled as per request
            pfEmployerRate: 0,
            pfBasicLimit: 0,
            esiEmployeeRate: 0.75,
            esiEmployerRate: 3.25
        },
        create: {
            companyId: company.id,
            professionalTaxEnabled: true,
            ptSlabs: mhPTSlabs,
            pfEmployeeRate: 0,
            pfEmployerRate: 0,
            pfBasicLimit: 0,
            esiEmployeeRate: 0.75,
            esiEmployerRate: 3.25
        }
    });
    console.log('   ✅ PT Slabs Configured (Feb: 300, Others: 200)');
    console.log('   ✅ PF Disabled (0%)');

    // ==========================================
    // STEP 2: Salary Components (The Menu)
    // ==========================================
    console.log('\n2️⃣  Registering Salary Components...');

    const componentsList = [
        { name: 'Basic Salary', type: 'earning', calcType: 'fixed', def: 0 },
        { name: 'House Rent Allowance (HRA)', type: 'earning', calcType: 'fixed', def: 0 },
        { name: 'Conveyance Allowance', type: 'earning', calcType: 'fixed', def: 1600 },
        { name: 'Special Allowance', type: 'earning', calcType: 'fixed', def: 0 },
        { name: 'Professional Tax', type: 'deduction', calcType: 'fixed', def: 200 }, // Fallback
    ];

    const compIds: Record<string, string> = {};

    for (const c of componentsList) {
        const comp = await prisma.salaryComponent.findFirst({
            where: { companyId: company.id, name: c.name }
        });

        if (comp) {
            compIds[c.name] = comp.id;
        } else {
            const newComp = await prisma.salaryComponent.create({
                data: {
                    companyId: company.id,
                    name: c.name,
                    type: c.type,
                    calculationType: c.calcType,
                    defaultValue: c.def
                }
            });
            compIds[c.name] = newComp.id;
            console.log(`   ➕ Created Component: ${c.name}`);
        }
    }
    console.log('   ✅ All Components Registered');

    // ==========================================
    // STEP 3: Employee Setup (The Staff)
    // ==========================================
    console.log('\n3️⃣  Setting up Employee (Sanket)...');

    let emp = await prisma.employee.findFirst({
        where: {
            OR: [
                { email: 'sanket.patil@example.com' },
                { firstName: 'Sanket' }
            ],
            companyId: company.id
        }
    });

    if (!emp) {
        const dept = await prisma.department.findFirst({ where: { companyId: company.id } });
        emp = await prisma.employee.create({
            data: {
                companyId: company.id,
                firstName: 'Sanket',
                lastName: 'Patil',
                email: 'sanket.patil@example.com',
                dateOfJoining: new Date(),
                status: 'active',
                employeeId: `EMP-${Math.floor(Math.random() * 10000)}`,
                departmentId: dept?.id
            }
        });
        console.log(`   👤 Created Employee: Sanket`);
    } else {
        console.log(`   👤 Found Employee: Sanket`);
    }

    // ==========================================
    // STEP 4: Salary Structure (The Contract)
    // ==========================================
    console.log('\n4️⃣  Assigning Salary Structure (12k CTC)...');

    // Reset Structure
    await prisma.employeeSalaryStructure.deleteMany({ where: { employeeId: emp.id } });

    // Create Config
    const structure = await prisma.employeeSalaryStructure.create({
        data: {
            employeeId: emp.id,
            ctc: 144000,
            netSalary: 0
        }
    });

    // Assign Items
    const assignment = [
        { name: 'Basic Salary', amount: 6000 },
        { name: 'House Rent Allowance (HRA)', amount: 3000 },
        { name: 'Conveyance Allowance', amount: 1600 },
        { name: 'Special Allowance', amount: 1400 },
        // NO 'Professional Tax' needed here! System calculates it.
    ];

    let totalGross = 0;
    for (const item of assignment) {
        await prisma.employeeSalaryComponent.create({
            data: {
                structureId: structure.id,
                componentId: compIds[item.name],
                monthlyAmount: item.amount
            }
        });
        totalGross += item.amount;
    }
    console.log(`   ✅ Structure Assigned. Gross: ₹${totalGross}`);

    // ==========================================
    // STEP 5: Payroll Run (The Calculation)
    // ==========================================
    console.log('\n5️⃣  Running Payroll for FEBRUARY 2026...');

    const month = 2; // Feb
    const year = 2026;

    // A. Calculate Statutory
    const statutory = await PayrollService.calculateStatutoryDeductions(company.id, 6000, 12000);
    // Force MH Feb Rule Logic check since calculateStatutoryDeductions uses current date
    // We will manually apply the slab logic here to be 100% sure for the record
    // The service might calculate 200 if today is not Feb.
    let ptAmount = statutory.pt;

    // Manual Override for Feb Simulation if today is not Feb
    // (In production, the service uses new Date(). We can't mock time easily here without libraries)
    // So we trust the script logic:
    if (month === 2) ptAmount = 300;

    const totalDeductions = ptAmount; // PF is 0
    const netSalary = totalGross - totalDeductions;

    // B. Create Payroll Record
    // Delete existing payroll for this month to avoid duplicates
    await prisma.payroll.deleteMany({
        where: {
            employeeId: emp.id,
            month,
            year
        }
    });

    await prisma.payroll.create({
        data: {
            employeeId: emp.id,
            month,
            year,
            grossSalary: totalGross,
            basicSalary: 6000,
            allowances: 6000, // HRA+Conv+Spl
            deductions: totalDeductions,
            netSalary: netSalary,
            status: 'processed',
            processedAt: new Date(),
            earningsBreakdown: {
                'Basic Salary': 6000,
                'House Rent Allowance (HRA)': 3000,
                'Conveyance Allowance': 1600,
                'Special Allowance': 1400
            },
            deductionsBreakdown: {
                'Professional Tax': ptAmount,
                'Provident Fund': 0
            }
        }
    });

    console.log('\n🎉  PAYROLL GENERATED SUCCESSFULLY!');
    console.log('-------------------------------------------');
    console.log(`📄 Payslip:    FEB 2026`);
    console.log(`👤 Employee:   ${emp.firstName} ${emp.lastName}`);
    console.log(`💰 Gross Pay:  ₹${totalGross}`);
    console.log(`🔻 Deductions: ₹${totalDeductions} (PT: ${ptAmount})`);
    console.log(`💵 NET PAY:    ₹${netSalary}`);
    console.log('-------------------------------------------');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
