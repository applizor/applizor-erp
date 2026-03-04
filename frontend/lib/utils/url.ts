export const getBaseUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
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
