import { useState, useEffect } from 'react';
import {
    Eye,
    Mail,
    CheckCircle,
    Clock,
    Globe,
    Calendar,
    Smartphone,
    Monitor,
    XCircle,
    Activity
} from 'lucide-react';
import api from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AnalyticsData {
    id: string;
    viewCount: number;
    lastViewedAt: string | null;
    emailOpens: number;
    lastEmailOpenedAt: string | null;
    status: string;
    clientViewedAt: string | null;
    clientAcceptedAt: string | null;
    clientRejectedAt: string | null;
    activities: {
        id: string;
        type: string;
        ipAddress: string | null;
        userAgent: string | null;
        location: string | null;
        deviceType: string | null;
        browser: string | null;
        createdAt: string;
    }[];
}

interface AnalyticsDashboardProps {
    quotationId: string;
}

export function AnalyticsDashboard({ quotationId }: AnalyticsDashboardProps) {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAnalytics();
    }, [quotationId]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/quotations/${quotationId}/analytics`);
            setData(response.data.analytics);
        } catch (err: any) {
            console.error('Failed to load analytics:', err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8"><LoadingSpinner /></div>;
    if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-lg">{error}</div>;
    if (!data) return null;

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'VIEWED': return <Eye className="w-4 h-4 text-blue-500" />;
            case 'EMAIL_OPENED': return <Mail className="w-4 h-4 text-purple-500" />;
            case 'DOWNLOADED': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const getActivityTypeLabel = (type: string) => {
        switch (type) {
            case 'VIEWED': return 'Viewed Quotation';
            case 'EMAIL_OPENED': return 'Email Opened';
            case 'DOWNLOADED': return 'Downloaded PDF';
            default: return type.replace(/_/g, ' ');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Views Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Views</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{data.viewCount}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Eye className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    {data.lastViewedAt && (
                        <p className="text-xs text-gray-500 mt-4 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Last viewed: {new Date(data.lastViewedAt).toLocaleString()}
                        </p>
                    )}
                </div>

                {/* Status Card */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Current Status</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2 capitalize">{data.status}</h3>
                        </div>
                        <div className={`p-2 rounded-lg ${data.status === 'accepted' ? 'bg-green-50' :
                                data.status === 'rejected' ? 'bg-red-50' :
                                    data.status === 'viewed' ? 'bg-blue-50' : 'bg-gray-50'
                            }`}>
                            {data.status === 'accepted' ? <CheckCircle className="w-6 h-6 text-green-600" /> :
                                data.status === 'rejected' ? <XCircle className="w-6 h-6 text-red-600" /> :
                                    <Activity className="w-6 h-6 text-gray-600" />}
                        </div>
                    </div>
                    {data.clientAcceptedAt && (
                        <p className="text-xs text-green-600 mt-4 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Accepted on {new Date(data.clientAcceptedAt).toLocaleDateString()}
                        </p>
                    )}
                </div>

                {/* Email Opens (Placeholder for now until pixel tracking is fully integrated) */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Email Opens</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{data.emailOpens}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Mail className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    {data.lastEmailOpenedAt ? (
                        <p className="text-xs text-gray-500 mt-4 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Last opened: {new Date(data.lastEmailOpenedAt).toLocaleString()}
                        </p>
                    ) : (
                        <p className="text-xs text-gray-400 mt-4">No email tracking data</p>
                    )}
                </div>

                {/* Engagement Score (Derived) */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Engagement</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                {data.viewCount > 0 ? 'High' : (data.emailOpens > 0 ? 'Medium' : 'Low')}
                            </h3>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Activity className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        Based on views & interactions
                    </p>
                </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
                </div>
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                    {data.activities.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No activity recorded yet.
                        </div>
                    ) : (
                        data.activities.map((activity) => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-gray-100 rounded-full">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {getActivityTypeLabel(activity.type)}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                {activity.deviceType && (
                                                    <span className="inline-flex items-center text-xs text-gray-500">
                                                        {activity.deviceType === 'Mobile' ? <Smartphone className="w-3 h-3 mr-1" /> : <Monitor className="w-3 h-3 mr-1" />}
                                                        {activity.deviceType}
                                                    </span>
                                                )}
                                                {activity.ipAddress && (
                                                    <span className="inline-flex items-center text-xs text-gray-500">
                                                        <Globe className="w-3 h-3 mr-1" />
                                                        {activity.ipAddress === '::1' ? 'Localhost' : activity.ipAddress}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {new Date(activity.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
