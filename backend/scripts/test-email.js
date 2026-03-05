const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { sendEmail } = require('../dist/services/email.service');

async function testEmail() {
    const to = process.argv[2];
    if (!to) {
        console.error('Usage: node test-email.js <recipient-email>');
        process.exit(1);
    }

    console.log(`Testing email sending to: ${to}`);
    console.log(`SMTP_SERVICE_PROVIDER: ${process.env.SMTP_SERVICE_PROVIDER}`);

    try {
        const result = await sendEmail(to, 'Test Email from Applizor Diagnostics', '<h1>Test Successful</h1><p>If you see this, email sending is working correctly.</p>');
        console.log('✅ Test result:', result);
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testEmail();
