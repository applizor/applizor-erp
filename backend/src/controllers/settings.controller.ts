import { Response } from 'express';
import prisma from '../prisma/client';
import { AuthRequest } from '../middleware/auth';
import { StorageService } from '../services/storage.service';
import { sendEmailDirect, resolveEmailConfig } from '../services/email.service';

// =====================
// Tax Rates
// =====================

export const getTaxRates = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const rates = await prisma.taxRate.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(rates);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tax rates' });
    }
};

export const createTaxRate = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { name, percentage, description } = req.body;

        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const rate = await prisma.taxRate.create({
            data: {
                companyId,
                name,
                percentage,
                description
            }
        });
        res.json(rate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create tax rate' });
    }
};

export const updateTaxRate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;
        const { name, percentage, description, isActive } = req.body;

        const existing = await prisma.taxRate.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ error: 'Tax rate not found' });

        const rate = await prisma.taxRate.update({
            where: { id },
            data: { name, percentage, description, isActive }
        });
        res.json(rate);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update tax rate' });
    }
};

export const deleteTaxRate = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const existing = await prisma.taxRate.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ error: 'Tax rate not found' });

        await prisma.taxRate.delete({ where: { id } });
        res.json({ message: 'Tax rate deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete tax rate' });
    }
};

// =====================
// Unit Types
// =====================

export const getUnitTypes = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const units = await prisma.unitType.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch unit types' });
    }
};

export const createUnitType = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { name, symbol } = req.body;

        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const unit = await prisma.unitType.create({
            data: {
                companyId,
                name,
                symbol
            }
        });
        res.json(unit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create unit type' });
    }
};

export const updateUnitType = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, symbol, isActive } = req.body;
        const companyId = req.user!.companyId;

        const existing = await prisma.unitType.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ error: 'Unit type not found' });

        const unit = await prisma.unitType.update({
            where: { id },
            data: { name, symbol, isActive }
        });
        res.json(unit);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update unit type' });
    }
};

export const deleteUnitType = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const companyId = req.user!.companyId;

        const existing = await prisma.unitType.findFirst({ where: { id, companyId } });
        if (!existing) return res.status(404).json({ error: 'Unit type not found' });

        await prisma.unitType.delete({ where: { id } });
        res.json({ message: 'Unit type deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete unit type' });
    }
};

// =====================
// Email Configuration — Multi-Department / Multi-Provider
// =====================

const MASK = '************';
const SECRET_FIELDS = ['smtpPass', 'microsoftClientSecret', 'microsoftRefreshToken', 'googleClientSecret', 'googleRefreshToken', 'sesSmtpPass', 'sendgridApiKey', 'mailgunApiKey'];

/** Deep-mask all secret fields inside a config object */
const maskSecrets = (obj: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
        if (key === 'departments' && val && typeof val === 'object') {
            out[key] = {};
            for (const [dept, deptConfig] of Object.entries(val as Record<string, any>)) {
                out[key][dept] = maskSecrets(deptConfig);
            }
        } else if (key === 'default' && val && typeof val === 'object') {
            out[key] = maskSecrets(val);
        } else if (SECRET_FIELDS.includes(key) && val) {
            out[key] = MASK;
        } else {
            out[key] = val;
        }
    }
    return out;
};

/** Merge new config with existing, preserving masked secrets */
const mergeWithExisting = (incoming: Record<string, any>, existing: Record<string, any>): Record<string, any> => {
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(incoming)) {
        if (key === 'departments' && val && typeof val === 'object') {
            out[key] = {};
            const existDepts = (existing?.departments || {}) as Record<string, any>;
            for (const [dept, deptConfig] of Object.entries(val as Record<string, any>)) {
                out[key][dept] = mergeWithExisting(deptConfig, existDepts[dept] || {});
            }
        } else if (key === 'default' && val && typeof val === 'object') {
            out[key] = mergeWithExisting(val, existing?.default || {});
        } else if (SECRET_FIELDS.includes(key) && val === MASK) {
            // Keep the existing secret — user didn't change it
            out[key] = existing[key] || '';
        } else {
            out[key] = val;
        }
    }
    return out;
};

/**
 * GET /api/settings/email
 * Returns the full email config with secrets masked.
 * Shape: { default: { provider, smtpHost, … }, departments: { accounts: {…}, hr: {…}, … } }
 */
export const getEmailConfig = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { emailConfig: true }
        });

        const config = (company?.emailConfig as Record<string, any>) || {};

        // Provide sensible default structure
        const defaultConfig = config.default || {
            provider: config.provider || 'smtp',
            smtpHost: config.smtpHost || '',
            smtpPort: config.smtpPort || '587',
            smtpUser: config.smtpUser || '',
            smtpPass: config.smtpPass || '',
            smtpSecure: config.smtpSecure || false,
            defaultFrom: config.fromEmail || config.defaultFrom || '',
            fromName: config.fromName || 'Applizor ERP',
            // Microsoft
            microsoftTenantId: config.microsoftTenantId || '',
            microsoftClientId: config.microsoftClientId || '',
            microsoftClientSecret: config.microsoftClientSecret || '',
            microsoftRefreshToken: config.microsoftRefreshToken || '',
            // Google
            googleClientId: config.googleClientId || '',
            googleClientSecret: config.googleClientSecret || '',
            googleRefreshToken: config.googleRefreshToken || '',
            // SES
            sesSmtpHost: config.sesSmtpHost || '',
            sesSmtpPort: config.sesSmtpPort || '587',
            sesSmtpUser: config.sesSmtpUser || '',
            sesSmtpPass: config.sesSmtpPass || '',
            sesRegion: config.sesRegion || '',
            // SendGrid
            sendgridApiKey: config.sendgridApiKey || '',
            // Mailgun
            mailgunApiKey: config.mailgunApiKey || '',
            mailgunDomain: config.mailgunDomain || '',
            mailgunHost: config.mailgunHost || '',
        };

        const departments = config.departments || {};

        res.json(maskSecrets({ default: defaultConfig, departments }));
    } catch (error) {
        console.error('getEmailConfig error:', error);
        res.status(500).json({ error: 'Failed to fetch email config' });
    }
};

/**
 * POST /api/settings/email
 * Save multi-department email config. Auto-merges masked secrets.
 */
export const saveEmailConfig = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { emailConfig: true }
        });

        const existing = (company?.emailConfig as Record<string, any>) || {};
        const merged = mergeWithExisting(req.body, existing);

        await prisma.company.update({
            where: { id: companyId },
            data: { emailConfig: merged }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('saveEmailConfig error:', error);
        res.status(500).json({ error: 'Failed to save email config' });
    }
};

/**
 * POST /api/settings/email/test
 * Sends a real test email through the configured provider using sendEmailDirect.
 */
export const testEmailConfig = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const { to, department } = req.body;
        if (!to) return res.status(400).json({ error: 'Recipient email is required' });

        // Resolve the active config for this department
        const config = await resolveEmailConfig(companyId, department || 'default');

        const html = `
            <div style="font-family: 'Inter', sans-serif; padding: 32px; background: #F8FAFC;">
                <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #001C30 0%, #003A5C 100%); padding: 24px 32px;">
                        <p style="color: rgba(255,255,255,0.5); font-size: 9px; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase; margin: 0;">Applizor ERP</p>
                        <p style="color: #fff; font-size: 20px; font-weight: 900; margin: 8px 0 0;">✅ Test Email Successful</p>
                    </div>
                    <div style="padding: 24px 32px;">
                        <p style="font-size: 14px; color: #475569; line-height: 1.7; margin: 0 0 16px;">
                            This is a test email from your Applizor ERP system. If you're reading this, your email configuration is working correctly!
                        </p>
                        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px; text-align: center;">
                            <p style="font-size: 9px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #166534; margin: 0 0 4px;">Provider</p>
                            <p style="font-size: 16px; font-weight: 800; color: #14532D; margin: 0; text-transform: uppercase;">${config.provider || 'SMTP'}</p>
                        </div>
                        ${department && department !== 'default' ? `<p style="font-size: 12px; color: #94A3B8; margin-top: 12px; text-align: center;">Department: <strong>${department}</strong></p>` : ''}
                    </div>
                    <div style="background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 32px;">
                        <p style="font-size: 11px; color: #CBD5E1; margin: 0;">&copy; ${new Date().getFullYear()} Applizor ERP — Automated test email</p>
                    </div>
                </div>
            </div>`;

        await sendEmailDirect(to, `✅ Applizor ERP — Email Test ${department ? `(${department})` : ''}`, html, config);

        res.json({ success: true, message: 'Test email sent successfully! Check your inbox.' });
    } catch (error: any) {
        console.error('testEmailConfig error:', error);
        res.status(400).json({ error: 'Failed to send test email', details: error.message });
    }
};

// =====================
// Email Audit Logs
// =====================

/**
 * GET /api/settings/email/logs
 * Returns paginated email logs for the tenant.
 * Query params: page (default 1), limit (default 25), status, department, search
 */
export const getEmailLogs = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
        const skip = (page - 1) * limit;
        const status = req.query.status as string;
        const department = req.query.department as string;
        const search = req.query.search as string;

        const where: any = { companyId };
        if (status && status !== 'all') where.status = status;
        if (department && department !== 'all') where.department = department;
        if (search) {
            where.OR = [
                { recipient: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
                { sender: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.emailLog.findMany({
                where,
                orderBy: { sentAt: 'desc' },
                take: limit,
                skip,
                select: {
                    id: true,
                    recipient: true,
                    sender: true,
                    subject: true,
                    department: true,
                    status: true,
                    errorMessage: true,
                    sentAt: true,
                    attempts: true,
                    lastAttempt: true,
                }
            }),
            prisma.emailLog.count({ where })
        ]);

        // Stats
        const [totalSent, totalFailed, totalPending] = await Promise.all([
            prisma.emailLog.count({ where: { companyId, status: 'sent' } }),
            prisma.emailLog.count({ where: { companyId, status: 'failed' } }),
            prisma.emailLog.count({ where: { companyId, status: 'pending' } }),
        ]);

        res.json({
            logs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            stats: { totalSent, totalFailed, totalPending, total: totalSent + totalFailed + totalPending }
        });
    } catch (error) {
        console.error('getEmailLogs error:', error);
        res.status(500).json({ error: 'Failed to fetch email logs' });
    }
};

/**
 * POST /api/settings/email/logs/:id/retry
 * Retry a failed/pending email.
 */
export const retryEmail = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        const { id } = req.params;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const log = await prisma.emailLog.findFirst({ where: { id, companyId } });
        if (!log) return res.status(404).json({ error: 'Email log not found' });
        if (log.status === 'sent') return res.status(400).json({ error: 'Email already sent' });

        // Reset status to pending so the queue picks it up
        await prisma.emailLog.update({
            where: { id },
            data: { status: 'pending', attempts: 0, errorMessage: null }
        });

        res.json({ success: true, message: 'Email queued for retry' });
    } catch (error) {
        console.error('retryEmail error:', error);
        res.status(500).json({ error: 'Failed to retry email' });
    }
};

// =====================
// Payment Configuration
// =====================

export const getPaymentConfig = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { paymentConfig: true }
        });

        const config = (company?.paymentConfig as Record<string, any>) || {};
        res.json({
            razorpayKeyId: config.razorpayKeyId || '',
            razorpayKeySecret: config.razorpayKeySecret ? '************' : '',
            cashfreeAppId: config.cashfreeAppId || '',
            cashfreeSecretKey: config.cashfreeSecretKey ? '************' : '',
            paypalClientId: config.paypalClientId || '',
            paypalClientSecret: config.paypalClientSecret ? '************' : '',
            preferredGateway: config.preferredGateway || 'razorpay',
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch payment config' });
    }
};

export const savePaymentConfig = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const { razorpayKeyId, razorpayKeySecret, cashfreeAppId, cashfreeSecretKey, paypalClientId, paypalClientSecret, preferredGateway } = req.body;

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { paymentConfig: true }
        });

        const existing = (company?.paymentConfig as Record<string, any>) || {};

        await prisma.company.update({
            where: { id: companyId },
            data: {
                paymentConfig: {
                    ...existing,
                    razorpayKeyId: razorpayKeyId || existing.razorpayKeyId || '',
                    razorpayKeySecret: razorpayKeySecret === '************' ? existing.razorpayKeySecret : (razorpayKeySecret || ''),
                    cashfreeAppId: cashfreeAppId || existing.cashfreeAppId || '',
                    cashfreeSecretKey: cashfreeSecretKey === '************' ? existing.cashfreeSecretKey : (cashfreeSecretKey || ''),
                    paypalClientId: paypalClientId || existing.paypalClientId || '',
                    paypalClientSecret: paypalClientSecret === '************' ? existing.paypalClientSecret : (paypalClientSecret || ''),
                    preferredGateway: preferredGateway || existing.preferredGateway || 'razorpay',
                }
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save payment config' });
    }
};

// =====================
// Storage Configuration
// =====================

export const getStorageConfig = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { storageConfig: true }
        });

        const config = (company?.storageConfig as Record<string, any>) || {};
        const masked = {
            provider: config.provider || 's3',
            awsAccessKeyId: config.awsAccessKeyId || '',
            awsSecretAccessKey: config.awsSecretAccessKey ? '************' : '',
            awsRegion: config.awsRegion || 'ap-south-1',
            awsBucketName: config.awsBucketName || '',
            awsEndpoint: config.awsEndpoint || '',
        };

        res.json(masked);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch storage config' });
    }
};

export const saveStorageConfig = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const { provider, awsAccessKeyId, awsSecretAccessKey, awsRegion, awsBucketName, awsEndpoint } = req.body;

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { storageConfig: true }
        });

        const existing = (company?.storageConfig as Record<string, any>) || {};

        await prisma.company.update({
            where: { id: companyId },
            data: {
                storageConfig: {
                    provider: provider || existing.provider || 's3',
                    awsAccessKeyId: awsAccessKeyId || existing.awsAccessKeyId || '',
                    awsSecretAccessKey: awsSecretAccessKey === '************' ? existing.awsSecretAccessKey : (awsSecretAccessKey || ''),
                    awsRegion: awsRegion || existing.awsRegion || 'ap-south-1',
                    awsBucketName: awsBucketName || existing.awsBucketName || '',
                    awsEndpoint: awsEndpoint || existing.awsEndpoint || '',
                }
            }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save storage config' });
    }
};

export const testStorageConfig = async (req: AuthRequest, res: Response) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) return res.status(400).json({ error: 'Company ID is missing' });

        const { awsAccessKeyId, awsSecretAccessKey, awsRegion, awsBucketName, awsEndpoint } = req.body;

        let secretKey = awsSecretAccessKey;
        if (secretKey === '************') {
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { storageConfig: true }
            });
            const existing = (company?.storageConfig as any) || {};
            secretKey = existing.awsSecretAccessKey;
        }

        if (!awsAccessKeyId || !secretKey || !awsBucketName) {
            return res.status(400).json({ error: 'Missing S3 credentials' });
        }

        const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const client = new S3Client({
            region: awsRegion || 'ap-south-1',
            credentials: {
                accessKeyId: awsAccessKeyId,
                secretAccessKey: secretKey,
            },
            endpoint: awsEndpoint || undefined,
            forcePathStyle: true,
        });

        const testFileName = `test-connection-${Date.now()}.txt`;
        const testContent = Buffer.from('Applizor ERP S3 Connection Test File');

        await client.send(new PutObjectCommand({
            Bucket: awsBucketName,
            Key: testFileName,
            Body: testContent,
            ContentType: 'text/plain',
        }));

        await client.send(new DeleteObjectCommand({
            Bucket: awsBucketName,
            Key: testFileName,
        }));

        res.json({ success: true, message: 'S3 Connection established and verified successfully!' });
    } catch (error: any) {
        console.error('Storage test error:', error);
        res.status(400).json({ error: 'S3 Connection test failed', details: error.message });
    }
};
