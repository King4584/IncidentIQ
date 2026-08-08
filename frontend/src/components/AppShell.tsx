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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const isLoginRoute = pathname === '/' || pathname === '/login';

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('incidentiq_user');
      const token = localStorage.getItem('incidentiq_token');

      if (!token) {
        setIsAuthenticated(false);
        if (!isLoginRoute) {
          router.replace('/');
        }
      } else {
        setIsAuthenticated(true);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (e) {
      console.error(e);
      setIsAuthenticated(false);
      if (!isLoginRoute) {
        router.replace('/');
      }
    }
  }, [pathname, isLoginRoute]);

  if (isLoginRoute) {
    return <div className="min-h-screen w-full bg-[#090d16] text-slate-100">{children}</div>;
  }

  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center text-xs text-slate-400 font-mono space-y-2">
        <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p>Redirecting to IncidentIQ AI Login...</p>
      </div>
    );
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
