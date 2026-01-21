'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function LeadsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to kanban board
    router.push('/leads/kanban');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto" />
        <p className="mt-4 text-gray-600">Loading sales pipeline...</p>
      </div>
    </div>
  );
}
