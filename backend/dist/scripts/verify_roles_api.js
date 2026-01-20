"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const API_URL = 'http://localhost:5000/api';
async function main() {
    console.log('Verifying Roles API Access...');
    try {
        // 1. Login as Admin
        // Assuming default credentials or if not, using the HR user we just made (User Management might be restricted)
        // Let's try HR first, if that fails (403), we know auth works but perm denied.
        // Actually, let's look for Admin credentials in DB or assume standard.
        // I will try with the HR user created earlier.
        console.log('Logging in as hr@applizor.com...');
        const loginRes = await axios_1.default.post(`${API_URL}/auth/login`, {
            email: 'hr@applizor.com',
            password: 'hr123'
        });
        const token = loginRes.data.token;
        console.log('Login Successful.');
        // 2. Fetch Roles
        console.log('Fetching Roles list...');
        const rolesRes = await axios_1.default.get(`${API_URL}/roles`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Roles Fetched Successfully!');
        console.log(`Count: ${rolesRes.data.length}`);
        rolesRes.data.forEach((r) => console.log(`- ${r.name} (users: ${r._count?.userRoles || 0})`));
    }
    catch (error) {
        console.error('Verification Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=verify_roles_api.js.map