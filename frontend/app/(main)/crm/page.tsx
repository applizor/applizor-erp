'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
    LayoutDashboard,
    Users,
    FileText,
    Target,
    TrendingUp,
    ArrowRight,
    Building,
    CheckCircle2,
    Briefcase
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCurrency } from '@/hooks/useCurrency';

export default function CRMDashboard() {
    const [stats, setStats] = useState<any>({
        leads: { total: 0, new: 0, won: 0 },
        contracts: { active: 0, expiring: 0 },
        targets: { active: 0, achievement: 0 }
    });
    const [recentLeads, setRecentLeads] = useState([]);
    const [recentContracts, setRecentContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency } = useCurrency();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // In a real scenario, we might have a dedicated dashboard endpoint or call multiple in parallel
            // For now, let's call existing list endpoints with limits if possible, or just slice

            const [leadsRes, contractsRes, targetsRes] = await Promise.all([
                api.get('/leads?limit=5'),
                api.get('/contracts?status=active&limit=5'),
                api.get('/sales/targets')
            ]);

            const leads = leadsRes.data.leads || [];
            const contracts = contractsRes.data || [];
            const targets = targetsRes.data || [];

            // Calculate Stats
            const totalLeads = leadsRes.data.pagination?.total || leads.length;
            const newLeads = leads.filter((l: any) => l.status === 'new').length; // Approximation if pagination
            const wonLeads = leads.filter((l: any) => l.status === 'won').length;

            const activeContracts = contracts.length;

            // Calc Sales Target Achievement
            const totalTargetAmount = targets.reduce((sum: number, t: any) => sum + (Number(t.targetAmount) || 0), 0);
            const totalAchieved = targets.reduce((sum: number, t: any) => sum + (Number(t.achievedAmount) || 0), 0);
            const achievementRate = totalTargetAmount > 0 ? (totalAchieved / totalTargetAmount) * 100 : 0;

            setStats({
                leads: { total: totalLeads, new: newLeads, won: wonLeads },
                contracts: { active: activeContracts, expiring: 0 }, // Expiring needs date logic
                targets: { active: targets.length, achievement: achievementRate }
            });

            setRecentLeads(leads.slice(0, 5));
            setRecentContracts(contracts.slice(0, 5));

        } catch (error) {
            console.error('Dashboard load failed', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-white p-5 rounded-md border border-gray-200 shadow-sm flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary-900 rounded-md shadow-lg">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 tracking-tight leading-none uppercase">
                            CRM Command Center
                        </h1>
                        <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wide">
                            Customer Relationships & Sales
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/leads/new" className="btn-primary flex items-center gap-2">
                        <Users size={14} />
                        New Lead
                    </Link>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Sales Targets KPI */}
                <div className="ent-card group cursor-pointer hover:border-primary-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md">
                            <Target size={20} />
                        </div>
                        <Link href="/sales/targets" className="text-[10px] font-black uppercase text-gray-400 hover:text-primary-600 flex items-center gap-1">
                            View Targets <ArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="mb-2">
                        <h3 className="text-2xl font-black text-gray-900">{stats.targets.achievement.toFixed(1)}%</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Overall Target Achievement</p>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, stats.targets.achievement)}%` }}
                        />
                    </div>
                </div>

                {/* Pipeline KPI */}
                <div className="ent-card group cursor-pointer hover:border-primary-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                            <TrendingUp size={20} />
                        </div>
                        <Link href="/leads" className="text-[10px] font-black uppercase text-gray-400 hover:text-primary-600 flex items-center gap-1">
                            Pipeline <ArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">{stats.leads.total}</h3>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">Total Leads</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">{stats.leads.new}</h3>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">New</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">{stats.leads.won}</h3>
                            <p className="text-[9px] text-gray-500 font-bold uppercase">Won</p>
                        </div>
                    </div>
                </div>

                {/* Contracts KPI */}
                <div className="ent-card group cursor-pointer hover:border-primary-200 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-md">
                            <Briefcase size={20} />
                        </div>
                        <Link href="/contracts" className="text-[10px] font-black uppercase text-gray-400 hover:text-primary-600 flex items-center gap-1">
                            Contracts <ArrowRight size={10} />
                        </Link>
                    </div>
                    <div className="mb-2">
                        <h3 className="text-2xl font-black text-gray-900">{stats.contracts.active}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Active Contracts</p>
                    </div>
                </div>
            </div>

            {/* Recent Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Recent Leads */}
                <div className="ent-card min-h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase text-gray-900">Recent Leads</h3>
                        <Link href="/leads" className="text-[10px] font-bold text-primary-600 hover:underline">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {recentLeads.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-8">No recent leads found.</p>
                        ) : (
                            recentLeads.map((lead: any) => (
                                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs shadow-sm">
                                            {lead.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-900">{lead.name}</h4>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold">{lead.company || 'Individual'}</p>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider
                                        ${lead.status === 'new' ? 'bg-blue-50 text-blue-700' :
                                            lead.status === 'won' ? 'bg-emerald-50 text-emerald-700' :
                                                'bg-gray-100 text-gray-600'}`}>
                                        {lead.status}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Active Contracts */}
                <div className="ent-card min-h-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-black uppercase text-gray-900">Active Contracts</h3>
                        <Link href="/contracts" className="text-[10px] font-bold text-primary-600 hover:underline">View All</Link>
                    </div>
                    <div className="space-y-3">
                        {recentContracts.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-8">No active contracts found.</p>
                        ) : (
                            recentContracts.map((contract: any) => (
                                <div key={contract.id} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900">{contract.title}</h4>
                                        <p className="text-[9px] text-gray-500 uppercase font-bold">{contract.client?.companyName || 'Client'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-gray-900">{formatCurrency(contract.totalValue, contract.currency)}</p>
                                        <p className="text-[9px] text-gray-400 uppercase font-bold">Value</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
