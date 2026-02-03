import { Dialog } from '@/components/ui/Dialog';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/context/CurrencyContext';
import { FileText, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface ClientQuotationsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    quotations: any[];
    clientName: string;
}

export function ClientQuotationsDialog({ isOpen, onClose, quotations, clientName }: ClientQuotationsDialogProps) {
    const router = useRouter();
    const { formatCurrency } = useCurrency();

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700 border-gray-200',
            sent: 'bg-blue-50 text-blue-700 border-blue-200',
            accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rejected: 'bg-rose-50 text-rose-700 border-rose-200',
            expired: 'bg-orange-50 text-orange-700 border-orange-200',
        };

        const icons: Record<string, any> = {
            draft: FileText,
            sent: Clock,
            accepted: CheckCircle,
            rejected: XCircle,
            expired: AlertCircle,
        };

        const Icon = icons[status] || FileText;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles.draft}`}>
                <Icon size={12} />
                {status}
            </span>
        );
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={`Quotations - ${clientName}`}
            maxWidth="4xl"
        >
            <div className="mt-4">
                {quotations.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-900">No quotations found</p>
                        <p className="text-xs text-gray-500 mt-1">This client hasn't received any quotations yet.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Reference
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {quotations.map((quotation) => (
                                    <tr
                                        key={quotation.id}
                                        className="group hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/quotations/${quotation.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                                                    <FileText className="w-4 h-4 text-primary-600" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-gray-900 font-mono">
                                                        {quotation.quotationNumber}
                                                    </div>
                                                    <div className="text-[10px] font-medium text-gray-500 truncate max-w-[200px]">
                                                        {quotation.title}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                                <Calendar size={12} className="text-gray-400" />
                                                {new Date(quotation.quotationDate).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(quotation.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-black text-gray-900 font-mono">
                                                {formatCurrency(quotation.total)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-md text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                    Close
                </button>
            </div>
        </Dialog>
    );
}
