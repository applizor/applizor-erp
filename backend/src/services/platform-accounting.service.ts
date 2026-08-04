/**
 * Platform Accounting — Applizor SaaS books (subscription revenue).
 *
 * Separated from tenant company accounting:
 * - Tenant COA / journal / P&L live under each tenant's companyId
 * - Platform books live under a dedicated Company with isPlatform=true
 * - Subscription payments post HERE, never into the paying tenant's COA
 *
 * All DB work runs without ALS company context so tenant isolation
 * middleware cannot rewrite platform companyId to the caller's tenant.
 */
import prisma from '../prisma/client';
import { runWithoutCompanyContext } from '../utils/context';
import {
    createJournalEntry,
    ensureAccount,
    getJournalEntries,
    getProfitAndLoss,
    getTrialBalance,
} from './accounting.service';

export const PLATFORM_COMPANY_NAME = 'Applizor Platform';
export const PLATFORM_COMPANY_EMAIL = 'platform@applizor.com';

/** Platform-only chart of accounts (codes are local to the platform company). */
export const PLATFORM_ACCOUNTS = [
    { code: '1000', name: 'Platform Bank / Settlement', type: 'asset' },
    { code: '1100', name: 'Payment Gateway Clearing', type: 'asset' },
    { code: '3000', name: 'Platform Capital', type: 'equity' },
    { code: '4000', name: 'SaaS Subscription Revenue', type: 'income' },
    { code: '4100', name: 'Other Platform Income', type: 'income' },
    { code: '5400', name: 'Payment Gateway Fees', type: 'expense' },
    { code: '5200', name: 'Platform Operating Expense', type: 'expense' },
] as const;

export function subscriptionJournalRef(orderId: string): string {
    return `SUB-${orderId}`;
}

/**
 * Find or create the dedicated platform books company.
 * Never returned as a "tenant" in platform admin lists.
 */
export async function getOrCreatePlatformCompany() {
    return runWithoutCompanyContext(async () => {
        let company = await prisma.company.findFirst({
            where: { isPlatform: true },
        });

        if (!company) {
            company = await prisma.company.findFirst({
                where: { name: PLATFORM_COMPANY_NAME },
            });
            if (company && !company.isPlatform) {
                company = await prisma.company.update({
                    where: { id: company.id },
                    data: { isPlatform: true, isActive: true },
                });
            }
        }

        if (!company) {
            const india = await prisma.country.findUnique({ where: { code: 'IN' } });
            company = await prisma.company.create({
                data: {
                    name: PLATFORM_COMPANY_NAME,
                    email: PLATFORM_COMPANY_EMAIL,
                    legalName: 'Applizor Softech LLP — Platform Books',
                    country: 'India',
                    countryId: india?.id,
                    timezone: 'Asia/Kolkata',
                    locale: 'en-IN',
                    currency: 'INR',
                    isActive: true,
                    isPlatform: true,
                    // No tenant modules — this company is books-only
                    enabledModules: {},
                },
            });
        }

        await ensurePlatformChartOfAccounts(company.id);
        return company;
    });
}

export async function ensurePlatformChartOfAccounts(platformCompanyId: string) {
    return runWithoutCompanyContext(async () => {
        for (const acc of PLATFORM_ACCOUNTS) {
            await ensureAccount(platformCompanyId, acc.code, acc.name, acc.type);
        }
    });
}

export interface PostSubscriptionRevenueInput {
    tenantCompanyId: string;
    tenantName?: string;
    amount: number;
    currency?: string;
    gateway: string;
    orderId: string;
    planName?: string;
    planCode?: string;
    userId?: string;
}

/**
 * Post a tenant SaaS subscription payment into platform books.
 * Idempotent on reference SUB-{orderId}.
 * Never touches the tenant company's ledgers.
 */
export async function postSubscriptionRevenueToPlatform(input: PostSubscriptionRevenueInput) {
    const amount = Number(input.amount);
    if (!amount || amount <= 0) {
        return { skipped: true, reason: 'invalid_amount' as const };
    }

    return runWithoutCompanyContext(async () => {
        const platform = await getOrCreatePlatformCompany();
        const ref = subscriptionJournalRef(input.orderId);

        const existing = await prisma.journalEntry.findFirst({
            where: { companyId: platform.id, reference: ref },
        });
        if (existing) {
            return { skipped: true, reason: 'already_posted' as const, entry: existing };
        }

        const bank = await ensureAccount(
            platform.id,
            '1000',
            'Platform Bank / Settlement',
            'asset'
        );
        const revenue = await ensureAccount(
            platform.id,
            '4000',
            'SaaS Subscription Revenue',
            'income'
        );

        const tenantLabel = input.tenantName || input.tenantCompanyId;
        const planLabel = input.planName || input.planCode || 'plan';
        const description =
            `SaaS subscription revenue — ${planLabel} — tenant: ${tenantLabel}` +
            ` (${input.gateway}, ${input.currency || 'INR'} ${amount.toFixed(2)})`;

        const entry = await createJournalEntry(
            platform.id,
            new Date(),
            description,
            ref,
            [
                { accountId: bank.id, debit: amount },
                { accountId: revenue.id, credit: amount },
            ],
            true,
            input.userId
        );

        return { skipped: false, entry, platformCompanyId: platform.id };
    });
}

export async function getPlatformAccounts() {
    return runWithoutCompanyContext(async () => {
        const platform = await getOrCreatePlatformCompany();
        return {
            platformCompany: { id: platform.id, name: platform.name, isPlatform: true },
            accounts: await getTrialBalance(platform.id),
        };
    });
}

export async function getPlatformJournal(limit = 100) {
    return runWithoutCompanyContext(async () => {
        const platform = await getOrCreatePlatformCompany();
        return {
            platformCompany: { id: platform.id, name: platform.name, isPlatform: true },
            entries: await getJournalEntries(platform.id, limit),
        };
    });
}

export async function getPlatformProfitAndLoss(startDate?: Date, endDate?: Date) {
    return runWithoutCompanyContext(async () => {
        const platform = await getOrCreatePlatformCompany();
        const data = await getProfitAndLoss(platform.id, startDate, endDate);
        return {
            platformCompany: { id: platform.id, name: platform.name, isPlatform: true },
            ...data,
        };
    });
}

/**
 * MVP: paid SaaS subscriptions + matching platform journal lines (SUB-*).
 */
export async function getPlatformSubscriptionPayments() {
    return runWithoutCompanyContext(async () => {
        const platform = await getOrCreatePlatformCompany();

        const journals = await prisma.journalEntry.findMany({
            where: {
                companyId: platform.id,
                reference: { startsWith: 'SUB-' },
            },
            include: {
                lines: { include: { account: true } },
            },
            orderBy: { date: 'desc' },
            take: 200,
        });

        const subscriptions = await prisma.tenantSubscription.findMany({
            where: {
                paymentGatewayId: { not: null },
                status: { in: ['active', 'cancelled', 'expired', 'paused'] },
            },
            include: {
                plan: true,
                company: { select: { id: true, name: true, email: true, isPlatform: true } },
            },
            orderBy: { updatedAt: 'desc' },
            take: 200,
        });

        const tenantPayments = subscriptions
            .filter((s) => !s.company?.isPlatform)
            .map((s) => {
                const ref = s.paymentGatewayId
                    ? subscriptionJournalRef(s.paymentGatewayId)
                    : null;
                const journal = ref
                    ? journals.find((j) => j.reference === ref)
                    : undefined;
                return {
                    subscriptionId: s.id,
                    tenantCompanyId: s.companyId,
                    tenantName: s.company?.name,
                    planName: s.plan?.name,
                    planCode: s.plan?.code,
                    amount: s.plan ? Number(s.plan.price) : null,
                    currency: s.plan?.currency,
                    status: s.status,
                    gateway: s.paymentMethod,
                    orderId: s.paymentGatewayId,
                    periodStart: s.currentPeriodStart,
                    periodEnd: s.currentPeriodEnd,
                    journalPosted: !!journal,
                    journalId: journal?.id || null,
                    journalReference: journal?.reference || null,
                    notes: s.notes,
                    updatedAt: s.updatedAt,
                };
            });

        return {
            platformCompany: { id: platform.id, name: platform.name, isPlatform: true },
            payments: tenantPayments,
            journals,
        };
    });
}

const platformAccountingService = {
    getOrCreatePlatformCompany,
    ensurePlatformChartOfAccounts,
    postSubscriptionRevenueToPlatform,
    getPlatformAccounts,
    getPlatformJournal,
    getPlatformProfitAndLoss,
    getPlatformSubscriptionPayments,
    PLATFORM_ACCOUNTS,
    PLATFORM_COMPANY_NAME,
};

export default platformAccountingService;
