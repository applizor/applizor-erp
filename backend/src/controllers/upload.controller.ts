import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StorageService } from '../services/storage.service';
import path from 'path';

export const uploadEditorAsset = async (req: AuthRequest, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = `editor/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`;
        const fileUrl = await StorageService.uploadFile(file.buffer, fileName, file.mimetype);

        const baseUrl = process.env.BACKEND_URL 
            ? process.env.BACKEND_URL.replace(/\/$/, '') 
            : `${req.protocol}://${req.get('host')}`;
        const cleanFileUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
        const url = `${baseUrl}/api/upload/editor/${cleanFileUrl}`;

        res.json({
            url: url,
            name: file.originalname,
            size: file.size,
            type: file.mimetype
        });
    } catch (error) {
        console.error('[UploadController] Editor Asset Error:', error);
        res.status(500).json({ error: 'Failed to upload asset' });
    }
};

export const getEditorAsset = async (req: Request, res: Response) => {
    try {
        const key = req.params[0];
        if (!key) {
            return res.status(400).json({ error: 'File key is required' });
        }

        // Extract companyId from key if present (e.g. "36f02d11-e355-44bd-817a-79cd71dc2674/editor/...")
        const parts = key.split('/');
        const companyId = parts.length > 2 && parts[0].length === 36 ? parts[0] : undefined;

        const stream = await StorageService.getFileStream(key, companyId);
        if (!stream) {
            return res.status(404).json({ error: 'File not found' });
        }

        const ext = path.extname(key).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.pdf') contentType = 'application/pdf';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        stream.pipe(res);
    } catch (error) {
        console.error('[UploadController] Get Editor Asset Error:', error);
        res.status(500).json({ error: 'Failed to retrieve asset' });
    }
};
