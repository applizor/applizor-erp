require('dotenv').config();

console.log('--- Email Configuration Check ---');
console.log('SMTP_SERVICE_PROVIDER:', process.env.SMTP_SERVICE_PROVIDER);
console.log('EMAIL_INFO:', process.env.EMAIL_INFO);
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('MICROSOFT_CLIENT_ID:', process.env.MICROSOFT_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('MICROSOFT_TENANT_ID:', process.env.MICROSOFT_TENANT_ID);
