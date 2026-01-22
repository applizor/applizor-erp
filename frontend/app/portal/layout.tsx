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
    User
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
        { name: 'My Projects', href: '/portal/projects', icon: Briefcase },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-64 bg-[#0F172A] text-white z-30 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 -translate-x-full">
                <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
                    <span className="text-lg font-black tracking-tight text-white uppercase">Client Portal</span>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`group flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <Icon size={18} className={`mr-3 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 px-2 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-xs">
                            {user?.name?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
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
