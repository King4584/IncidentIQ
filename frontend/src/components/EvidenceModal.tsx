'use client';

import { useState } from 'react';
import { X, ExternalLink, ShieldCheck, Database } from 'lucide-react';
import RawJsonModal from '@/components/RawJsonModal';

interface EvidenceItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  confidence: number;
  source: string;
  timestamp?: string;
  raw_event_id?: string;
  normalized_event_id?: string;
}

interface EvidenceModalProps {
  evidence: EvidenceItem | null;
  onClose: () => void;
}

export default function EvidenceModal({ evidence, onClose }: EvidenceModalProps) {
  const [activeRawId, setActiveRawId] = useState<string | null>(null);

  if (!evidence) return null;

  const targetRawId = evidence.raw_event_id || evidence.normalized_event_id || evidence.id;

  const getTierBadge = (cat: string) => {
    switch (cat) {
      case 'CONFIRMED_EVIDENCE':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Confirmed Evidence</span>;
      case 'OBSERVED_FACT':
        return <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Observed Fact</span>;
      case 'INFERENCE':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Inference</span>;
      case 'ASSUMPTION':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Assumption</span>;
      case 'HYPOTHESIS':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Hypothesis</span>;
      default:
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Confirmed Root Cause</span>;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="glass-panel bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                {getTierBadge(evidence.category)}
                <span className="text-xs text-slate-400 font-mono">Confidence: {Math.round((evidence.confidence || 1) * 100)}%</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100">{evidence.title}</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Evidence Summary</h4>
              <p className="text-sm text-slate-200 bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono leading-relaxed">
                {evidence.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-medium">Source Provider</span>
                <p className="font-semibold text-slate-200 mt-0.5">{evidence.source}</p>
              </div>
              <div className="bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-medium">Timestamp</span>
                <p className="font-semibold text-slate-200 mt-0.5">{evidence.timestamp?.slice(0, 19) || 'N/A'}</p>
              </div>
            </div>

            {/* Immutable Raw JSONB Link */}
            <div className="bg-cyan-950/20 border border-cyan-500/30 p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <Database className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="font-semibold text-cyan-200">Immutable Raw Payload Preserved</p>
                  <p className="text-[11px] text-cyan-400/80">Stored in PostgreSQL JSONB</p>
                </div>
              </div>
              <button
                onClick={() => setActiveRawId(targetRawId)}
                className="flex items-center space-x-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-lg font-medium border border-cyan-500/40"
              >
                <span>View Raw JSON</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Raw JSON Modal */}
      {activeRawId && (
        <RawJsonModal rawEventId={activeRawId} onClose={() => setActiveRawId(null)} />
      )}
    </>
  );
}
