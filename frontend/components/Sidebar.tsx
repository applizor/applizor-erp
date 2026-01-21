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
    Receipt
} from 'lucide-react';
import { auth, useAuth } from '@/lib/auth';
import { useState } from 'react';
import { usePermission } from '@/hooks/usePermission';

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'Main' },

        // HRMS (People)
        { name: 'Employees', href: '/hrms/employees', icon: Users, category: 'HRMS', module: 'Employee' },
        { name: 'Departments', href: '/hrms/departments', icon: Layers, category: 'HRMS', module: 'Department', action: 'update' }, // Hide for read-only
        { name: 'Positions', href: '/hrms/positions', icon: Briefcase, category: 'HRMS', module: 'Position', action: 'update' }, // Hide for read-only
        { name: 'Assets', href: '/hrms/assets', icon: CreditCard, category: 'HRMS', module: 'Asset' },
        { name: 'Attendance', href: '/attendance/my-attendance', icon: CalendarCheck, category: 'HRMS', module: 'Attendance' }, // Universal access usually
        { name: 'Holidays', href: '/attendance/holidays', icon: CalendarCheck, category: 'HRMS', module: 'Holiday' }, // Universal usually or restricted?
        { name: 'My Leaves', href: '/attendance/leaves', icon: Briefcase, category: 'HRMS', module: 'Leave' }, // Universal
        { name: 'Leave Approvals', href: '/attendance/leaves/approvals', icon: CalendarCheck, category: 'HRMS', module: 'Leave', action: 'update' }, // Requires update permission
        { name: 'Leave Balances', href: '/attendance/leaves/balances', icon: PieChart, category: 'HRMS', module: 'LeaveBalance' }, // Added Leave Balances
        { name: 'Shifts', href: '/attendance/shifts', icon: Activity, category: 'HRMS', module: 'Shift', action: 'update' }, // Master config - hide for read-only users
        { name: 'Shift Roster', href: '/attendance/roster', icon: CalendarCheck, category: 'HRMS', module: 'ShiftRoster' },
        { name: 'All Attendance', href: '/attendance/admin', icon: Users, category: 'HRMS', module: 'Attendance' }, // Separated module
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
        { name: 'Salary Components', href: '/payroll/components', icon: Layers, category: 'Finance', module: 'Payroll' }, // New
        { name: 'Payslips', href: '/payroll/payslips', icon: FileSpreadsheet, category: 'Finance', module: 'Payroll' }, // Usually universal for own, but this link implies admin view?
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

        // Always show Dashboard
        if (item.name === 'Dashboard') return true;

        // Items without module/role are considered universal for now (or explicit checks needed)
        if (!item.module && !(item as any).role) return true;

        // Check explicit role requirement (e.g. manager) - keep existing logic or move to can?
        // Let's rely on 'can' for modules, but role check remains for specific UI things not mapped to permissions
        const isAdmin = user.roles?.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'administrator');

        if ((item as any).role && !user.roles?.includes((item as any).role) && !isAdmin) {
            // If implicit role check fails, we might still check module permissions? 
            // But usually role restriction is stricter.
            // However, let's prioritize Module Permission if it exists.
            // Role check mismatch
            return false; // If role is required and not met, hide it.
        }

        // Check Module Permissions
        if (item.module) {
            const moduleName = item.module; // Capture for TS narrowing
            // Use implicit 'read' unless 'action' is specified
            // e.g. Shifts sidebar needs 'update' permission, but user might have 'read' for dropdowns
            const requiredAction = (item as any).action || 'read';

            if (!can(moduleName, requiredAction)) {
                return false;
            }

            // Special Case: "All Attendance" implies seeing everyone
            if (item.name === 'All Attendance') {
                // Return false if read scope is 'owned'
                const perm = user?.permissions?.[moduleName];
                if (perm?.readLevel === 'owned') return false;
            }

            // Special Case: "Leave Approvals"
            // This special case is now partially covered by the `requiredAction` logic if `action: 'update'` is added to it.
            // However, the `updateLevel` check is still specific.
            if (item.name === 'Leave Approvals') {
                const perm = user?.permissions?.[moduleName];
                if (perm?.updateLevel === 'owned' || perm?.updateLevel === 'none') return false;
            }

        }

        return true;
    });

    // Group navigation by category
    const groupedNav = filteredNavigation.reduce((acc, item: any) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, typeof navigation>);

    const handleLogout = () => {
        auth.logout();
        window.location.href = '/login';
    };

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center fixed w-full z-30 top-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Building2 size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-black text-slate-900 tracking-tight">Applizor</span>
                </div>
                <button onClick={toggleMobileMenu} className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                    <Menu size={24} />
                </button>
            </div>

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transform transition-all duration-300 ease-in-out border-r border-slate-800/50 shadow-2xl
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:sticky md:top-0 md:h-screen
            `}>
                <div className="flex flex-col h-full">
                    {/* Brand Section */}
                    <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/50">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Building2 size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-white">Applizor</h1>
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Enterprise ERP</p>
                        </div>
                    </div>

                    {/* Navigation Section */}
                    <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
                        {Object.entries(groupedNav).map(([category, items]) => (
                            <div key={category} className="mb-4 px-3">
                                <h3 className="px-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                    {category}
                                </h3>
                                <nav className="space-y-1">
                                    {items.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));

                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={`
                                                    group flex items-center px-4 py-2 text-[11px] font-bold rounded-xl transition-all duration-200 relative
                                                    ${isActive
                                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 translate-x-1'
                                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50 hover:translate-x-1'}
                                                `}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <item.icon className={`mr-3 h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                                {item.name}
                                                {isActive && (
                                                    <div className="absolute right-4 w-1 h-1 rounded-full bg-indigo-300 animate-pulse" />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        ))}
                    </div>

                    {/* User Profile & Footer Section */}
                    <div className="p-3 bg-slate-950/50 border-t border-slate-800/50">
                        <div className="bg-slate-800/40 rounded-2xl p-2.5 border border-slate-700/30">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-[10px] font-black text-white shadow-inner">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-black text-white truncate">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">Premium</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
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
