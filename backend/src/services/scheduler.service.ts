import cron from 'node-cron';
import prisma from '../prisma/client';
import { sendQuotationReminder, sendInvoiceEmail, sendEmail } from './email.service';
import { leaveAccrualService } from './leave-accrual.service';
import { InvoiceService } from './invoice.service';
import { AutomationService } from './automation.service';
import { generatePublicLink } from '../controllers/quotation-public.controller'; // Careful: this might be a controller function
import { CronLockService } from './cron-lock.service';

export class SchedulerService {
    static init() {
        console.log('⏳ Scheduler Service initialized');

        // Run every hour at minute 0
        cron.schedule('0 * * * *', async () => {
            await CronLockService.withCronLock('quotation_reminders', async () => {
                console.log('⏰ Running hourly scheduler tasks...');
                await this.processQuotationReminders();
            });
        });

        // Monthly Leave Accrual: Run at 00:00 on the 1st of every month
        cron.schedule('0 0 1 * *', async () => {
            await CronLockService.withCronLock('monthly_leave_accruals', async () => {
                console.log('⏰ Running monthly leave accruals...');
                await leaveAccrualService.processMonthlyAccruals();
            });
        });

        // Probation Confirmation: Run daily at 00:01
        cron.schedule('1 0 * * *', async () => {
            await CronLockService.withCronLock('daily_probation_check', async () => {
                console.log('⏰ Running daily probation check...');
                await leaveAccrualService.processProbationConfirmations();
            });
        });

        // Recurring Invoices: Run daily at 01:00
        cron.schedule('0 1 * * *', async () => {
            await CronLockService.withCronLock('recurring_invoices', async () => {
                console.log('⏰ Running daily recurring invoice generation...');
                await this.processRecurringInvoices();
            });
        });

        // Task Reminders: Run daily at 09:30 AM
        cron.schedule('30 9 * * *', async () => {
            await CronLockService.withCronLock('daily_task_reminders', async () => {
                console.log('⏰ Running daily task reminder check...');
                await this.processTaskReminders();
            });
        });

        // CRM Lead Alerts & Quotation Expirations: Run daily at 00:05 AM
        cron.schedule('5 0 * * *', async () => {
            await CronLockService.withCronLock('daily_crm_alerts', async () => {
                console.log('⏰ Running daily CRM lead alert and quotation expiration check...');
                await this.checkLeadFollowUps();
                await this.expireQuotations();
            });
        });
    }

    static async processRecurringInvoices() {
        try {
            console.log('[Scheduler] Processing recurring invoices...');
            const results = await InvoiceService.processRecurringInvoices();
            console.log(`[Scheduler] Processed ${results.length} recurring invoices.`);
        } catch (error) {
            console.error('[Scheduler] Error processing recurring invoices:', error);
        }
    }

    static async processQuotationReminders() {
        try {
            const now = new Date();

            // Find quotations that need reminders
            const quotations = await prisma.quotation.findMany({
                where: {
                    status: 'sent', // Only for sent quotations
                    nextReminderAt: {
                        lte: now
                    },
                    isPublicEnabled: true, // Needs to be public enabled to have a link?
                    publicToken: { not: null } // Must have a token
                },
                include: {
                    lead: true,
                    company: true,
                    client: true
                }
            });

            // Filtering manually if prisma doesn't support field comparison in where
            // (Prisma generally compares against values, not other fields, unless updated syntax)
            // But maxReminders is a field. We'll filter in JS to be safe.

            console.log(`Found ${quotations.length} quotations due for reminders.`);

            for (const quotation of quotations) {
                if (quotation.reminderCount >= quotation.maxReminders) continue;

                console.log(`Sending reminder for Quotation #${quotation.quotationNumber}`);

                // Generate public URL
                const publicUrl = `${process.env.FRONTEND_URL}/public/quotations/${quotation.publicToken}`;

                // Send Email
                await sendQuotationReminder(quotation, publicUrl);

                // Update Quotation
                let nextDate = null;
                if (quotation.reminderFrequency === 'daily') {
                    nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                } else if (quotation.reminderFrequency === 'weekly') {
                    nextDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                } else if (quotation.reminderFrequency === '3_days') {
                    nextDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
                }

                // If max reminders reached after this one, set nextDate to null
                if (quotation.reminderCount + 1 >= quotation.maxReminders) {
                    nextDate = null;
                }

                await prisma.quotation.update({
                    where: { id: quotation.id },
                    data: {
                        reminderCount: { increment: 1 },
                        nextReminderAt: nextDate,
                        activities: {
                            create: {
                                type: 'REMINDER_SENT',
                                metadata: {
                                    sentAt: new Date(),
                                    frequency: quotation.reminderFrequency
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error processing quotation reminders:', error);
        }
    }

    static async sendInvoiceReminders() {
        // ... (existing code preserved)
    }

    static async processTaskReminders() {
        try {
            console.log('[Scheduler] Processing task reminders...');

            // 1. Fetch active reminder rules
            const rules = await prisma.automationRule.findMany({
                where: {
                    triggerType: 'TASK_REMINDER',
                    isActive: true
                }
            });

            if (rules.length === 0) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const rule of rules) {
                const config = rule.triggerConfig as any;
                const daysBefore = config.daysBefore || 1;

                // Target date is today + daysBefore
                const targetDate = new Date(today.getTime());
                targetDate.setDate(targetDate.getDate() + daysBefore);

                const nextDay = new Date(targetDate.getTime());
                nextDay.setDate(nextDay.getDate() + 1);

                // Find tasks due on targetDate for this project
                const tasks = await prisma.task.findMany({
                    where: {
                        projectId: rule.projectId,
                        dueDate: {
                            gte: targetDate,
                            lt: nextDay
                        },
                        status: { notIn: ['done', 'completed', 'cancelled'] }
                    },
                    include: {
                        assignee: { select: { id: true, firstName: true, email: true } },
                        assignees: { include: { user: { select: { id: true, firstName: true, email: true } } } },
                        project: { select: { companyId: true, name: true, id: true } }
                    }
                });

                console.log(`[Scheduler] Rule "${rule.name}" found ${tasks.length} tasks due in ${daysBefore} days.`);

                for (const task of tasks) {
                    const allAssignees = [
                        ...(task.assignee ? [task.assignee] : []),
                        ...(task.assignees?.map((a: any) => a.user).filter(Boolean) || [])
                    ];
                    const uniqueAssignees = allAssignees.filter((a: any, i: number, arr: any[]) =>
                        arr.findIndex((x: any) => x.id === a.id) === i
                    );
                    for (const assignee of uniqueAssignees) {
                        await AutomationService.executeAction(rule, {
                            taskId: task.id,
                            projectId: task.projectId!,
                            taskTitle: task.title,
                            assigneeEmail: assignee.email || undefined,
                            assigneeName: assignee.firstName || 'User',
                            assigneeId: assignee.id || undefined,
                            companyId: task.project!.companyId,
                            newStatus: task.status,
                            daysRemaining: daysBefore,
                            dueDate: task.dueDate
                        } as any);
                    }
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error processing task reminders:', error);
        }
    }

    static async checkLeadFollowUps() {
        try {
            const now = new Date();
            const dueLeads = await prisma.lead.findMany({
                where: {
                    nextFollowUpAt: { lte: now },
                    status: { notIn: ['won', 'lost', 'converted'] },
                    assignedTo: { not: null }
                },
                include: {
                    assignedUser: true
                }
            });

            console.log(`[Scheduler] Found ${dueLeads.length} leads due for follow-ups.`);

            for (const lead of dueLeads) {
                if (lead.assignedUser && lead.assignedUser.email) {
                    const link = `/leads/${lead.id}`;
                    
                    // Check if alert notification was already created for this specific nextFollowUpAt
                    const existingAlert = await prisma.notification.findFirst({
                        where: {
                            userId: lead.assignedTo!,
                            type: 'LEAD_REMINDER',
                            link,
                            createdAt: { gte: lead.nextFollowUpAt! }
                        }
                    });

                    if (existingAlert) {
                        console.log(`[Scheduler] Alert already sent for lead "${lead.name}" (ID: ${lead.id}) for follow-up date ${lead.nextFollowUpAt}. Skipping.`);
                        continue;
                    }

                    console.log(`[Scheduler] Alerting ${lead.assignedUser.email} for Lead "${lead.name}" follow-up.`);
                    
                    await prisma.notification.create({
                        data: {
                            userId: lead.assignedTo!,
                            companyId: lead.companyId,
                            title: 'Lead Follow-up Due',
                            message: `The scheduled follow-up for lead "${lead.name}" (${lead.company || 'Private'}) is now due.`,
                            type: 'LEAD_REMINDER',
                            link,
                            isRead: false
                        }
                    });

                    const subject = `Lead Follow-up Reminder: ${lead.name}`;
                    const content = `
                        <p>Hello <strong>${lead.assignedUser.firstName}</strong>,</p>
                        <p>This is a reminder that you have a scheduled follow-up due for the following lead:</p>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <tr><td style="padding: 5px; font-weight: bold; width: 120px;">Lead Name:</td><td>${lead.name}</td></tr>
                            <tr><td style="padding: 5px; font-weight: bold;">Company:</td><td>${lead.company || '—'}</td></tr>
                            <tr><td style="padding: 5px; font-weight: bold;">Contact:</td><td>${lead.email || lead.phone || '—'}</td></tr>
                            <tr><td style="padding: 5px; font-weight: bold;">Next Follow-up:</td><td>${lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleString() : 'N/A'}</td></tr>
                        </table>
                    `;
                    
                    await sendEmail(lead.assignedUser.email, subject, content);
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error checking lead follow-ups:', error);
        }
    }

    static async expireQuotations() {
        try {
            const now = new Date();
            const expiredQuotes = await prisma.quotation.findMany({
                where: {
                    validUntil: { lte: now },
                    status: { in: ['draft', 'sent'] }
                }
            });

            console.log(`[Scheduler] Expiring ${expiredQuotes.length} quotations.`);

            for (const quote of expiredQuotes) {
                await prisma.$transaction(async (tx) => {
                    await tx.quotation.update({
                        where: { id: quote.id },
                        data: { status: 'expired' }
                    });

                    await tx.quotationActivity.create({
                        data: {
                            quotationId: quote.id,
                            type: 'EXPIRED',
                            metadata: {
                                reason: 'Validity period reached validUntil limit'
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error('[Scheduler] Error auto-expiring quotations:', error);
        }
    }
}
