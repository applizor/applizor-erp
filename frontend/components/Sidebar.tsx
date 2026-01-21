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
            <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center fixed w-full z-20 top-0">
                <span className="text-xl font-bold text-gray-800">Applizor ERP</span>
                <button onClick={toggleMobileMenu} className="p-2 text-gray-600">
                    <Menu />
                </button>
            </div>

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-10 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out font-sans
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:static md:inset-auto md:h-screen
            `}>
                <div className="flex flex-col h-full">
                    {/* Brand */}
                    <div className="h-16 flex items-center px-6 bg-slate-950">
                        <h1 className="text-xl font-bold tracking-wider">Applizor ERP</h1>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto py-4">
                        {Object.entries(groupedNav).map(([category, items]) => (
                            <div key={category} className="mb-6">
                                <h3 className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    {category}
                                </h3>
                                <nav className="space-y-1 px-3">
                                    {items.map((item) => {
                                        // More precise active state detection
                                        // Exact match OR child route (with trailing slash to avoid false matches)
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/dashboard' &&
                                                pathname?.startsWith(item.href + '/'));
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={`
                                                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150
                                                    ${isActive
                                                        ? 'bg-primary-600 text-white'
                                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                                                `}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                            >
                                                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                                {item.name}
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        ))}
                    </div>

                    {/* User Profile & Logout */}
                    <div className="bg-slate-950 p-4 border-t border-slate-800">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-slate-400">View Profile</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="ml-auto p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
                                title="Logout"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-0 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </>
    );
}
