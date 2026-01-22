import { Request, Response } from 'express';
import { ContractService } from '../services/contract.service';
import { AuthRequest } from '../middleware/auth';
import { ClientAuthRequest } from '../middleware/client.auth';
import { PDFService } from '../services/pdf.service';

// Admin Controllers
export const createContract = async (req: AuthRequest, res: Response) => {
    try {
        const contract = await ContractService.createContract({
            ...req.body,
            companyId: req.user!.companyId,
            creatorId: req.userId!
        });
        res.status(201).json(contract);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getContracts = async (req: AuthRequest, res: Response) => {
    try {
        const contracts = await ContractService.getContracts(req.user!.companyId);
        res.json(contracts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const getContractById = async (req: Request, res: Response) => {
    try {
        const contract = await ContractService.getContractById(req.params.id);
        if (!contract) return res.status(404).json({ error: 'Contract not found' });
        res.json(contract);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const updateContract = async (req: Request, res: Response) => {
    try {
        const contract = await ContractService.updateContract(req.params.id, req.body);
        res.json(contract);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteContract = async (req: Request, res: Response) => {
    try {
        await ContractService.deleteContract(req.params.id);
        res.json({ message: 'Contract deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// Portal Controllers
export const getMyContracts = async (req: ClientAuthRequest, res: Response) => {
    try {
        const contracts = await ContractService.getContracts(req.client.companyId, {
            clientId: req.clientId,
            status: { not: 'draft' } // Clients can't see drafts
        });
        res.json(contracts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const signContract = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { signature, name } = req.body;
        const ip = req.ip || req.socket.remoteAddress || 'Unknown';

        const contract = await ContractService.signContract(req.params.id, {
            signature,
            name,
            ip: ip as string
        });
        res.json(contract);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const downloadContractPDF = async (req: Request, res: Response) => {
    try {
        const contract = await ContractService.getContractById(req.params.id);
        if (!contract) return res.status(404).json({ error: 'Contract not found' });

        const pdfBuffer = await PDFService.generateContractPDF({
            id: contract.id,
            title: contract.title,
            content: contract.content,
            date: contract.createdAt,
            company: contract.company,
            client: contract.client,
            clientSignature: contract.clientSignature,
            signerIp: contract.signerIp,
            signedAt: contract.signedAt
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Contract-${contract.title}.pdf"`);
        res.send(pdfBuffer);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
