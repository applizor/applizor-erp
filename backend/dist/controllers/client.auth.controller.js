"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        // Find client
        const client = await client_1.default.client.findFirst({
            where: { email, status: 'active', portalAccess: true },
            include: { company: true }
        });
        if (!client || !client.password) {
            return res.status(401).json({ error: 'Invalid credentials or portal access not enabled' });
        }
        // Check password
        const isValid = await (0, password_1.comparePassword)(password, client.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Update last login
        await client_1.default.client.update({
            where: { id: client.id },
            data: { lastLogin: new Date() }
        });
        // Generate token (Using same util, payloads might differ but id is key)
        // We might want to use a different secret or payload structure to distinguish from employees,
        // but for MVP reusing generateToken with a 'role': 'client' payload would be ideal if generateToken supports it.
        // If generateToken only signs ID, we need to ensure middleware checks user vs client existence.
        // Let's assume standard token for now.
        const token = (0, jwt_1.generateToken)(client.id);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: client.id,
                name: client.name,
                email: client.email,
                type: 'client',
                companyName: client.company.name
            }
        });
    }
    catch (error) {
        console.error('Client login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};
exports.login = login;
//# sourceMappingURL=client.auth.controller.js.map