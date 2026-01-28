'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Applizor ERP
        </h1>
        <p className="text-center text-lg mb-4">
          Complete ERP/CRM/HRMS/Accounting Solution
        </p>
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Redirecting...
          </p>
        </div>
      </div>
    </main>
  );
}
