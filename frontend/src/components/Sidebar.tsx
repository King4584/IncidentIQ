'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Activity, 
  UploadCloud, 
  AlertTriangle, 
  Clock, 
  BrainCircuit, 
  CheckCircle2, 
  FileText, 
  ShieldAlert, 
  BarChart3, 
  Settings,
  Sparkles,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Activity },
  { name: 'Event Ingestion', href: '/ingestion', icon: UploadCloud },
  { name: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { name: 'Timeline Explorer', href: '/timeline', icon: Clock },
  { name: 'AI Hypotheses', href: '/hypotheses', icon: BrainCircuit },
  { name: 'Root Cause & Mitigations', href: '/root-cause', icon: CheckCircle2 },
  { name: 'Incident Reports', href: '/reports', icon: FileText },
  { name: 'Audit Trail', href: '/audit', icon: ShieldAlert },
  { name: 'SRE Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings & Profile', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppStore();

  const handleLogout = () => {
    localStorage.removeItem('incidentiq_token');
    localStorage.removeItem('incidentiq_user');
    router.push('/login');
  };

  const activeUser = user || {
    full_name: 'Alex Vance (Lead SRE)',
    email: 'admin@incidentiq.ai',
    role: 'ADMIN',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  };

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col h-screen sticky top-0 z-40">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              INCIDENTIQ <span className="text-cyan-400 font-mono text-xs ml-1 border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 rounded">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Evidence-Backed Agent</p>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logged-In User Profile Footer */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <img
              src={activeUser.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-cyan-500/40 object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{activeUser.full_name}</p>
              <span className="inline-block text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1 py-0.2 rounded uppercase font-mono">
                {activeUser.role || 'ADMIN'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout of IncidentIQ AI"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
