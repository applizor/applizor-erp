export const getBaseUrl = () => {
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
        // Handle protocol-relative or hostname-only URLs
        if (cleaned.startsWith('//')) {
            cleaned = window.location.protocol + cleaned;
        } else {
            cleaned = window.location.protocol + '//' + cleaned;
        }
    }

    return cleaned;
};
