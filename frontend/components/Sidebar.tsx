
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
    ChevronRight,
    ChevronLeft
} from 'lucide-react';
import { auth, useAuth } from '@/lib/auth';
import { useState, useEffect, useRef } from 'react';
import { usePermission } from '@/hooks/usePermission';

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

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
        { name: 'Contracts', href: '/crm/contracts', icon: ShieldCheck, category: 'CRM', module: 'Contract' },

        // Finance
        { name: 'Invoices', href: '/invoices', icon: FileText, category: 'Finance', module: 'Invoice' },
        { name: 'Run Payroll', href: '/payroll/run', icon: Banknote, category: 'Finance', module: 'Payroll' },
        { name: 'Salary Components', href: '/payroll/components', icon: Layers, category: 'Finance', module: 'Payroll' },
        { name: 'Payslips', href: '/payroll/payslips', icon: FileSpreadsheet, category: 'Finance', module: 'Payroll' },
        { name: 'Accounting', href: '/accounting', icon: Activity, category: 'Finance', module: 'Invoice' },

        // Ops & Docs
        { name: 'Projects', href: '/projects', icon: LayoutDashboard, category: 'Operations', module: 'Project' },
        { name: 'Timesheets', href: '/timesheets', icon: CalendarCheck, category: 'Operations', module: 'Timesheet' },
        { name: 'Documents', href: '/documents', icon: FileText, category: 'Operations', module: 'Document' },

        // Settings
        { name: 'Company Settings', href: '/settings/company', icon: Briefcase, category: 'Settings', module: 'Company' },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

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
                    <span className="sidebar-logo-text !text-primary-900">Applizor</span>
                </div>
                <button onClick={toggleMobileMenu} className="p-2 text-slate-600 hover:bg-slate-50 rounded-md transition-colors">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-40 bg-slate-900 text-white transform transition-all duration-300 ease-in-out border-r border-slate-800/50 shadow-2xl flex flex-col
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:sticky md:top-0 md:h-screen
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}>

                {/* Brand Section */}
                <div className={`h-16 flex items-center border-b border-slate-800/50 bg-brand-gradient transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6 gap-3'}`}>
                    <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-md flex items-center justify-center border border-white/10 flex-shrink-0">
                        <Building2 size={18} className="text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap">
                            <h1 className="sidebar-logo-text text-sm">Applizor</h1>
                            <p className="text-[9px] font-black text-primary-300 uppercase tracking-[0.2em]">Softech ERP</p>
                        </div>
                    )}
                </div>

                {/* Navigation Section */}
                <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
                    {Object.entries(groupedNav).map(([category, items]) => (
                        <div key={category} className={`mb-2 ${isCollapsed ? 'px-2' : 'px-3'}`}>

                            {/* Category Header */}
                            {category !== 'Main' && (
                                isCollapsed ? (
                                    <div className="h-px bg-slate-800 mx-2 my-3" title={category} />
                                ) : (
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 hover:text-slate-300 transition-colors"
                                    >
                                        <span>{category}</span>
                                        {expandedCategories[category] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </button>
                                )
                            )}

                            {/* When collapsed, Main category needs no header/separator if it's top of list */}
                            {category === 'Main' && !isCollapsed && (
                                <h3 className="px-3 py-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                                    {category}
                                </h3>
                            )}

                            {/* Collapsible Content */}
                            <div className={`space-y-1 transition-all duration-300 ease-in-out overflow-hidden
                                ${isCollapsed ? 'max-h-[2000px] opacity-100' : (category === 'Main' || expandedCategories[category] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0')}
                            `}>
                                <nav className="space-y-1">
                                    {items.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                ref={isActive ? activeLinkRef : null}
                                                title={isCollapsed ? item.name : undefined}
                                                className={`
                                                    group flex items-center text-[11px] font-bold rounded-md transition-all duration-200 relative
                                                    ${isCollapsed ? 'justify-center p-2' : 'px-4 py-2'}
                                                    ${isActive
                                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                                                `}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <item.icon className={`${isCollapsed ? 'mr-0' : 'mr-3'} h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                                {!isCollapsed && item.name}
                                                {isActive && (
                                                    <div className={`absolute rounded-full bg-primary-300 animate-pulse ${isCollapsed ? 'bottom-1 w-1 h-1' : 'right-4 w-1 h-1'}`} />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Section: Toggle Only */}
                <div className="bg-slate-950/50 border-t border-slate-800/50">
                    <div className="hidden md:flex justify-end p-2">
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                        >
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </button>
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
