'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getBaseUrl } from '@/lib/utils/url';
import { Chrome, ShieldAlert, KeyRound, Building2 } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // SAML State
  const [showSamlModal, setShowSamlModal] = useState(false);
  const [samlDomain, setSamlDomain] = useState('');

  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam) {
      setError(decodeURIComponent(errParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await auth.login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = getBaseUrl();
    window.location.href = `${backendUrl}/api/auth/sso/google`;
  };

  const handleSamlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!samlDomain) return;

    let domain = samlDomain.trim();
    if (domain.includes('@')) {
      domain = domain.split('@')[1];
    }

    const backendUrl = getBaseUrl();
    window.location.href = `${backendUrl}/api/auth/sso/saml/login?domain=${encodeURIComponent(domain)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md border border-gray-100">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 tracking-tight">
            Sign in to Applizor ERP
          </h2>
          <p className="mt-2 text-center text-xs text-gray-500 font-medium">Enterprise Portal & Core Resource Directory</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-md text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-xs font-bold"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-xs font-black uppercase tracking-widest text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* SSO Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-400 font-black uppercase tracking-widest text-[9px]">Or authenticate via SSO</span>
            </div>
          </div>

          {/* SSO Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-200 rounded-md shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-700 bg-white hover:bg-gray-50 transition-all"
            >
              <Chrome className="w-4 h-4 text-rose-500" />
              Google SSO
            </button>
            <button
              type="button"
              onClick={() => setShowSamlModal(true)}
              className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-200 rounded-md shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-700 bg-white hover:bg-gray-50 transition-all"
            >
              <Building2 className="w-4 h-4 text-primary-500" />
              SAML SSO
            </button>
          </div>

          <div className="text-center">
            <a
              href="/register"
              className="text-xs font-bold text-primary-600 hover:text-primary-500"
            >
              Don't have an account? Register
            </a>
          </div>
        </form>
      </div>

      {/* SAML Initiation Modal */}
      <Dialog
        isOpen={showSamlModal}
        onClose={() => setShowSamlModal(false)}
        title="Enterprise SAML Authentication"
        maxWidth="sm"
      >
        <form onSubmit={handleSamlSubmit} className="space-y-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight leading-relaxed">
            Enter your work email or company domain name (e.g. <code>acme.com</code>) to initiate single sign-on redirect with your Identity Provider.
          </p>
          <div className="ent-form-group">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
              Domain or Work Email
            </label>
            <input
              type="text"
              required
              placeholder="e.g. acme.com or john@company.com"
              value={samlDomain}
              onChange={(e) => setSamlDomain(e.target.value)}
              className="ent-input w-full font-bold text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowSamlModal(false)}
              className="px-4 py-2 rounded text-[10px] font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 shadow-md transition-all flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Proceed to IdP
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
