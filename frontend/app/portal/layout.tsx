'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Briefcase,
    LogOut,
    Menu,
    X,
    Bell,
    User,
    Building2,
    FileSignature
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check auth
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        const portalType = localStorage.getItem('portalType');

        if (!token || !userData || userData === 'undefined' || portalType !== 'client') {
            router.push('/portal/login');
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch (e) {
            console.error('Failed to parse user data', e);
            localStorage.clear();
            router.push('/portal/login');
        }
    }, []);

    if (pathname === '/portal/login') {
        return <>{children}</>;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('portalType');
        router.push('/portal/login');
    };

    const menuItems = [
        { name: 'Dashboard', href: '/portal/dashboard', icon: LayoutDashboard },
        { name: 'My Invoices', href: '/portal/invoices', icon: FileText },
        { name: 'My Contracts', href: '/portal/contracts', icon: FileSignature },
        { name: 'My Projects', href: '/portal/projects', icon: Briefcase },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-30 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 -translate-x-full border-r border-slate-800/50 shadow-2xl">
                {/* Brand Section */}
                <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/50 bg-brand-gradient">
                    <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center border border-white/10 flex-shrink-0">
                        <Building2 size={18} className="text-white" />
                    </div>
                    <div className="overflow-hidden whitespace-nowrap">
                        <h1 className="sidebar-logo-text text-sm">Applizor</h1>
                        <p className="text-[9px] font-black text-primary-300 uppercase tracking-[0.2em]">Client Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    group flex items-center px-4 py-2 text-[11px] font-bold rounded-md transition-all duration-200 relative
                                    ${isActive
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                                `}
                            >
                                <Icon className={`mr-3 h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                {item.name}
                                {isActive && (
                                    <div className="absolute right-4 w-1 h-1 rounded-full bg-primary-300 animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800/50 bg-slate-950/30">
                    <div className="flex items-center gap-3 px-2 py-3 mb-2 bg-slate-900/50 rounded-lg border border-slate-800">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                            {user?.name?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-all border border-rose-500/20 hover:border-rose-500/40"
                    >
                        <LogOut size={14} className="mr-2" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-20">
                    <span className="font-black text-slate-800 uppercase">Applizor Portal</span>
                    <button className="p-2 text-slate-600">
                        <Menu size={20} />
                    </button>
                </header>

                <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
