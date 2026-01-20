"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, client_controller_1.createClient);
router.get('/', auth_1.authenticate, client_controller_1.getClients);
router.get('/:id', auth_1.authenticate, client_controller_1.getClient);
router.put('/:id', auth_1.authenticate, client_controller_1.updateClient);
router.delete('/:id', auth_1.authenticate, client_controller_1.deleteClient);
exports.default = router;
//# sourceMappingURL=client.routes.js.map