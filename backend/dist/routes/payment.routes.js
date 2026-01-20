"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Webhook endpoint (no auth required, uses signature verification)
router.post('/webhook', (req, res) => {
    (0, payment_controller_1.handlePaymentWebhook)(req, res);
});
// Protected routes
router.post('/link', auth_1.authenticate, payment_controller_1.createPaymentLink);
router.post('/verify', auth_1.authenticate, payment_controller_1.verifyPayment);
router.get('/', auth_1.authenticate, payment_controller_1.getPayments);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map