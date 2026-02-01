import { useState, useEffect } from 'react';
import {
    Eye,
    Mail,
    Download,
    Clock,
    Globe,
    Smartphone,
    Monitor,
    Activity,
    CreditCard,
    CheckCircle2,
    RefreshCw
} from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ActivityRecord {
    id: string;
    type: string;
    ipAddress: string | null;
    userAgent: string | null;
    deviceType: string | null;
    browser: string | null;
    metadata: any;
    createdAt: string;
}

interface InvoiceActivityLogProps {
    invoiceId: string;
}

export function InvoiceActivityLog({ invoiceId }: InvoiceActivityLogProps) {
    const [activities, setActivities] = useState<ActivityRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadActivities();
    }, [invoiceId]);

    const loadActivities = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/invoices/${invoiceId}/activities`);
            setActivities(response.data.activities);
        } catch (err: any) {
            console.error('Failed to load activity log:', err);
            setError('Failed to load activity data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-lg">{error}</div>;

    const getActivityIcon = (type: string, metadata: any) => {
        const action = metadata?.action;

        if (action === 'PAYMENT_RECORDED') return <CreditCard className="w-4 h-4 text-emerald-500" />;
        if (action === 'STATUS_UPDATE') return <RefreshCw className="w-4 h-4 text-amber-500" />;

        switch (type) {
            case 'VIEWED': return <Eye className="w-4 h-4 text-blue-500" />;
            case 'DOWNLOADED': return <Download className="w-4 h-4 text-emerald-500" />;
            case 'EMAIL_OPENED': return <Mail className="w-4 h-4 text-purple-500" />;
            case 'STATUS_CHANGE': return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
            default: return <Activity className="w-4 h-4 text-gray-400" />;
        }
    };

    const getActivityLabel = (activity: ActivityRecord) => {
        const { type, metadata, browser } = activity;
        const action = metadata?.action;

        if (action === 'CREATED') return 'Invoice Created';
        if (action === 'UPDATED') return 'Invoice Updated';
        if (action === 'STATUS_UPDATE') return `Status Updated to ${metadata.new_status}`;
        if (action === 'PAYMENT_RECORDED') return `Payment Recorded: ${metadata.amount}`;
        if (action === 'PUBLIC_LINK_GENERATED') return 'Public Link Generated';
        if (action === 'PUBLIC_LINK_REVOKED') return 'Public Link Revoked';

        switch (type) {
            case 'VIEWED':
                return `Viewed via ${browser || 'Link'}`;
            case 'DOWNLOADED':
                return `PDF Downloaded (${browser || 'Direct'})`;
            case 'EMAIL_OPENED':
                return 'Email Opened';
            default:
                return action || type.replace(/_/g, ' ');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={16} className="text-primary-600" />
                    Activity Log & Analytics
                </h3>
                <button
                    onClick={loadActivities}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                    <RefreshCw size={14} className="text-gray-400" />
                </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {activities.length === 0 ? (
                    <div className="p-12 text-center">
                        <Activity className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No activity recorded yet</p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-lg mt-0.5 ${activity.type === 'VIEWED' ? 'bg-blue-50' :
                                            activity.type === 'DOWNLOADED' ? 'bg-emerald-50' :
                                                'bg-gray-100'
                                        }`}>
                                        {getActivityIcon(activity.type, activity.metadata)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900 leading-none">
                                            {getActivityLabel(activity)}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                            {activity.deviceType && (
                                                <span className="inline-flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                    {activity.deviceType === 'Mobile' ? <Smartphone className="w-3 h-3 mr-1" /> : <Monitor className="w-3 h-3 mr-1" />}
                                                    {activity.deviceType}
                                                </span>
                                            )}

                                            {activity.browser && (
                                                <span className="inline-flex items-center text-[10px] font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-1.5 py-0.5 rounded">
                                                    {activity.browser}
                                                </span>
                                            )}

                                            {activity.ipAddress && (
                                                <span className="inline-flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                    <Globe className="w-3 h-3 mr-1 opacity-50" />
                                                    {activity.ipAddress === '::1' || activity.ipAddress === '127.0.0.1' ? 'Localhost' : activity.ipAddress}
                                                </span>
                                            )}
                                        </div>

                                        {activity.metadata?.userName && (
                                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                                By: <span className="text-gray-900">{activity.metadata.userName}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-900 mt-0.5">
                                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
