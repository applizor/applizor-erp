'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, Users, CreditCard, Shield, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PlatformStats {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  totalEmployees: number;
  totalInvoices: number;
  planDistribution: {
    id: string;
    name: string;
    code: string;
    price: string;
    _count: {
      subscriptions: number;
    };
  }[];
  recentCompanies: {
    id: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
    _count: {
      users: number;
      employees: number;
    };
  }[];
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/platform/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch platform stats:', error);
        toast.error('Failed to load platform dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-12 bg-white rounded-md border border-gray-200">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">No stats available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4 bg-white p-5 rounded-md border border-gray-200 shadow-sm">
        <div className="p-3 bg-slate-900 rounded-md shadow-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">Platform Admin Overview</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Global metrics, tenant distribution, and system performance
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-t-4 border-t-slate-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Total Tenants</CardTitle>
              <CardDescription>All registered companies</CardDescription>
            </div>
            <Building2 className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{stats.totalCompanies}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded">
                {stats.activeCompanies} Active
              </span>
              <span className="text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded">
                {stats.suspendedCompanies} Suspended
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-indigo-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Platform Users</CardTitle>
              <CardDescription>Total login accounts</CardDescription>
            </div>
            <Users className="w-5 h-5 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-900">{stats.totalUsers}</div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
              Admin & Staff accounts
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Total Employees</CardTitle>
              <CardDescription>Managed employee profiles</CardDescription>
            </div>
            <Users className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-900">{stats.totalEmployees}</div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
              SaaS users & payroll profiles
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-amber-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Invoices Issued</CardTitle>
              <CardDescription>Tenant invoicing volume</CardDescription>
            </div>
            <FileText className="w-5 h-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-900">{stats.totalInvoices}</div>
            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">
              Total transaction documents
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Plan Distribution and Recent Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Plan Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Active tenant subscription counts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.planDistribution.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-100"
              >
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900">{plan.name}</h4>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">
                    ${parseFloat(plan.price).toFixed(2)}/mo
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">
                    {plan._count.subscriptions}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">tenants</span>
                </div>
              </div>
            ))}

            {stats.planDistribution.length === 0 && (
              <p className="text-[10px] text-slate-400 text-center py-4 font-bold uppercase">
                No plans created yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Companies */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recently Onboarded Tenants</CardTitle>
              <CardDescription>Most recent company signups</CardDescription>
            </div>
            <Link
              href="/superadmin/tenants"
              className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Manage Tenants <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Company Name
                    </th>
                    <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Email/Contact
                    </th>
                    <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Users/Employees
                    </th>
                    <th className="pb-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Joined Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentCompanies.map((company) => (
                    <tr key={company.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900 text-xs">{company.name}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{company.id}</div>
                      </td>
                      <td className="py-3.5">
                        <div className="text-slate-600 text-xs">{company.email}</div>
                        {company.phone && (
                          <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                            {company.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="flex gap-2">
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded">
                            {company._count.users} Users
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold px-1.5 py-0.5 rounded">
                            {company._count.employees} Employees
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 font-medium">
                        {new Date(company.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}

                  {stats.recentCompanies.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400 text-xs font-bold uppercase">
                        No recent tenants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
