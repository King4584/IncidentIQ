'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Search, Database } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const logs = await fetchApi<any[]>('/audit?limit=100');
        setAuditLogs(logs);
      } catch (err) {
        console.error(err);
      }
    }
    loadLogs();
  }, []);

  const filtered = auditLogs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center">
            <ShieldAlert className="w-5 h-5 text-amber-400 mr-2" /> Security & Operational Audit Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable audit logging across user actions, AI hypotheses, evidence ingestion, and root cause confirmations.
          </p>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search audit actions (e.g. INCIDENT_CREATED, HYPOTHESIS_ACCEPT)..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
        />
      </div>

      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Entity Type</th>
              <th className="py-2.5 px-3">IP Address</th>
              <th className="py-2.5 px-3">Payload Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filtered.map((log, idx) => (
              <tr key={idx} className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 text-slate-400">{log.created_at?.slice(0, 19)}</td>
                <td className="py-2.5 px-3 font-bold text-cyan-300">{log.action}</td>
                <td className="py-2.5 px-3 text-slate-300">{log.entity_type}</td>
                <td className="py-2.5 px-3 text-slate-400">{log.ip_address}</td>
                <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{JSON.stringify(log.payload)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
