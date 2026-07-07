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
    deleteUnitType,
    getEmailConfig,
    saveEmailConfig,
    testEmailConfig,
    getEmailLogs,
    retryEmail,
    getPaymentConfig,
    savePaymentConfig,
    getStorageConfig,
    saveStorageConfig,
    testStorageConfig
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

// Email Configuration
router.get('/email', getEmailConfig);
router.post('/email', saveEmailConfig);
router.post('/email/test', testEmailConfig);

// Email Audit Logs
router.get('/email/logs', getEmailLogs);
router.post('/email/logs/:id/retry', retryEmail);

// Payment Configuration
router.get('/payments', getPaymentConfig);
router.post('/payments', savePaymentConfig);

// Storage Configuration
router.get('/storage', getStorageConfig);
router.post('/storage', saveStorageConfig);
router.post('/storage/test', testStorageConfig);

export default router;
