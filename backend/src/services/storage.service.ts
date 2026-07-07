import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import prisma from '../prisma/client';
import { getCompanyIdFromContext } from '../utils/context';

// Resolver to dynamically build S3 client and configurations per tenant
const getS3Config = async (companyId?: string) => {
    // Fallback to AsyncLocalStorage company context if no parameter supplied
    const resolvedCompanyId = companyId || getCompanyIdFromContext();

    if (resolvedCompanyId) {
        const company = await prisma.company.findUnique({
            where: { id: resolvedCompanyId },
            select: { storageConfig: true }
        });

        const config = company?.storageConfig as any;
        if (config && config.awsAccessKeyId && config.awsSecretAccessKey) {
            const endpoint = config.awsEndpoint || `https://s3.${config.awsRegion || 'ap-south-1'}.amazonaws.com`;
            const base = endpoint.replace(/\/$/, '');
            return {
                client: new S3Client({
                    region: config.awsRegion || 'ap-south-1',
                    credentials: {
                        accessKeyId: config.awsAccessKeyId,
                        secretAccessKey: config.awsSecretAccessKey,
                    },
                    endpoint: config.awsEndpoint || undefined,
                    forcePathStyle: true,
                }),
                bucket: config.awsBucketName || 'applizor-erp',
                endpoint: base,
                isCustom: true
            };
        }
    }

    // Default system fallback from environment variables
    const region = process.env.AWS_REGION || 'ap-south-1';
    const bucket = process.env.AWS_BUCKET_NAME || 'applizor-erp';
    const endpoint = process.env.AWS_ENDPOINT || `https://s3.${region}.amazonaws.com`;
    const base = endpoint.replace(/\/$/, '');

    return {
        client: new S3Client({
            region,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            },
            endpoint: process.env.AWS_ENDPOINT || undefined,
            forcePathStyle: true,
        }),
        bucket,
        endpoint: base,
        isCustom: false
    };
};

export class StorageService {
    /**
     * Extracts the S3 Key from a full URL, or returns the input if already a key.
     */
    static extractKey(fileKeyOrUrl: string, bucketName?: string): string {
        if (!fileKeyOrUrl) return '';
        if (!fileKeyOrUrl.startsWith('http')) return fileKeyOrUrl;

        try {
            const urlObj = new URL(fileKeyOrUrl);
            let keyPath = urlObj.pathname.substring(1); // Remove leading slash

            // If path-style addressing is used, the bucket name might be the first segment
            const bucket = bucketName || 'applizor-erp';
            if (keyPath.startsWith(`${bucket}/`)) {
                keyPath = keyPath.substring(bucket.length + 1);
            }
            return keyPath;
        } catch {
            return fileKeyOrUrl;
        }
    }

    /**
     * Upload a file to S3
     * @param fileBuffer The file content as a Buffer
     * @param fileName The desired filename (including folder path like 'logos/image.png')
     * @param mimeType The file's MIME type
     * @param companyId Optional company ID context
     * @returns The relative file path or S3 URL
     */
    static async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, companyId?: string): Promise<string> {
        // Enforce prefix segregation inside the bucket
        const resolvedCompanyId = companyId || getCompanyIdFromContext();
        const prefixName = resolvedCompanyId ? `${resolvedCompanyId}/${fileName}` : fileName;

        const s3Conf = await getS3Config(resolvedCompanyId);

        try {
            const parallelUploads3 = new Upload({
                client: s3Conf.client,
                params: {
                    Bucket: s3Conf.bucket,
                    Key: prefixName,
                    Body: fileBuffer,
                    ContentType: mimeType,
                },
            });

            await parallelUploads3.done();
            return prefixName; // Return key path instead of full url so getFileUrl can dynamically presign it!
        } catch (error) {
            console.error('[StorageService] S3 Upload Error:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    /**
     * Delete a file from S3
     */
    static async deleteFile(fileKey: string, companyId?: string): Promise<void> {
        if (!fileKey) return;

        const resolvedCompanyId = companyId || getCompanyIdFromContext();
        const s3Conf = await getS3Config(resolvedCompanyId);

        try {
            const key = StorageService.extractKey(fileKey, s3Conf.bucket);
            const command = new DeleteObjectCommand({
                Bucket: s3Conf.bucket,
                Key: key,
            });
            await s3Conf.client.send(command);
        } catch (error) {
            console.error('[StorageService] S3 Delete Error:', error);
        }
    }

    /**
     * Get a file's buffer (used for PDF generation or internal processing)
     */
    static async getFileBuffer(fileKey: string, companyId?: string): Promise<Buffer | null> {
        if (!fileKey) return null;

        const resolvedCompanyId = companyId || getCompanyIdFromContext();
        const s3Conf = await getS3Config(resolvedCompanyId);

        try {
            const key = StorageService.extractKey(fileKey, s3Conf.bucket);
            const command = new GetObjectCommand({
                Bucket: s3Conf.bucket,
                Key: key,
            });
            const response = await s3Conf.client.send(command);
            const stream = response.Body as Readable;

            return new Promise((resolve, reject) => {
                const chunks: any[] = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('error', reject);
                stream.on('end', () => resolve(Buffer.concat(chunks)));
            });
        } catch (error) {
            console.error('[StorageService] S3 Get Error:', error);
            return null;
        }
    }

    /**
     * Get a readable stream for a file (used for piping downloads directly to frontend)
     */
    static async getFileStream(fileKey: string, companyId?: string): Promise<Readable | null> {
        if (!fileKey) return null;

        const resolvedCompanyId = companyId || getCompanyIdFromContext();
        const s3Conf = await getS3Config(resolvedCompanyId);

        try {
            const key = StorageService.extractKey(fileKey, s3Conf.bucket);
            const command = new GetObjectCommand({
                Bucket: s3Conf.bucket,
                Key: key,
            });
            const response = await s3Conf.client.send(command);
            return response.Body as Readable;
        } catch (error) {
            console.error('[StorageService] S3 Stream Error:', error);
            return null;
        }
    }

    /**
     * Get a temporary pre-signed URL for a file
     */
    static async getFileUrl(fileKey: string, companyId?: string): Promise<string> {
        if (!fileKey) return '';
        if (fileKey.startsWith('http')) return fileKey;
        if (fileKey.startsWith('/uploads/')) return fileKey;

        const resolvedCompanyId = companyId || getCompanyIdFromContext();
        const s3Conf = await getS3Config(resolvedCompanyId);

        try {
            const key = StorageService.extractKey(fileKey, s3Conf.bucket);
            const command = new GetObjectCommand({
                Bucket: s3Conf.bucket,
                Key: key,
            });
            // Pre-signed URL valid for 15 minutes (900 seconds)
            return await getSignedUrl(s3Conf.client as any, command, { expiresIn: 900 });
        } catch (error) {
            console.error('[StorageService] Presign S3 URL Error:', error);
            // Fallback to static public S3 URL format
            return `${s3Conf.endpoint}/${s3Conf.bucket}/${fileKey}`;
        }
    }
}
