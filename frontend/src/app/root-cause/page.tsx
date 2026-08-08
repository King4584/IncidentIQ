'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ShieldAlert, Plus, ExternalLink, Check } from 'lucide-react';
import { fetchApi } from '@/lib/api';

export default function RootCausePage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [mitigations, setMitigations] = useState<any[]>([]);
  const [rootCause, setRootCause] = useState<any>(null);

  // Dynamic Form fields
  const [category, setCategory] = useState('');
  const [summary, setSummary] = useState('');
  const [evidenceIds, setEvidenceIds] = useState('');
  const [lessons, setLessons] = useState('');

  // Mitigation form fields
  const [newMitName, setNewMitName] = useState('');
  const [newMitDesc, setNewMitDesc] = useState('');

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

  useEffect(() => {
    if (!selectedIncidentId) return;
    async function loadIncidentDetails() {
      try {
        const [mits, rc, hyps] = await Promise.all([
          fetchApi<any[]>(`/mitigations/${selectedIncidentId}`).catch(() => []),
          fetchApi<any>(`/root-cause/${selectedIncidentId}`).catch(() => null),
          fetchApi<any[]>(`/hypotheses/${selectedIncidentId}`).catch(() => [])
        ]);
        setMitigations(mits);
        setRootCause(rc);

        if (rc) {
          setCategory(rc.category || '');
          setSummary(rc.summary || '');
          setEvidenceIds(rc.supporting_evidence_ids ? rc.supporting_evidence_ids.join(', ') : '');
          setLessons(rc.lessons_learned ? rc.lessons_learned.join('\n') : '');
        } else {
          setCategory('');
          setSummary('');
          setLessons('');
          if (hyps.length > 0 && hyps[0].supporting_evidence?.length > 0) {
            setEvidenceIds(hyps[0].supporting_evidence.map((e: any) => e.id).join(', '));
          } else {
            setEvidenceIds('');
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadIncidentDetails();
  }, [selectedIncidentId]);

  const handleSaveRootCause = async () => {
    const ids = evidenceIds.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      alert("CRITICAL REQUIREMENT: Root Cause CANNOT be saved without linked supporting evidence IDs.");
      return;
    }
    try {
      await fetchApi(`/root-cause/${selectedIncidentId}`, {
        method: 'POST',
        body: JSON.stringify({
          category: category || "Operational Root Cause",
          summary,
          supporting_evidence_ids: ids,
          lessons_learned: lessons ? lessons.split('\n').filter(Boolean) : ["Enforce strict connection pool timeout and monitoring"],
          reference_docs: []
        })
      });
      alert("Confirmed Root Cause saved successfully!");
      const rc = await fetchApi<any>(`/root-cause/${selectedIncidentId}`);
      setRootCause(rc);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddMitigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMitName) return;
    try {
      await fetchApi(`/mitigations/${selectedIncidentId}`, {
        method: 'POST',
        body: JSON.stringify({
          mitigation_name: newMitName,
          description: newMitDesc || "Mitigation action created by investigator",
          status: "IN_PROGRESS"
        })
      });
      setNewMitName('');
      setNewMitDesc('');
      const mits = await fetchApi<any[]>(`/mitigations/${selectedIncidentId}`);
      setMitigations(mits);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleMarkCompleted = async (mitigationId: string) => {
    try {
      await fetchApi(`/mitigations/item/${mitigationId}?status=COMPLETED`, { method: 'PUT' });
      const mits = await fetchApi<any[]>(`/mitigations/${selectedIncidentId}`);
      setMitigations(mits);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mr-2" /> Root Cause & Mitigation Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Mandatory evidence-bound root cause confirmation & mitigation tracking.
          </p>
        </div>

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mitigation Actions Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between">
            <span>Mitigation Action Tracker ({mitigations.length})</span>
          </h3>

          <form onSubmit={handleAddMitigation} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-cyan-400">+ Record New Mitigation Action</h4>
            <input
              type="text"
              placeholder="Action Title (e.g. Scale database cluster, Rollback release)"
              value={newMitName}
              onChange={(e) => setNewMitName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
            />
            <input
              type="text"
              placeholder="Impact & action details..."
              value={newMitDesc}
              onChange={(e) => setNewMitDesc(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
            />
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-lg text-xs"
            >
              Add Mitigation Action
            </button>
          </form>

          <div className="space-y-2">
            {mitigations.map((m) => (
              <div key={m.id} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-2">
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
                    onClick={() => handleMarkCompleted(m.id)}
                    className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-bold hover:bg-emerald-500/30"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Evidence-Bound Root Cause Lockdown */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center">
              <ShieldAlert className="w-4 h-4 text-emerald-400 mr-2" /> Mandatory Evidence-Bound Root Cause
            </h3>
            {rootCause && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">
                Confirmed
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400">Failure Category</label>
              <input
                type="text"
                placeholder="Failure category title..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Root Cause Summary</label>
              <textarea
                rows={3}
                placeholder="Enter technical root cause summary..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Supporting Evidence IDs (MANDATORY)</label>
              <input
                type="text"
                placeholder="Paste evidence IDs..."
                value={evidenceIds}
                onChange={(e) => setEvidenceIds(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-cyan-300 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400">Lessons Learned & Prevention Actions</label>
              <textarea
                rows={2}
                placeholder="Future prevention steps..."
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
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
  );
}
