
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testRoster() {
    try {
        // 1. Login as Admin
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@applizor.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Login successful, token obtained.');

        // 2. Get Employees and Shifts
        const empsRes = await axios.get(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } });
        const shiftsRes = await axios.get(`${API_URL}/shifts`, { headers: { Authorization: `Bearer ${token}` } });

        if (empsRes.data.length === 0 || shiftsRes.data.length === 0) {
            console.error('No employees or shifts found.');
            return;
        }

        const employeeId = empsRes.data[0].id;
        const shiftId = shiftsRes.data[0].id;
        const date = new Date().toISOString().split('T')[0];

        console.log(`Testing roster update for Emp: ${employeeId}, Shift: ${shiftId}, Date: ${date}`);

        // 3. Update Roster
        const payload = {
            assignments: [
                { employeeId, shiftId, date }
            ]
        };

        const updateRes = await axios.post(`${API_URL}/shift-rosters/batch`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Roster update successful:', updateRes.data);

    } catch (error: any) {
        console.error('Roster update failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testRoster();
