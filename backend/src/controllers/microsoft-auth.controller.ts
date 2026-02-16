import { Request, Response } from 'express';
import axios from 'axios';

// Microsoft Graph API Endpoints
const TENANT_ID = process.env.MICROSOFT_TENANT_ID || 'common';
const TOKEN_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
const AUTH_ENDPOINT = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`;

// Scopes required for sending email
// offline_access is needed for refresh_token
const SCOPES = 'https://graph.microsoft.com/Mail.Send offline_access User.Read';

export const getAuthUrl = (req: Request, res: Response) => {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${backendUrl}/api/automation/microsoft/callback`;

    if (!clientId) {
        return res.status(500).send('Error: MICROSOFT_CLIENT_ID is not defined in .env');
    }

    const authUrl = `${AUTH_ENDPOINT}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(SCOPES)}&state=12345`;

    res.send(`
        <h1>Microsoft Email Integration Setup</h1>
        <p>Click the link below to authorize this application to send emails on your behalf.</p>
        <a href="${authUrl}" style="background-color: #0078d4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-family: sans-serif;">Authorize with Microsoft</a>
    `);
};

export const handleCallback = async (req: Request, res: Response) => {
    const { code } = req.query;
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || `${backendUrl}/api/automation/microsoft/callback`;

    if (!code) {
        return res.status(400).send('Error: No code provided');
    }

    if (!clientId || !clientSecret) {
        return res.status(500).send('Error: Microsoft credentials not configured in .env');
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('scope', SCOPES);
        params.append('code', code as string);
        params.append('redirect_uri', redirectUri);
        params.append('grant_type', 'authorization_code');
        params.append('client_secret', clientSecret);

        const response = await axios.post(TOKEN_ENDPOINT, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { refresh_token, access_token } = response.data;

        res.send(`
            <div style="font-family: monospace; max-width: 800px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #107c10;">Authorization Successful!</h1>
                <p>Please copy the <strong>Refresh Token</strong> below and add it to your <code>.env</code> file.</p>
                
                <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; word-break: break-all; margin-bottom: 20px;">
                    <strong>MICROSOFT_REFRESH_TOKEN=</strong>${refresh_token}
                </div>

                <h3>Other Configs Needed:</h3>
                <ul>
                    <li><strong>SMTP_SERVICE_PROVIDER=</strong>MICROSOFT</li>
                    <li><strong>MICROSOFT_CLIENT_ID=</strong>${clientId}</li>
                    <li><strong>MICROSOFT_CLIENT_SECRET=</strong>${clientSecret}</li>
                    <li><strong>EMAIL_FROM=</strong>(Your Microsoft Email Address)</li>
                </ul>

                <p style="color: #666; margin-top: 20px;">Access Token (Valid for 1 hour): ${access_token.substring(0, 20)}...</p>
            </div>
        `);

    } catch (error: any) {
        console.error('Error exchanging code for token:', error.response?.data || error.message);
        res.status(500).send(`
            <h1>Authorization Failed</h1>
            <p>Error: ${error.response?.data?.error_description || error.message}</p>
            <pre>${JSON.stringify(error.response?.data, null, 2)}</pre>
        `);
    }
};
