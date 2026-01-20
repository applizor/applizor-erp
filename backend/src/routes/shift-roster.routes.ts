import { Router } from 'express';
import * as shiftRosterController from '../controllers/shift-roster.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, shiftRosterController.getRoster);
router.post('/batch', authenticate, shiftRosterController.updateRoster);

export default router;
