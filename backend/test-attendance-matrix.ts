
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const EMAIL = 'admin@applizor.com';
const PASSWORD = 'admin123';

async function testEnterpriseLogic() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.token;
        const headers = { Authorization: `Bearer ${token}` };
        console.log('   Success. Token obtained.');

        // Test 1: Attendance Muster Roll
        console.log('\n2. Testing Attendance Matrix (Muster Roll)...');
        const month = 1; // January
        const year = 2026;
        const matrixRes = await axios.get(`${API_URL}/attendance-leave/all-attendance?month=${month}&year=${year}`, { headers });

        if (matrixRes.data.matrix) {
            console.log(`   Success. Received Matrix for ${matrixRes.data.employees?.length || Object.keys(matrixRes.data.matrix).length} employees.`);
            // console.log(JSON.stringify(matrixRes.data.matrix[0], null, 2));
        } else {
            console.error('   FAILED. Response format incorrect:', Object.keys(matrixRes.data));
            console.log('Response:', matrixRes.data);
        }

        // Test 2: Shift Roster with Leaves
        console.log('\n3. Testing Shift Roster Sync...');
        const startDate = '2026-01-19';
        const endDate = '2026-01-25';
        const rosterRes = await axios.get(`${API_URL}/shift-rosters?startDate=${startDate}&endDate=${endDate}`, { headers });

        if (Array.isArray(rosterRes.data)) {
            console.log(`   Success. Received ${rosterRes.data.length} roster entries.`);
            const leaveEntry = rosterRes.data.find((r: any) => r.isLeave);
            if (leaveEntry) {
                console.log('   Verified: Found Leave Entry in Roster:', leaveEntry.shift.name);
            } else {
                console.log('   Note: No leaves found in this range (might need to create one first for true verification).');
            }
        } else {
            console.error('   FAILED. Response is not an array.');
        }

    } catch (error: any) {
        console.error('Test Failed:', error.response?.data || error.message);
    }
}

testEnterpriseLogic();
