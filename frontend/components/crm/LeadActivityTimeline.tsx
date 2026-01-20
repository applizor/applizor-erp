import { format } from 'date-fns';
import {
    Phone, Mail, Calendar, MessageSquare,
    CheckCircle, Clock, FileText, Activity
} from 'lucide-react';

interface Activity {
    id: string;
    type: string;
    title: string;
    description?: string;
    outcome?: string;
    createdAt: string;
    createdBy?: string;
    scheduledAt?: string;
}

interface LeadActivityTimelineProps {
    activities: Activity[];
}

export default function LeadActivityTimeline({ activities }: LeadActivityTimelineProps) {
    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No activities recorded yet.</p>
            </div>
        );
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone className="w-4 h-4 text-blue-600" />;
            case 'email': return <Mail className="w-4 h-4 text-purple-600" />;
            case 'meeting': return <Calendar className="w-4 h-4 text-orange-600" />;
            case 'note': return <FileText className="w-4 h-4 text-gray-600" />;
            case 'status_change': return <Activity className="w-4 h-4 text-green-600" />;
            case 'follow_up': return <Clock className="w-4 h-4 text-red-600" />;
            default: return <MessageSquare className="w-4 h-4 text-gray-600" />;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'call': return 'bg-blue-100';
            case 'email': return 'bg-purple-100';
            case 'meeting': return 'bg-orange-100';
            case 'note': return 'bg-gray-100';
            case 'status_change': return 'bg-green-100';
            case 'follow_up': return 'bg-red-100';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {activities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                        <div className="relative pb-8">
                            {activityIdx !== activities.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActivityColor(activity.type)}`}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            <span className="font-medium text-gray-900">{activity.title}</span>
                                        </p>
                                        {activity.description && (
                                            <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{activity.description}</p>
                                        )}
                                        {activity.outcome && (
                                            <p className="mt-1 text-xs text-gray-500">Outcome: <span className="font-medium capitalize">{activity.outcome}</span></p>
                                        )}
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        <time dateTime={activity.createdAt}>{format(new Date(activity.createdAt), 'MMM d, h:mm a')}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
