export const getBaseUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // 1. Prioritize configured ENV var if it looks valid
    if (apiUrl && apiUrl !== 'undefined' && apiUrl.length > 10 && (apiUrl.includes('.') || apiUrl.includes('localhost'))) {
        return apiUrl.replace(/\/api\/?$/, '').trim();
    }

    // 2. Fallback to browser origin if available
    if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        if (origin && origin !== 'null' && origin.length > 5) {
            return origin;
        }
    }

    // 3. Last resort for SSR or missing config
    return 'http://localhost:5000';
};
