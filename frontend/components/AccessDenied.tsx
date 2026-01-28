import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6 max-w-md">
                You do not have the necessary permissions to view this page.
                Please contact your administrator if you believe this is an error.
            </p>
            <Link
                href="/dashboard"
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
                Return to Dashboard
            </Link>
        </div>
    );
}
