'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!auth.isAuthenticated()) {
            router.push('/login');
        }
    }, [router]);

    if (!mounted) return null;

    return (
        <CurrencyProvider>
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col md:overflow-hidden">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8 mt-14 md:mt-0">
                        {children}
                    </main>
                </div>
            </div>
        </CurrencyProvider>
    );
}
