'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, MoreVertical, Edit, Trash2, Eye, ChevronRight } from 'lucide-react';
import { clientsApi } from '@/lib/api/clients';
import { PermissionGuard } from '@/components/PermissionGuard';
import { ClientListSkeleton } from '@/components/clients/ClientListSkeleton';
import { ClientEmptyState } from '@/components/clients/ClientEmptyState';
import { ClientFilterBar } from '@/components/clients/ClientFilterBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

export default function ClientsPage() {
  const toast = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ clientType: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; clientId: string | null; clientName: string }>({
    isOpen: false,
    clientId: null,
    clientName: ''
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchClients(pagination.page, search, filters);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [pagination.page, search, filters]);

  const fetchClients = async (page: number, searchQuery: string, currentFilters: typeof filters) => {
    setLoading(true);
    try {
      const data = await clientsApi.getAll({
        page,
        limit: pagination.limit,
        search: searchQuery,
        ...currentFilters
      });
      setClients(data.clients);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch clients');
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({ clientType: '', status: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDeleteClick = (client: any) => {
    setDeleteDialog({
      isOpen: true,
      clientId: client.id,
      clientName: client.name
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.clientId) return;

    setDeleting(true);
    try {
      await clientsApi.delete(deleteDialog.clientId);
      toast.success('Client deleted successfully');
      setDeleteDialog({ isOpen: false, clientId: null, clientName: '' });
      fetchClients(pagination.page, search, filters); // Refresh list
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete client');
    } finally {
      setDeleting(false);
    }
  };

  const getClientTypeBadge = (type: string) => {
    const styles = {
      customer: 'bg-blue-100 text-blue-800',
      vendor: 'bg-purple-100 text-purple-800',
      partner: 'bg-green-100 text-green-800'
    };
    return styles[type as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 px-2">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-3">
            Customer Registry
            {!loading && clients.length > 0 && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase font-black tracking-widest">
                {pagination.total} ENTITIES
              </span>
            )}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Manage global client partnerships and billing identities.
          </p>
        </div>
        <PermissionGuard module="Client" action="create">
          <Link
            href="/clients/create"
            className="btn-primary"
          >
            <Plus size={16} />
            Onboard Entity
          </Link>
        </PermissionGuard>
      </div>

      {/* Global Search & Filtration */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 mx-2">
        <div className="flex-1 glass p-1.5 rounded-xl border border-slate-100/50 shadow-sm focus-within:border-indigo-500/50 transition-all">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Query by identity, communication, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-slate-900 text-xs font-bold placeholder:text-slate-300 placeholder:font-medium"
            />
          </div>
        </div>
        <div className="hidden lg:block">
          <ClientFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>

      {/* Content Engine */}
      <div className="mx-2">
        {loading ? (
          <ClientListSkeleton />
        ) : clients.length === 0 ? (
          <ClientEmptyState />
        ) : (
          <div className="ent-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th className="rounded-l-2xl">Identity Portfolio</th>
                    <th>Communication Channel</th>
                    <th>Geographic Region</th>
                    <th>Classification</th>
                    <th>Operational State</th>
                    <th className="text-right rounded-r-2xl">Ledger Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clients.map((client) => (
                    <tr key={client.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm group-hover:scale-110 transition-transform">
                            <span className="text-indigo-600 font-black text-base">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-black text-slate-900 tracking-tight">{client.name}</div>
                            {client.gstin && (
                              <div className="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">VAT: {client.gstin}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-600">{client.email || 'N/A'}</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">{client.phone || 'No phone'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs font-black text-slate-700">
                          {client.city && client.state
                            ? `${client.city}, ${client.state}`
                            : client.city || client.state || 'Unspecified'
                          }
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-[9px] font-black uppercase tracking-widest rounded-full border ${getClientTypeBadge(client.clientType)}`}>
                          {client.clientType}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                            {client.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/clients/${client.id}`}
                            className="p-2 bg-white border border-slate-100 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all shadow-sm"
                            title="Intel Overview"
                          >
                            <Eye size={16} />
                          </Link>
                          <PermissionGuard module="Client" action="update">
                            <Link
                              href={`/clients/${client.id}/edit`}
                              className="p-2 bg-white border border-slate-100 text-sky-600 hover:text-white hover:bg-sky-600 rounded-lg transition-all shadow-sm"
                              title="Modify Registry"
                            >
                              <Edit size={16} />
                            </Link>
                          </PermissionGuard>
                          <PermissionGuard module="Client" action="delete">
                            <button
                              onClick={() => handleDeleteClick(client)}
                              className="p-2 bg-white border border-slate-100 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-all shadow-sm"
                              title="Remove Entry"
                            >
                              <Trash2 size={16} />
                            </button>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Portfolio */}
            {pagination.totalPages > 1 && (
              <div className="bg-slate-50/50 px-6 py-4 flex items-center justify-between border-t border-slate-100/50">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="btn-secondary py-1.5"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn-secondary py-1.5"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="text-slate-900">{((pagination.page - 1) * pagination.limit) + 1}</span> —{' '}
                      <span className="text-slate-900">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span> of{' '}
                      <span className="text-slate-900">{pagination.total}</span> Entities
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                    >
                      <ChevronRight size={16} className="rotate-180" />
                    </button>
                    <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-900">
                      {pagination.page} / {pagination.totalPages}
                    </div>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, clientId: null, clientName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Registry Termination"
        message={`Confirm the permanent removal of entity "${deleteDialog.clientName}" from the enterprise database.`}
        confirmText="Terminate Entry"
        cancelText="Revert"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
}
