'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Sparkles, Lock, Mail, ArrowRight, Check, Key, UserCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Save token and user profile to localStorage
      localStorage.setItem('incidentiq_token', data.access_token);
      localStorage.setItem('incidentiq_user', JSON.stringify(data.user));

      // Redirect to Dashboard
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@incidentiq.ai');
    setPassword('admin123');
    setError('');
  };

  const fillDemoSRE = () => {
    setEmail('sre@incidentiq.ai');
    setPassword('sre123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full text-xs text-cyan-400 font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Native Incident Investigation Platform</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center justify-center space-x-2">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            <span>INCIDENTIQ AI</span>
          </h1>
          <p className="text-xs text-slate-400">
            Log in to access autonomous SRE evidence reasoning & post-mortem investigation workspace.
          </p>
        </div>

        {/* Login Form Panel */}
        <div className="glass-panel bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center">
                <Mail className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> User Email / Account ID
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@incidentiq.ai"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center">
                <Lock className="w-3.5 h-3.5 text-purple-400 mr-1.5" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Control Room'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Key className="w-3.5 h-3.5 text-cyan-400 mr-1" /> Quick Fill Demo Credentials
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Pre-configured
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoAdmin}
                className="p-2.5 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left space-y-0.5 group transition-all"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                  <span>Alex Vance</span>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded">ADMIN</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">admin@incidentiq.ai</p>
                <p className="text-[10px] text-slate-500 font-mono">Pass: admin123</p>
              </button>

              <button
                type="button"
                onClick={fillDemoSRE}
                className="p-2.5 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-left space-y-0.5 group transition-all"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                  <span>Elena Rostova</span>
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded">SRE</span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono truncate">sre@incidentiq.ai</p>
                <p className="text-[10px] text-slate-500 font-mono">Pass: sre123</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-500 font-mono">
          IncidentIQ AI Platform v1.0.0 &bull; Enterprise RBAC Enabled
        </p>
      </div>
    </div>
  );
}
