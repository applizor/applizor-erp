import { Request, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import paymentService from '../services/payment.service';
import { hashPassword } from '../utils/password';
import { sendEmail } from '../services/email.service';
import { runWithoutCompanyContext } from '../utils/context';
import {
    getOrCreatePlatformCompany,
    getPlatformAccounts,
    getPlatformJournal,
    getPlatformProfitAndLoss,
    getPlatformSubscriptionPayments,
    postSubscriptionRevenueToPlatform,
} from '../services/platform-accounting.service';

// =====================
// Helpers
// =====================

function billingIntervalDays(billingInterval?: string | null): number {
    if (billingInterval === 'yearly') return 365;
    if (billingInterval === 'quarterly') return 90;
    return 30;
}

function periodEndFrom(start: Date, billingInterval?: string | null): Date {
    return new Date(start.getTime() + billingIntervalDays(billingInterval) * 24 * 60 * 60 * 1000);
}

/** Normalize plan module flags so UI keys (clients) match route gates (crm). */
function normalizeEnabledModules(modules: unknown): Record<string, boolean> | null {
    if (!modules || typeof modules !== 'object' || Array.isArray(modules)) {
        if (Array.isArray(modules)) {
            const mapped: Record<string, boolean> = {};
            for (const key of modules as string[]) {
                mapped[String(key).toLowerCase()] = true;
            }
            return Object.keys(mapped).length ? mapped : null;
        }
        return null;
    }
    const src = modules as Record<string, boolean>;
    const out: Record<string, boolean> = { ...src };
    if (out.clients && !out.crm) out.crm = true;
    if (out.crm && !out.clients) out.clients = true;
    if (out.employees && !out.hrms) out.hrms = true;
    if (out.hrms && !out.employees) out.employees = true;
    return out;
}

async function findSystemAdminRole() {
    // Prefer global system Admin; match case-insensitively (Admin / admin / ADMIN)
    const systemAdmin =
        (await prisma.role.findFirst({
            where: { name: { equals: 'Admin', mode: 'insensitive' }, isSystem: true, companyId: null },
        })) ||
        (await prisma.role.findFirst({
            where: { name: { equals: 'Admin', mode: 'insensitive' }, companyId: null },
        })) ||
        (await prisma.role.findFirst({
            where: { name: { equals: 'Admin', mode: 'insensitive' }, isSystem: true },
        })) ||
        (await prisma.role.findFirst({
            where: { name: { equals: 'Admin', mode: 'insensitive' } },
        }));
    return systemAdmin;
}

async function resolveOnboardPlan(planCode?: string | null) {
    const code = planCode && String(planCode).trim() ? String(planCode).trim() : 'starter_monthly';
    const plan = await prisma.tenantPlan.findUnique({ where: { code } });
    return { plan, code, isTrial: !planCode || !String(planCode).trim() };
}

async function syncCompanyModulesFromPlan(companyId: string, planId: string) {
    const plan = await prisma.tenantPlan.findUnique({ where: { id: planId } });
    if (!plan) return;
    const enabledModules = normalizeEnabledModules(plan.enabledModules);
    await prisma.company.update({
        where: { id: companyId },
        data: { enabledModules: enabledModules ?? undefined },
    });
}

function generateTempPassword(length = 12): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

// =====================
// Tenant (Company) Management
// =====================

export const listTenants = async (req: AuthRequest, res: Response) => {
    try {
        const { page = '1', limit = '20', search, status, planId } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        // Platform books company is not a tenant
        const where: any = { isPlatform: false };
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { legalName: { contains: search as string, mode: 'insensitive' } },
            ];
        }
        if (status === 'active') where.isActive = true;
        if (status === 'suspended') where.isActive = false;
        if (planId) {
            where.tenantSubscription = { planId: planId as string };
        }

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { users: true, employees: true } },
                    tenantSubscription: { include: { plan: true } },
                    countryData: true,
                    stateData: true,
                },
            }),
            prisma.company.count({ where }),
        ]);

        res.json({
            tenants: companies,
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total,
                totalPages: Math.ceil(total / take),
            },
        });
    } catch (error) {
        console.error('List tenants error:', error);
        res.status(500).json({ error: 'Failed to list tenants' });
    }
};

export const getTenant = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                _count: { select: { users: true, employees: true, clients: true, invoices: true } },
                tenantSubscription: { include: { plan: true } },
                countryData: true,
                stateData: true,
                users: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true, roles: { include: { role: true } } } },
            },
        });

        if (!company) return res.status(404).json({ error: 'Tenant not found' });
        res.json(company);
    } catch (error) {
        console.error('Get tenant error:', error);
        res.status(500).json({ error: 'Failed to get tenant' });
    }
};

export async function initializeCompanyDefaults(companyId: string, countryId: string) {
    try {
        // 1. Fetch COA Template
        const coaTemplate = await prisma.coaTemplate.findFirst({
            where: { countryId, isActive: true },
            include: { entries: { where: { isActive: true } } }
        });

        if (coaTemplate) {
            // Create Ledger Accounts
            for (const entry of coaTemplate.entries) {
                await prisma.ledgerAccount.create({
                    data: {
                        companyId,
                        code: entry.code,
                        name: entry.name,
                        type: entry.type,
                        balance: 0,
                    }
                });
            }
        }

        // Fetch the created accounts to map them
        const accounts = await prisma.ledgerAccount.findMany({ where: { companyId } });
        const cashAcc = accounts.find(a => a.code === '1001');
        const pfAcc = accounts.find(a => a.code === '2400');
        const ptAcc = accounts.find(a => a.code === '2420');
        const tdsAcc = accounts.find(a => a.code === '2300');
        const netSalaryAcc = accounts.find(a => a.code === '2430') || cashAcc;

        // 2. Create StatutoryConfig
        await prisma.statutoryConfig.create({
            data: {
                companyId,
                pfEmployeeRate: 12.00,
                pfEmployerRate: 12.00,
                pfBasicLimit: 15000.00,
                esiEmployeeRate: 0.75,
                esiEmployerRate: 3.25,
                esiGrossLimit: 21000.00,
                professionalTaxEnabled: true,
                ptSlabs: {
                    'Maharashtra': [
                        { min: 0, max: 10000, amount: 0 },
                        { min: 10001, max: 25000, amount: 200 },
                        { min: 25001, max: null, amount: 300 }
                    ]
                },
                tdsEnabled: true,
                salaryPayableAccountId: netSalaryAcc?.id || null,
                pfPayableAccountId: pfAcc?.id || null,
                ptPayableAccountId: ptAcc?.id || null,
                tdsPayableAccountId: tdsAcc?.id || null,
            }
        });

        // 3. Create default Salary Components
        const defaultComponents = [
            { name: 'Basic Salary', type: 'earning', calculationType: 'percentage', defaultValue: 50 },
            { name: 'House Rent Allowance', type: 'earning', calculationType: 'percentage', defaultValue: 20 },
            { name: 'Special Allowance', type: 'earning', calculationType: 'percentage', defaultValue: 30 },
            { name: 'Provident Fund Deduction', type: 'deduction', calculationType: 'percentage', defaultValue: 12 },
            { name: 'Employee State Insurance', type: 'deduction', calculationType: 'percentage', defaultValue: 0.75 },
            { name: 'Professional Tax', type: 'deduction', calculationType: 'flat', defaultValue: 200 },
        ];

        for (const comp of defaultComponents) {
            await prisma.salaryComponent.create({
                data: {
                    companyId,
                    name: comp.name,
                    type: comp.type,
                    calculationType: comp.calculationType,
                    defaultValue: comp.defaultValue,
                    isActive: true,
                    isTaxable: comp.type === 'earning',
                }
            });
        }

        // 4. Create default Email Templates
        const defaultTemplates = [
            {
                name: 'Standard Interview Invite',
                subject: 'Interview Invitation - {{companyName}}',
                type: 'interview_invite',
                body: `<p>Dear {{candidateName}},</p>\n<p>Thank you for applying for the <strong>{{jobTitle}}</strong> position.</p>\n<p>We were impressed by your background and would like to invite you for an interview to discuss this opportunity further.</p>\n<p>Please let us know your availability over the next few days.</p>\n<p>Best regards,<br>HR Team</p>`
            },
            {
                name: 'Standard Job Offer',
                subject: 'Job Offer: {{jobTitle}} - {{companyName}}',
                type: 'offer',
                body: `<p>Dear {{candidateName}},</p>\n<p>We are thrilled to offer you the position of <strong>{{jobTitle}}</strong>.</p>\n<p>We believe your skills and experience will be a great asset to our team. Please find attached the formal offer letter containing details of your compensation and benefits.</p>\n<p>Please review and let us know your acceptance by signing and returning the document.</p>\n<p>Welcome to the team!</p>\n<p>Best regards,<br>HR Team</p>`
            },
            {
                name: 'Standard Rejection Email',
                subject: 'Update on your application - {{companyName}}',
                type: 'rejection',
                body: `<p>Dear {{candidateName}},</p>\n<p>Thank you for taking the time to apply and interview for the <strong>{{jobTitle}}</strong> position.</p>\n<p>We appreciated learning more about your skills and experience. Unfortunately, we have decided to move forward with other candidates whose qualifications closely align with our current needs.</p>\n<p>We will keep your resume on file for future opportunities. We wish you all the best in your career search.</p>\n<p>Best regards,<br>HR Team</p>`
            },
            {
                name: 'Standard Invoice Dispatch',
                subject: 'Invoice #{{invoiceNumber}} — {{companyName}}',
                type: 'invoice',
                body: `<p>Dear {{clientName}},</p>\n<p>We are sharing your invoice details below. A PDF copy is attached for your records.</p>\n<p>Invoice No: #{{invoiceNumber}}<br>Amount Due: {{amount}}<br>Due Date: {{dueDate}}</p>\n<p>You can view and pay your invoice online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>\n<p>Thank you for choosing {{companyName}}.</p>`
            },
            {
                name: 'Standard Invoice Follow-up',
                subject: 'Reminder: Invoice #{{invoiceNumber}} is due — {{companyName}}',
                type: 'invoice_followup',
                body: `<p>Dear {{clientName}},</p>\n<p>This is a friendly payment reminder. The following invoice is currently due. Please arrange payment at your earliest convenience.</p>\n<p>Invoice No: #{{invoiceNumber}}<br>Amount Due: {{amount}}<br>Due Date: {{dueDate}}</p>\n<p>You can view and pay your invoice online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>\n<p>Thank you for choosing {{companyName}}.</p>`
            },
            {
                name: 'Standard Quotation Dispatch',
                subject: 'Quotation #{{quotationNumber}} — {{companyName}}',
                type: 'quotation',
                body: `<p>Dear {{clientName}},</p>\n<p>We are pleased to present our formal quotation. Our team has carefully mapped out your requirements to ensure the highest quality of service. Please review the details below.</p>\n<p>Quotation No: #{{quotationNumber}}<br>Total Estimate: {{amount}}<br>Valid Until: {{validUntil}}</p>\n<p>You can review and accept this proposal online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>\n<p>We look forward to working with you.</p>`
            },
            {
                name: 'Standard Quotation Follow-up',
                subject: 'Friendly Reminder: Quotation #{{quotationNumber}} — {{companyName}}',
                type: 'quotation_followup',
                body: `<p>Dear {{clientName}},</p>\n<p>This is a gentle reminder about the proposal we sent on {{quotationDate}}. We would love to hear your thoughts and move forward together.</p>\n<p>Quotation No: #{{quotationNumber}}<br>Total Estimate: {{amount}}<br>Valid Until: {{validUntil}}</p>\n<p>You can review and accept this proposal online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>`
            },
            {
                name: 'Standard Contract Dispatch',
                subject: 'Action Required: Contract for Review - {{companyName}}',
                type: 'contract',
                body: `<p>Hello {{clientName}},</p>\n<p>A formal service agreement has been prepared for you. Please review the terms carefully and provide your digital signature at your earliest convenience.</p>\n<p>Document Title: {{contractTitle}}</p>\n<p>You can review and sign the contract online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>`
            },
            {
                name: 'Standard Contract Follow-up',
                subject: 'Reminder: Action Required - Contract review is pending - {{companyName}}',
                type: 'contract_followup',
                body: `<p>Hello {{clientName}},</p>\n<p>This is a friendly reminder that the contract review and signature for "{{contractTitle}}" is still pending.</p>\n<p>Please review and sign the contract online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>`
            }
        ];

        for (const t of defaultTemplates) {
            await prisma.emailTemplate.create({
                data: {
                    companyId,
                    name: t.name,
                    subject: t.subject,
                    type: t.type,
                    body: t.body,
                    isActive: true
                }
            });
        }

        console.log(`Successfully auto-initialized company defaults for ${companyId}`);
    } catch (e) {
        console.error(`Failed to auto-initialize company defaults for ${companyId}:`, e);
    }
}

export async function bootstrapAllEmailTemplates() {
    try {
        const companies = await prisma.company.findMany({ select: { id: true, name: true } });
        console.log(`[Bootstrap] Verifying email templates for ${companies.length} company/companies...`);
        
        const defaultTemplates = [
            {
                name: 'Standard Interview Invite',
                subject: 'Interview Invitation - {{companyName}}',
                type: 'interview_invite',
                body: `<p>Dear {{candidateName}},</p>\n<p>Thank you for applying for the <strong>{{jobTitle}}</strong> position.</p>\n<p>We were impressed by your background and would like to invite you for an interview to discuss this opportunity further.</p>\n<p>Please let us know your availability over the next few days.</p>\n<p>Best regards,<br>HR Team</p>`
            },
            {
                name: 'Standard Job Offer',
                subject: 'Job Offer: {{jobTitle}} - {{companyName}}',
                type: 'offer',
                body: `<p>Dear {{candidateName}},</p>\n<p>We are thrilled to offer you the position of <strong>{{jobTitle}}</strong>.</p>\n<p>We believe your skills and experience will be a great asset to our team. Please find attached the formal offer letter containing details of your compensation and benefits.</p>\n<p>Please review and let us know your acceptance by signing and returning the document.</p>\n<p>Welcome to the team!</p>\n<p>Best regards,<br>HR Team</p>`
            },
            {
                name: 'Standard Rejection Email',
                subject: 'Update on your application - {{companyName}}',
                type: 'rejection',
                body: `<p>Dear {{candidateName}},</p>\n<p>Thank you for taking the time to apply and interview for the <strong>{{jobTitle}}</strong> position.</p>\n<p>We appreciated learning more about your skills and experience. Unfortunately, we have decided to move forward with other candidates whose qualifications closely align with our current needs.</p>\n<p>We will keep your resume on file for future opportunities. We wish you all the best in your career search.</p>\n<p>Best regards,<br>HR Team</p>`
            },
            {
                name: 'Standard Invoice Dispatch',
                subject: 'Invoice #{{invoiceNumber}} — {{companyName}}',
                type: 'invoice',
                body: `<p>Dear {{clientName}},</p>\n<p>We are sharing your invoice details below. A PDF copy is attached for your records.</p>\n<p>Invoice No: #{{invoiceNumber}}<br>Amount Due: {{amount}}<br>Due Date: {{dueDate}}</p>\n<p>You can view and pay your invoice online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>\n<p>Thank you for choosing {{companyName}}.</p>`
            },
            {
                name: 'Standard Invoice Follow-up',
                subject: 'Reminder: Invoice #{{invoiceNumber}} is due — {{companyName}}',
                type: 'invoice_followup',
                body: `<p>Dear {{clientName}},</p>\n<p>This is a friendly payment reminder. The following invoice is currently due. Please arrange payment at your earliest convenience.</p>\n<p>Invoice No: #{{invoiceNumber}}<br>Amount Due: {{amount}}<br>Due Date: {{dueDate}}</p>\n<p>You can view and pay your invoice online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>\n<p>Thank you for choosing {{companyName}}.</p>`
            },
            {
                name: 'Standard Quotation Dispatch',
                subject: 'Quotation #{{quotationNumber}} — {{companyName}}',
                type: 'quotation',
                body: `<p>Dear {{clientName}},</p>\n<p>We are pleased to present our formal quotation. Our team has carefully mapped out your requirements to ensure the highest quality of service. Please review the details below.</p>\n<p>Quotation No: #{{quotationNumber}}<br>Total Estimate: {{amount}}<br>Valid Until: {{validUntil}}</p>\n<p>You can review and accept this proposal online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>\n<p>We look forward to working with you.</p>`
            },
            {
                name: 'Standard Quotation Follow-up',
                subject: 'Friendly Reminder: Quotation #{{quotationNumber}} — {{companyName}}',
                type: 'quotation_followup',
                body: `<p>Dear {{clientName}},</p>\n<p>This is a gentle reminder about the proposal we sent on {{quotationDate}}. We would love to hear your thoughts and move forward together.</p>\n<p>Quotation No: #{{quotationNumber}}<br>Total Estimate: {{amount}}<br>Valid Until: {{validUntil}}</p>\n<p>You can review and accept this proposal online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>`
            },
            {
                name: 'Standard Contract Dispatch',
                subject: 'Action Required: Contract for Review - {{companyName}}',
                type: 'contract',
                body: `<p>Hello {{clientName}},</p>\n<p>A formal service agreement has been prepared for you. Please review the terms carefully and provide your digital signature at your earliest convenience.</p>\n<p>Document Title: {{contractTitle}}</p>\n<p>You can review and sign the contract online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>`
            },
            {
                name: 'Standard Contract Follow-up',
                subject: 'Reminder: Action Required - Contract review is pending - {{companyName}}',
                type: 'contract_followup',
                body: `<p>Hello {{clientName}},</p>\n<p>This is a friendly reminder that the contract review and signature for "{{contractTitle}}" is still pending.</p>\n<p>Please review and sign the contract online at: <a href="{{publicUrl}}">{{publicUrl}}</a></p>`
            }
        ];

        for (const company of companies) {
            for (const t of defaultTemplates) {
                const existing = await prisma.emailTemplate.findFirst({
                    where: { companyId: company.id, type: t.type }
                });
                if (!existing) {
                    await prisma.emailTemplate.create({
                        data: {
                            companyId: company.id,
                            name: t.name,
                            subject: t.subject,
                            type: t.type,
                            body: t.body,
                            isActive: true
                        }
                    });
                    console.log(`[Bootstrap] Created template '${t.name}' for company ${company.name}`);
                }
            }
        }
        console.log('[Bootstrap] Email templates verification completed.');
    } catch (e: any) {
        console.error('[Bootstrap] Failed to bootstrap email templates:', e.message);
    }
}

export const onboardTenant = async (req: AuthRequest, res: Response) => {
    try {
        const {
            name,
            legalName,
            email,
            phone,
            address,
            city,
            countryId,
            stateId,
            timezone,
            locale,
            currency,
            planCode,
            adminEmail,
            adminFirstName,
            adminLastName,
            adminPassword,
            adminPhone,
            sendWelcomeEmail = true,
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Company name and email are required' });
        }

        const adminLoginEmail = String(adminEmail || email).trim().toLowerCase();
        if (!adminLoginEmail) {
            return res.status(400).json({ error: 'Admin email is required' });
        }

        const existingCompany = await prisma.company.findFirst({ where: { email } });
        if (existingCompany) return res.status(409).json({ error: 'A company with this email already exists' });

        const existingUser = await prisma.user.findUnique({ where: { email: adminLoginEmail } });
        if (existingUser) {
            return res.status(409).json({ error: `A user with email ${adminLoginEmail} already exists` });
        }

        const adminRole = await findSystemAdminRole();
        if (!adminRole) {
            return res.status(500).json({
                error: 'System Admin role is missing. Run database seed before onboarding tenants.',
            });
        }

        const { plan: resolvedPlan, code: resolvedPlanCode, isTrial } = await resolveOnboardPlan(planCode);
        if (!resolvedPlan) {
            return res.status(400).json({
                error: `Plan code "${resolvedPlanCode}" not found. Seed tenant plans before onboarding.`,
                details: `Expected plan code: ${resolvedPlanCode}`,
            });
        }

        const passwordPlain = adminPassword && String(adminPassword).trim().length >= 6
            ? String(adminPassword).trim()
            : generateTempPassword(12);
        const passwordWasGenerated = !(adminPassword && String(adminPassword).trim().length >= 6);
        const hashedPassword = await hashPassword(passwordPlain);

        const now = new Date();
        const periodEnd = periodEndFrom(now, resolvedPlan.billingInterval);
        const enabledModules = normalizeEnabledModules(resolvedPlan.enabledModules);

        // Bypass Super Admin ALS tenant context so creates keep the NEW company's companyId
        const result = await runWithoutCompanyContext(() =>
            prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name,
                    legalName: legalName || name,
                    email,
                    phone: phone || null,
                    address: address || null,
                    city: city || null,
                    countryId: countryId || null,
                    stateId: stateId || null,
                    timezone: timezone || 'Asia/Kolkata',
                    locale: locale || 'en-IN',
                    currency: currency || 'INR',
                    isActive: true,
                    offDays: 'Saturday, Sunday',
                    enabledModules: enabledModules ?? undefined,
                },
            });

            // Explicit companyId required — tenant middleware must not rewrite it to the caller's company
            await tx.tenantSubscription.create({
                data: {
                    companyId: company.id,
                    planId: resolvedPlan.id,
                    status: isTrial ? 'trial' : 'active',
                    autoRenew: true,
                    paymentMethod: 'manual',
                    trialEndsAt: isTrial ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null,
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    notes: isTrial
                        ? 'Auto-assigned starter trial on onboard'
                        : `Assigned plan ${resolvedPlan.code} on onboard`,
                },
            });

            const adminUser = await tx.user.create({
                data: {
                    email: adminLoginEmail,
                    password: hashedPassword,
                    firstName: (adminFirstName && String(adminFirstName).trim()) || name.split(' ')[0] || 'Admin',
                    lastName: (adminLastName && String(adminLastName).trim()) || 'Admin',
                    phone: adminPhone || phone || null,
                    companyId: company.id,
                    isActive: true,
                    roles: {
                        create: { roleId: adminRole.id },
                    },
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    isActive: true,
                    companyId: true,
                },
            });

            return { company, adminUser };
        })
        );

        // Defaults / email are best-effort — never fail onboard after company+plan+user committed
        let defaultsWarning: string | undefined;
        if (countryId) {
            try {
                await initializeCompanyDefaults(result.company.id, countryId);
            } catch (defaultsErr: any) {
                defaultsWarning = defaultsErr?.message || 'Failed to initialize company defaults';
                console.error('Onboard defaults failed:', defaultsErr);
            }
        }

        let welcomeEmailSent = false;
        let welcomeEmailError: string | undefined;
        if (sendWelcomeEmail !== false) {
            try {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                await sendEmail(
                    adminLoginEmail,
                    `Welcome to Applizor ERP — ${result.company.name}`,
                    `
                      <h2>Welcome to Applizor ERP</h2>
                      <p>Your company <strong>${result.company.name}</strong> has been onboarded.</p>
                      <p><strong>Login URL:</strong> <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>
                      <p><strong>Email:</strong> ${adminLoginEmail}</p>
                      <p><strong>Temporary Password:</strong> ${passwordPlain}</p>
                      <p>Please sign in and change your password immediately.</p>
                    `,
                    [],
                    undefined,
                    undefined,
                    undefined,
                    true
                );
                welcomeEmailSent = true;
            } catch (emailErr: any) {
                welcomeEmailError = emailErr?.message || 'Welcome email failed';
                console.error('Onboard welcome email failed:', emailErr);
            }
        }

        const companyWithRelations = await prisma.company.findUnique({
            where: { id: result.company.id },
            include: {
                tenantSubscription: { include: { plan: true } },
                _count: { select: { users: true, employees: true } },
            },
        });

        res.status(201).json({
            ...companyWithRelations,
            adminUser: result.adminUser,
            credentials: {
                email: adminLoginEmail,
                temporaryPassword: passwordPlain,
                passwordWasGenerated,
                welcomeEmailSent,
                welcomeEmailError,
            },
            warnings: defaultsWarning ? { defaults: defaultsWarning } : undefined,
        });
    } catch (error: any) {
        console.error('Onboard tenant error:', error);
        const details = error?.message || String(error);
        const target = error?.meta?.target;
        if (error?.code === 'P2002') {
            const fieldHint = Array.isArray(target) ? target.join(', ') : target;
            return res.status(409).json({
                error: fieldHint
                    ? `Duplicate value for: ${fieldHint}`
                    : 'Company, admin email, or subscription already exists',
                details,
                code: error.code,
                meta: error.meta,
            });
        }
        res.status(500).json({
            error: 'Failed to onboard tenant',
            details,
            code: error?.code,
            meta: error?.meta,
        });
    }
};

/** Provision an Admin login for tenants created without a user (orphans). */
export const provisionTenantAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const {
            adminEmail,
            adminFirstName,
            adminLastName,
            adminPassword,
            adminPhone,
            sendWelcomeEmail = true,
        } = req.body;

        const company = await prisma.company.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } },
        });
        if (!company) return res.status(404).json({ error: 'Tenant not found' });

        const loginEmail = String(adminEmail || company.email || '').trim().toLowerCase();
        if (!loginEmail) {
            return res.status(400).json({ error: 'adminEmail is required (company has no email)' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email: loginEmail } });
        if (existingUser) {
            if (existingUser.companyId === company.id) {
                return res.status(409).json({ error: 'An admin user with this email already belongs to this tenant' });
            }
            return res.status(409).json({ error: `Email ${loginEmail} is already registered to another account` });
        }

        const adminRole = await findSystemAdminRole();
        if (!adminRole) {
            return res.status(500).json({ error: 'System Admin role is missing. Run database seed.' });
        }

        const passwordPlain = adminPassword && String(adminPassword).trim().length >= 6
            ? String(adminPassword).trim()
            : generateTempPassword(12);
        const passwordWasGenerated = !(adminPassword && String(adminPassword).trim().length >= 6);
        const hashedPassword = await hashPassword(passwordPlain);

        const adminUser = await prisma.user.create({
            data: {
                email: loginEmail,
                password: hashedPassword,
                firstName: (adminFirstName && String(adminFirstName).trim()) || company.name.split(' ')[0] || 'Admin',
                lastName: (adminLastName && String(adminLastName).trim()) || 'Admin',
                phone: adminPhone || company.phone || null,
                companyId: company.id,
                isActive: true,
                roles: { create: { roleId: adminRole.id } },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                companyId: true,
            },
        });

        let welcomeEmailSent = false;
        if (sendWelcomeEmail !== false) {
            try {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                await sendEmail(
                    loginEmail,
                    `Welcome to Applizor ERP — ${company.name}`,
                    `
                      <h2>Your Applizor ERP account is ready</h2>
                      <p>Company: <strong>${company.name}</strong></p>
                      <p><strong>Login:</strong> <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>
                      <p><strong>Email:</strong> ${loginEmail}</p>
                      <p><strong>Temporary Password:</strong> ${passwordPlain}</p>
                    `,
                    [],
                    undefined,
                    undefined,
                    undefined,
                    true
                );
                welcomeEmailSent = true;
            } catch (emailErr) {
                console.error('Provision admin welcome email failed:', emailErr);
            }
        }

        res.status(201).json({
            message: 'Tenant admin provisioned',
            adminUser,
            credentials: {
                email: loginEmail,
                temporaryPassword: passwordPlain,
                passwordWasGenerated,
                welcomeEmailSent,
            },
            previousUserCount: company._count.users,
        });
    } catch (error: any) {
        console.error('Provision tenant admin error:', error);
        if (error?.code === 'P2002') {
            return res.status(409).json({ error: 'User email already exists' });
        }
        res.status(500).json({ error: 'Failed to provision tenant admin', details: error?.message });
    }
};

export const updateTenant = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, legalName, email, phone, address, city, countryId, stateId, timezone, locale, currency } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Company name and email are required' });
        }

        const existing = await prisma.company.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'Company not found' });

        if (email !== existing.email) {
            const emailInUse = await prisma.company.findFirst({ where: { email } });
            if (emailInUse) return res.status(409).json({ error: 'A company with this email already exists' });
        }

        const company = await prisma.company.update({
            where: { id },
            data: {
                name,
                legalName: legalName || name,
                email,
                phone: phone ?? null,
                address: address ?? null,
                city: city ?? null,
                countryId: countryId ?? null,
                stateId: stateId ?? null,
                timezone: timezone || 'Asia/Kolkata',
                locale: locale || 'en-IN',
                currency: currency || 'INR'
            }
        });

        res.json(company);
    } catch (error) {
        console.error('Update tenant error:', error);
        res.status(500).json({ error: 'Failed to update tenant details' });
    }
};

export const suspendTenant = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const company = await prisma.company.update({
            where: { id },
            data: { isActive: false },
        });
        await prisma.tenantSubscription.updateMany({
            where: { companyId: id, status: { in: ['active', 'trial'] } },
            data: { status: 'paused', notes: `Paused on tenant suspend at ${new Date().toISOString()}` },
        });
        res.json({ message: 'Tenant suspended', company });
    } catch (error) {
        console.error('Suspend tenant error:', error);
        res.status(500).json({ error: 'Failed to suspend tenant' });
    }
};

export const activateTenant = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const company = await prisma.company.update({
            where: { id },
            data: { isActive: true },
        });
        const sub = await prisma.tenantSubscription.findUnique({ where: { companyId: id }, include: { plan: true } });
        if (sub && sub.status === 'paused') {
            const now = new Date();
            await prisma.tenantSubscription.update({
                where: { companyId: id },
                data: {
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEndFrom(now, sub.plan?.billingInterval),
                    notes: `Reactivated with tenant at ${now.toISOString()}`,
                },
            });
        }
        res.json({ message: 'Tenant activated', company });
    } catch (error) {
        console.error('Activate tenant error:', error);
        res.status(500).json({ error: 'Failed to activate tenant' });
    }
};

export const deleteTenant = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const company = await prisma.company.findUnique({ where: { id }, select: { isPlatform: true } });
        if (!company) return res.status(404).json({ error: 'Tenant not found' });
        if (company.isPlatform) {
            return res.status(400).json({ error: 'Cannot delete the platform books company' });
        }
        await prisma.company.delete({ where: { id } });
        res.json({ message: 'Tenant deleted' });
    } catch (error) {
        console.error('Delete tenant error:', error);
        res.status(500).json({ error: 'Failed to delete tenant' });
    }
};

// =====================
// Tenant Subscription Management
// =====================

export const updateTenantSubscription = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { planId, status, autoRenew, notes, paymentMethod, extendDays } = req.body;

        const company = await prisma.company.findUnique({ where: { id } });
        if (!company) return res.status(404).json({ error: 'Tenant not found' });

        const existing = await prisma.tenantSubscription.findUnique({
            where: { companyId: id },
            include: { plan: true },
        });

        let resolvedPlanId = (planId as string | undefined) || existing?.planId;
        let plan = resolvedPlanId
            ? await prisma.tenantPlan.findUnique({ where: { id: resolvedPlanId } })
            : null;

        if (planId && !plan) {
            return res.status(400).json({ error: 'Invalid planId' });
        }

        if (!resolvedPlanId || !plan) {
            const starter = await prisma.tenantPlan.findFirst({ where: { code: 'starter_monthly' } });
            if (!starter) {
                return res.status(500).json({ error: 'No starter plan found. Seed tenant plans first.' });
            }
            resolvedPlanId = starter.id;
            plan = starter;
        }

        const now = new Date();
        const nextStatus = status || existing?.status || 'active';
        const data: any = {
            planId: resolvedPlanId,
            status: nextStatus,
            autoRenew: autoRenew !== undefined ? autoRenew : (existing?.autoRenew ?? true),
        };

        if (notes !== undefined) data.notes = notes;
        if (paymentMethod !== undefined) data.paymentMethod = paymentMethod;

        const planChanged = !existing || existing.planId !== resolvedPlanId;
        const activating = ['active', 'trial'].includes(nextStatus) &&
            (!existing || !['active', 'trial'].includes(existing.status) || planChanged);

        if (activating || planChanged) {
            data.currentPeriodStart = now;
            data.currentPeriodEnd = periodEndFrom(now, plan?.billingInterval);
            if (nextStatus === 'trial' && !existing?.trialEndsAt) {
                data.trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
            }
            if (nextStatus === 'active') {
                data.cancelledAt = null;
            }
            if (!data.paymentMethod) data.paymentMethod = existing?.paymentMethod || 'manual';
        }

        if (typeof extendDays === 'number' && extendDays > 0) {
            const base = existing?.currentPeriodEnd && existing.currentPeriodEnd > now
                ? existing.currentPeriodEnd
                : now;
            data.currentPeriodEnd = new Date(base.getTime() + extendDays * 24 * 60 * 60 * 1000);
            if (nextStatus === 'cancelled' || nextStatus === 'expired') {
                data.status = 'active';
            }
        }

        if (nextStatus === 'cancelled') {
            data.cancelledAt = now;
            data.autoRenew = false;
        }

        const subscription = await prisma.tenantSubscription.upsert({
            where: { companyId: id },
            update: data,
            create: {
                companyId: id,
                planId: resolvedPlanId!,
                status: nextStatus,
                autoRenew: autoRenew ?? true,
                paymentMethod: paymentMethod || 'manual',
                notes: notes || null,
                currentPeriodStart: now,
                currentPeriodEnd: periodEndFrom(now, plan?.billingInterval),
                trialEndsAt: nextStatus === 'trial' ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null,
            },
            include: { plan: true },
        });

        await syncCompanyModulesFromPlan(id, subscription.planId);

        res.json(subscription);
    } catch (error: any) {
        console.error('Update subscription error:', error);
        res.status(500).json({ error: 'Failed to update subscription', details: error?.message });
    }
};

// =====================
// Platform Plans
// =====================

export const listPlans = async (req: AuthRequest, res: Response) => {
    try {
        // Public catalog: active plans only. Superadmin /plans/all uses listAllPlans.
        const plans = await prisma.tenantPlan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        res.json(plans);
    } catch (error) {
        console.error('List plans error:', error);
        res.status(500).json({ error: 'Failed to list plans' });
    }
};

export const listAllPlans = async (req: AuthRequest, res: Response) => {
    try {
        const plans = await prisma.tenantPlan.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        res.json(plans);
    } catch (error) {
        console.error('List all plans error:', error);
        res.status(500).json({ error: 'Failed to list plans' });
    }
};

export const createPlan = async (req: AuthRequest, res: Response) => {
    try {
        const { name, code, description, price, currency, billingInterval, maxUsers, maxStorageGb, maxCompanies, enabledModules, features, sortOrder, isPublic } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Plan name and code are required' });
        }
        if (price === undefined || price === null || Number.isNaN(Number(price))) {
            return res.status(400).json({ error: 'Valid plan price is required' });
        }

        const existing = await prisma.tenantPlan.findUnique({ where: { code } });
        if (existing) return res.status(409).json({ error: `Plan code "${code}" already exists` });

        const plan = await prisma.tenantPlan.create({
            data: {
                name,
                code,
                description: description || null,
                price,
                currency: currency || 'USD',
                billingInterval: billingInterval || 'monthly',
                maxUsers: maxUsers ?? 5,
                maxStorageGb: maxStorageGb ?? 1,
                maxCompanies: maxCompanies ?? 1,
                enabledModules: normalizeEnabledModules(enabledModules) ?? undefined,
                features: features || undefined,
                sortOrder: sortOrder || 0,
                isPublic: isPublic !== undefined ? !!isPublic : true,
                isActive: true,
            },
        });

        res.status(201).json(plan);
    } catch (error: any) {
        console.error('Create plan error:', error);
        if (error?.code === 'P2002') return res.status(409).json({ error: 'Plan code already exists' });
        res.status(500).json({ error: 'Failed to create plan' });
    }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };
        delete data.id;
        delete data.code;

        if (data.enabledModules !== undefined) {
            data.enabledModules = normalizeEnabledModules(data.enabledModules) ?? undefined;
        }

        const plan = await prisma.tenantPlan.update({
            where: { id },
            data,
        });
        res.json(plan);
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ error: 'Failed to update plan' });
    }
};

export const deletePlan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.tenantPlan.update({
            where: { id },
            data: { isActive: false },
        });
        res.json({ message: 'Plan deactivated' });
    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({ error: 'Failed to delete plan' });
    }
};

// =====================
// Reference Data (Country/State/Currency)
// =====================

export const listCountries = async (req: AuthRequest, res: Response) => {
    try {
        const countries = await prisma.country.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: { currency: true },
        });

        const seenCodes = new Set();
        const uniqueCountries = countries.filter(c => {
            const normalized = c.code.trim().toUpperCase();
            if (seenCodes.has(normalized)) return false;
            seenCodes.add(normalized);
            return true;
        });

        res.json(uniqueCountries);
    } catch (error) {
        console.error('List countries error:', error);
        res.status(500).json({ error: 'Failed to list countries' });
    }
};

export const listStates = async (req: AuthRequest, res: Response) => {
    try {
        const { countryId, countryCode } = req.query;
        const where: any = { isActive: true };
        if (countryId) where.countryId = countryId as string;
        if (countryCode) {
            const country = await prisma.country.findUnique({ where: { code: countryCode as string } });
            if (country) where.countryId = country.id;
        }
        const states = await prisma.state.findMany({
            where,
            orderBy: { name: 'asc' },
        });

        // De-duplicate states by name
        const seenNames = new Set();
        const uniqueStates = states.filter(state => {
            const normalized = state.name.trim().toLowerCase();
            if (seenNames.has(normalized)) return false;
            seenNames.add(normalized);
            return true;
        });

        res.json(uniqueStates);
    } catch (error) {
        console.error('List states error:', error);
        res.status(500).json({ error: 'Failed to list states' });
    }
};

export const listCurrencies = async (req: AuthRequest, res: Response) => {
    try {
        const currencies = await prisma.currency.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' },
        });
        res.json(currencies);
    } catch (error) {
        console.error('List currencies error:', error);
        res.status(500).json({ error: 'Failed to list currencies' });
    }
};

// =====================
// Platform Dashboard Stats
// =====================

// =====================
// Statutory Rules Management
// =====================

export const listStatutoryRules = async (req: AuthRequest, res: Response) => {
    try {
        const { countryId, countryCode, code, globalOnly } = req.query;
        const companyId = req.user?.companyId || null;
        const isGlobalOnly = globalOnly === 'true';

        const where: any = {
            isActive: true,
            OR: isGlobalOnly
                ? [ { companyId: null } ]
                : [
                    { companyId: null },
                    ...(companyId ? [{ companyId }] : [])
                ]
        };
        if (countryId) where.countryId = countryId as string;
        if (code) where.code = code as string;
        if (countryCode) {
            const country = await prisma.country.findUnique({ where: { code: countryCode as string } });
            if (country) where.countryId = country.id;
            else return res.status(404).json({ error: 'Country not found' });
        }

        const rules = await prisma.statutoryRule.findMany({
            where,
            orderBy: [{ code: 'asc' }, { effectiveFrom: 'desc' }],
            include: { country: { select: { name: true, code: true } } },
        });
        res.json(rules);
    } catch (error) {
        console.error('List statutory rules error:', error);
        res.status(500).json({ error: 'Failed to list statutory rules' });
    }
};

export const createStatutoryRule = async (req: AuthRequest, res: Response) => {
    try {
        const { countryId, code, name, category, ruleType, employeeRate, employerRate, wageCeiling, slabData, effectiveFrom, effectiveTo } = req.body;

        if (!countryId || !code || !name || !category || !ruleType || !effectiveFrom) {
            return res.status(400).json({ error: 'Missing required fields: countryId, code, name, category, ruleType, effectiveFrom' });
        }

        const rule = await prisma.statutoryRule.create({
            data: {
                countryId,
                code,
                name,
                category,
                ruleType,
                employeeRate: employeeRate ?? null,
                employerRate: employerRate ?? null,
                wageCeiling: wageCeiling ?? null,
                slabData: slabData ?? null,
                effectiveFrom: new Date(effectiveFrom),
                effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
            },
        });

        res.status(201).json(rule);
    } catch (error) {
        console.error('Create statutory rule error:', error);
        res.status(500).json({ error: 'Failed to create statutory rule' });
    }
};

export const updateStatutoryRule = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { code, name, category, ruleType, employeeRate, employerRate, wageCeiling, slabData, effectiveFrom, effectiveTo, isActive } = req.body;

        const data: any = {};
        if (code !== undefined) data.code = code;
        if (name !== undefined) data.name = name;
        if (category !== undefined) data.category = category;
        if (ruleType !== undefined) data.ruleType = ruleType;
        if (employeeRate !== undefined) data.employeeRate = employeeRate;
        if (employerRate !== undefined) data.employerRate = employerRate;
        if (wageCeiling !== undefined) data.wageCeiling = wageCeiling;
        if (slabData !== undefined) data.slabData = slabData;
        if (effectiveFrom !== undefined) data.effectiveFrom = new Date(effectiveFrom);
        if (effectiveTo !== undefined) data.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
        if (isActive !== undefined) data.isActive = isActive;

        const rule = await prisma.statutoryRule.update({ where: { id }, data });
        res.json(rule);
    } catch (error) {
        console.error('Update statutory rule error:', error);
        res.status(500).json({ error: 'Failed to update statutory rule' });
    }
};

export const deactivateStatutoryRule = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const rule = await prisma.statutoryRule.update({
            where: { id },
            data: { isActive: false },
        });
        res.json({ message: 'Statutory rule deactivated', rule });
    } catch (error) {
        console.error('Deactivate statutory rule error:', error);
        res.status(500).json({ error: 'Failed to deactivate statutory rule' });
    }
};

export const applyGlobalRulesToCompany = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.params;
        const { countryId } = req.body;

        if (!companyId) return res.status(400).json({ error: 'Target company ID is required' });

        const company = await prisma.company.findUnique({
            where: { id: companyId }
        });
        if (!company) return res.status(404).json({ error: 'Target company not found' });

        const globalRules = await prisma.statutoryRule.findMany({
            where: {
                companyId: null,
                ...(countryId ? { countryId } : {})
            }
        });

        if (globalRules.length === 0) {
            return res.status(404).json({ error: 'No global rules found to apply' });
        }

        let count = 0;
        for (const rule of globalRules) {
            const existing = await prisma.statutoryRule.findFirst({
                where: { companyId, code: rule.code, countryId: rule.countryId }
            });

            if (existing) {
                await prisma.statutoryRule.update({
                    where: { id: existing.id },
                    data: {
                        name: rule.name,
                        category: rule.category,
                        ruleType: rule.ruleType,
                        employeeRate: rule.employeeRate,
                        employerRate: rule.employerRate,
                        wageCeiling: rule.wageCeiling,
                        slabData: rule.slabData as any,
                        effectiveFrom: rule.effectiveFrom,
                        effectiveTo: rule.effectiveTo,
                        isActive: true
                    }
                });
            } else {
                await prisma.statutoryRule.create({
                    data: {
                        countryId: rule.countryId,
                        companyId,
                        code: rule.code,
                        name: rule.name,
                        category: rule.category,
                        ruleType: rule.ruleType,
                        employeeRate: rule.employeeRate,
                        employerRate: rule.employerRate,
                        wageCeiling: rule.wageCeiling,
                        slabData: rule.slabData as any,
                        effectiveFrom: rule.effectiveFrom,
                        effectiveTo: rule.effectiveTo,
                        isActive: true
                    }
                });
            }
            count++;
        }

        res.json({ message: `Successfully applied ${count} global statutory rules to company ${company.name}` });
    } catch (error) {
        console.error('Apply global rules to company error:', error);
        res.status(500).json({ error: 'Failed to apply global rules to company' });
    }
};

export const resetCompanyStatutoryRules = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!companyId) return res.status(400).json({ error: 'User must belong to a company' });

        await prisma.statutoryRule.deleteMany({
            where: { companyId }
        });

        res.json({ message: 'Company compliance overrides successfully reset to platform defaults' });
    } catch (error) {
        console.error('Reset company statutory rules error:', error);
        res.status(500).json({ error: 'Failed to reset rules to platform defaults' });
    }
};

export const createCompanyStatutoryRule = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!companyId) return res.status(400).json({ error: 'User must belong to a company' });

        const { countryId, code, name, category, ruleType, employeeRate, employerRate, wageCeiling, slabData, effectiveFrom, effectiveTo } = req.body;

        if (!countryId || !code || !name || !category || !ruleType || !effectiveFrom) {
            return res.status(400).json({ error: 'Missing required fields: countryId, code, name, category, ruleType, effectiveFrom' });
        }

        const rule = await prisma.statutoryRule.create({
            data: {
                countryId,
                companyId,
                code,
                name,
                category,
                ruleType,
                employeeRate: employeeRate ?? null,
                employerRate: employerRate ?? null,
                wageCeiling: wageCeiling ?? null,
                slabData: slabData ?? null,
                effectiveFrom: new Date(effectiveFrom),
                effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
            },
        });

        res.status(201).json(rule);
    } catch (error) {
        console.error('Create company statutory rule error:', error);
        res.status(500).json({ error: 'Failed to create statutory rule' });
    }
};

export const updateCompanyStatutoryRule = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!companyId) return res.status(400).json({ error: 'User must belong to a company' });

        const { id } = req.params;
        const { code, name, category, ruleType, employeeRate, employerRate, wageCeiling, slabData, effectiveFrom, effectiveTo, isActive } = req.body;

        // Verify ownership
        const existing = await prisma.statutoryRule.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(403).json({ error: 'Access denied: Rule not owned by your company' });

        const data: any = {};
        if (code !== undefined) data.code = code;
        if (name !== undefined) data.name = name;
        if (category !== undefined) data.category = category;
        if (ruleType !== undefined) data.ruleType = ruleType;
        if (employeeRate !== undefined) data.employeeRate = employeeRate;
        if (employerRate !== undefined) data.employerRate = employerRate;
        if (wageCeiling !== undefined) data.wageCeiling = wageCeiling;
        if (slabData !== undefined) data.slabData = slabData;
        if (effectiveFrom !== undefined) data.effectiveFrom = new Date(effectiveFrom);
        if (effectiveTo !== undefined) data.effectiveTo = effectiveTo ? new Date(effectiveTo) : null;
        if (isActive !== undefined) data.isActive = isActive;

        const rule = await prisma.statutoryRule.update({ where: { id }, data });
        res.json(rule);
    } catch (error) {
        console.error('Update company statutory rule error:', error);
        res.status(500).json({ error: 'Failed to update statutory rule' });
    }
};

export const deactivateCompanyStatutoryRule = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.user;
        if (!companyId) return res.status(400).json({ error: 'User must belong to a company' });

        const { id } = req.params;

        // Verify ownership
        const existing = await prisma.statutoryRule.findFirst({
            where: { id, companyId }
        });
        if (!existing) return res.status(403).json({ error: 'Access denied: Rule not owned by your company' });

        const rule = await prisma.statutoryRule.update({
            where: { id },
            data: { isActive: false },
        });
        res.json({ message: 'Statutory rule deactivated', rule });
    } catch (error) {
        console.error('Deactivate company statutory rule error:', error);
        res.status(500).json({ error: 'Failed to deactivate statutory rule' });
    }
};

export const getPlatformStats = async (req: AuthRequest, res: Response) => {
    try {
        const tenantWhere = { isPlatform: false };
        const [totalCompanies, activeCompanies, totalUsers, totalEmployees, totalInvoices, recentCompanies] = await Promise.all([
            prisma.company.count({ where: tenantWhere }),
            prisma.company.count({ where: { ...tenantWhere, isActive: true } }),
            prisma.user.count(),
            prisma.employee.count(),
            prisma.invoice.count(),
            prisma.company.findMany({
                where: tenantWhere,
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { _count: { select: { users: true, employees: true } } },
            }),
        ]);

        const planDistribution = await prisma.tenantPlan.findMany({
            include: { _count: { select: { subscriptions: true } } },
        });

        res.json({
            totalCompanies,
            activeCompanies,
            suspendedCompanies: totalCompanies - activeCompanies,
            totalUsers,
            totalEmployees,
            totalInvoices,
            planDistribution,
            recentCompanies,
        });
    } catch (error) {
        console.error('Platform stats error:', error);
        res.status(500).json({ error: 'Failed to get platform stats' });
    }
};

export const createSubscriptionCheckout = async (req: AuthRequest, res: Response) => {
    try {
        const { planId, gateway } = req.body;
        const companyId = req.user?.companyId;

        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });
        if (!planId || !gateway) return res.status(400).json({ error: 'Plan ID and Gateway are required' });

        const plan = await prisma.tenantPlan.findUnique({ where: { id: planId } });
        if (!plan) return res.status(404).json({ error: 'Subscription plan not found' });

        const user = await prisma.user.findFirst({
            where: { id: req.userId!, companyId },
        });

        const amount = Number(plan.price);
        const currency = plan.currency || 'INR';

        let checkoutUrl = '';
        let gatewayOrderId = '';

        if (gateway === 'cashfree') {
            const timestamp = Date.now();
            const cleanCompId = companyId.replace(/-/g, '');
            const cleanPlanId = planId.replace(/-/g, '');
            gatewayOrderId = `sub_${cleanCompId}_${cleanPlanId}_${timestamp}`;

            const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/billing?status=success&gateway=cashfree&order_id=${gatewayOrderId}`;
            const cfOrder = await paymentService.createCashfreeOrder(
                amount,
                user?.id || 'guest',
                user?.phone || '9999999999',
                user?.email || 'admin@company.com',
                returnUrl
            );

            const isProd = process.env.NODE_ENV === 'production';
            checkoutUrl = isProd
                ? `https://api.cashfree.com/pg/view/checkout?session_id=${cfOrder.payment_session_id}`
                : `https://sandbox.cashfree.com/pg/view/checkout?session_id=${cfOrder.payment_session_id}`;
            gatewayOrderId = cfOrder.order_id ?? gatewayOrderId;
        } else if (gateway === 'paypal') {
            const paypalOrder = await paymentService.createPaypalOrder(amount, currency);
            checkoutUrl = paypalOrder.links.find((l: any) => l.rel === 'approve')?.href || '';
            gatewayOrderId = paypalOrder.id;
        } else {
            return res.status(400).json({ error: 'Unsupported gateway' });
        }

        await prisma.tenantSubscription.upsert({
            where: { companyId },
            create: {
                companyId,
                planId,
                status: 'pending_payment',
                notes: JSON.stringify({ checkoutPlanId: planId, checkoutGateway: gateway, checkoutOrderId: gatewayOrderId }),
            },
            update: {
                notes: JSON.stringify({ checkoutPlanId: planId, checkoutGateway: gateway, checkoutOrderId: gatewayOrderId }),
            }
        });

        res.json({ checkoutUrl, orderId: gatewayOrderId });
    } catch (error: any) {
        console.error('Subscription checkout error:', error);
        res.status(500).json({ error: 'Failed to initiate checkout', details: error.message });
    }
};

export const verifySubscriptionPayment = async (req: AuthRequest, res: Response) => {
    try {
        const { gateway, orderId } = req.body;
        const companyId = req.user?.companyId;

        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });
        if (!gateway || !orderId) return res.status(400).json({ error: 'Gateway and Order ID are required' });

        const subscription = await prisma.tenantSubscription.findUnique({
            where: { companyId },
            include: { plan: true },
        });

        if (!subscription) return res.status(404).json({ error: 'Subscription record not found' });

        let isSuccess = false;
        let targetPlanId = subscription.planId;

        const checkoutData = subscription.notes ? JSON.parse(subscription.notes) : null;
        if (checkoutData && checkoutData.checkoutOrderId === orderId) {
            targetPlanId = checkoutData.checkoutPlanId;
        }

        if (gateway === 'cashfree') {
            const cf = paymentService.getCashfreeClient();
            const resCf = await (cf as any).PGFetchOrder(orderId);
            isSuccess = resCf.data.order_status === 'PAID';
        } else if (gateway === 'paypal') {
            const captureResult = await paymentService.capturePaypalOrder(orderId);
            isSuccess = captureResult.status === 'COMPLETED';
        }

        if (isSuccess) {
            const plan = await prisma.tenantPlan.findUnique({ where: { id: targetPlanId } });
            if (!plan) return res.status(404).json({ error: 'Associated plan not found' });

            const now = new Date();
            await prisma.tenantSubscription.update({
                where: { companyId },
                data: {
                    planId: targetPlanId,
                    status: 'active',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEndFrom(now, plan.billingInterval),
                    paymentMethod: gateway,
                    paymentGatewayId: orderId,
                    cancelledAt: null,
                    notes: `Paid successfully via ${gateway} at ${now.toISOString()}`,
                }
            });

            await syncCompanyModulesFromPlan(companyId, targetPlanId);

            // Post SaaS revenue into Applizor platform books (never tenant COA)
            try {
                const company = await prisma.company.findUnique({
                    where: { id: companyId },
                    select: { name: true },
                });
                await postSubscriptionRevenueToPlatform({
                    tenantCompanyId: companyId,
                    tenantName: company?.name,
                    amount: Number(plan.price),
                    currency: plan.currency || 'INR',
                    gateway,
                    orderId,
                    planName: plan.name,
                    planCode: plan.code,
                    userId: req.userId,
                });
            } catch (ledgerErr) {
                console.error('Platform subscription ledger post failed:', ledgerErr);
            }

            return res.json({ status: 'success', message: 'Subscription activated' });
        }

        res.status(400).json({ status: 'failed', message: 'Payment verification failed or pending' });
    } catch (error: any) {
        console.error('Subscription verification error:', error);
        res.status(500).json({ error: 'Failed to verify subscription payment', details: error.message });
    }
};

export const handleSubscriptionWebhook = async (req: Request, res: Response) => {
    try {
        const webhookBody = JSON.stringify(req.body);
        const cfSignature = req.headers['x-webhook-signature'] as string;
        const cfTimestamp = req.headers['x-webhook-timestamp'] as string;

        let isVerified = false;
        let gatewayOrderId = '';
        let gateway = '';

        if (cfSignature && cfTimestamp) {
            gateway = 'cashfree';
            gatewayOrderId = req.body.data?.order?.order_id;
            isVerified = paymentService.verifyCashfreeSignature(cfTimestamp, webhookBody, cfSignature);
        }

        if (isVerified && gatewayOrderId) {
            const subscriptions = await prisma.tenantSubscription.findMany({
                where: {
                    notes: {
                        contains: gatewayOrderId,
                    }
                }
            });

            const subscription = subscriptions[0];

            if (subscription && subscription.status !== 'active') {
                const checkoutData = subscription.notes ? JSON.parse(subscription.notes) : null;
                const targetPlanId = checkoutData?.checkoutPlanId || subscription.planId;

                const plan = await prisma.tenantPlan.findUnique({ where: { id: targetPlanId } });
                if (plan) {
                    const now = new Date();
                    await prisma.tenantSubscription.update({
                        where: { id: subscription.id },
                        data: {
                            planId: targetPlanId,
                            status: 'active',
                            currentPeriodStart: now,
                            currentPeriodEnd: periodEndFrom(now, plan.billingInterval),
                            paymentMethod: gateway,
                            paymentGatewayId: gatewayOrderId,
                            cancelledAt: null,
                            notes: `Paid successfully via webhook (${gateway}) at ${now.toISOString()}`,
                        }
                    });
                    await syncCompanyModulesFromPlan(subscription.companyId, targetPlanId);

                    try {
                        const company = await prisma.company.findUnique({
                            where: { id: subscription.companyId },
                            select: { name: true },
                        });
                        await postSubscriptionRevenueToPlatform({
                            tenantCompanyId: subscription.companyId,
                            tenantName: company?.name,
                            amount: Number(plan.price),
                            currency: plan.currency || 'INR',
                            gateway,
                            orderId: gatewayOrderId,
                            planName: plan.name,
                            planCode: plan.code,
                        });
                    } catch (ledgerErr) {
                        console.error('Platform subscription ledger post (webhook) failed:', ledgerErr);
                    }
                }
            }
        }

        res.json({ received: true });
    } catch (error: any) {
        console.error('Subscription webhook error:', error);
        res.status(500).json({ error: 'Webhook handling failed', details: error.message });
    }
};


// =====================
// Platform Accounting (Applizor SaaS books)
// =====================

export const ensurePlatformBooks = async (_req: AuthRequest, res: Response) => {
    try {
        const company = await getOrCreatePlatformCompany();
        res.json({
            platformCompany: { id: company.id, name: company.name, isPlatform: true },
            message: 'Platform books ready',
        });
    } catch (error: any) {
        console.error('Ensure platform books error:', error);
        res.status(500).json({ error: 'Failed to ensure platform books', details: error?.message });
    }
};

export const getPlatformAccountingAccounts = async (_req: AuthRequest, res: Response) => {
    try {
        res.json(await getPlatformAccounts());
    } catch (error: any) {
        console.error('Platform accounts error:', error);
        res.status(500).json({ error: 'Failed to load platform accounts', details: error?.message });
    }
};

export const getPlatformAccountingJournal = async (req: AuthRequest, res: Response) => {
    try {
        const limit = parseInt(String(req.query.limit || '100'), 10);
        res.json(await getPlatformJournal(limit));
    } catch (error: any) {
        console.error('Platform journal error:', error);
        res.status(500).json({ error: 'Failed to load platform journal', details: error?.message });
    }
};

export const getPlatformAccountingProfitLoss = async (req: AuthRequest, res: Response) => {
    try {
        const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined;
        const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined;
        res.json(await getPlatformProfitAndLoss(startDate, endDate));
    } catch (error: any) {
        console.error('Platform P&L error:', error);
        res.status(500).json({ error: 'Failed to load platform P&L', details: error?.message });
    }
};

export const getPlatformAccountingPayments = async (_req: AuthRequest, res: Response) => {
    try {
        res.json(await getPlatformSubscriptionPayments());
    } catch (error: any) {
        console.error('Platform payments error:', error);
        res.status(500).json({ error: 'Failed to load platform subscription payments', details: error?.message });
    }
};
