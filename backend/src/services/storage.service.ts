import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'applizor-erp';

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    endpoint: process.env.AWS_ENDPOINT || undefined,
    forcePathStyle: true, // often required for custom endpoints like Minio/DO
});

export class StorageService {
    /**
     * Extracts the S3 Key from a full URL, or returns the input if already a key.
     */
    static extractKey(fileKeyOrUrl: string): string {
        if (!fileKeyOrUrl) return '';
        if (!fileKeyOrUrl.startsWith('http')) return fileKeyOrUrl;

        try {
            const urlObj = new URL(fileKeyOrUrl);
            let path = urlObj.pathname.substring(1); // Remove leading slash

            // If path-style addressing is used, the bucket name might be the first segment
            if (path.startsWith(`${AWS_BUCKET_NAME}/`)) {
                path = path.substring(AWS_BUCKET_NAME.length + 1);
            }
            return path;
        } catch {
            return fileKeyOrUrl;
        }
    }

    /**
     * Upload a file to S3 or local disk
     * @param fileBuffer The file content as a Buffer
     * @param fileName The desired filename (including folder path like 'logos/image.png')
     * @param mimeType The file's MIME type
     * @returns The relative file path or S3 URL
     */
    static async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
        if (STORAGE_TYPE === 's3') {
            try {
                const parallelUploads3 = new Upload({
                    client: s3Client,
                    params: {
                        Bucket: AWS_BUCKET_NAME,
                        Key: fileName,
                        Body: fileBuffer,
                        ContentType: mimeType,
                    },
                });

                await parallelUploads3.done();
                // Return the full HTTP URL so frontend can render it seamlessly.
                return StorageService.getFileUrl(fileName);
            } catch (error) {
                console.error('[StorageService] S3 Upload Error:', error);
                throw new Error('Failed to upload file to S3');
            }
        } else {
            // Local storage
            const uploadDir = path.join(process.cwd(), 'uploads', path.dirname(fileName));
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const fullPath = path.join(process.cwd(), 'uploads', fileName);
            fs.writeFileSync(fullPath, fileBuffer);
            return `/uploads/${fileName}`;
        }
    }

    /**
     * Delete a file from S3 or local disk
     */
    static async deleteFile(fileKey: string): Promise<void> {
        if (!fileKey) return;

        if (STORAGE_TYPE === 's3') {
            try {
                const key = StorageService.extractKey(fileKey);
                const command = new DeleteObjectCommand({
                    Bucket: AWS_BUCKET_NAME,
                    Key: key,
                });
                await s3Client.send(command);
            } catch (error) {
                console.error('[StorageService] S3 Delete Error:', error);
            }
        } else {
            // Local storage - assume fileKey is relative URL like /uploads/logos/file.png
            const relativePath = fileKey.startsWith('/uploads/') ? fileKey.substring(1) : fileKey;
            const absolutePath = path.join(process.cwd(), relativePath);
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        }
    }

    /**
     * Get a file's buffer (used for PDF generation or internal processing)
     */
    static async getFileBuffer(fileKey: string): Promise<Buffer | null> {
        if (!fileKey) return null;

        if (STORAGE_TYPE === 's3' || fileKey.startsWith('http')) {
            try {
                const key = StorageService.extractKey(fileKey);
                const command = new GetObjectCommand({
                    Bucket: AWS_BUCKET_NAME,
                    Key: key,
                });
                const response = await s3Client.send(command);
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
        } else {
            // Local storage
            const relativePath = fileKey.startsWith('/uploads/') ? fileKey.substring(1) : fileKey;
            const absolutePath = path.join(process.cwd(), relativePath);
            if (fs.existsSync(absolutePath)) {
                return fs.readFileSync(absolutePath);
            }
            return null;
        }
    }

    /**
     * Get the public URL for a file
     */
    static getFileUrl(fileKey: string): string {
        if (!fileKey) return '';
        if (fileKey.startsWith('http')) return fileKey;
        if (fileKey.startsWith('/uploads/')) return fileKey;

        if (STORAGE_TYPE === 's3') {
            const endpoint = process.env.AWS_ENDPOINT || `https://s3.${AWS_REGION}.amazonaws.com`;
            // Remove trailing slash from endpoint if exists
            const base = endpoint.replace(/\/$/, '');
            return `${base}/${AWS_BUCKET_NAME}/${fileKey}`;
        }

        return `/uploads/${fileKey}`;
    }
}
