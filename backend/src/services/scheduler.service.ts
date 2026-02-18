import cron from 'node-cron';
import prisma from '../prisma/client';
import { sendQuotationReminder, sendInvoiceEmail } from './email.service';
import { leaveAccrualService } from './leave-accrual.service';
import { InvoiceService } from './invoice.service';
import { generatePublicLink } from '../controllers/quotation-public.controller'; // Careful: this might be a controller function
// We might need to implement logic to get/generate valid public token without controller req/res

export class SchedulerService {
    static init() {
        console.log('⏳ Scheduler Service initialized');

        // Run every hour at minute 0
        cron.schedule('0 * * * *', async () => {
            console.log('⏰ Running hourly scheduler tasks...');
            await this.processQuotationReminders();
        });

        // Monthly Leave Accrual: Run at 00:00 on the 1st of every month
        cron.schedule('0 0 1 * *', async () => {
            console.log('⏰ Running monthly leave accruals...');
            await leaveAccrualService.processMonthlyAccruals();
        });

        // Probation Confirmation: Run daily at 00:01
        cron.schedule('1 0 * * *', async () => {
            console.log('⏰ Running daily probation check...');
            await leaveAccrualService.processProbationConfirmations();
        });

        // Recurring Invoices: Run daily at 01:00
        cron.schedule('0 1 * * *', async () => {
            console.log('⏰ Running daily recurring invoice generation...');
            await this.processRecurringInvoices();
        });

        // Invoice Reminders: Run daily at 09:00 AM (better time for emails)
        cron.schedule('0 9 * * *', async () => {
            console.log('⏰ Running daily invoice reminder check...');
            await this.sendInvoiceReminders();
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
        try {
            console.log('[Scheduler] Checking for upcoming and overdue invoices...');
            const today = new Date();
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(today.getDate() + 7);

            // Find invoices due within the next 7 days OR overdue
            // And are NOT paid
            const targetInvoices = await prisma.invoice.findMany({
                where: {
                    status: { in: ['sent', 'partial', 'overdue'] },
                    dueDate: {
                        lte: sevenDaysFromNow // Due date is today or in the next 7 days (or in the past)
                    }
                },
                include: { client: true }
            });

            console.log(`[Scheduler] Found ${targetInvoices.length} invoices for reminders.`);

            for (const invoice of targetInvoices) {
                if (!invoice.client || !invoice.client.email) continue;

                // Basic Logic: Send reminder
                // Optimization: In a real app, we should check if we already sent a reminder TODAY to avoid spamming if this script runs multiple times.
                // For this implementation, we assume the scheduler runs exactly once daily.

                await sendInvoiceEmail(
                    invoice.client.email,
                    invoice,
                    undefined, // No PDF attachment for reminder logic simple version, or could generate
                    true, // isReminder
                    `${process.env.FRONTEND_URL}/portal/invoices/${invoice.id}`
                );

                console.log(`[Scheduler] Reminder sent for Invoice #${invoice.invoiceNumber} to ${invoice.client.email}`);
            }
        } catch (error) {
            console.error('[Scheduler] Error sending invoice reminders:', error);
        }
    }
}
