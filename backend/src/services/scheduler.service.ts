import cron from 'node-cron';
import prisma from '../prisma/client';
import { sendQuotationReminder } from './email.service';
import { leaveAccrualService } from './leave-accrual.service';
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
                    company: true
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
}
