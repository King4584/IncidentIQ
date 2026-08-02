'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Activity, 
  Clock, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowUpRight, 
  UploadCloud, 
  Zap,
  TrendingDown,
  Layers,
  Server,
  UserCheck
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

export default function DashboardPage() {
  const { user } = useAppStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeUser = user || {
    full_name: 'Alex Vance (Lead SRE)',
    email: 'admin@incidentiq.ai',
    role: 'ADMIN',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [aData, iData] = await Promise.all([
          fetchApi<any>('/analytics/overview').catch(() => null),
          fetchApi<any[]>('/incidents').catch(() => [])
        ]);
        setAnalytics(aData);
        setIncidents(iData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero with Logged-In User Profile */}
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
                SRE Control Room
              </span>
              <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Logged in as {activeUser.full_name} ({activeUser.role})
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Welcome back, {activeUser.full_name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              IncidentIQ AI Agent is monitoring operational streams across 10 telemetry sources. Real-time root cause reasoning powered by Azure OpenAI gpt-4o.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/ingestion"
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-xl font-medium border border-slate-700 transition-all"
            >
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Ingest Events</span>
            </Link>
            <Link
              href="/incidents"
              className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Open Workspaces</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SRE KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-slate-100">{analytics?.total_incidents || 12}</span>
            <span className="text-[11px] text-amber-400 font-medium">({analytics?.open_incidents || 3} Active)</span>
          </div>
          <p className="text-[11px] text-slate-500">Across production & staging</p>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Mean Time To Resolve (MTTR)</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-cyan-400">{analytics?.mttr_minutes || 42.5}m</span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center">
              <TrendingDown className="w-3 h-3 mr-0.5" /> -14% vs last week
            </span>
          </div>
          <p className="text-[11px] text-slate-500">MTTD: {analytics?.mttd_minutes || 8.2} mins</p>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">AI Hypothesis Accuracy</span>
            <BrainCircuit className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-purple-400">{analytics?.hypothesis_accuracy_pct || 94.2}%</span>
            <span className="text-[11px] text-purple-300 font-medium">Evidence-bound</span>
          </div>
          <p className="text-[11px] text-slate-500">{analytics?.ai_hypotheses_count || 38} hypotheses generated</p>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Raw Evidence Preserved</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">{analytics?.evidence_count || 482}</span>
            <span className="text-[11px] text-slate-400 font-medium">Postgres JSONB</span>
          </div>
          <p className="text-[11px] text-slate-500">100% Immutable Raw Storage</p>
        </div>
      </div>

      {/* Main Grid: Active Incidents & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Incidents Feed */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-slate-200">Active Incident Workspaces</h3>
            </div>
            <Link href="/incidents" className="text-xs text-cyan-400 hover:underline flex items-center">
              View All <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {incidents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">No active incidents found. Ingest events to start.</div>
            ) : (
              incidents.slice(0, 4).map((inc) => (
                <div key={inc.id} className="glass-card p-4 rounded-xl flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{inc.incident_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        inc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {inc.severity}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                        {inc.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-100">{inc.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{inc.description}</p>
                  </div>
                  <Link
                    href={`/incidents/${inc.id}`}
                    className="flex items-center space-x-1 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold px-3 py-2 rounded-lg border border-cyan-500/30 transition-all shrink-0 ml-4"
                  >
                    <span>Investigate</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Reliability Metrics Side Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-sm text-slate-200">Incident Trend (7 Days)</h3>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.incident_trend || []}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="count" stroke="#38bdf8" fillOpacity={1} fill="url(#colorInc)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center">
              <Server className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> Top Affected Microservices
            </h4>
            <div className="space-y-1.5">
              {(analytics?.top_affected_services || []).slice(0, 3).map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="font-mono text-slate-200">{item.service}</span>
                  <span className="font-bold text-rose-400">{item.count} Incidents</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
