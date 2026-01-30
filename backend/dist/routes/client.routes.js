"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../utils/upload");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, client_controller_1.createClient);
router.get('/', auth_1.authenticate, client_controller_1.getClients);
router.get('/:id', auth_1.authenticate, client_controller_1.getClient);
router.put('/:id', auth_1.authenticate, client_controller_1.updateClient);
router.delete('/:id', auth_1.authenticate, client_controller_1.deleteClient);
router.post('/upload', auth_1.authenticate, upload_1.uploadLogo.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = `/uploads/logos/${req.file.filename}`;
    res.json({ filePath });
});
router.post('/upload-profile', auth_1.authenticate, upload_1.uploadProfilePicture.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = `/uploads/profiles/${req.file.filename}`;
    res.json({ filePath });
});
exports.default = router;
//# sourceMappingURL=client.routes.js.map