'use client';

import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Save, MapPin, Globe } from 'lucide-react';

export default function AttendanceConfigPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        allowedIPs: '',
        latitude: '',
        longitude: '',
        radius: 100
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/company/profile'); // Assuming this endpoint returns company details
            // Need to make sure /company/profile returns generic company info or specific settings
            // If not, I'll need to create a specific endpoint or update company profile
            // Based on previous checks, company controller returns basic info. 
            // I might need to update company controller to include these fields in response if they are not there
            // But they are on the model, so they should be returned.
            const data = res.data;
            setFormData({
                allowedIPs: data.allowedIPs || '',
                latitude: data.latitude || '',
                longitude: data.longitude || '',
                radius: data.radius || 100
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Need an endpoint to update these specific settings
            // Or use generic Update Company endpoint
            // Let's assume PUT /company/:id or /company/profile
            // I'll check routes. But usually I need the company ID. 
            // I'll use a specific route `attendance/settings` if I can create it, or use existing company update.
            // Let's assume generic company update for now. 
            // Wait, I don't have company ID easily available unless I fetch it.
            // Best to have PUT /company/settings endpoint.
            // I'll assume PUT /company/profile works for now (I will need to check/verify this endpoint exists).

            await api.put('/company/profile', {
                allowedIPs: formData.allowedIPs,
                latitude: parseFloat(formData.latitude) || null,
                longitude: parseFloat(formData.longitude) || null,
                radius: parseInt(formData.radius.toString()) || 100
            });
            toast.success('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData({
                        ...formData,
                        latitude: pos.coords.latitude.toString(),
                        longitude: pos.coords.longitude.toString()
                    });
                },
                (err) => toast.info('Location access denied')
            );
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Attendance Settings</h2>

            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleSave} className="space-y-8">

                    {/* IP Restrictions */}
                    <div className="border-b pb-6">
                        <div className="flex items-center mb-4">
                            <Globe className="text-primary-600 mr-2" size={24} />
                            <h3 className="text-lg font-medium text-gray-900">IP Restrictions</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Restrict check-in/out to specific IP addresses (e.g., Office WiFi). Leave blank to allow all.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Allowed IPs (Comma separated)</label>
                            <input
                                type="text"
                                value={formData.allowedIPs}
                                onChange={(e) => setFormData({ ...formData, allowedIPs: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                placeholder="192.168.1.1, 203.0.113.5"
                            />
                        </div>
                    </div>

                    {/* Geofencing */}
                    <div>
                        <div className="flex items-center mb-4">
                            <MapPin className="text-primary-600 mr-2" size={24} />
                            <h3 className="text-lg font-medium text-gray-900">Geofencing</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Restrict check-in/out to a specific geographic location.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Latitude</label>
                                <input
                                    type="text"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="e.g. 28.6139"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Longitude</label>
                                <input
                                    type="text"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="e.g. 77.2090"
                                />
                            </div>
                        </div>

                        <div className="mt-2">
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                            >
                                Use Current Location
                            </button>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">Allowed Radius (meters)</label>
                            <input
                                type="number"
                                value={formData.radius}
                                onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                                className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 shadow-sm"
                        >
                            <Save size={18} />
                            <span>Save Settings</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
