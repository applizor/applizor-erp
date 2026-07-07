import express from 'express';
import { authenticate } from '../middleware/auth';
import { globalSearch } from '../controllers/search.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', globalSearch);

export default router;
