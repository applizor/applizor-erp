import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    getTaxRates,
    createTaxRate,
    updateTaxRate,
    deleteTaxRate,
    getUnitTypes,
    createUnitType,
    updateUnitType,
    deleteUnitType
} from '../controllers/settings.controller';

const router = express.Router();

router.use(authenticate);

// Tax Rates
router.get('/taxes', getTaxRates);
router.post('/taxes', createTaxRate);
router.put('/taxes/:id', updateTaxRate);
router.delete('/taxes/:id', deleteTaxRate);

// Unit Types
router.get('/units', getUnitTypes);
router.post('/units', createUnitType);
router.put('/units/:id', updateUnitType);
router.delete('/units/:id', deleteUnitType);

export default router;
