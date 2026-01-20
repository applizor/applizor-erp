
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function main() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'emp1@test.com',
            password: 'password'
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // 2. Fetch All Balances
        console.log('Fetching All Balances...');
        try {
            const res = await axios.get(`${API_URL}/attendance-leave/all-balances`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Success! Data:', res.data);
        } catch (err: any) {
            console.error('Fetch Failed!');
            console.error('Status:', err.response?.status);
            console.error('Data:', err.response?.data);
        }

    } catch (error: any) {
        console.error('Detailed Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

main();
