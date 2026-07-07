import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Loading() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" className="text-primary-600 mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Loading...</p>
        </div>
    );
}
