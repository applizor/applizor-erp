import React from 'react';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';

export function QuotationEmptyState() {
    return (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                <FileText className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Create your first quotation to send proposals to your leads and clients.
            </p>
            <Link
                href="/quotations/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
                <Plus size={18} className="mr-2" />
                Create Your First Quotation
            </Link>
        </div>
    );
}
