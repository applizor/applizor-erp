'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import api from '@/lib/api';
import { CreditCard, Save, Loader2, Check, X, Eye, EyeOff } from 'lucide-react';

export default function PaymentSettingsPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);
    const [config, setConfig] = useState({
        razorpayKeyId: '', razorpayKeySecret: '',
        cashfreeAppId: '', cashfreeSecretKey: '',
        paypalClientId: '', paypalClientSecret: '',
        preferredGateway: 'razorpay',
    });

    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const res = await api.get('/settings/payments');
            if (res.data) {
                setConfig({
                    razorpayKeyId: res.data.razorpayKeyId || '',
                    razorpayKeySecret: '',
                    cashfreeAppId: res.data.cashfreeAppId || '',
                    cashfreeSecretKey: '',
                    paypalClientId: res.data.paypalClientId || '',
                    paypalClientSecret: '',
                    preferredGateway: res.data.preferredGateway || 'razorpay',
                });
            }
        } catch { /* use defaults */ }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await api.post('/settings/payments', config);
            toast.success('Payment configuration saved');
        } catch { toast.error('Failed to save payment config'); }
        finally { setSaving(false); }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 size={32} className="animate-spin text-primary-600 mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading payment config...</p>
        </div>
    );

    const gateways = [
        { key: 'razorpay', name: 'Razorpay', fields: ['razorpayKeyId', 'razorpayKeySecret'] },
        { key: 'cashfree', name: 'Cashfree', fields: ['cashfreeAppId', 'cashfreeSecretKey'] },
        { key: 'paypal', name: 'PayPal', fields: ['paypalClientId', 'paypalClientSecret'] },
    ];

    return (
        <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-900 rounded-md shadow-lg"><CreditCard className="w-6 h-6 text-white" /></div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Payment Gateways</h2>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Razorpay · Cashfree · PayPal configuration</p>
                </div>
                <button onClick={() => setShowSecrets(!showSecrets)} className="ml-auto text-xs text-gray-500 flex items-center gap-1">
                    {showSecrets ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSecrets ? 'Hide' : 'Show'} Secrets
                </button>
            </div>

            <div className="space-y-4">
                {gateways.map(gw => {
                    const isActive = config.preferredGateway === gw.key;
                    return (
                        <div key={gw.key} className={`ent-card p-5 ${isActive ? 'border-primary-300 ring-1 ring-primary-200' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-md ${isActive ? 'bg-primary-100' : 'bg-gray-100'}`}>
                                        <CreditCard size={18} className={isActive ? 'text-primary-600' : 'text-gray-500'} />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-wider">{gw.name}</h3>
                                    {isActive && <span className="ent-badge ent-badge-success text-[8px]">Active</span>}
                                </div>
                                <button onClick={() => setConfig({ ...config, preferredGateway: gw.key })}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isActive ? 'border-primary-600 bg-primary-600' : 'border-gray-300'}`}>
                                    {isActive && <Check size={12} className="text-white" />}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {gw.fields.map(field => (
                                    <div key={field} className="ent-form-group">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                            {field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                        </label>
                                        <input type={showSecrets ? 'text' : 'password'} className="ent-input w-full p-2 text-sm font-mono"
                                            placeholder={`Enter ${gw.name} ${field.includes('Secret') ? 'Secret' : 'Key ID'}`}
                                            value={(config as any)[field] || ''}
                                            onChange={e => setConfig({ ...config, [field]: e.target.value })} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={saving}
                    className="btn-primary py-2.5 px-6 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save All Configurations
                </button>
            </div>
        </div>
    );
}
