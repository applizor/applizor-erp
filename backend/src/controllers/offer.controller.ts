import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create Offer
export const createOffer = async (req: AuthRequest, res: Response) => {
    try {
        const { candidateId, position, department, salary, startDate } = req.body;

        // Check if offer already exists
        const existingOffer = await prisma.offerLetter.findUnique({
            where: { candidateId }
        });

        if (existingOffer) {
            return res.status(400).json({ error: 'Offer letter already exists for this candidate' });
        }

        const offer = await prisma.offerLetter.create({
            data: {
                candidateId,
                position,
                department,
                salary: Number(salary),
                startDate: new Date(startDate),
                status: 'pending'
            }
        });

        // Update candidate status
        await prisma.candidate.update({
            where: { id: candidateId },
            data: {
                status: 'offer',
                currentStage: 'Offer Generated'
            }
        });

        res.status(201).json(offer);
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
};

// Get Offer by Candidate ID
export const getOffer = async (req: AuthRequest, res: Response) => {
    try {
        const { candidateId } = req.params;

        const offer = await prisma.offerLetter.findUnique({
            where: { candidateId }
        });

        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        res.json(offer);
    } catch (error) {
        console.error('Get offer error:', error);
        res.status(500).json({ error: 'Failed to fetch offer' });
    }
};

// Update Offer Status
export const updateOfferStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // sent, accepted, rejected

        const offer = await prisma.offerLetter.update({
            where: { id },
            data: { status }
        });

        // If accepted, candidate is Hired
        if (status === 'accepted') {
            await prisma.candidate.update({
                where: { id: offer.candidateId },
                data: { status: 'hired', currentStage: 'Hired' }
            });
        }
        // If rejected, candidate is Rejected
        else if (status === 'rejected') {
            await prisma.candidate.update({
                where: { id: offer.candidateId },
                data: { status: 'rejected', currentStage: 'Offer Rejected' }
            });
        }

        res.json(offer);
    } catch (error) {
        console.error('Update offer status error:', error);
        res.status(500).json({ error: 'Failed to update offer status' });
    }
};
