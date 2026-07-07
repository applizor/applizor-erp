'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';

function SsoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [status, setStatus] = useState('Authenticating and synchronizing user profile...');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(error);
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!token) {
      toast.error('Authentication token not received.');
      router.push('/login');
      return;
    }

    // Save token
    localStorage.setItem('token', token);

    // Fetch user profile to sync
    api.get('/auth/profile')
      .then((res) => {
        if (res.data?.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          toast.success('Successfully signed in via SSO.');
          router.push('/dashboard');
        } else {
          throw new Error('User profile response empty.');
        }
      })
      .catch((err) => {
        console.error('SSO profile sync failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('SSO Profile synchronization failed.');
        router.push('/login');
      });
  }, [searchParams, router, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{status}</p>
      </div>
    </div>
  );
}

export default function SsoCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-4 p-8 bg-white rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Initializing OAuth Callback...</p>
        </div>
      </div>
    }>
      <SsoCallbackInner />
    </Suspense>
  );
}
