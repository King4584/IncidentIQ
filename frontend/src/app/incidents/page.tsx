'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Plus, ArrowUpRight, Search, Filter } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function IncidentsListPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [priority, setPriority] = useState('P2');
  const [environment, setEnvironment] = useState('production');
  const [services, setServices] = useState('payment-api, checkout-service');

  async function loadIncidents() {
    try {
      const data = await fetchApi<any[]>('/incidents');
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title,
          severity,
          priority,
          environment,
          affected_services: services.split(',').map(s => s.trim())
        })
      });
      setShowCreateModal(false);
      setTitle('');
      loadIncidents();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-400 mr-2" /> Operational Incident Workspaces
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full lifecycle investigation, evidence correlation, and AI root cause reasoning.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Incident</span>
        </button>
      </div>

      {/* Incident List Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incidents.map((inc) => (
            <div key={inc.id} className="glass-card p-5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">{inc.incident_number}</span>
                  <div className="flex space-x-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      inc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {inc.severity}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
                      {inc.status}
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-100 mt-2">{inc.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{inc.description || 'No description provided.'}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-slate-500 font-mono text-[11px]">
                  Env: <span className="text-slate-300">{inc.environment}</span>
                </div>
                <Link
                  href={`/incidents/${inc.id}`}
                  className="flex items-center space-x-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-colors"
                >
                  <span>Open Workspace</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="glass-panel bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">Create New Incident Workspace</h3>
            <div>
              <label className="text-xs font-semibold text-slate-400">Incident Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Redis Cluster Cache Invalidation Failure"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="production">production</option>
                  <option value="staging">staging</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Affected Services (comma separated)</label>
              <input
                type="text"
                value={services}
                onChange={(e) => setServices(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
