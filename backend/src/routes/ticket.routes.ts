
import { Router } from 'express';
import { createTicket, getTickets, updateTicket } from '../controllers/ticket.controller';
import { authenticate, checkPermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Everyone can create tickets (usually), typically tied to 'Ticket' module access
router.post('/', checkPermission('Ticket', 'create'), createTicket);
router.get('/', checkPermission('Ticket', 'read'), getTickets);
router.put('/:id', checkPermission('Ticket', 'update'), updateTicket);

export default router;
