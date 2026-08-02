'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Database, Plus, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import RawJsonModal from '@/components/RawJsonModal';

export default function IngestionPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'api'>('upload');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedIncId, setSelectedIncId] = useState('');
  const [customIncName, setCustomIncName] = useState('');
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [ingestedEvents, setIngestedEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [selectedRawId, setSelectedRawId] = useState<string | null>(null);

  // Manual Form State
  const [manualService, setManualService] = useState('payment-api');
  const [manualSeverity, setManualSeverity] = useState('ERROR');
  const [manualType, setManualType] = useState('LOG');
  const [manualMsg, setManualMsg] = useState('Connection pool exhausted: asyncpg.exceptions.TooManyConnectionsError');
  const [manualReqId, setManualReqId] = useState('req-7710a');
  const [manualDeployId, setManualDeployId] = useState('dep-9941a');

  async function loadIncidents() {
    try {
      const incs = await fetchApi<any[]>('/incidents');
      setIncidents(incs);
      if (incs.length > 0 && !selectedIncId) {
        setSelectedIncId(incs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  const targetIncidentIdentifier = customIncName.trim() || selectedIncId;

  const handleFileUpload = async () => {
    if (!file || !targetIncidentIdentifier) {
      alert("Please select a file and choose or type a target Incident ID");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('incident_id', targetIncidentIdentifier);
      formData.append('file', file);

      const res = await fetch("http://127.0.0.1:8000/api/v1/ingestion/file", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setIngestedEvents(data);
      setStatusMsg(`Successfully ingested ${data.length} events into PostgreSQL raw JSONB!`);
      loadIncidents();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualIngest = async () => {
    if (!targetIncidentIdentifier) {
      alert("Please select or type a target Incident ID");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        incident_id: targetIncidentIdentifier,
        events: [{
          source: "Manual Entry",
          service: manualService,
          severity: manualSeverity,
          event_type: manualType,
          message: manualMsg,
          request_id: manualReqId,
          deployment_id: manualDeployId,
          payload: {
            service: manualService,
            severity: manualSeverity,
            request_id: manualReqId,
            deployment_id: manualDeployId,
            message: manualMsg
          }
        }]
      };

      const res = await fetchApi<any[]>('/ingestion/manual', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setIngestedEvents(res);
      setStatusMsg("Manual operational event successfully ingested and normalized!");
      loadIncidents();
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center">
            <UploadCloud className="w-5 h-5 text-cyan-400 mr-2" /> Multi-Source Operational Event Ingestion
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Accepting Application Logs, Deployments, Alerts, DB Events, User Reports & Custom JSON/CSV payloads.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'upload' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            File Upload (CSV/JSON/TXT)
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'manual' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Manual Entry Form
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'api' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            REST API Guide
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Target Incident ID Selector */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2">
        <label className="text-xs font-semibold text-slate-300">Target Incident Context:</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={selectedIncId}
            onChange={(e) => { setSelectedIncId(e.target.value); setCustomIncName(''); }}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono"
          >
            {incidents.map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.incident_number}: {inc.title}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={customIncName}
            onChange={(e) => setCustomIncName(e.target.value)}
            placeholder="Or type custom incident name (e.g. Redis Cache OOM Outage)"
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* TAB 1: FILE UPLOAD */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
            }}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              dragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
            }`}
          >
            <UploadCloud className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-bounce" />
            <h3 className="font-bold text-sm text-slate-200">Drag & Drop Log Files Here</h3>
            <p className="text-xs text-slate-400 mt-1">Supports .json, .csv, .txt log files up to 50MB</p>
            
            <input
              type="file"
              accept=".json,.csv,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-input"
            />
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <label
                htmlFor="file-input"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg font-semibold border border-slate-700 cursor-pointer"
              >
                Browse Local Files
              </label>
              <a
                href="/sample_events.json"
                download="sample_events_postgres.json"
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs px-3.5 py-2 rounded-lg font-semibold border border-cyan-500/30"
              >
                Download Postgres Outage JSON
              </a>
              <a
                href="/sample_events_redis.json"
                download="sample_events_redis.json"
                className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs px-3.5 py-2 rounded-lg font-semibold border border-purple-500/30"
              >
                Download Redis OOM JSON
              </a>
            </div>

            {file && (
              <div className="mt-4 p-3 bg-slate-800/80 rounded-xl inline-flex items-center space-x-2 text-xs font-mono border border-slate-700 text-cyan-300">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <button
            onClick={handleFileUpload}
            disabled={loading || !file}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
          >
            {loading ? 'Ingesting into PostgreSQL JSONB...' : 'Ingest File Events'}
          </button>
        </div>
      )}

      {/* TAB 2: MANUAL ENTRY FORM */}
      {activeTab === 'manual' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">Manual Event Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Microservice</label>
              <input
                type="text"
                value={manualService}
                onChange={(e) => setManualService(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Severity Level</label>
              <select
                value={manualSeverity}
                onChange={(e) => setManualSeverity(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="ERROR">ERROR</option>
                <option value="WARNING">WARNING</option>
                <option value="INFO">INFO</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Event Type</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
              >
                <option value="LOG">LOG</option>
                <option value="DEPLOYMENT">DEPLOYMENT</option>
                <option value="API_FAILURE">API_FAILURE</option>
                <option value="DB_ALERT">DB_ALERT</option>
                <option value="USER_REPORT">USER_REPORT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium">Event Message / Log Text</label>
            <textarea
              rows={3}
              value={manualMsg}
              onChange={(e) => setManualMsg(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-medium">Request ID (Optional)</label>
              <input
                type="text"
                value={manualReqId}
                onChange={(e) => setManualReqId(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium">Deployment ID (Optional)</label>
              <input
                type="text"
                value={manualDeployId}
                onChange={(e) => setManualDeployId(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleManualIngest}
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all shadow"
          >
            Submit Operational Event
          </button>
        </div>
      )}

      {/* TAB 3: REST API GUIDE */}
      {activeTab === 'api' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-slate-200 font-sans text-sm">Programmatic API Event Ingestion Endpoint</h3>
          <p className="text-slate-400 font-sans">Send operational events directly from Datadog webhooks, CI/CD runners, or Kubernetes sidecars.</p>
          <pre className="bg-slate-950 p-4 rounded-xl text-cyan-300 border border-slate-800 overflow-x-auto">
{`POST /api/v1/ingestion/manual HTTP/1.1
Host: 127.0.0.1:8000
Content-Type: application/json

{
  "incident_id": "INC-8092",
  "events": [
    {
      "source": "Datadog APM",
      "service": "payment-api",
      "severity": "CRITICAL",
      "event_type": "DB_ALERT",
      "message": "fatal: remaining connection slots are reserved",
      "request_id": "req-7710a",
      "payload": { "max_connections": 200, "active": 200 }
    }
  ]
}`}
          </pre>
        </div>
      )}

      {/* Ingested Events Preview Table */}
      {ingestedEvents.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 flex items-center">
              <Database className="w-4 h-4 text-emerald-400 mr-2" /> Normalized & Raw Evidence Ledger ({ingestedEvents.length})
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase">
              Validation Passed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3">Service</th>
                  <th className="py-2 px-3">Severity</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Message</th>
                  <th className="py-2 px-3">Raw Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {ingestedEvents.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{ev.service}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {ev.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{ev.event_type}</td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-md truncate">{ev.message}</td>
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
        </div>
      )}

      {/* Raw JSON Modal */}
      <RawJsonModal rawEventId={selectedRawId} onClose={() => setSelectedRawId(null)} />
    </div>
  );
}
