import { Router } from 'express';
import {
    getInvoiceByToken,
    downloadPDFPublic
} from '../controllers/invoice-public.controller';

const router = Router();

router.get('/:token', getInvoiceByToken);
router.get('/:token/download', downloadPDFPublic);

export default router;
