'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';


import { Briefcase, Users, LayoutDashboard, UserCircle, Copy } from 'lucide-react';

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Job Openings', href: '/recruitment/jobs', icon: Briefcase },
        { name: 'Candidates', href: '/recruitment/candidates', icon: Users },
        { name: 'Interviews', href: '/recruitment/interviews', icon: UserCircle },
        { name: 'Board', href: '/recruitment/board', icon: LayoutDashboard },
        { name: 'Templates', href: '/recruitment/templates', icon: Copy },
    ];

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="px-4 md:px-8">
                    {/* Header Section */}
                    <div className="py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-900 rounded-md flex items-center justify-center shadow-lg shadow-primary-900/10">
                                <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none">Talent Acquisition</h1>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Enterprise Recruitment Lifecycle</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const isActive = pathname === tab.href || (tab.href !== '/recruitment' && pathname?.startsWith(tab.href + '/'));
                            return (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    className={`
                                        whitespace-nowrap py-4 px-1 border-b-2 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2
                                        ${isActive
                                            ? 'border-primary-600 text-primary-600'
                                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'}
                                    `}
                                >
                                    <tab.icon size={12} />
                                    {tab.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
            <div className="p-4 md:p-8">
                {children}
            </div>
        </div>
    );
}
