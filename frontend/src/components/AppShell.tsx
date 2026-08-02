'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { useAppStore } from '@/lib/store';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser } = useAppStore();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('incidentiq_user');
      const token = localStorage.getItem('incidentiq_token');

      if (pathname !== '/login' && !token) {
        // Redirect to login if unauthenticated on protected routes
        router.push('/login');
      } else if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuthChecked(true);
    }
  }, [pathname]);

  if (pathname === '/login') {
    return <div className="min-h-screen w-full bg-[#090d16] text-slate-100">{children}</div>;
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-xs text-slate-400 font-mono">Authenticating IncidentIQ AI Control Room...</div>;
  }

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
