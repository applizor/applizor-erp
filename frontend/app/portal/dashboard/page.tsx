'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function PortalDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/portal/dashboard')
            .then((res: any) => setStats(res.data))
            .catch((err: any) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading dashboard...</div>;
    if (!stats) return <div>Failed to load data</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Total Due</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {stats.currency || 'USD'} {stats.totalDue.toLocaleString()}
                    </p>
                    <p className="text-sm text-red-500 mt-1">Pay your invoices on time</p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Pending Invoices</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {stats.pendingInvoicesCount}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Active Projects</h3>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                        {stats.activeProjects}
                    </p>
                </div>
            </div>
        </div>
    );
}
