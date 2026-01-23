"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, invoice_controller_1.createInvoice);
router.get('/', auth_1.authenticate, invoice_controller_1.getInvoices);
router.get('/:id', auth_1.authenticate, invoice_controller_1.getInvoice);
router.post('/:id/generate-pdf', auth_1.authenticate, invoice_controller_1.generateInvoicePDF);
router.get('/stats/summary', auth_1.authenticate, invoice_controller_1.getInvoiceStats);
router.post('/batch/status', auth_1.authenticate, invoice_controller_1.batchUpdateStatus);
router.post('/batch/send', auth_1.authenticate, invoice_controller_1.batchSendInvoices);
router.post('/:id/convert', auth_1.authenticate, invoice_controller_1.convertQuotation);
router.post('/:id/payments', auth_1.authenticate, invoice_controller_1.recordPayment);
router.put('/:id/status', auth_1.authenticate, invoice_controller_1.updateInvoiceStatus);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map