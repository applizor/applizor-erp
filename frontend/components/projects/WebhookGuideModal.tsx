'use client';

import React from 'react';
import { X, Slack, Hash, Info, ExternalLink } from 'lucide-react';
import Portal from '@/components/ui/Portal';

interface WebhookGuideModalProps {
    type: 'slack' | 'teams';
    onClose: () => void;
}

export default function WebhookGuideModal({ type, onClose }: WebhookGuideModalProps) {
    return (
        <Portal>
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex justify-center items-center p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-zoom-in border border-slate-200">

                    {/* Header */}
                    <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-900 text-white flex items-center justify-center">
                                <Info size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Webhook Guide</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Setup Third-Party Integrations</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">

                        {/* Slack Section */}
                        {type === 'slack' && (
                            <section className="space-y-4 animate-slide-up">
                                <div className="flex items-center gap-3 text-slate-900">
                                    <div className="p-2 bg-[#E01E5A]/10 text-[#E01E5A] rounded-lg">
                                        <Slack size={20} />
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-wider">How to get Slack Webhook</h4>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                                    <ol className="space-y-3 text-xs font-bold text-slate-600 list-decimal pl-5">
                                        <li>Go to <a href="https://api.slack.com/apps" target="_blank" className="text-primary-600 hover:underline inline-flex items-center gap-1">Slack API Apps <ExternalLink size={10} /></a></li>
                                        <li>Click <strong>"Create New App"</strong> and choose <strong>"From scratch"</strong>.</li>
                                        <li>Name it (e.g., "Applizor Bot") and select your Workspace.</li>
                                        <li>From the <strong>Features</strong> menu, select <strong>"Incoming Webhooks"</strong>.</li>
                                        <li>Toggle <strong>"Activate Incoming Webhooks"</strong> to <strong>On</strong>.</li>
                                        <li>Click <strong>"Add New Webhook to Workspace"</strong> at the bottom.</li>
                                        <li>Pick a channel and click <strong>"Allow"</strong>.</li>
                                        <li>Copy the <strong>Webhook URL</strong> and paste it into Applizor.</li>
                                    </ol>
                                    <div className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto">
                                        [Your Webhook URL will appear here]
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* MS Teams Section */}
                        {type === 'teams' && (
                            <section className="space-y-4 animate-slide-up">
                                <div className="flex items-center gap-3 text-slate-900">
                                    <div className="p-2 bg-[#444791]/10 text-[#444791] rounded-lg">
                                        <span className="font-black text-xs">MS</span>
                                    </div>
                                    <h4 className="text-sm font-black uppercase tracking-wider">How to get MS Teams Webhook</h4>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                                    <ol className="space-y-3 text-xs font-bold text-slate-600 list-decimal pl-5">
                                        <li>Open Microsoft Teams and go to the channel you want to notify.</li>
                                        <li>Click <strong>"..." (More options)</strong> next to the channel name.</li>
                                        <li>Select <strong>"Connectors"</strong> (or "Workflows" in newer versions).</li>
                                        <li>Search for <strong>"Incoming Webhook"</strong> and click <strong>"Add/Configure"</strong>.</li>
                                        <li>Provide a name (e.g., "Applizor Alerts") and click <strong>"Create"</strong>.</li>
                                        <li>Copy the <strong>URL</strong> presented on the screen.</li>
                                    </ol>
                                    <div className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-emerald-400 overflow-x-auto">
                                        [Your Webhook URL will appear here]
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Tips */}
                        <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 flex gap-3">
                            <Info size={16} className="text-primary-600 shrink-0" />
                            <p className="text-[10px] font-bold text-primary-700 leading-relaxed uppercase tracking-wide">
                                <strong>PRO TIP:</strong> You can test your webhook by creating a "Task Created" rule first to see if the message arrives correctly in your channel.
                            </p>
                        </div>
                    </div>

                    <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button
                            onClick={onClose}
                            className="btn-primary px-8"
                        >
                            Got it!
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
}
