import { Mail, Phone, Building, User, Calendar, DollarSign, Tag, Briefcase, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/context/CurrencyContext';

interface LeadInfoCardProps {
    lead: any;
    onEdit?: () => void;
}

export default function LeadInfoCard({ lead, onEdit }: LeadInfoCardProps) {
    if (!lead) return null;

    const { formatCurrency, currency } = useCurrency();

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-blue-100 text-blue-800';
            case 'low': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'won': return 'bg-emerald-100 text-emerald-800';
            case 'lost': return 'bg-red-100 text-red-800';
            case 'lead': return 'bg-gray-100 text-gray-800';
            case 'contacted': return 'bg-blue-100 text-blue-800';
            case 'proposal': return 'bg-yellow-100 text-yellow-800';
            case 'negotiation': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{lead.name}</h2>
                        {lead.jobTitle && (
                            <p className="text-sm text-gray-500">{lead.jobTitle}</p>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(lead.stage)} capitalize`}>
                            {lead.stage}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(lead.priority)} capitalize`}>
                            {lead.priority}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contact Details</h3>

                        {lead.email && (
                            <div className="flex items-center text-sm text-gray-700">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                <a href={`mailto:${lead.email}`} className="hover:text-primary-600">{lead.email}</a>
                            </div>
                        )}

                        {lead.phone && (
                            <div className="flex items-center text-sm text-gray-700">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                <a href={`tel:${lead.phone}`} className="hover:text-primary-600">{lead.phone}</a>
                            </div>
                        )}

                        {lead.company && (
                            <div className="flex items-center text-sm text-gray-700">
                                <Building className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{lead.company}</span>
                            </div>
                        )}

                        {lead.industry && (
                            <div className="flex items-center text-sm text-gray-700">
                                <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{lead.industry}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Deal Info</h3>

                        <div className="flex items-center text-sm text-gray-700">
                            <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-semibold">
                                {lead.value ? formatCurrency(lead.value) : 'No value set'}
                            </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-700">
                            <span className="text-gray-400 w-4 h-4 mr-2 text-xs flex items-center justify-center font-bold">%</span>
                            <span>Probability: {lead.probability}%</span>
                        </div>

                        {lead.source && (
                            <div className="text-sm">
                                <span className="text-gray-500">Source: </span>
                                <span className="text-gray-900 capitalize">{lead.source}</span>
                            </div>
                        )}
                    </div>
                </div>

                {lead.tags && lead.tags.length > 0 && (
                    <div className="mt-6">
                        <div className="flex flex-wrap gap-2">
                            {lead.tags.map((tag: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs text-gray-500">
                    <div>
                        <p>Created</p>
                        <p className="font-medium">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                        <p>Last Contacted</p>
                        <p className="font-medium">
                            {lead.lastContactedAt ? format(new Date(lead.lastContactedAt), 'MMM d, yyyy') : 'Never'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
