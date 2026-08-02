'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Clock, BrainCircuit, ShieldCheck } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetchApi<any>('/analytics/overview');
        setData(res);
      } catch (err) {
        console.error(err);
      }
    }
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center">
            <BarChart3 className="w-5 h-5 text-cyan-400 mr-2" /> SRE Analytics & AI Performance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Key metrics for MTTR, MTTD, Hypothesis Accuracy, and Service Reliability trends.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Failure Categories */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Top Incident Root Cause Categories</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top_failure_categories || []} layout="vertical">
                <XAxis type="number" stroke="#475569" fontSize={10} />
                <YAxis dataKey="category" type="category" stroke="#475569" fontSize={10} width={140} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Frequency Trend */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200">Incident Frequency (Weekly Trend)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.incident_trend || []}>
                <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="count" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
