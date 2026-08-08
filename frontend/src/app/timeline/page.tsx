'use client';

import { useEffect, useState } from 'react';
import { Clock, Search, Filter, Layers, LayoutList, Share2, Database } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import RawJsonModal from '@/components/RawJsonModal';

export default function TimelinePage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [selectedRawId, setSelectedRawId] = useState<string | null>(null);

  useEffect(() => {
    async function loadIncidents() {
      try {
        const incs = await fetchApi<any[]>('/incidents');
        setIncidents(incs);
      } catch (err) {
        console.error(err);
      }
    }
    loadIncidents();
  }, []);

  useEffect(() => {
    async function loadEvents() {
      try {
        let query = '/timeline?limit=100';
        if (selectedIncidentId) query += `&incident_id=${selectedIncidentId}`;
        if (severityFilter) query += `&severity=${severityFilter}`;
        if (serviceFilter) query += `&service=${serviceFilter}`;
        if (search) query += `&search=${encodeURIComponent(search)}`;
        
        const data = await fetchApi<any[]>(query);
        setEvents(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadEvents();
  }, [selectedIncidentId, search, severityFilter, serviceFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center">
            <Clock className="w-5 h-5 text-cyan-400 mr-2" /> Timeline Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological multi-vector event stream with infinite scroll & search.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-cyan-300"
          >
            <option value="">All Operational Incidents</option>
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.incident_number}: {inc.title}
              </option>
            ))}
          </select>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'timeline' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline View</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                viewMode === 'table' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event messages, request IDs, trace IDs..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="ERROR">ERROR</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>

          <input
            type="text"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            placeholder="Filter Service..."
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono"
          />
        </div>
      </div>

      {/* Timeline Stream View */}
      {viewMode === 'timeline' ? (
        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
          {events.map((ev, idx) => (
            <div key={idx} className="relative group">
              <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                ev.severity === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400'
              }`} />

              <div className="glass-card p-4 rounded-xl border border-slate-800 space-y-2 group-hover:border-cyan-500/40">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-cyan-400 font-bold">[{ev.service}]</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ev.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {ev.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{ev.source}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] text-slate-400 font-mono">{ev.timestamp?.slice(0, 19)}</span>
                    <button
                      onClick={() => setSelectedRawId(ev.raw_event_id || ev.id)}
                      className="text-[11px] text-cyan-400 hover:underline font-mono flex items-center space-x-1"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>View Raw JSON</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-200 font-mono leading-relaxed">{ev.message}</p>

                {(ev.request_id || ev.deployment_id) && (
                  <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono pt-1">
                    {ev.request_id && <span>Request: <strong className="text-cyan-300">{ev.request_id}</strong></span>}
                    {ev.deployment_id && <span>Deploy: <strong className="text-purple-300">{ev.deployment_id}</strong></span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Message</th>
                <th className="py-2.5 px-3">Raw JSON</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {events.map((ev, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 text-slate-400">{ev.timestamp?.slice(0, 19)}</td>
                  <td className="py-2.5 px-3 font-semibold text-cyan-300">{ev.service}</td>
                  <td className="py-2.5 px-3">{ev.severity}</td>
                  <td className="py-2.5 px-3 text-slate-200 max-w-md truncate">{ev.message}</td>
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => setSelectedRawId(ev.raw_event_id || ev.id)}
                      className="text-cyan-400 hover:underline font-mono text-[10px]"
                    >
                      View Raw JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raw JSON Modal */}
      <RawJsonModal rawEventId={selectedRawId} onClose={() => setSelectedRawId(null)} />
    </div>
  );
}
