'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, Users, FileText, DollarSign, Building2, UserCheck } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        if (!query) { setLoading(false); return; }
        setLoading(true);
        const timer = setTimeout(() => {
            const suggestions = [
                { label: 'Employees', icon: Users, href: '/hrms/employees', desc: 'Search employees by name, ID, department' },
                { label: 'Clients', icon: Building2, href: '/clients', desc: 'Search clients, contacts, companies' },
                { label: 'Invoices', icon: DollarSign, href: '/invoices', desc: 'Search invoices by number, client' },
                { label: 'Documents', icon: FileText, href: '/documents', desc: 'Search documents by title, type' },
                { label: 'Leads', icon: UserCheck, href: '/leads/list', desc: 'Search leads by name, company, stage' },
            ].filter(s => query.length < 3 || s.label.toLowerCase().includes(query.toLowerCase()) || s.desc.toLowerCase().includes(query.toLowerCase()));
            setResults(suggestions);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="max-w-3xl mx-auto space-y-6 p-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-900 rounded-md shadow-lg">
                    <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Search Results</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Showing results for &ldquo;{query}&rdquo;</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center py-12">
                    <LoadingSpinner size="lg" className="text-primary-600 mb-4" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Searching...</p>
                </div>
            ) : results.length === 0 ? (
                <div className="ent-card p-12 flex flex-col items-center text-center opacity-40">
                    <Search size={40} className="text-gray-300 mb-4" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No results for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs text-gray-400 mt-2">Try searching for employees, clients, invoices, or documents</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {results.map((r, i) => (
                        <Link key={i} href={r.href} className="ent-card p-4 flex items-center gap-4 hover:shadow-md transition-all group">
                            <div className="p-2.5 bg-gray-50 rounded-lg group-hover:bg-primary-50">
                                <r.icon size={20} className="text-gray-500 group-hover:text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{r.label}</h3>
                                <p className="text-[10px] text-gray-500 mt-0.5">{r.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
