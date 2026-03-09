import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StorageService } from '../services/storage.service';

export const uploadEditorAsset = async (req: AuthRequest, res: Response) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = `editor/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`;
        const fileUrl = await StorageService.uploadFile(file.buffer, fileName, file.mimetype);

        res.json({
            url: fileUrl,
            name: file.originalname,
            size: file.size,
            type: file.mimetype
        });
    } catch (error) {
        console.error('[UploadController] Editor Asset Error:', error);
        res.status(500).json({ error: 'Failed to upload asset' });
    }
};
