'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Server, ShieldCheck, Database, Key, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function StorageSettingsPage() {
  const [formData, setFormData] = useState({
    provider: 's3',
    awsAccessKeyId: '',
    awsSecretAccessKey: '',
    awsRegion: 'ap-south-1',
    awsBucketName: '',
    awsEndpoint: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'failed' | null; message: string }>({
    status: null,
    message: '',
  });

  const toast = useToast();

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/storage');
      if (res.data) {
        setFormData({
          provider: res.data.provider || 's3',
          awsAccessKeyId: res.data.awsAccessKeyId || '',
          awsSecretAccessKey: res.data.awsSecretAccessKey || '',
          awsRegion: res.data.awsRegion || 'ap-south-1',
          awsBucketName: res.data.awsBucketName || '',
          awsEndpoint: res.data.awsEndpoint || '',
        });
      }
    } catch (error) {
      toast.error('Failed to load storage configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post('/settings/storage', formData);
      toast.success('Storage settings saved successfully');
      loadConfig();
    } catch (error) {
      toast.error('Failed to save storage settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult({ status: null, message: '' });
      const res = await api.post('/settings/storage/test', formData);
      setTestResult({
        status: 'success',
        message: res.data.message || 'Connection established successfully!',
      });
      toast.success('S3 Connection verified!');
    } catch (error: any) {
      const errMsg = error.response?.data?.details || error.response?.data?.error || 'S3 validation failed';
      setTestResult({
        status: 'failed',
        message: errMsg,
      });
      toast.error('S3 Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-900 rounded-md shadow-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 uppercase font-sans">S3 Cloud Storage</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Configure custom tenant AWS S3 buckets to isolate your employee documents, contracts, and logos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle>AWS S3 Connection Parameters</CardTitle>
              <CardDescription>Enter details of your private AWS S3 bucket or compatible S3 object storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Access Key */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">AWS Access Key ID</label>
                  <input
                    type="text"
                    name="awsAccessKeyId"
                    value={formData.awsAccessKeyId}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    required
                  />
                </div>

                {/* Secret Key */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">AWS Secret Access Key</label>
                  <input
                    type="password"
                    name="awsSecretAccessKey"
                    value={formData.awsSecretAccessKey}
                    onChange={handleChange}
                    className="input-field"
                    placeholder={formData.awsSecretAccessKey ? '************' : 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'}
                    required
                  />
                </div>

                {/* Bucket Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">AWS S3 Bucket Name</label>
                  <input
                    type="text"
                    name="awsBucketName"
                    value={formData.awsBucketName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="my-company-storage-bucket"
                    required
                  />
                </div>

                {/* Region */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">AWS Region</label>
                  <input
                    type="text"
                    name="awsRegion"
                    value={formData.awsRegion}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="ap-south-1"
                    required
                  />
                </div>

                {/* Custom Endpoint */}
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                      Custom Endpoint (Optional)
                    </label>
                    <div className="group relative">
                      <HelpCircle size={12} className="text-slate-400 cursor-pointer" />
                      <div className="absolute hidden group-hover:block bg-slate-800 text-white text-[9px] font-bold uppercase p-2 rounded shadow-lg -top-8 left-4 w-56 z-10">
                        Required for MinIO, DigitalOcean Spaces, or Cloudflare R2
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    name="awsEndpoint"
                    value={formData.awsEndpoint}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="https://s3.ap-south-1.amazonaws.com"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || saving}
                  className="btn-secondary px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  {testing ? <LoadingSpinner /> : <Server size={14} />}
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>

                <button
                  type="submit"
                  disabled={saving || testing}
                  className="btn-primary px-6 py-2 text-xs"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Info & test result side panel */}
        <div className="space-y-6">
          {/* S3 status/Test result */}
          {testResult.status !== null && (
            <Card
              className={`border-t-4 bg-white ${
                testResult.status === 'success' ? 'border-t-emerald-500' : 'border-t-rose-500'
              }`}
            >
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  {testResult.status === 'success' ? (
                    <CheckCircle className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="text-rose-500 w-5 h-5 flex-shrink-0" />
                  )}
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    {testResult.status === 'success' ? 'Connection Verified' : 'Connection Failed'}
                  </h3>
                </div>
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed font-mono bg-slate-50 p-2.5 rounded border border-slate-100 break-words">
                  {testResult.message}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Security Best Practices info */}
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle>Storage Security Advisory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[11px] leading-relaxed text-slate-600 font-medium">
              <div className="flex gap-2">
                <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wide mb-0.5">Private Bucket Lock</h4>
                  <p>Keep your S3 bucket blocked from public access. The ERP automatically generates temporary Pre-signed URLs for rendering files securely.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Key size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-slate-800 uppercase tracking-wide mb-0.5">Least Privilege Policy</h4>
                  <p>Create an IAM User with access restricted only to this bucket. Ensure it has `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
