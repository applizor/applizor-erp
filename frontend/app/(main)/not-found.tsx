import Link from 'next/link';

export default function NotFoundPage() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="text-8xl font-black text-gray-200 mb-4">404</div>
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-2">Page Not Found</h2>
            <p className="text-sm text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
            <Link href="/dashboard" className="btn-primary py-2.5 px-6 text-xs font-black uppercase tracking-widest">
                Back to Dashboard
            </Link>
        </div>
    );
}
