import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  listCurrencies,
  getRates,
  convertAmount,
  syncRates,
} from '../controllers/currency.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', listCurrencies);
router.get('/rates', getRates);
router.post('/convert', convertAmount);
router.post('/sync', syncRates);

export default router;
