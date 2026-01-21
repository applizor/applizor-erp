'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useConfirm } from '@/context/ConfirmationContext';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
}

interface Asset {
    id: string;
    name: string;
    type: string;
    serialNumber: string;
    status: string;
    purchaseDate?: string;
    price?: number;
    employeeId?: string | null;
    employee?: Employee;
    assignedDate?: string;
}

export default function AssetsPage() {
    const toast = useToast();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [currentAsset, setCurrentAsset] = useState<Partial<Asset>>({
        name: '',
        type: 'Laptop',
        serialNumber: '',
        status: 'Available',
        purchaseDate: '',
        price: 0,
        employeeId: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assetsRes, empRes] = await Promise.all([
                api.get('/assets'),
                api.get('/employees') // Assuming this endpoint exists and returns basic details
            ]);
            setAssets(assetsRes.data);
            setEmployees(empRes.data);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentAsset.id) {
                await api.put(`/assets/${currentAsset.id}`, currentAsset);
            } else {
                await api.post('/assets', currentAsset);
            }
            setShowModal(false);
            resetForm();
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save asset');
        }
    };

    const { confirm } = useConfirm();

    const handleDelete = async (id: string) => {
        if (!await confirm({ message: 'Are you sure? This cannot be undone.', type: 'danger' })) return;
        try {
            await api.delete(`/assets/${id}`);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete asset');
        }
    };

    const resetForm = () => {
        setCurrentAsset({
            name: '',
            type: 'Laptop',
            serialNumber: '',
            status: 'Available',
            purchaseDate: '',
            price: 0,
            employeeId: ''
        });
        setIsEditing(false);
    };

    const handleEdit = (asset: Asset) => {
        setCurrentAsset({
            ...asset,
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
            employeeId: asset.employeeId || ''
        });
        setIsEditing(true);
        setShowModal(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Asset Management</h2>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                >
                    + Add New Asset
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {assets.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                                            {asset.price && <div className="text-xs text-gray-500">₹{asset.price}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {asset.type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                            {asset.serialNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${asset.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                asset.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                                                    asset.status === 'Retired' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {asset.employee ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {asset.employee.firstName} {asset.employee.lastName}
                                                    </span>
                                                    <span className="text-xs text-gray-400">Since {asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : '-'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(asset)} className="text-primary-600 hover:text-primary-900 mr-4">Edit</button>
                                            <button onClick={() => handleDelete(asset.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {assets.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No assets found. Add items to track your inventory.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-4">{isEditing ? 'Edit Asset' : 'Add New Asset'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Asset Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. MacBook Pro M1 2021"
                                        value={currentAsset.name}
                                        onChange={(e) => setCurrentAsset({ ...currentAsset, name: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type *</label>
                                        <select
                                            value={currentAsset.type}
                                            onChange={(e) => setCurrentAsset({ ...currentAsset, type: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        >
                                            <option value="Laptop">Laptop</option>
                                            <option value="Desktop">Desktop</option>
                                            <option value="Peripherals">Peripherals</option>
                                            <option value="Phone">Phone</option>
                                            <option value="License">Software License</option>
                                            <option value="Furniture">Furniture</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                                        <input
                                            type="text"
                                            value={currentAsset.serialNumber || ''}
                                            onChange={(e) => setCurrentAsset({ ...currentAsset, serialNumber: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                                        <input
                                            type="date"
                                            value={currentAsset.purchaseDate}
                                            onChange={(e) => setCurrentAsset({ ...currentAsset, purchaseDate: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={currentAsset.price}
                                            onChange={(e) => setCurrentAsset({ ...currentAsset, price: parseFloat(e.target.value) })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={currentAsset.status}
                                        onChange={(e) => setCurrentAsset({ ...currentAsset, status: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="Available">Available</option>
                                        <option value="Assigned">Assigned</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Retired">Retired</option>
                                        <option value="Lost">Lost</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Assign to Employee</label>
                                    <select
                                        value={currentAsset.employeeId || ''}
                                        onChange={(e) => setCurrentAsset({ ...currentAsset, employeeId: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        <option value="">-- Unassigned --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.firstName} {emp.lastName} ({emp.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Choosing an employee will automatically set status to 'Assigned'</p>
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-primary-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700"
                                    >
                                        {isEditing ? 'Save Changes' : 'Add Asset'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
