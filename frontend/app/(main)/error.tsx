'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                <span className="text-rose-500 text-2xl font-black">!</span>
            </div>
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md text-center">{error.message || 'An unexpected error occurred'}</p>
            <button onClick={reset} className="btn-primary py-2.5 px-6 text-xs font-black uppercase tracking-widest">
                Try Again
            </button>
        </div>
    );
}
