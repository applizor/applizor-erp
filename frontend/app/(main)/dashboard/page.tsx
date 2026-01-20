'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, FileText, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { useCurrency } from '@/context/CurrencyContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalLeads: 0,
    totalQuotations: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    recentClients: [],
    recentLeads: [],
    recentQuotations: [],
    recentInvoices: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [clients, leads, quotations, invoices] = await Promise.all([
        api.get('/clients').catch(() => ({ data: { clients: [] } })),
        api.get('/leads').catch(() => ({ data: { leads: [] } })),
        api.get('/quotations').catch(() => ({ data: { quotations: [] } })),
        api.get('/invoices').catch(() => ({ data: { invoices: [] } }))
      ]);

      const clientsData = clients.data.clients || [];
      const leadsData = leads.data.leads || [];
      const quotationsData = quotations.data.quotations || [];
      const invoicesData = invoices.data.invoices || [];

      // Calculate stats
      const totalRevenue = invoicesData
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

      const pendingAmount = invoicesData
        .filter((inv: any) => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

      setStats({
        totalClients: clientsData.length,
        totalLeads: leadsData.length,
        totalQuotations: quotationsData.length,
        totalInvoices: invoicesData.length,
        totalRevenue,
        pendingInvoices: pendingAmount,
        recentClients: clientsData.slice(0, 5),
        recentLeads: leadsData.slice(0, 5),
        recentQuotations: quotationsData.slice(0, 5),
        recentInvoices: invoicesData.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back! Here's what's happening with your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Total Clients */}
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <Users size={24} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalClients}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/clients" className="text-sm font-medium text-primary-600 hover:text-primary-900">
              View all clients →
            </Link>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Leads</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalLeads}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/leads/list" className="text-sm font-medium text-primary-600 hover:text-primary-900">
              View all leads →
            </Link>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats.totalRevenue)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/invoices" className="text-sm font-medium text-primary-600 hover:text-primary-900">
              View invoices →
            </Link>
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white">
                  <Clock size={24} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Amount</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats.pendingInvoices)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <span className="text-sm text-gray-500">Awaiting payment</span>
          </div>
        </div>

        {/* Total Quotations */}
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <FileText size={24} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Quotations</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalQuotations}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/quotations" className="text-sm font-medium text-primary-600 hover:text-primary-900">
              View quotations →
            </Link>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-pink-500 text-white">
                  <CheckCircle size={24} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Invoices</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.totalInvoices}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <Link href="/invoices" className="text-sm font-medium text-primary-600 hover:text-primary-900">
              View all invoices →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/clients/create"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-blue-500"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Client</h3>
          <p className="text-sm text-gray-600">Create a new client record</p>
        </Link>

        <Link
          href="/leads/create"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-green-500"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Lead</h3>
          <p className="text-sm text-gray-600">Track a new sales opportunity</p>
        </Link>

        <Link
          href="/quotations/create"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-indigo-500"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Quotation</h3>
          <p className="text-sm text-gray-600">Send a proposal to client</p>
        </Link>

        <Link
          href="/invoices/create"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-pink-500"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Invoice</h3>
          <p className="text-sm text-gray-600">Bill your client</p>
        </Link>
      </div>
    </div>
  );
}
