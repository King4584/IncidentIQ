'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Search, Bell, User, Sun, Moon, Sparkles, ChevronDown, LogOut, Key, Shield, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Topbar() {
  const router = useRouter();
  const { globalSearch, setGlobalSearch } = useAppStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('incidentiq_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser({
          full_name: 'Alex Vance (Lead SRE)',
          email: 'admin@incidentiq.ai',
          role: 'ADMIN',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('incidentiq_token');
    localStorage.removeItem('incidentiq_user');
    setShowProfileMenu(false);
    router.push('/');
  };

  const mockNotifs = [
    { id: 1, title: 'AI Hypothesis Updated', time: '5m ago', type: 'CONFIRMED' },
    { id: 2, title: 'Missing Telemetry Request', time: '12m ago', type: 'WARNING' },
    { id: 3, title: 'New Raw Events Ingested', time: '25m ago', type: 'INFO' }
  ];

  return (
    <header className="h-16 glass-panel border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Global Search Bar */}
      <div className="flex items-center space-x-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Global Search (Incidents, Evidence, Logs, Hypotheses)..."
            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Quick Trigger AI Agent */}
        <Link
          href="/incidents"
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Run AI Agent</span>
        </Link>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-cyan-500 absolute top-1.5 right-1.5 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-cyan-500 absolute top-1.5 right-1.5" />
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 glass-panel bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 space-y-2 z-50">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-semibold text-xs text-slate-200">Notifications</h4>
                <span className="text-[10px] text-cyan-400 font-mono">3 Unread</span>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {mockNotifs.map((n) => (
                  <div key={n.id} className="p-2 rounded bg-slate-800/40 hover:bg-slate-800 text-xs">
                    <p className="font-medium text-slate-200">{n.title}</p>
                    <p className="text-[10px] text-slate-400">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <img
              src={currentUser?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt="Avatar"
              className="w-7 h-7 rounded-full border border-cyan-500/40 object-cover"
            />
            <span className="text-xs font-semibold text-slate-200 hidden md:inline">{currentUser?.full_name?.split(' ')[0]}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 glass-panel bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 space-y-1 z-50">
              <div className="p-2 border-b border-slate-800">
                <p className="font-semibold text-xs text-slate-100">{currentUser?.full_name}</p>
                <p className="text-[11px] text-slate-400 font-mono truncate">{currentUser?.email}</p>
                <span className="mt-1 inline-block text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded uppercase font-bold">
                  {currentUser?.role || 'ADMIN'}
                </span>
              </div>
              <Link href="/settings" className="flex items-center space-x-2 px-2.5 py-2 rounded text-xs text-slate-300 hover:bg-slate-800">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>View Profile</span>
              </Link>
              <Link href="/settings" className="flex items-center space-x-2 px-2.5 py-2 rounded text-xs text-slate-300 hover:bg-slate-800">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>API Keys & Security</span>
              </Link>
              <Link href="/" className="flex items-center space-x-2 px-2.5 py-2 rounded text-xs text-slate-300 hover:bg-slate-800">
                <LogIn className="w-3.5 h-3.5 text-slate-400" />
                <span>Switch Account</span>
              </Link>
              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-2.5 py-2 rounded text-xs text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
