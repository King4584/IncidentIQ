'use client';

import { use, useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  BrainCircuit, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Plus, 
  ExternalLink,
  HelpCircle,
  FileCode,
  RotateCcw,
  Check,
  X,
  AlertOctagon,
  ShieldAlert,
  Database,
  ArrowRight,
  Activity
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import EvidenceModal from '@/components/EvidenceModal';
import VersionDrawer from '@/components/VersionDrawer';
import RawJsonModal from '@/components/RawJsonModal';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const AGENT_NODES = [
  { id: 'EVENT_ANALYZED', label: '1. Event Analyzer' },
  { id: 'EVIDENCE_EXTRACTED', label: '2. Evidence Extractor' },
  { id: 'CORRELATIONS_ANALYZED', label: '3. Correlation Engine' },
  { id: 'HYPOTHESES_GENERATED', label: '4. Hypothesis Generator' },
  { id: 'HYPOTHESES_VALIDATED', label: '5. Hypothesis Validator' },
  { id: 'CONTRADICTIONS_DETECTED', label: '6. Contradiction Detector' },
  { id: 'MISSING_EVIDENCE_DETECTED', label: '7. Telemetry Requestor' },
  { id: 'HYPOTHESES_RANKED', label: '8. Hypothesis Ranker' },
  { id: 'REVIEW_COMPLETED', label: '9. Investigator Review' },
  { id: 'INVESTIGATION_COMPLETE', label: '10. Report Generator' }
];

export default function IncidentWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const incidentId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'hypotheses' | 'rootcause' | 'report'>('hypotheses');
  const [incident, setIncident] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [mitigations, setMitigations] = useState<any[]>([]);
  const [rootCause, setRootCause] = useState<any>(null);
  
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [selectedVersionHistory, setSelectedVersionHistory] = useState<any[] | null>(null);
  const [selectedRawId, setSelectedRawId] = useState<string | null>(null);
  
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentStepIndex, setAgentStepIndex] = useState(-1);
  const [agentMsg, setAgentMsg] = useState('');

  // Dynamic Root Cause Form State
  const [rcCategory, setRcCategory] = useState('');
  const [rcSummary, setRcSummary] = useState('');
  const [rcEvidenceIds, setRcEvidenceIds] = useState('');
  const [rcLessons, setRcLessons] = useState('');

  // Dynamic Mitigation Form State
  const [mitName, setMitName] = useState('');
  const [mitDesc, setMitDesc] = useState('');

  async function loadAllData() {
    try {
      const [incData, evData, hypData, mitData, rcData] = await Promise.all([
        fetchApi<any>(`/incidents/${incidentId}`).catch(() => null),
        fetchApi<any[]>(`/timeline?incident_id=${incidentId}`).catch(() => []),
        fetchApi<any[]>(`/hypotheses/${incidentId}`).catch(() => []),
        fetchApi<any[]>(`/mitigations/${incidentId}`).catch(() => []),
        fetchApi<any>(`/root-cause/${incidentId}`).catch(() => null)
      ]);
      setIncident(incData);
      setEvents(evData);
      setHypotheses(hypData);
      setMitigations(mitData);
      setRootCause(rcData);

      if (rcData) {
        setRcCategory(rcData.category || '');
        setRcSummary(rcData.summary || '');
        setRcEvidenceIds(rcData.supporting_evidence_ids ? rcData.supporting_evidence_ids.join(', ') : '');
        setRcLessons(rcData.lessons_learned ? rcData.lessons_learned.join('\n') : '');
      } else if (hypData.length > 0 && hypData[0].supporting_evidence?.length > 0) {
        setRcEvidenceIds(hypData[0].supporting_evidence.map((e: any) => e.id).join(', '));
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadAllData();
  }, [incidentId]);

  const handleRunAgent = async () => {
    setRunningAgent(true);
    setAgentStepIndex(0);
    setAgentMsg('Executing 10-Node LangGraph Agent Investigation Pipeline...');

    // Animate through 10 nodes for visual feedback
    for (let i = 0; i < AGENT_NODES.length; i++) {
      setAgentStepIndex(i);
      await new Promise((r) => setTimeout(r, 220));
    }

    try {
      const res = await fetchApi<any>(`/agent/trigger/${incidentId}`, { method: 'POST' });
      setAgentMsg(`Investigation complete! LangGraph AI Agent generated ${res.hypotheses_generated} evidence-backed hypotheses and extracted ${res.evidence_extracted} evidence items.`);
      setAgentStepIndex(AGENT_NODES.length - 1);
      loadAllData();
      setActiveTab('hypotheses');
    } catch (err: any) {
      setAgentMsg(`Error: ${err.message}`);
    } finally {
      setRunningAgent(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await fetchApi(`/incidents/${incidentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      loadAllData();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleHypothesisAction = async (hypothesis: any, action: string, notes: string = '') => {
    try {
      await fetchApi(`/hypotheses/${hypothesis.id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, notes })
      });

      if (action === 'ACCEPT') {
        setRcCategory(hypothesis.title);
        setRcSummary(hypothesis.description);
        if (hypothesis.supporting_evidence?.length > 0) {
          setRcEvidenceIds(hypothesis.supporting_evidence.map((e: any) => e.id).join(', '));
        }
        await handleUpdateStatus('MITIGATING');
        setActiveTab('rootcause');
      }

      loadAllData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleSaveRootCause = async () => {
    const ids = rcEvidenceIds.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      alert("CRITICAL REQUIREMENT: Root Cause CANNOT be saved without linked supporting evidence IDs.");
      return;
    }

    try {
      await fetchApi(`/root-cause/${incidentId}`, {
        method: 'POST',
        body: JSON.stringify({
          category: rcCategory || "Operational Root Cause",
          summary: rcSummary,
          supporting_evidence_ids: ids,
          lessons_learned: rcLessons ? rcLessons.split('\n').filter(Boolean) : ["Enforce strict monitoring & liveness alerts"],
          reference_docs: []
        })
      });
      await handleUpdateStatus('RESOLVED');
      alert("Confirmed Root Cause saved! Incident status updated to RESOLVED.");
      loadAllData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddMitigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mitName) return;
    try {
      await fetchApi(`/mitigations/${incidentId}`, {
        method: 'POST',
        body: JSON.stringify({
          mitigation_name: mitName,
          description: mitDesc || "Mitigation action initiated by investigator",
          status: 'IN_PROGRESS'
        })
      });
      setMitName('');
      setMitDesc('');
      loadAllData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdateMitigationStatus = async (mitigationId: string, status: string) => {
    try {
      await fetchApi(`/mitigations/item/${mitigationId}?status=${status}`, { method: 'PUT' });
      loadAllData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!incident) return <div className="p-8 text-center text-slate-400 text-xs">Loading incident workspace...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-mono font-bold text-cyan-400">{incident.incident_number}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                incident.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {incident.severity}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                incident.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 
                incident.status === 'INVESTIGATING' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-300'
              }`}>
                Status: {incident.status}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-100">{incident.title}</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Affected Services: {incident.affected_services?.join(', ') || 'N/A'} | Environment: {incident.environment}
            </p>
          </div>

          {/* AI Trigger Button */}
          <button
            onClick={handleRunAgent}
            disabled={runningAgent}
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <Sparkles className={`w-4 h-4 text-slate-950 ${runningAgent ? 'animate-spin' : ''}`} />
            <span>{runningAgent ? 'Executing LangGraph Agent...' : 'Trigger LangGraph AI Agent'}</span>
          </button>
        </div>

        {/* 10-Node LangGraph Visual Stepper Bar */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
            <span className="flex items-center text-cyan-400">
              <Activity className="w-3.5 h-3.5 mr-1" /> 10-Node LangGraph Reasoning Pipeline
            </span>
            <span className="text-slate-500">
              {runningAgent ? `Running Node ${agentStepIndex + 1}/10...` : 'Status: Ready'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5 pt-1">
            {AGENT_NODES.map((node, idx) => {
              const isActive = runningAgent && agentStepIndex === idx;
              const isPassed = !runningAgent && hypotheses.length > 0;
              return (
                <div
                  key={node.id}
                  className={`p-1.5 rounded text-[10px] font-mono text-center font-semibold transition-all ${
                    isActive ? 'bg-cyan-500 text-slate-950 animate-pulse font-bold scale-105 shadow-md shadow-cyan-500/30' :
                    isPassed ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                  title={node.label}
                >
                  <div className="truncate">{node.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {agentMsg && (
          <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 font-medium">
            {agentMsg}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 text-xs font-semibold pt-2 space-x-6">
          <button
            onClick={() => setActiveTab('hypotheses')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'hypotheses' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>AI Hypotheses Workspace ({hypotheses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'timeline' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Timeline Explorer ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rootcause')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'rootcause' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Root Cause & Mitigations</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'report' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Post-Mortem Report</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI HYPOTHESES WORKSPACE */}
      {activeTab === 'hypotheses' && (
        <div className="space-y-6">
          {hypotheses.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
              <BrainCircuit className="w-12 h-12 text-cyan-400/60 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">No Hypotheses Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Click "Trigger LangGraph AI Agent" above to execute the 10-node reasoning graph over ingested telemetry.
              </p>
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        hypo.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {hypo.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">{hypo.title}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-cyan-400 font-mono">
                      {Math.round(hypo.confidence_score * 100)}%
                    </span>
                    <p className="text-[10px] text-slate-400 font-semibold">Evidence Confidence</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
                  {hypo.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supporting Evidence */}
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

                  {/* AI Requested Telemetry */}
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

                {/* Investigator Action Bar */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedVersionHistory(hypo.versions || [{
                      id: hypo.id,
                      version: hypo.version || 1,
                      title: hypo.title,
                      description: hypo.description,
                      confidence_score: hypo.confidence_score,
                      reason_for_change: 'Initial LangGraph AI execution',
                      changed_at: new Date().toISOString()
                    }])}
                    className="text-xs text-slate-400 hover:text-cyan-400 font-mono flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>View Version History ({hypo.versions?.length || 1})</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleHypothesisAction(hypo, 'REJECT')}
                      className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-bold border border-rose-500/40"
                    >
                      Reject Hypothesis
                    </button>
                    <button
                      onClick={() => handleHypothesisAction(hypo, 'ACCEPT')}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-extrabold shadow"
                    >
                      Accept as Confirmed
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: TIMELINE EXPLORER */}
      {activeTab === 'timeline' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center">
            <Clock className="w-4 h-4 text-cyan-400 mr-2" /> Chronological Telemetry Feed ({events.length})
          </h3>

          <div className="space-y-3">
            {events.map((ev, idx) => (
              <div key={idx} className="glass-card p-4 rounded-xl border border-slate-800 flex items-start justify-between space-x-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-mono">{ev.timestamp?.slice(0, 19)}</span>
                    <span className="text-xs font-bold text-cyan-300 font-mono">[{ev.service}]</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      ev.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {ev.severity}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-200">{ev.message}</p>
                </div>
                <button
                  onClick={() => setSelectedRawId(ev.raw_event_id || ev.id)}
                  className="text-[11px] text-cyan-400 hover:underline font-mono shrink-0 flex items-center space-x-1"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>View Raw JSON</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ROOT CAUSE & MITIGATIONS */}
      {activeTab === 'rootcause' && (
        <div className="space-y-6">
          {/* Status Controls */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Incident Status Lifecycle:</span>
              <span className={`text-xs font-mono px-3 py-1 rounded-lg font-bold uppercase ${
                incident.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                incident.status === 'MITIGATING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                incident.status === 'INVESTIGATING' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-300'
              }`}>
                {incident.status}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-semibold">
              <button
                onClick={() => handleUpdateStatus('INVESTIGATING')}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/30"
              >
                Set Status: INVESTIGATING
              </button>
              <button
                onClick={() => handleUpdateStatus('MITIGATING')}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/30"
              >
                Set Status: MITIGATING
              </button>
              <button
                onClick={() => handleUpdateStatus('RESOLVED')}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30"
              >
                Set Status: RESOLVED
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mitigation Actions */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center justify-between">
                <span>Mitigation Action Tracker ({mitigations.length})</span>
              </h3>

              <form onSubmit={handleAddMitigation} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-cyan-400">+ Record New Mitigation Action</h4>
                <input
                  type="text"
                  placeholder="Action Title (e.g. Restart replicas, Scale database)"
                  value={mitName}
                  onChange={(e) => setMitName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
                <input
                  type="text"
                  placeholder="Action details & expected impact..."
                  value={mitDesc}
                  onChange={(e) => setMitDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
                <button
                  type="submit"
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-lg text-xs"
                >
                  Save Mitigation Action
                </button>
              </form>

              <div className="space-y-2">
                {mitigations.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-slate-200">{m.mitigation_name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        m.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-slate-400">{m.description}</p>
                    {m.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateMitigationStatus(m.id, 'COMPLETED')}
                        className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-bold hover:bg-emerald-500/30"
                      >
                        Mark as Completed
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmed Root Cause Lockdown */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2" /> Confirmed Root Cause Lockdown
                </h3>
                {rootCause && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">
                    Confirmed
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Root Cause Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Connection Pool Exhaustion, Memory Leak"
                    value={rcCategory}
                    onChange={(e) => setRcCategory(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400">Technical Root Cause Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Explain confirmed root cause findings backed by evidence..."
                    value={rcSummary}
                    onChange={(e) => setRcSummary(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400">Mandatory Supporting Evidence IDs</label>
                  <input
                    type="text"
                    placeholder="Paste supporting evidence IDs..."
                    value={rcEvidenceIds}
                    onChange={(e) => setRcEvidenceIds(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400">Lessons Learned & Prevention Actions</label>
                  <textarea
                    rows={2}
                    placeholder="Future prevention steps..."
                    value={rcLessons}
                    onChange={(e) => setRcLessons(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                <button
                  onClick={handleSaveRootCause}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                >
                  {rootCause ? 'Update Confirmed Root Cause' : 'Save & Lockdown Confirmed Root Cause'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: POST-MORTEM REPORT */}
      {activeTab === 'report' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono font-bold text-cyan-400">{incident.incident_number}</span>
              <h3 className="text-base font-bold text-slate-100 font-sans mt-0.5">Executive Post-Mortem Incident Report</h3>
            </div>
            <a
              href={`${API_BASE_URL}/reports/${incidentId}/export/html`}
              target="_blank"
              rel="noreferrer"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow flex items-center space-x-1 font-sans"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Export HTML / Print PDF</span>
            </a>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">1. Executive Summary</h4>
            <p className="text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              Incident {incident.incident_number} ({incident.title}) was rated as {incident.severity} severity in environment '{incident.environment}'. Affected services included: {incident.affected_services?.join(', ') || 'N/A'}. Status: {incident.status}.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">2. Confirmed Root Cause</h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <p><strong className="text-cyan-400">Category:</strong> {rootCause?.category || 'Investigation ongoing'}</p>
              <p><strong className="text-cyan-400">Technical Summary:</strong> {rootCause?.summary || 'Root cause investigation is currently ongoing.'}</p>
              {rootCause?.lessons_learned?.length > 0 && (
                <div>
                  <strong className="text-cyan-400">Lessons Learned & Prevention:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                    {rootCause.lessons_learned.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">3. AI Hypotheses & Telemetry ({hypotheses.length})</h4>
            <div className="space-y-2">
              {hypotheses.map((h) => (
                <div key={h.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-200">{h.title}</span>
                    <span className="text-cyan-400 font-mono">{Math.round(h.confidence_score * 100)}% Confidence ({h.status})</span>
                  </div>
                  <p className="text-slate-400">{h.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">4. Mitigation Actions ({mitigations.length})</h4>
            <div className="space-y-1.5">
              {mitigations.map((m) => (
                <div key={m.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                  <span className="text-slate-200">{m.mitigation_name}</span>
                  <span className="text-cyan-400">{m.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <EvidenceModal evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
      <VersionDrawer versions={selectedVersionHistory} onClose={() => setSelectedVersionHistory(null)} />
      <RawJsonModal rawEventId={selectedRawId} onClose={() => setSelectedRawId(null)} />
    </div>
  );
}
