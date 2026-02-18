import express from 'express';
import { getRoster, updateRoster, syncPreviousWeek } from '../controllers/shift-roster.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getRoster);
router.post('/batch', authenticate, updateRoster);
router.post('/sync-prev', authenticate, syncPreviousWeek);

export default router;
