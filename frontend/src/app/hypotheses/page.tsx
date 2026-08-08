'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, ShieldCheck, HelpCircle, CheckCircle2, RotateCcw, AlertOctagon } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import EvidenceModal from '@/components/EvidenceModal';

export default function HypothesesPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const incs = await fetchApi<any[]>('/incidents');
        setIncidents(incs);
        if (incs.length > 0) {
          setSelectedIncidentId(incs[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedIncidentId) return;
    async function loadHypotheses() {
      try {
        const hyps = await fetchApi<any[]>(`/hypotheses/${selectedIncidentId}`);
        setHypotheses(hyps);
      } catch (err) {
        console.error(err);
      }
    }
    loadHypotheses();
  }, [selectedIncidentId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center">
            <BrainCircuit className="w-5 h-5 text-purple-400 mr-2" /> AI Hypothesis Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict evidence-backed hypotheses, missing telemetry requests & investigator audit logs.
          </p>
        </div>

        {/* Incident Selector */}
        <select
          value={selectedIncidentId}
          onChange={(e) => setSelectedIncidentId(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-cyan-300 focus:outline-none focus:border-cyan-500"
        >
          {incidents.map((inc) => (
            <option key={inc.id} value={inc.id}>
              {inc.incident_number}: {inc.title}
            </option>
          ))}
        </select>
      </div>

      {/* Hypotheses List */}
      <div className="space-y-6">
        {hypotheses.length === 0 ? (
          <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-xs text-slate-400">
            No hypotheses found for the selected incident. Ingest events and trigger the AI agent.
          </div>
        ) : (
          hypotheses.map((hypo) => (
            <div key={hypo.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                      Hypothesis v{hypo.version}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded uppercase">
                      {hypo.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{hypo.title}</h3>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                    {Math.round(hypo.confidence_score * 100)}%
                  </span>
                  <p className="text-[10px] text-slate-400 font-semibold">Confidence Score</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
                {hypo.description}
              </p>

              {/* Supporting & Missing Evidence Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1.5" /> Supporting Evidence ({hypo.supporting_evidence?.length || 0})
                  </h4>
                  <div className="space-y-1.5">
                    {(hypo.supporting_evidence || []).map((ev: any) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvidence(ev)}
                        className="p-2 bg-slate-800/60 hover:bg-slate-800 rounded-lg text-xs cursor-pointer flex items-center justify-between border border-slate-700/50"
                      >
                        <span className="font-semibold text-slate-200 truncate">{ev.title}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded font-mono">
                          Cite
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-1.5" /> AI Requested Telemetry ({hypo.missing_evidence?.length || 0})
                  </h4>
                  <div className="space-y-1.5">
                    {(hypo.missing_evidence || []).map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-950/80 rounded-lg text-xs border border-amber-500/20 space-y-1">
                        <p className="font-bold text-amber-300">{item.title}</p>
                        <p className="text-[11px] text-slate-400">{item.description}</p>
                        <p className="text-[10px] text-cyan-400 font-mono">Action: {item.suggested_action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <EvidenceModal evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
    </div>
  );
}
