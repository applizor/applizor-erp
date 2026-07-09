
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { StorageService } from '../services/storage.service';
import { PermissionService } from '../services/permission.service';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { type, name } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const employeeId = req.user?.employee?.id;
        if (!employeeId) {
            return res.status(400).json({ error: 'Employee record not found for this user' });
        }

        const fileName = `${type || 'document'}/${employeeId}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`;
        const fileUrl = await StorageService.uploadFile(file.buffer, fileName, file.mimetype);

        const document = await prisma.document.create({
            data: {
                name: name || file.originalname,
                type: type || 'document',
                filePath: fileUrl,
                fileSize: file.size,
                mimeType: file.mimetype,
                companyId: req.user!.companyId,
                employeeId: employeeId,
                uploadedById: (req.user as any).id
            }
        });

        res.status(201).json(document);
    } catch (error) {
        console.error('Upload Error', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};

export const getMyDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const employeeId = req.user?.employee?.id;
        if (!employeeId) return res.json([]);

        const scope = PermissionService.getPermissionScope(req.user, 'Document', 'read');
        const where: any = { employeeId };

        if (!scope.all) {
            if (scope.added && !scope.owned) {
                where.uploadedById = req.user!.id;
            } else if (!scope.added && !scope.owned) {
                where.status = { not: 'draft' };
            }
        }

        const documents = await prisma.document.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const employeeId = req.user?.employee?.id;
        const document = await prisma.document.findFirst({
            where: { id, employeeId }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        await prisma.document.delete({ where: { id } });
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete document' });
    }
};
