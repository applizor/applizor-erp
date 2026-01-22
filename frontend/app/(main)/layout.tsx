'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { auth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';

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
            <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <TopHeader />
                    <main className="flex-1 px-4 pt-1 pb-6 md:px-8 md:pt-2 md:pb-8 max-w-[1600px] mx-auto w-full">
                        {children}
                    </main>
                </div>
            </div>
        </CurrencyProvider>
    );
}
