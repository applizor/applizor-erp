'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


export default function HRMSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="px-4 py-6 sm:px-0">
            <div className="mt-6">
                <Suspense fallback={<div>Loading...</div>}>
                    {children}
                </Suspense>
            </div>
        </div>
    );
}
