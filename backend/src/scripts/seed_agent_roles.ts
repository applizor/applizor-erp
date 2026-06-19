import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SYSTEM_MODULES = [
    'Dashboard', 'Company', 'User', 'Role',
    'Client', 'Lead', 'LeadActivity', 'Quotation', 'QuotationTemplate', 'Invoice', 'Payment', 'Subscription', 'Service',
    'Department', 'Position', 'Employee', 'Attendance', 'Leave', 'LeaveType', 'LeaveBalance', 'Shift', 'ShiftRoster', 'Payroll', 'Asset',
    'SalaryComponent', 'SalaryStructure',
    'Recruitment', 'RecruitmentBoard',
    'Performance', 'OKR',
    'Document',
    'Project', 'ProjectTask',
    'Timesheet',
    'Holiday', 'Contract', 'Accounting', 'NewsCMS', 'Policy',
    'Certificate', 'CertificateTemplate',
    'Student', 'Course', 'CourseEnrollment', 'OnlineClass', 'Lecture', 'Exam',
];

interface PermissionInput {
    module: string;
    createLevel?: string;
    readLevel?: string;
    updateLevel?: string;
    deleteLevel?: string;
}

interface AgentRoleDef {
    name: string;
    description: string;
    userId: string;
    permissions: PermissionInput[];
}

const AGENT_ROLES: AgentRoleDef[] = [
    {
        name: 'ChiefOfStaff',
        description: 'Central orchestrator agent',
        userId: '5227bf4a-7610-458d-b1a6-65039bc98bdc',
        permissions: SYSTEM_MODULES.map(module => ({
            module,
            createLevel: 'all',
            readLevel: 'all',
            updateLevel: 'all',
            deleteLevel: 'all'
        }))
    },
    {
        name: 'BackendDeveloper',
        description: 'AI Backend Developer',
        userId: '12434163-713e-4fa7-af6a-0c42339f15ca',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Project', readLevel: 'all' },
            { module: 'ProjectTask', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' }
        ]
    },
    {
        name: 'FrontendDeveloper',
        description: 'AI Frontend Developer',
        userId: '2e617c74-09b4-4561-b451-9a6d33251176',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Project', readLevel: 'all' },
            { module: 'ProjectTask', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' }
        ]
    },
    {
        name: 'QaAgent',
        description: 'AI QA Agent',
        userId: 'a20a185e-e594-41ea-a4e1-61b0404ef5ba',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Project', readLevel: 'all' },
            { module: 'ProjectTask', readLevel: 'all', updateLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' },
            { module: 'Document', readLevel: 'all' }
        ]
    },
    {
        name: 'HrAgent',
        description: 'AI HR Representative',
        userId: '89c5b606-b3c4-47cb-8c65-68255772e844',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Employee', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Department', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Position', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Leave', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'LeaveType', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'LeaveBalance', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Attendance', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Shift', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'ShiftRoster', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Holiday', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Recruitment', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'RecruitmentBoard', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Payroll', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'SalaryComponent', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'SalaryStructure', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Performance', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'OKR', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' }
        ]
    },
    {
        name: 'SalesAgent',
        description: 'AI Sales Representative',
        userId: '0351249a-0d1c-4671-95e8-2100903ecc3c',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Client', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Lead', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'LeadActivity', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Quotation', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'QuotationTemplate', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Invoice', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Payment', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Service', createLevel: 'all', readLevel: 'all', updateLevel: 'all' },
            { module: 'Subscription', createLevel: 'all', readLevel: 'all', updateLevel: 'all' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' }
        ]
    },
    {
        name: 'ResearchAgent',
        description: 'AI Technical Researcher',
        userId: 'b4ee72e3-f239-4f08-be46-2e18874cb43c',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Project', readLevel: 'all' },
            { module: 'ProjectTask', readLevel: 'all' },
            { module: 'NewsCMS', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Policy', readLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' }
        ]
    },
    {
        name: 'BusinessAnalystAgent',
        description: 'AI Business Analyst',
        userId: 'f051a0ec-8450-4a9b-add9-85436160d08d',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Project', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'ProjectTask', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'OKR', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Performance', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' }
        ]
    },
    {
        name: 'ProjectManagerAgent',
        description: 'AI Project Manager',
        userId: '963b29ce-b0c5-4659-a31e-40680fff8949',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Project', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'ProjectTask', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'OKR', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Performance', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' }
        ]
    },
    {
        name: 'ClientCommAgent',
        description: 'AI Client Communication Representative',
        userId: 'bfd5e287-e7ce-4ce3-bae5-f2c5c1b75086',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Client', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Lead', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'LeadActivity', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' }
        ]
    },
    {
        name: 'MarketingAgent',
        description: 'AI Brand Planner',
        userId: 'edc779d6-b980-4f11-a68f-c9a4c1a38b99',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Project', readLevel: 'all' },
            { module: 'ProjectTask', readLevel: 'all' },
            { module: 'NewsCMS', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Policy', readLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' }
        ]
    },
    {
        name: 'FinanceAgent',
        description: 'AI Auditor',
        userId: '3cd23304-81e6-4611-bc47-c30685d20b8f',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Invoice', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Payment', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Accounting', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Payroll', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Quotation', readLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' }
        ]
    },
    {
        name: 'DevOpsAgent',
        description: 'AI DevOps Engineer',
        userId: '5bfd77ce-e7ef-4afd-8694-685c7a20ab58',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Project', readLevel: 'all' },
            { module: 'ProjectTask', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' }
        ]
    },
    {
        name: 'DatabaseAgent',
        description: 'AI Database Architect',
        userId: '3622836c-b6bd-4f43-97b3-16f26c0dfd8d',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Project', readLevel: 'all' },
            { module: 'ProjectTask', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' }
        ]
    },
    {
        name: 'DocumentationAgent',
        description: 'AI Documentation Specialist',
        userId: '8dadd940-6528-4591-a5f8-9b76f5c493b0',
        permissions: [
            { module: 'Dashboard', readLevel: 'all' },
            { module: 'Project', readLevel: 'all' },
            { module: 'ProjectTask', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
            { module: 'Timesheet', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned', deleteLevel: 'owned' },
            { module: 'Document', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' }
        ]
    }
];

async function main() {
    console.log('🌱 Seeding Agent Roles & Permissions...');

    // Get default company
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'Applizor Tech',
                email: 'admin@applizor.com',
                country: 'India',
                currency: 'USD',
                isActive: true
            }
        });
        console.log('Created default company:', company.id);
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    for (const agent of AGENT_ROLES) {
        console.log(`Processing Agent Role: ${agent.name}...`);

        // 1. Create/Upsert Role
        const role = await prisma.role.upsert({
            where: { name: agent.name },
            update: {
                description: agent.description,
                isSystem: true
            },
            create: {
                name: agent.name,
                description: agent.description,
                isSystem: true
            }
        });

        // 2. Create Permissions
        for (const perm of agent.permissions) {
            await prisma.rolePermission.upsert({
                where: {
                    roleId_module: {
                        roleId: role.id,
                        module: perm.module
                    }
                },
                update: {
                    createLevel: perm.createLevel || 'none',
                    readLevel: perm.readLevel || 'none',
                    updateLevel: perm.updateLevel || 'none',
                    deleteLevel: perm.deleteLevel || 'none'
                },
                create: {
                    roleId: role.id,
                    module: perm.module,
                    createLevel: perm.createLevel || 'none',
                    readLevel: perm.readLevel || 'none',
                    updateLevel: perm.updateLevel || 'none',
                    deleteLevel: perm.deleteLevel || 'none'
                }
            });
        }

        // 3. Upsert User (with matching stable ID)
        const userEmail = `${agent.name.toLowerCase()}@applizor.com`;
        const user = await prisma.user.upsert({
            where: { id: agent.userId },
            update: {
                email: userEmail,
                firstName: agent.name,
                lastName: 'Agent',
                companyId: company.id,
                isActive: true
            },
            create: {
                id: agent.userId,
                email: userEmail,
                password: hashedPassword,
                firstName: agent.name,
                lastName: 'Agent',
                companyId: company.id,
                isActive: true
            }
        });

        // 4. Link User to Role
        await prisma.userRole.upsert({
            where: {
                userId_roleId: {
                    userId: user.id,
                    roleId: role.id
                }
            },
            update: {},
            create: {
                userId: user.id,
                roleId: role.id
            }
        });

        console.log(`✅ Successfully seeded role and mapped user for: ${agent.name}`);
    }

    console.log('🎉 Seeding Agent Roles & Permissions Complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
