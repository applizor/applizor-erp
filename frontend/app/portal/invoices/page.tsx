'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function PortalInvoices() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/portal/invoices')
            .then((res: any) => setInvoices(res.data))
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading invoices...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">My Invoices</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {invoices.length === 0 ? (
                        <li className="px-6 py-4 text-center text-gray-500">No invoices found</li>
                    ) : (
                        invoices.map((inv) => (
                            <li key={inv.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-indigo-600 truncate">{inv.invoiceNumber}</p>
                                    <p className="text-sm text-gray-500">
                                        Date: {new Date(inv.invoiceDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {inv.currency} {Number(inv.total).toLocaleString()}
                                        </p>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {inv.status}
                                        </span>
                                    </div>
                                    {/* In future: Download Button */}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
