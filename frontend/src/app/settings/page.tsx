'use client';

import { useState } from 'react';
import { Settings, User, Key, Bell, Shield, Save } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function SettingsPage() {
  const { user, setUser } = useAppStore();
  const [fullName, setFullName] = useState(user?.full_name || 'Alex Vance (Lead SRE)');
  const [email, setEmail] = useState(user?.email || 'admin@incidentiq.ai');
  const [apiKey, setApiKey] = useState('iq_live_sec_9941a8092f3301');
  const [openaiKey, setOpenaiKey] = useState('sk-proj-********************');
  const [msg, setMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({
      ...user!,
      full_name: fullName,
      email: email
    });
    setMsg("Profile settings updated successfully!");
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center">
            <Settings className="w-5 h-5 text-cyan-400 mr-2" /> Profile & Platform Settings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your SRE profile, API keys, AI model parameters, and notification alerts.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold">
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        {/* User Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center border-b border-slate-800 pb-2">
            <User className="w-4 h-4 text-cyan-400 mr-2" /> User Profile Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center border-b border-slate-800 pb-2">
            <Key className="w-4 h-4 text-purple-400 mr-2" /> API Keys & AI Integration Settings
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">IncidentIQ Ingestion API Token</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">OpenAI API Key (Optional for LangGraph Engine)</label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-cyan-500/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </form>
    </div>
  );
}
