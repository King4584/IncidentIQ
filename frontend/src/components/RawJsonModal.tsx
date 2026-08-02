'use client';

import { useState, useEffect } from 'react';
import { X, Database, Copy, Check, FileCode } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface RawJsonModalProps {
  rawEventId: string | null;
  onClose: () => void;
}

export default function RawJsonModal({ rawEventId, onClose }: RawJsonModalProps) {
  const [rawEvent, setRawEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!rawEventId) return;
    async function loadRaw() {
      setLoading(true);
      try {
        const data = await fetchApi<any>(`/ingestion/raw/${rawEventId}`);
        setRawEvent(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRaw();
  }, [rawEventId]);

  if (!rawEventId) return null;

  const jsonString = rawEvent ? JSON.stringify(rawEvent.original_payload || rawEvent, null, 2) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Immutable Raw Payload (PostgreSQL JSONB)</h3>
              <p className="text-[11px] text-slate-400 font-mono">Raw Evidence ID: {rawEventId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">Fetching raw evidence payload from PostgreSQL...</div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3">
            {rawEvent && (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Source Provider:</span>
                  <p className="font-semibold text-cyan-300">{rawEvent.source}</p>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500">Ingested At:</span>
                  <p className="font-semibold text-slate-300">{rawEvent.ingested_at?.slice(0, 19)}</p>
                </div>
              </div>
            )}

            <div className="relative">
              <div className="flex items-center justify-between bg-slate-950 px-4 py-2 border-t border-x border-slate-800 rounded-t-xl text-xs font-mono text-slate-400">
                <span className="flex items-center text-slate-300">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400 mr-1.5" /> original_payload.json
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 text-[11px] text-cyan-400 hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="bg-slate-950/90 p-4 rounded-b-xl border border-slate-800 text-cyan-300 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
                {jsonString}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
