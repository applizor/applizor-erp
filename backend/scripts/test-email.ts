import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log(`Using credentials:
  SMTP_SERVICE_PROVIDER: ${process.env.SMTP_SERVICE_PROVIDER}
  EMAIL_FROM: ${process.env.EMAIL_FROM}
  MICROSOFT_CLIENT_ID: ${process.env.MICROSOFT_CLIENT_ID}
  MICROSOFT_TENANT_ID: ${process.env.MICROSOFT_TENANT_ID}
  MICROSOFT_REFRESH_TOKEN: ${process.env.MICROSOFT_REFRESH_TOKEN ? 'Present' : 'MISSING'}
`);

// Reusing logic from email.service.ts manually to isolate issues
// Manual Token Exchange to Verify Credentials
async function getAccessToken() {
    const params = new URLSearchParams();
    params.append('client_id', process.env.MICROSOFT_CLIENT_ID!);
    params.append('client_secret', process.env.MICROSOFT_CLIENT_SECRET!);
    params.append('refresh_token', process.env.MICROSOFT_REFRESH_TOKEN!);
    params.append('grant_type', 'refresh_token');
    params.append('scope', 'https://graph.microsoft.com/.default');

    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    try {
        console.log(`Requesting token from: ${tokenEndpoint}`);
        // console.log('Params:', params.toString()); 

        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('❌ Token Exchange Failed:', data);
            return null;
        }

        console.log('✅ Token Exchange Successful!');
        return data.access_token;
    } catch (error) {
        console.error('❌ Token Network Error:', error);
        return null;
    }
}

async function main() {
    const accessToken = await getAccessToken();

    if (!accessToken) {
        console.log('⚠️ Stopping email test due to token failure.');
        return;
    }

    // Verify Graph API Send (Since SMTP failed)
    console.log('🚀 Attempting to send via Microsoft Graph API...');

    // Construct Email for Graph API
    const emailData = {
        message: {
            subject: "Test Email from Graph API",
            body: {
                contentType: "HTML",
                content: "<h1>Graph API Success!</h1><p>This email was sent using Microsoft Graph API, bypassing SMTP.</p>"
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: "applizor@gmail.com"
                    }
                }
            ],
            from: {
                emailAddress: {
                    address: process.env.EMAIL_ACCOUNTS // Send as accounts@applizor.com
                }
            }
        },
        saveToSentItems: "true"
    };

    // Note: To send as shared mailbox, we use /users/{shared-email}/sendMail
    // But first let's try /me/sendMail (authenticated user)
    // To send as shared mailbox with 'Me' endpoint, we rely on "Send As" permissions and the 'from' field.
    // However, Graph recommends using /users/shared@domain.com/sendMail.

    // Let's try /me/sendMail first with explicit From
    const graphEndpoint = `https://graph.microsoft.com/v1.0/me/sendMail`;

    try {
        const emailResponse = await fetch(graphEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (emailResponse.ok) {
            console.log('✅ Graph API Email Sent Successfully!');
        } else {
            const errorData = await emailResponse.json();
            console.error('❌ Graph API Failed:', JSON.stringify(errorData, null, 2));

            // If failed, maybe try the shared user endpoint?
            if (process.env.EMAIL_ACCOUNTS) {
                console.log(`\n🔄 Retrying with /users/${process.env.EMAIL_ACCOUNTS}/sendMail...`);
                const sharedEndpoint = `https://graph.microsoft.com/v1.0/users/${process.env.EMAIL_ACCOUNTS}/sendMail`;
                const retryResponse = await fetch(sharedEndpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(emailData)
                });

                if (retryResponse.ok) {
                    console.log(`✅ Graph API (Shared Endpoint) Sent Successfully!`);
                } else {
                    const retryError = await retryResponse.json();
                    console.error('❌ Graph API (Shared Endpoint) Failed:', JSON.stringify(retryError, null, 2));
                }
            }
        }
    } catch (error) {
        console.error('❌ Graph API Network Error:', error);
    }
}

main();
