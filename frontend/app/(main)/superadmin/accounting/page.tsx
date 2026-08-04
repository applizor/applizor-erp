'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Banknote, BookOpen, RefreshCw } from 'lucide-react';

type Tab = 'payments' | 'accounts' | 'journal' | 'pnl';

export default function PlatformAccountingPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('payments');
  const [loading, setLoading] = useState(true);
  const [ensuring, setEnsuring] = useState(false);
  const [platformCompany, setPlatformCompany] = useState<{ id: string; name: string } | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journal, setJournal] = useState<any[]>([]);
  const [pnl, setPnl] = useState<any>(null);

  const load = async (active: Tab = tab) => {
    try {
      setLoading(true);
      if (active === 'payments') {
        const res = await api.get('/platform/accounting/payments');
        setPlatformCompany(res.data.platformCompany);
        setPayments(res.data.payments || []);
      } else if (active === 'accounts') {
        const res = await api.get('/platform/accounting/accounts');
        setPlatformCompany(res.data.platformCompany);
        setAccounts(res.data.accounts || []);
      } else if (active === 'journal') {
        const res = await api.get('/platform/accounting/journal');
        setPlatformCompany(res.data.platformCompany);
        setJournal(res.data.entries || []);
      } else {
        const res = await api.get('/platform/accounting/profit-loss');
        setPlatformCompany(res.data.platformCompany);
        setPnl(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load platform accounting');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const ensureBooks = async () => {
    try {
      setEnsuring(true);
      const res = await api.post('/platform/accounting/ensure');
      setPlatformCompany(res.data.platformCompany);
      toast.success('Platform books ready');
      await load(tab);
    } catch (error) {
      console.error(error);
      toast.error('Failed to ensure platform books');
    } finally {
      setEnsuring(false);
    }
  };

  const formatMoney = (n: any) => {
    const v = Number(n || 0);
    return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 bg-white p-5 rounded-md border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <Banknote className="h-4 w-4" />
            Platform Admin
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Platform Accounting</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-2xl">
            Applizor SaaS books for subscription revenue. Separate from every tenant chart of accounts —
            payments post here as <code className="text-xs bg-gray-100 px-1 rounded">SUB-&#123;orderId&#125;</code> journals.
          </p>
          {platformCompany && (
            <p className="mt-2 text-xs text-gray-500">
              Books company: <span className="font-medium text-gray-800">{platformCompany.name}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => load(tab)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={ensureBooks} disabled={ensuring}>
            <BookOpen className="h-4 w-4 mr-2" />
            {ensuring ? 'Ensuring…' : 'Ensure Books'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ['payments', 'Subscription Payments'],
          ['accounts', 'Trial Balance'],
          ['journal', 'Journal'],
          ['pnl', 'Profit & Loss'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 text-sm rounded-md border ${
              tab === key
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center min-h-[280px]">
            <LoadingSpinner />
          </div>
        ) : tab === 'payments' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Gateway</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Posted</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No paid SaaS subscriptions yet. Checkout verify/webhook posts revenue here.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.subscriptionId} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.tenantName || p.tenantCompanyId}</td>
                      <td className="px-4 py-3 text-gray-700">{p.planName || p.planCode}</td>
                      <td className="px-4 py-3">{p.currency || ''} {formatMoney(p.amount)}</td>
                      <td className="px-4 py-3">{p.gateway || '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{p.orderId || '—'}</td>
                      <td className="px-4 py-3">
                        {p.journalPosted ? (
                          <span className="text-emerald-700 font-medium">{p.journalReference}</span>
                        ) : (
                          <span className="text-amber-700">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : tab === 'accounts' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      No platform accounts yet. Click Ensure Books.
                    </td>
                  </tr>
                ) : (
                  accounts.map((a: any) => (
                    <tr key={a.id || a.code} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
                      <td className="px-4 py-3">{a.name}</td>
                      <td className="px-4 py-3 capitalize">{a.type}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(a.debit ?? a.totalDebit)}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(a.credit ?? a.totalCredit)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(a.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : tab === 'journal' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {journal.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                      No platform journal entries yet.
                    </td>
                  </tr>
                ) : (
                  journal.map((e: any) => (
                    <tr key={e.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 font-mono text-xs">{e.reference || '—'}</td>
                      <td className="px-4 py-3">{e.description}</td>
                      <td className="px-4 py-3 capitalize">{e.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {!pnl ? (
              <p className="text-gray-500 text-sm">No P&amp;L data.</p>
            ) : (
              <>
                {(() => {
                  const rev = (pnl.revenue || []).reduce((s: number, r: any) => s + Number(r.balance || 0), 0)
                    + (pnl.otherIncome || []).reduce((s: number, r: any) => s + Number(r.balance || 0), 0);
                  const exp = (pnl.operatingExpenses || []).reduce((s: number, r: any) => s + Number(r.balance || 0), 0)
                    + (pnl.costOfGoodsSold || []).reduce((s: number, r: any) => s + Number(r.balance || 0), 0);
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-md border border-gray-200 p-4">
                        <div className="text-xs uppercase tracking-wider text-gray-500">Revenue</div>
                        <div className="mt-1 text-xl font-semibold">{formatMoney(rev)}</div>
                      </div>
                      <div className="rounded-md border border-gray-200 p-4">
                        <div className="text-xs uppercase tracking-wider text-gray-500">Expenses</div>
                        <div className="mt-1 text-xl font-semibold">{formatMoney(exp)}</div>
                      </div>
                      <div className="rounded-md border border-gray-200 p-4">
                        <div className="text-xs uppercase tracking-wider text-gray-500">Net</div>
                        <div className="mt-1 text-xl font-semibold">{formatMoney(rev - exp)}</div>
                      </div>
                    </div>
                  );
                })()}
                {[
                  ['Revenue', pnl.revenue],
                  ['Other Income', pnl.otherIncome],
                  ['Operating Expenses', pnl.operatingExpenses],
                ].map(([label, rows]) =>
                  Array.isArray(rows) && rows.length > 0 ? (
                    <div key={String(label)}>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2">{label as string}</h3>
                      <ul className="text-sm space-y-1">
                        {(rows as any[]).map((row: any) => (
                          <li key={row.id || row.code} className="flex justify-between border-b border-gray-100 py-1">
                            <span>{row.code} — {row.name}</span>
                            <span>{formatMoney(row.balance)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
