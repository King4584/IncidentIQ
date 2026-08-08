'use client';

import { X, RotateCcw, ShieldCheck, HelpCircle, History, Clock } from 'lucide-react';

interface VersionItem {
  id: string;
  version: number;
  title: string;
  description: string;
  confidence_score: number;
  reason_for_change?: string;
  investigator_notes?: string;
  changed_at: string;
}

interface VersionDrawerProps {
  versions: VersionItem[] | null;
  onClose: () => void;
}

export default function VersionDrawer({ versions, onClose }: VersionDrawerProps) {
  if (!versions || versions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="glass-panel bg-slate-900 border-l border-slate-800 w-full max-w-lg h-full p-6 flex flex-col space-y-4 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-slate-100">Hypothesis Version Timeline</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline list */}
        <div className="relative border-l-2 border-slate-800 ml-3 pl-5 space-y-6 flex-1 py-2">
          {versions.map((ver) => (
            <div key={ver.id} className="relative space-y-2">
              {/* Timeline Dot */}
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-slate-900" />

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded font-mono text-[10px]">
                    Version {ver.version}
                  </span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">
                    {Math.round(ver.confidence_score * 100)}% Confidence
                  </span>
                </div>

                <h4 className="font-bold text-slate-100 text-sm">{ver.title}</h4>
                <p className="text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {ver.description}
                </p>

                {ver.reason_for_change && (
                  <div className="pt-2 border-t border-slate-800 text-[11px]">
                    <span className="text-slate-500 font-semibold">Reason for Change:</span>
                    <p className="text-amber-300 font-mono">{ver.reason_for_change}</p>
                  </div>
                )}

                {ver.investigator_notes && (
                  <div className="text-[11px]">
                    <span className="text-slate-500 font-semibold">Investigator Notes:</span>
                    <p className="text-slate-300 font-mono italic">"{ver.investigator_notes}"</p>
                  </div>
                )}

                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  Recorded: {ver.changed_at?.slice(0, 19)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
