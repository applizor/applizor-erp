import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import paymentService from '../services/payment.service';

// =====================
// Tenant (Company) Management
// =====================

export const listTenants = async (req: AuthRequest, res: Response) => {
    try {
        const { page = '1', limit = '20', search, status, planId } = req.query;
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const where: any = {};
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
                        { min: 25001, max: Infinity, amount: 300 }
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
        const { name, legalName, email, phone, address, city, countryId, stateId, timezone, locale, currency, planCode } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Company name and email are required' });
        }

        const existing = await prisma.company.findFirst({ where: { email } });
        if (existing) return res.status(409).json({ error: 'A company with this email already exists' });

        const company = await prisma.company.create({
            data: {
                name,
                legalName: legalName || name,
                email,
                phone,
                address,
                city,
                countryId,
                stateId,
                timezone: timezone || 'Asia/Kolkata',
                locale: locale || 'en-IN',
                currency: currency || 'INR',
                isActive: true,
                offDays: 'Saturday, Sunday',
            },
        });

        // Assign plan if specified, or default to Starter
        if (planCode) {
            const plan = await prisma.tenantPlan.findUnique({ where: { code: planCode } });
            if (plan) {
                await prisma.tenantSubscription.create({
                    data: {
                        companyId: company.id,
                        planId: plan.id,
                        status: 'active',
                        autoRenew: true,
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                });
            }
        } else {
            const starterPlan = await prisma.tenantPlan.findUnique({ where: { code: 'starter_monthly' } });
            if (starterPlan) {
                await prisma.tenantSubscription.create({
                    data: {
                        companyId: company.id,
                        planId: starterPlan.id,
                        status: 'trial',
                        autoRenew: true,
                        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                        currentPeriodStart: new Date(),
                        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                });
            }
        }

        // Auto-bootstrap defaults if countryId is provided
        if (countryId) {
            await initializeCompanyDefaults(company.id, countryId);
        }

        res.status(201).json(company);
    } catch (error) {
        console.error('Onboard tenant error:', error);
        res.status(500).json({ error: 'Failed to onboard tenant' });
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
        res.json({ message: 'Tenant activated', company });
    } catch (error) {
        console.error('Activate tenant error:', error);
        res.status(500).json({ error: 'Failed to activate tenant' });
    }
};

export const deleteTenant = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
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
        const { planId, status, autoRenew, notes } = req.body;

        const data: any = {};
        if (planId) data.planId = planId;
        if (status) data.status = status;
        if (autoRenew !== undefined) data.autoRenew = autoRenew;
        if (notes !== undefined) data.notes = notes;

        const subscription = await prisma.tenantSubscription.upsert({
            where: { companyId: id },
            update: data,
            create: {
                companyId: id,
                planId: planId || (await prisma.tenantPlan.findFirst({ where: { code: 'starter_monthly' } }))!.id,
                status: status || 'active',
                autoRenew: autoRenew ?? true,
            },
        });

        res.json(subscription);
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ error: 'Failed to update subscription' });
    }
};

// =====================
// Platform Plans
// =====================

export const listPlans = async (req: AuthRequest, res: Response) => {
    try {
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

export const createPlan = async (req: AuthRequest, res: Response) => {
    try {
        const { name, code, description, price, currency, billingInterval, maxUsers, maxStorageGb, maxCompanies, enabledModules, features, sortOrder } = req.body;

        const plan = await prisma.tenantPlan.create({
            data: {
                name,
                code,
                description,
                price,
                currency: currency || 'USD',
                billingInterval: billingInterval || 'monthly',
                maxUsers: maxUsers || 5,
                maxStorageGb: maxStorageGb || 1,
                maxCompanies: maxCompanies || 1,
                enabledModules: enabledModules || null,
                features: features || null,
                sortOrder: sortOrder || 0,
            },
        });

        res.status(201).json(plan);
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({ error: 'Failed to create plan' });
    }
};

export const updatePlan = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        delete data.id;
        delete data.code;

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
        const [totalCompanies, activeCompanies, totalUsers, totalEmployees, totalInvoices, recentCompanies] = await Promise.all([
            prisma.company.count(),
            prisma.company.count({ where: { isActive: true } }),
            prisma.user.count(),
            prisma.employee.count(),
            prisma.invoice.count(),
            prisma.company.findMany({
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

            const intervalDays = plan.billingInterval === 'yearly' ? 365 : plan.billingInterval === 'quarterly' ? 90 : 30;

            await prisma.tenantSubscription.update({
                where: { companyId },
                data: {
                    planId: targetPlanId,
                    status: 'active',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000),
                    paymentMethod: gateway,
                    paymentGatewayId: orderId,
                    notes: `Paid successfully via ${gateway} at ${new Date().toISOString()}`,
                }
            });

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
                    const intervalDays = plan.billingInterval === 'yearly' ? 365 : plan.billingInterval === 'quarterly' ? 90 : 30;

                    await prisma.tenantSubscription.update({
                        where: { id: subscription.id },
                        data: {
                            planId: targetPlanId,
                            status: 'active',
                            currentPeriodStart: new Date(),
                            currentPeriodEnd: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000),
                            paymentMethod: gateway,
                            paymentGatewayId: gatewayOrderId,
                            notes: `Paid successfully via webhook (${gateway}) at ${new Date().toISOString()}`,
                        }
                    });
                }
            }
        }

        res.json({ received: true });
    } catch (error: any) {
        console.error('Subscription webhook error:', error);
        res.status(500).json({ error: 'Webhook handling failed', details: error.message });
    }
};
