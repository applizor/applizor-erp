'use client';

import Link from 'next/link';
import { Settings, Building2, Users, MapPin, CreditCard, Wrench, FileText, Shield, Layers, Activity, Mail, Database } from 'lucide-react';

const settingsItems = [
    { href: '/settings/company', label: 'Company Profile', desc: 'Logo, letterhead, tax info, units', icon: Building2 },
    { href: '/settings/roles', label: 'Roles & Permissions', desc: 'Manage user roles and access', icon: Shield },
    { href: '/settings/locations', label: 'Locations', desc: 'Branches and work locations', icon: MapPin },
    { href: '/settings/leave-types', label: 'Leave Types', desc: 'Configure leave policies', icon: Layers },
    { href: '/settings/subscription-plans', label: 'Subscription Plans', desc: 'Pricing and plan management', icon: CreditCard },
    { href: '/settings/services', label: 'Services', desc: 'Manage service offerings', icon: Wrench },
    { href: '/settings/certificate-templates', label: 'Certificate Templates', desc: 'HR certificate designs', icon: FileText },
    { href: '/settings/audit-logs', label: 'Audit Logs', desc: 'System activity monitoring', icon: Activity },
    { href: '/settings/email', label: 'Email Config', desc: 'SMTP and email notification settings', icon: Mail },
    { href: '/settings/payments', label: 'Payments', desc: 'Payment gateway configuration', icon: CreditCard },
    { href: '/settings/storage', label: 'S3 Cloud Storage', desc: 'Configure AWS S3 and private storage credentials', icon: Database },
    { href: '/settings/billing', label: 'SaaS Subscription', desc: 'Manage your ERP plan, limits, and invoices', icon: CreditCard },
];

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-900 rounded-md shadow-lg">
                    <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Settings</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">System configuration & preferences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settingsItems.map(item => (
                    <Link key={item.href} href={item.href} className="ent-card p-5 group hover:shadow-md transition-all duration-200">
                        <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-gray-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                                <item.icon size={20} className="text-gray-500 group-hover:text-primary-600 transition-colors" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{item.label}</h3>
                                <p className="text-[10px] text-gray-500 mt-1">{item.desc}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {settingsItems.length === 0 && (
                <div className="ent-card p-12 flex flex-col items-center justify-center text-center opacity-40">
                    <Settings size={40} className="text-gray-300 mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No settings available</p>
                </div>
            )}
        </div>
    );
}
