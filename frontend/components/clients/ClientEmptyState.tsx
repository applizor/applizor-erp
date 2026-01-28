import React from 'react';
import Link from 'next/link';
import { Users, Plus, FileText } from 'lucide-react';

export function ClientEmptyState() {
    return (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
                <Users className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Get started by creating your first client. You can add customers, vendors, or partners to manage your business relationships.
            </p>
            <div className="flex items-center justify-center gap-3">
                <Link
                    href="/clients/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                >
                    <Plus size={18} className="mr-2" />
                    Add Your First Client
                </Link>
                <a
                    href="#"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <FileText size={18} className="mr-2" />
                    Import from CSV
                </a>
            </div>
        </div>
    );
}
