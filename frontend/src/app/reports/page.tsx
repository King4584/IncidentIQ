'use client';

import { useEffect, useState } from 'react';
import { FileText, ExternalLink, RefreshCw, CheckCircle2, ShieldAlert, Clock, Layers } from 'lucide-react';
import { fetchApi } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export default function ReportsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadIncidents() {
      try {
        const incs = await fetchApi<any[]>('/incidents');
        setIncidents(incs);
        if (incs.length > 0) setSelectedIncidentId(incs[0].id);
      } catch (err) {
        console.error(err);
      }
    }
    loadIncidents();
  }, []);

  async function fetchReport(id: string) {
    if (!id) return;
    setLoading(true);
    try {
      const r = await fetchApi<any>(`/reports/${id}`);
      setReport(r);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport(selectedIncidentId);
  }, [selectedIncidentId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center">
            <FileText className="w-5 h-5 text-cyan-400 mr-2" /> Post-Mortem Incident Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-generated executive post-mortems with timeline, evidence ledger, & export capabilities.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-cyan-300"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.incident_number}: {inc.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchReport(selectedIncidentId)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {report && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400">{report.content?.incident_number}</span>
              <h2 className="text-lg font-bold text-slate-100 mt-1">{report.title}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Generated: {report.generated_at}</p>
            </div>
            <a
              href={`${API_BASE_URL}/reports/${selectedIncidentId}/export/html`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Export HTML / Print PDF</span>
            </a>
          </div>

          {/* 1. Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <FileText className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> 1. Executive Summary
            </h3>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono">
              {report.content?.executive_summary}
            </p>
          </div>

          {/* 2. Confirmed Root Cause Analysis */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mr-1.5" /> 2. Root Cause Analysis
            </h3>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 font-mono space-y-2">
              <p><strong className="text-cyan-400">Category:</strong> {report.content?.root_cause?.category || 'Investigation ongoing'}</p>
              <p><strong className="text-cyan-400">Summary:</strong> {report.content?.root_cause?.summary || 'Root cause investigation is currently ongoing.'}</p>
              {report.content?.root_cause?.lessons_learned?.length > 0 && (
                <div>
                  <strong className="text-cyan-400">Lessons Learned:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                    {report.content.root_cause.lessons_learned.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 3. AI Hypotheses Ledger */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <Layers className="w-3.5 h-3.5 text-purple-400 mr-1.5" /> 3. AI Hypotheses Ledger ({report.content?.hypotheses?.length || 0})
            </h3>
            <div className="space-y-2">
              {(report.content?.hypotheses || []).map((h: any) => (
                <div key={h.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-200">{h.title}</span>
                    <span className="text-cyan-400 font-mono">{Math.round(h.confidence_score * 100)}% Confidence</span>
                  </div>
                  <p className="text-slate-400 font-mono">{h.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Mitigation Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 mr-1.5" /> 4. Mitigation Actions ({report.content?.mitigations?.length || 0})
            </h3>
            <div className="space-y-2">
              {(report.content?.mitigations || []).map((m: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono flex justify-between">
                  <span className="text-slate-200">{m.name}</span>
                  <span className="text-cyan-400">{m.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Telemetry Timeline Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <Clock className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> 5. Telemetry Timeline ({report.content?.timeline?.length || 0} events)
            </h3>
            <div className="space-y-1 max-h-60 overflow-y-auto font-mono text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
              {(report.content?.timeline || []).map((t: any, idx: number) => (
                <div key={idx} className="p-1.5 border-b border-slate-800/60 flex items-center justify-between">
                  <span className="text-slate-400">{t.timestamp?.slice(0, 19)} [{t.service}]</span>
                  <span className="text-slate-200 truncate max-w-md">{t.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
