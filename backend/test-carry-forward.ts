
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testCarryForward() {
    try {
        // 1. Login as Admin
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@applizor.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. Trigger Carry Forward
        console.log('Triggering carry forward process...');
        const res = await axios.post(`${API_URL}/attendance-leave/leaves/process-carry-forward`, {
            year: 2026 // Process for current year based on 2025 usage
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Result:', JSON.stringify(res.data, null, 2));

    } catch (error: any) {
        console.error('Test failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testCarryForward();
