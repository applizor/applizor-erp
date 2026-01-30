
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';

export const uploadDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { type, name } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const document = await prisma.document.create({
            data: {
                name: name || file.originalname,
                type: type || 'document', // id_proof, address_proof, etc.
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                companyId: req.user!.companyId,
                employeeId: req.user!.employeeId, // Important: Link to employee
                uploadedById: req.user!.id
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
        const documents = await prisma.document.findMany({
            where: {
                employeeId: req.user!.employeeId,
                // Optional: Filter by specific types if needed, or get all
            },
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
        const document = await prisma.document.findFirst({
            where: { id, employeeId: req.user!.employeeId }
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
