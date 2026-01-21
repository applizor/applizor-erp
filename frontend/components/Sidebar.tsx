'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    LineChart,
    FileText,
    CreditCard,
    Briefcase,
    CalendarCheck,
    UserCircle,
    Users,
    Activity,
    LogOut,
    Menu,
    Edit,
    MapPin,
    Layers,
    FileSpreadsheet,
    PieChart,
    Mail,
    ShieldCheck,
    Banknote,
    Copy,
    Building2,
    Receipt,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { auth, useAuth } from '@/lib/auth';
import { useState, useEffect, useRef } from 'react';
import { usePermission } from '@/hooks/usePermission';

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // State for expanded categories
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Main': true // Main always open by default
    });

    const activeLinkRef = useRef<HTMLAnchorElement>(null);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Main' },

        // HRMS (People)
        { name: 'Employees', href: '/hrms/employees', icon: Users, category: 'HRMS', module: 'Employee' },
        { name: 'Departments', href: '/hrms/departments', icon: Layers, category: 'HRMS', module: 'Department', action: 'update' },
        { name: 'Positions', href: '/hrms/positions', icon: Briefcase, category: 'HRMS', module: 'Position', action: 'update' },
        { name: 'Assets', href: '/hrms/assets', icon: CreditCard, category: 'HRMS', module: 'Asset' },
        { name: 'Attendance', href: '/attendance/my-attendance', icon: CalendarCheck, category: 'HRMS', module: 'Attendance' },
        { name: 'Holidays', href: '/attendance/holidays', icon: CalendarCheck, category: 'HRMS', module: 'Holiday' },
        { name: 'My Leaves', href: '/attendance/leaves', icon: Briefcase, category: 'HRMS', module: 'Leave' },
        { name: 'Leave Approvals', href: '/attendance/leaves/approvals', icon: CalendarCheck, category: 'HRMS', module: 'Leave', action: 'update' },
        { name: 'Leave Balances', href: '/attendance/leaves/balances', icon: PieChart, category: 'HRMS', module: 'LeaveBalance' },
        { name: 'Shifts', href: '/attendance/shifts', icon: Activity, category: 'HRMS', module: 'Shift', action: 'update' },
        { name: 'Shift Roster', href: '/attendance/roster', icon: CalendarCheck, category: 'HRMS', module: 'ShiftRoster' },
        { name: 'All Attendance', href: '/attendance/admin', icon: Users, category: 'HRMS', module: 'Attendance' },
        { name: 'Leave Types', href: '/hrms/leaves/types', icon: Layers, category: 'HRMS', module: 'LeaveType', action: 'update' },
        { name: 'Roles & Permissions', href: '/settings/roles', icon: ShieldCheck, category: 'Settings', module: 'Role' },

        // Recruitment
        { name: 'Job Openings', href: '/recruitment/jobs', icon: Briefcase, category: 'Recruitment', module: 'Recruitment' },
        { name: 'Kanban Board', href: '/recruitment/board', icon: LayoutDashboard, category: 'Recruitment', module: 'Recruitment' },
        { name: 'Interviews', href: '/recruitment/interviews', icon: UserCircle, category: 'Recruitment', module: 'Recruitment' },

        // CRM (Sales)
        { name: 'Leads', href: '/leads', icon: LineChart, category: 'CRM', module: 'Lead' },
        { name: 'Clients', href: '/clients', icon: Users, category: 'CRM', module: 'Client' },
        { name: 'Quotations', href: '/quotations', icon: FileText, category: 'CRM', module: 'Lead' },
        { name: 'Templates', href: '/quotations/templates', icon: Copy, category: 'CRM', module: 'QuotationTemplate' },

        // Finance
        { name: 'Invoices', href: '/invoices', icon: FileText, category: 'Finance', module: 'Invoice' },
        { name: 'Run Payroll', href: '/payroll/run', icon: Banknote, category: 'Finance', module: 'Payroll' },
        { name: 'Salary Components', href: '/payroll/components', icon: Layers, category: 'Finance', module: 'Payroll' },
        { name: 'Payslips', href: '/payroll/payslips', icon: FileSpreadsheet, category: 'Finance', module: 'Payroll' },
        { name: 'Accounting', href: '/accounting', icon: Activity, category: 'Finance', module: 'Invoice' },

        // Ops & Docs
        { name: 'Documents', href: '/documents', icon: FileText, category: 'Operations', module: 'Document' },

        // Settings
        { name: 'Company Settings', href: '/settings/company', icon: Briefcase, category: 'Settings', module: 'Company' },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const { can } = usePermission();

    // Filter navigation based on permissions
    const filteredNavigation = navigation.filter(item => {
        if (!user) return false;
        if (item.name === 'Dashboard') return true;
        if (!item.module && !(item as any).role) return true;

        const isAdmin = user.roles?.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'administrator');

        if ((item as any).role && !user.roles?.includes((item as any).role) && !isAdmin) {
            return false;
        }

        if (item.module) {
            const moduleName = item.module;
            const requiredAction = (item as any).action || 'read';

            if (!can(moduleName, requiredAction)) {
                return false;
            }

            if (item.name === 'All Attendance') {
                const perm = user?.permissions?.[moduleName];
                if (perm?.readLevel === 'owned') return false;
            }

            if (item.name === 'Leave Approvals') {
                const perm = user?.permissions?.[moduleName];
                if (perm?.updateLevel === 'owned' || perm?.updateLevel === 'none') return false;
            }
        }
        return true;
    });

    const groupedNav = filteredNavigation.reduce((acc, item: any) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof navigation>);

    // Initialize expanded state based on active route and scroll to active item
    useEffect(() => {
        const foundCategory = Object.entries(groupedNav).find(([_, items]) =>
            items.some(item =>
                pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'))
            )
        )?.[0];

        if (foundCategory) {
            setExpandedCategories(prev => ({
                ...prev,
                [foundCategory]: true
            }));
        }

        // Auto-scroll to active link after a short delay to ensure rendering
        setTimeout(() => {
            if (activeLinkRef.current) {
                activeLinkRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    }, [pathname, user]); // Re-run when pathname changes or user loads (permissions update)

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleLogout = () => {
        auth.logout();
        window.location.href = '/login';
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center fixed w-full z-30 top-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-md flex items-center justify-center">
                        <Building2 size={18} className="text-white" />
                    </div>
                    <span className="sidebar-logo-text">Applizor</span>
                </div>
                <button onClick={toggleMobileMenu} className="p-2 text-slate-600 hover:bg-slate-50 rounded-md transition-colors">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Container - Reduced width from w-72 to w-64 */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-all duration-300 ease-in-out border-r border-slate-800/50 shadow-2xl
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:sticky md:top-0 md:h-screen
            `}>
                <div className="flex flex-col h-full">
                    {/* Brand Section */}
                    <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/50 bg-brand-gradient">
                        <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center border border-white/10">
                            <Building2 size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="sidebar-logo-text">Applizor</h1>
                            <p className="text-[9px] font-black text-primary-300 uppercase tracking-[0.2em]">Softech ERP</p>
                        </div>
                    </div>

                    {/* Navigation Section */}
                    <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
                        {Object.entries(groupedNav).map(([category, items]) => (
                            <div key={category} className="mb-2 px-3">
                                {category !== 'Main' ? (
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 hover:text-slate-300 transition-colors"
                                    >
                                        <span>{category}</span>
                                        {expandedCategories[category] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </button>
                                ) : (
                                    <h3 className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                                        {category}
                                    </h3>
                                )}

                                {/* Collapsible Content */}
                                <div className={`space-y-1 transition-all duration-300 ease-in-out overflow-hidden ${category === 'Main' || expandedCategories[category] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}>
                                    <nav className="space-y-1">
                                        {items.map((item) => {
                                            const isActive = pathname === item.href ||
                                                (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));

                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    ref={isActive ? activeLinkRef : null}
                                                    className={`
                                                        group flex items-center px-4 py-2 text-[11px] font-bold rounded-md transition-all duration-200 relative
                                                        ${isActive
                                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 translate-x-1'
                                                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:translate-x-1'}
                                                    `}
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    <item.icon className={`mr-3 h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                                    {item.name}
                                                    {isActive && (
                                                        <div className="absolute right-4 w-1 h-1 rounded-full bg-primary-300 animate-pulse" />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </nav>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* User Profile & Footer Section */}
                    <div className="p-3 bg-slate-950/50 border-t border-slate-800/50">
                        <div className="bg-slate-800/40 rounded-md p-2.5 border border-slate-700/30">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-md bg-gradient-to-tr from-primary-600 to-primary-800 flex items-center justify-center text-[10px] font-black text-white shadow-inner uppercase">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-white truncate">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">Premium</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all"
                                    title="Logout"
                                >
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </>
    );
}
