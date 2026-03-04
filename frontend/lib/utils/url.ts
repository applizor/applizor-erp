export const getBaseUrl = () => {
    // If we're in the browser, and the current URL is a production-like URL,
    // we should prefer the current origin to avoid DNS issues with hardcoded protocols
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        // If we're on a known production domain or not on localhost, 
        // we can safely assume the backend is on the same domain
        if (!origin.includes('localhost')) {
            return origin;
        }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl || apiUrl === 'undefined') {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return 'http://localhost:5000';
    }

    // Clean up the URL
    let cleaned = apiUrl.replace(/\/api\/?$/, '').trim();

    // Safety check: if cleaned is just 'https' or 'http' or too short, it's invalid
    if (cleaned.length < 10 || (!cleaned.includes('.') && !cleaned.includes('localhost'))) {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
    }

    // Ensure it has a protocol
    if (!cleaned.startsWith('http') && typeof window !== 'undefined') {
        if (cleaned.startsWith('//')) {
            cleaned = window.location.protocol + cleaned;
        } else {
            cleaned = window.location.protocol + '//' + cleaned;
        }
    }

    return cleaned;
};
