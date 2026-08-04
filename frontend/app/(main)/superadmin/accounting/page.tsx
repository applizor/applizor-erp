'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  FileText,
  LineChart,
  CreditCard,
  RefreshCw,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns/format';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';

type Tab = 'payments' | 'accounts' | 'journal' | 'pnl';

interface PlatformCompany {
  id: string;
  name: string;
  isPlatform: boolean;
}

interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number | string;
}

interface PaymentRow {
  subscriptionId: string;
  tenantCompanyId: string;
  tenantName?: string;
  planName?: string;
  planCode?: string;
  amount: number | null;
  currency?: string;
  status: string;
  gateway?: string | null;
  orderId?: string | null;
  journalPosted: boolean;
  journalReference?: string | null;
  updatedAt: string;
}

export default function PlatformAccountingPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('payments');
  const [loading, setLoading] = useState(true);
  const [platformCompany, setPlatformCompany] = useState<PlatformCompany | null>(null);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [pnl, setPnl] = useState<{
    revenue: LedgerAccount[];
    costOfGoodsSold: LedgerAccount[];
    otherIncome: LedgerAccount[];
    operatingExpenses: LedgerAccount[];
  } | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  const load = async () => {
    try {
      setLoading(true);
      await api.post('/platform/accounting/ensure');

      if (tab === 'accounts') {
        const res = await api.get('/platform/accounting/accounts');
        setPlatformCompany(res.data.platformCompany);
        setAccounts(res.data.accounts || []);
      } else if (tab === 'journal') {
        const res = await api.get('/platform/accounting/journal');
        setPlatformCompany(res.data.platformCompany);
        setEntries(res.data.entries || []);
      } else if (tab === 'pnl') {
        const res = await api.get('/platform/accounting/profit-loss', {
          params: dateRange,
        });
        setPlatformCompany(res.data.platformCompany);
        setPnl({
          revenue: res.data.revenue || [],
          costOfGoodsSold: res.data.costOfGoodsSold || [],
          otherIncome: res.data.otherIncome || [],
          operatingExpenses: res.data.operatingExpenses || [],
        });
      } else {
        const res = await api.get('/platform/accounting/payments');
        setPlatformCompany(res.data.platformCompany);
        setPayments(res.data.payments || []);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || 'Failed to load platform accounting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, dateRange.startDate, dateRange.endDate]);

  const sumBalances = (rows: LedgerAccount[]) =>
    rows.reduce((s, a) => s + Number(a.balance || 0), 0);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'payments', label: 'Subscription Payments', icon: CreditCard },
    { id: 'accounts', label: 'Platform COA', icon: BookOpen },
    { id: 'journal', label: 'Platform Journal', icon: FileText },
    { id: 'pnl', label: 'Platform P&L', icon: LineChart },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 bg-white p-5 rounded-md border border-gray-200 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-tight">
            Platform Accounting
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
            Applizor SaaS books — subscription revenue (separate from tenant company ledgers)
          </p>
          {platformCompany && (
            <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
              <Building2 size={12} />
              Books company: <span className="font-semibold">{platformCompany.name}</span>
              <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                isPlatform
              </span>
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-3">
        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">This is not tenant accounting</p>
          <p className="text-amber-800/90 text-xs mt-1">
            Tenant Chart of Accounts / Journal / P&amp;L live under each company&apos;s{' '}
            <Link href="/accounting/chart-of-accounts" className="underline font-medium">
              Accounting
            </Link>{' '}
            module. Country COA templates are managed at{' '}
            <Link href="/superadmin/coa" className="underline font-medium">
              COA Templates
            </Link>
            . Subscription payments post revenue here only.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[280px]">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {tab === 'payments' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider">
                  Tenant SaaS subscription payments
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {payments.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">
                    No gateway-paid subscriptions yet. When a tenant pays via billing checkout,
                    revenue posts here with reference SUB-&#123;orderId&#125;.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-[10px] uppercase tracking-wider text-gray-500">
                        <th className="pb-2 pr-3">Tenant</th>
                        <th className="pb-2 pr-3">Plan</th>
                        <th className="pb-2 pr-3">Amount</th>
                        <th className="pb-2 pr-3">Gateway</th>
                        <th className="pb-2 pr-3">Journal</th>
                        <th className="pb-2">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.subscriptionId} className="border-b border-gray-100">
                          <td className="py-2.5 pr-3 font-medium">{p.tenantName || p.tenantCompanyId}</td>
                          <td className="py-2.5 pr-3">{p.planName || p.planCode || '—'}</td>
                          <td className="py-2.5 pr-3">
                            {p.amount != null
                              ? `${p.currency || ''} ${Number(p.amount).toFixed(2)}`
                              : '—'}
                          </td>
                          <td className="py-2.5 pr-3">{p.gateway || '—'}</td>
                          <td className="py-2.5 pr-3">
                            {p.journalPosted ? (
                              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                                {p.journalReference || 'Posted'}
                              </span>
                            ) : (
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                                Not posted
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-gray-500">
                            {p.updatedAt ? format(new Date(p.updatedAt), 'dd MMM yyyy') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'accounts' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider">
                  Platform chart of accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-[10px] uppercase tracking-wider text-gray-500">
                      <th className="pb-2 pr-3">Code</th>
                      <th className="pb-2 pr-3">Name</th>
                      <th className="pb-2 pr-3">Type</th>
                      <th className="pb-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((a) => (
                      <tr key={a.id} className="border-b border-gray-100">
                        <td className="py-2 pr-3 font-mono text-xs">{a.code}</td>
                        <td className="py-2 pr-3">{a.name}</td>
                        <td className="py-2 pr-3 capitalize text-gray-600">{a.type}</td>
                        <td className="py-2 text-right font-medium">
                          {Number(a.balance || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {tab === 'journal' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider">
                  Platform journal entries
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {entries.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">No platform journals yet.</p>
                ) : (
                  entries.map((e) => (
                    <div key={e.id} className="rounded border border-gray-200 p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {e.reference || '—'}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {e.date ? format(new Date(e.date), 'dd MMM yyyy') : ''}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-emerald-700">
                          {e.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mb-2">{e.description}</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 text-left">
                            <th className="pb-1">Account</th>
                            <th className="pb-1 text-right">Debit</th>
                            <th className="pb-1 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(e.lines || []).map((l: any) => (
                            <tr key={l.id}>
                              <td className="py-0.5">
                                {l.account?.code} — {l.account?.name}
                              </td>
                              <td className="py-0.5 text-right">
                                {Number(l.debit) > 0 ? Number(l.debit).toFixed(2) : ''}
                              </td>
                              <td className="py-0.5 text-right">
                                {Number(l.credit) > 0 ? Number(l.credit).toFixed(2) : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'pnl' && pnl && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-end">
                <label className="text-xs font-bold uppercase text-gray-500">
                  From
                  <input
                    type="date"
                    className="mt-1 block rounded border border-gray-200 px-2 py-1.5 text-sm"
                    value={dateRange.startDate}
                    onChange={(ev) =>
                      setDateRange((d) => ({ ...d, startDate: ev.target.value }))
                    }
                  />
                </label>
                <label className="text-xs font-bold uppercase text-gray-500">
                  To
                  <input
                    type="date"
                    className="mt-1 block rounded border border-gray-200 px-2 py-1.5 text-sm"
                    value={dateRange.endDate}
                    onChange={(ev) =>
                      setDateRange((d) => ({ ...d, endDate: ev.target.value }))
                    }
                  />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase">Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(pnl.revenue || []).concat(pnl.otherIncome || []).map((a) => (
                      <div key={a.id} className="flex justify-between text-sm py-1 border-b border-gray-50">
                        <span>
                          {a.code} {a.name}
                        </span>
                        <span className="font-medium">{Number(a.balance || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-3">
                      <span>Total income</span>
                      <span>
                        {(
                          sumBalances(pnl.revenue || []) + sumBalances(pnl.otherIncome || [])
                        ).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm uppercase">Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(pnl.costOfGoodsSold || []).concat(pnl.operatingExpenses || []).map((a) => (
                      <div key={a.id} className="flex justify-between text-sm py-1 border-b border-gray-50">
                        <span>
                          {a.code} {a.name}
                        </span>
                        <span className="font-medium">{Number(a.balance || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-bold pt-3">
                      <span>Total expenses</span>
                      <span>
                        {(
                          sumBalances(pnl.costOfGoodsSold || []) +
                          sumBalances(pnl.operatingExpenses || [])
                        ).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardContent className="py-4 flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-wider">Net (period)</span>
                  <span className="text-lg font-black">
                    {(
                      sumBalances(pnl.revenue || []) +
                      sumBalances(pnl.otherIncome || []) -
                      sumBalances(pnl.costOfGoodsSold || []) -
                      sumBalances(pnl.operatingExpenses || [])
                    ).toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
