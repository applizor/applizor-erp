import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
    matcher: [
        /*
         * Match all paths except:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Get hostname (e.g. 'news.client.com', 'localhost:3000')
    const hostname = req.headers.get("host");

    // Define allowed domains (including localhost and main app domain)
    // In production, you would check env vars
    const allowedDomains = ["localhost:3000", "app.applizor.com", "applizor-erp.vercel.app"];

    // Verify if hostname requires rewriting
    const isMainDomain = allowedDomains.includes(hostname || "");

    // If it's a main domain, let it handle the request normally (Applizor App)
    if (isMainDomain) {
        return NextResponse.next();
    }

    // If it's a custom domain (e.g. news.client.com), rewrite to `/_sites/[domain]`
    // We keep the path (e.g. /about) and query params
    const searchParams = req.nextUrl.searchParams.toString();
    const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

    // Rewrite to the dynamic route
    return NextResponse.rewrite(new URL(`/_sites/${hostname}${path}`, req.url));
}
