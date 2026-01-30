'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';


export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Job Openings', href: '/recruitment/jobs' },
        { name: 'Candidates', href: '/recruitment/candidates' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow">
                <div className="px-4 sm:px-6 lg:px-8">

                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const isActive = pathname === tab.href || pathname?.startsWith(tab.href + '/');
                                return (
                                    <Link
                                        key={tab.name}
                                        href={tab.href}
                                        className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${isActive
                                                ? 'border-primary-500 text-primary-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
                                    >
                                        {tab.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </div>
        </div>
    );
}
