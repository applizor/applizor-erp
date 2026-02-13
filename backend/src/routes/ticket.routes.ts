import express from 'express';
import { authenticate } from '../middleware/auth';
import { checkPermission } from '../middleware/auth';
import * as ticketController from '../controllers/ticket.controller';

const router = express.Router();

router.use(authenticate);

// Lifecycle
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets);
router.get('/:id', ticketController.getTicketById);
router.put('/:id', ticketController.updateTicket);

// Thread
router.post('/:id/reply', ticketController.addReply);

export default router;
