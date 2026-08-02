import { create } from 'zustand';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

interface AppState {
  user: UserProfile | null;
  activeIncidentId: string | null;
  globalSearch: string;
  theme: 'dark' | 'light';
  setUser: (user: UserProfile | null) => void;
  setActiveIncidentId: (id: string | null) => void;
  setGlobalSearch: (search: string) => void;
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: {
    id: 'admin-1',
    email: 'admin@incidentiq.ai',
    full_name: 'Alex Vance (Lead SRE)',
    role: 'ADMIN',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  activeIncidentId: null,
  globalSearch: '',
  theme: 'dark',
  setUser: (user) => set({ user }),
  setActiveIncidentId: (activeIncidentId) => set({ activeIncidentId }),
  setGlobalSearch: (globalSearch) => set({ globalSearch }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}));
