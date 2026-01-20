"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOfferStatus = exports.getOffer = exports.createOffer = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create Offer
const createOffer = async (req, res) => {
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
    }
    catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
};
exports.createOffer = createOffer;
// Get Offer by Candidate ID
const getOffer = async (req, res) => {
    try {
        const { candidateId } = req.params;
        const offer = await prisma.offerLetter.findUnique({
            where: { candidateId }
        });
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }
        res.json(offer);
    }
    catch (error) {
        console.error('Get offer error:', error);
        res.status(500).json({ error: 'Failed to fetch offer' });
    }
};
exports.getOffer = getOffer;
// Update Offer Status
const updateOfferStatus = async (req, res) => {
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
    }
    catch (error) {
        console.error('Update offer status error:', error);
        res.status(500).json({ error: 'Failed to update offer status' });
    }
};
exports.updateOfferStatus = updateOfferStatus;
//# sourceMappingURL=offer.controller.js.map