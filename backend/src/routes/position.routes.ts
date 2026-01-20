import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    createPosition,
    getPositions,
    updatePosition,
    deletePosition
} from '../controllers/position.controller';

const router = express.Router();

router.use(authenticate);

router.post('/', createPosition);
router.get('/', getPositions);
router.put('/:id', updatePosition);
router.delete('/:id', deletePosition);

export default router;
