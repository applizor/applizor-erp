import express from 'express';
import * as shiftController from '../controllers/shift.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, shiftController.getShifts);
router.post('/', authenticate, shiftController.createShift);
router.put('/:id', authenticate, shiftController.updateShift);
router.delete('/:id', authenticate, shiftController.deleteShift);
router.post('/assign', authenticate, shiftController.assignShift);

export default router;
