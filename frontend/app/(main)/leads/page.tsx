'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to kanban board
    router.push('/leads/kanban');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading sales pipeline...</p>
      </div>
    </div>
  );
}
