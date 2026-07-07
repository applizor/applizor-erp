'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ShieldCheck, CreditCard, Users, Database, Building, CheckCircle2, ChevronRight, AlertTriangle, X } from 'lucide-react';

interface TenantPlan {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: string;
  currency: string;
  billingInterval: string;
  maxUsers: number;
  maxStorageGb: number;
  maxCompanies: number;
  enabledModules: Record<string, boolean> | null;
  features: Record<string, boolean> | null;
}

interface SubscriptionDetails {
  id: string;
  companyId: string;
  planId: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  autoRenew: boolean;
  paymentMethod: string | null;
  plan: TenantPlan;
}

interface UsageStats {
  usersCount: number;
  employeesCount: number;
  companiesCount: number;
  storageGbUsed: number;
}

export default function SaaSBillingPage() {
  const [plans, setPlans] = useState<TenantPlan[]>([]);
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TenantPlan | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load plans, subscription status and usage
  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, profileRes] = await Promise.all([
        api.get('/platform/plans'),
        api.get('/auth/profile'),
      ]);

      setPlans(plansRes.data || []);

      // Get current company details & subscription
      const compId = profileRes.data?.user?.companyId;
      if (compId) {
        const tenantRes = await api.get(`/platform/tenants/${compId}`);
        const tenantData = tenantRes.data;

        setSubDetails(tenantData.tenantSubscription);

        // Fetch usage stats
        setUsage({
          usersCount: tenantData._count?.users || 1,
          employeesCount: tenantData._count?.employees || 0,
          companiesCount: 1, // Current tenant itself
          storageGbUsed: 0.1, // Mock storage used
        });
      }
    } catch (error) {
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  // Check query params for payment callbacks
  useEffect(() => {
    const status = searchParams.get('status');
    const gateway = searchParams.get('gateway');
    const orderId = searchParams.get('order_id');

    if (status === 'success' && gateway && orderId) {
      const verifyPayment = async () => {
        try {
          setVerifying(true);
          await api.post('/platform/subscribe/verify', { gateway, orderId });
          toast.success('Your subscription was successfully activated!');
          // Redirect to clean URL
          router.replace('/settings/billing');
          loadData();
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Failed to verify subscription payment');
        } finally {
          setVerifying(false);
        }
      };
      verifyPayment();
    } else {
      loadData();
    }
  }, [searchParams]);

  const handleCheckout = async (gateway: 'cashfree' | 'paypal') => {
    if (!selectedPlan) return;
    try {
      setCheckoutLoading(true);
      const res = await api.post('/platform/subscribe/checkout', {
        planId: selectedPlan.id,
        gateway,
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error('Failed to get checkout payment URL');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Checkout initiation failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      trial: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
      paused: 'bg-amber-50 text-amber-700 border border-amber-100',
      expired: 'bg-rose-50 text-rose-700 border border-rose-100',
      pending_payment: 'bg-slate-100 text-slate-700 border border-slate-200 animate-pulse',
    };
    return colors[status?.toLowerCase()] || 'bg-slate-50 text-slate-600';
  };

  if (verifying) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] space-y-4 bg-white rounded-md border border-gray-200 p-8 shadow-sm">
        <LoadingSpinner />
        <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">Verifying subscription payment</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Please do not refresh or close this tab...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-900 rounded-md shadow-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 uppercase">SaaS Subscription & Billing</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Configure your ERP limits, view subscription period, or upgrade service tiers
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Status Dashboard */}
      {subDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current plan details */}
          <Card className="lg:col-span-1 border-t-4 border-t-indigo-600 bg-white">
            <CardHeader>
              <CardTitle>Current Plan Tiers</CardTitle>
              <CardDescription>Details of active subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase">{subDetails.plan?.name}</h3>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mt-0.5">
                  Code: {subDetails.plan?.code}
                </span>
              </div>

              <div className="flex gap-2.5 items-center mt-2">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${getStatusBadge(subDetails.status)}`}>
                  {subDetails.status}
                </span>
                {subDetails.currentPeriodEnd && (
                  <span className="text-[10px] text-slate-500 font-bold">
                    Valid Till: {new Date(subDetails.currentPeriodEnd).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-md border border-slate-100 mt-4">
                <span className="text-[9px] text-slate-400 font-bold uppercase mr-1">{subDetails.plan?.currency}</span>
                <span className="text-2xl font-black text-slate-900">
                  {parseFloat(subDetails.plan?.price || '0').toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase ml-1">/ {subDetails.plan?.billingInterval}</span>
              </div>
            </CardContent>
          </Card>

          {/* Usage quotas */}
          {usage && (
            <Card className="lg:col-span-2 bg-white">
              <CardHeader>
                <CardTitle>Usage Utilization Quotas</CardTitle>
                <CardDescription>Operational thresholds for company scale</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Users limit */}
                <div className="space-y-2 p-4 bg-slate-50 rounded border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <Users size={14} /> Team Seat Quota
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {usage.usersCount} <span className="text-slate-400 text-xs font-bold uppercase">/ {subDetails.plan?.maxUsers} seats</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (usage.usersCount / subDetails.plan?.maxUsers) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Storage limit */}
                <div className="space-y-2 p-4 bg-slate-50 rounded border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <Database size={14} /> Cloud Storage Gb
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {usage.storageGbUsed.toFixed(1)} <span className="text-slate-400 text-xs font-bold uppercase">/ {subDetails.plan?.maxStorageGb} GB</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (usage.storageGbUsed / subDetails.plan?.maxStorageGb) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Entity limit */}
                <div className="space-y-2 p-4 bg-slate-50 rounded border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <Building size={14} /> Subsidiaries / Entities
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {usage.companiesCount} <span className="text-slate-400 text-xs font-bold uppercase">/ {subDetails.plan?.maxCompanies} Limit</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (usage.companiesCount / subDetails.plan?.maxCompanies) * 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Available Plans Catalog */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase text-slate-800 tracking-wider">Available Subscription Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isActivePlan = subDetails?.planId === plan.id;
            return (
              <div
                key={plan.id}
                className={`ent-card bg-white flex flex-col justify-between transition-all ${
                  isActivePlan ? 'ring-2 ring-indigo-600 shadow-md border-transparent' : ''
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-900">{plan.name}</h3>
                      <span className="text-[8px] font-mono text-slate-400 uppercase block mt-0.5">{plan.code}</span>
                    </div>
                    {isActivePlan && (
                      <span className="text-[8px] bg-indigo-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Active Tier
                      </span>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-[10px] text-slate-500 font-medium italic mb-4">
                      {plan.description}
                    </p>
                  )}

                  <div className="mb-6 bg-slate-50 p-3 rounded border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold uppercase mr-1">{plan.currency}</span>
                    <span className="text-2xl font-black text-slate-900">
                      {parseFloat(plan.price).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase ml-1">/ {plan.billingInterval}</span>
                  </div>

                  {/* Plan features list */}
                  <div className="space-y-2 border-b border-slate-100 pb-4 mb-4">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      <span>Max Users Quota</span>
                      <span className="text-slate-900 font-black">{plan.maxUsers} Users</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      <span>Cloud Storage Size</span>
                      <span className="text-slate-900 font-black">{plan.maxStorageGb} GB</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      <span>Max Subsidiary Entities</span>
                      <span className="text-slate-900 font-black">{plan.maxCompanies}</span>
                    </div>
                  </div>

                  {/* Feature checkboxes */}
                  <div className="space-y-1.5 mb-6">
                    {Object.entries(plan.features || {}).map(([key, val]) => {
                      if (!val) return null;
                      return (
                        <div key={key} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase">
                          <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  {isActivePlan ? (
                    <button disabled className="btn-secondary w-full py-2.5 text-xs opacity-50 cursor-not-allowed">
                      Currently Subscribed
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedPlan(plan);
                        setIsPayModalOpen(true);
                      }}
                      className="btn-primary w-full py-2.5 text-xs"
                    >
                      Subscribe & Checkout <ChevronRight size={12} className="inline ml-1" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checkout Gateway selector modal */}
      {isPayModalOpen && selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black uppercase text-gray-900">
                Select Subscription Gateway
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-gray-900">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded border border-slate-100">
                <span className="text-[9px] text-slate-400 font-bold uppercase block mb-0.5">Selected Plan Tier</span>
                <span className="text-sm font-black text-slate-800 uppercase">{selectedPlan.name}</span>
                <span className="text-sm font-black text-indigo-600 block mt-1">
                  {selectedPlan.currency} {parseFloat(selectedPlan.price).toFixed(2)} / {selectedPlan.billingInterval}
                </span>
              </div>

              {checkoutLoading ? (
                <div className="flex flex-col justify-center items-center py-6 space-y-2">
                  <LoadingSpinner />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contacting gateway provider...</span>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {/* Cashfree (INR) Option */}
                  <button
                    onClick={() => handleCheckout('cashfree')}
                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-600 hover:bg-slate-50/50 transition-all text-left"
                  >
                    <div>
                      <span className="text-xs font-black text-slate-900 uppercase">Cashfree Checkout</span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">UPI, NetBanking, Domestic Cards (INR)</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>

                  {/* PayPal (USD) Option */}
                  <button
                    onClick={() => handleCheckout('paypal')}
                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:border-indigo-600 hover:bg-slate-50/50 transition-all text-left"
                  >
                    <div>
                      <span className="text-xs font-black text-slate-900 uppercase">PayPal Payment Protocol</span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">International Cards, PayPal Wallets (USD)</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
