'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Users, FileText, DollarSign, Building2, UserCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  employee: { icon: Users, color: 'text-sky-600 bg-sky-50', label: 'Employee' },
  client: { icon: Building2, color: 'text-primary-600 bg-primary-50', label: 'Client' },
  invoice: { icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', label: 'Invoice' },
  document: { icon: FileText, color: 'text-amber-600 bg-amber-50', label: 'Document' },
  lead: { icon: UserCheck, color: 'text-violet-600 bg-violet-50', label: 'Lead' },
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/search', { params: { q: query.trim() } });
        if (!cancelled) {
          const raw = res.data?.results || [];
          setResults(
            raw.map((r: any) => ({
              ...r,
              href: r.type === 'invoice' ? `/invoices/${r.id}` : r.href,
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError('Search failed. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const grouped = results.reduce((acc: Record<string, any[]>, r) => {
    const key = r.type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary-900 rounded-md shadow-lg">
          <Search className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Search Results</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {query ? <>Showing results for &ldquo;{query}&rdquo;</> : 'Enter at least 2 characters in global search'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-12">
          <LoadingSpinner size="lg" className="text-primary-600 mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Searching...</p>
        </div>
      ) : error ? (
        <div className="ent-card p-8 text-center text-sm font-bold text-rose-600">{error}</div>
      ) : !query || query.trim().length < 2 ? (
        <div className="ent-card p-12 flex flex-col items-center text-center">
          <Search size={40} className="text-gray-300 mb-4" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start typing in the header search</p>
          <p className="text-xs text-gray-400 mt-2">Employees, clients, invoices, documents, and leads</p>
        </div>
      ) : results.length === 0 ? (
        <div className="ent-card p-12 flex flex-col items-center text-center opacity-80">
          <Search size={40} className="text-gray-300 mb-4" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-gray-400 mt-2">Try another name, ID, invoice number, or company</p>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {results.length} match{results.length === 1 ? '' : 'es'}
          </p>
          {Object.entries(grouped).map(([type, items]) => {
            const meta = TYPE_META[type] || TYPE_META.document;
            const Icon = meta.icon;
            return (
              <div key={type} className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <span className={`p-1 rounded ${meta.color}`}>
                    <Icon size={12} />
                  </span>
                  {meta.label}s
                </h3>
                <div className="grid gap-2">
                  {(items as any[]).map((r) => (
                    <Link
                      key={`${r.type}-${r.id}`}
                      href={r.href}
                      className="ent-card p-4 flex items-center gap-4 hover:shadow-md transition-all group"
                    >
                      <div className={`p-2.5 rounded-lg ${meta.color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-gray-900 tracking-tight truncate">{r.label}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {[r.subtitle, r.description].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-slate-300 group-hover:text-primary-600 shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
