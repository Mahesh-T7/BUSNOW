import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'dark' | 'light';
export type Language = 'en' | 'hi' | 'kn' | 'te' | 'ta';
export type CrowdLevel = 'Low' | 'Medium' | 'High' | 'Full';

export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  etaMin?: number;
  reached?: boolean;
}

export interface RouteInfo {
  id: string;
  number: string;
  name: string;
  from: string;
  to: string;
  stops: BusStop[];
  distanceKm: number;
  durationMin: number;
  fare: number;
  peakFare: number;
}

export interface BusPlus {
  id: string;
  route: string;
  routeName: string;
  from: string;
  to: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  etaMin: number;
  distanceKm: number;
  crowd: CrowdLevel;
  driver: string;
  totalSeats: number;
  occupiedSeats: number;
  reservedSeats: number;
  womenSeats: number;
  seniorSeats: number;
  stops: BusStop[];
  fare: number;
  isLive: boolean;
  nextStop?: string;
}

export interface SOSAlert {
  id: string;
  busId: string;
  driverName: string;
  lat: number;
  lng: number;
  timestamp: Date;
  type: 'panic' | 'accident' | 'breakdown' | 'medical';
  resolved: boolean;
}

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;

  // Language
  language: Language;
  setLanguage: (l: Language) => void;

  // Search
  searchQuery: string;
  sourceStop: string;
  destStop: string;
  setSearchQuery: (q: string) => void;
  setSourceStop: (s: string) => void;
  setDestStop: (s: string) => void;

  // Buses
  buses: BusPlus[];
  setBuses: (buses: BusPlus[]) => void;
  updateBus: (id: string, partial: Partial<BusPlus>) => void;

  // Active bus tracking
  activeBusId: string | null;
  setActiveBusId: (id: string | null) => void;

  // Next stop alerts
  nextStopAlertEnabled: boolean;
  silentMode: boolean;
  setNextStopAlertEnabled: (v: boolean) => void;
  setSilentMode: (v: boolean) => void;

  // SOS
  sosAlerts: SOSAlert[];
  addSOSAlert: (alert: SOSAlert) => void;
  resolveSOSAlert: (id: string) => void;

  // Routes
  routes: RouteInfo[];
  setRoutes: (routes: RouteInfo[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      language: 'en',
      setLanguage: (l) => set({ language: l }),

      searchQuery: '',
      sourceStop: '',
      destStop: '',
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSourceStop: (s) => set({ sourceStop: s }),
      setDestStop: (s) => set({ destStop: s }),

      buses: [],
      setBuses: (buses) => set({ buses }),
      updateBus: (id, partial) =>
        set((s) => ({
          buses: s.buses.map((b) => (b.id === id ? { ...b, ...partial } : b)),
        })),

      activeBusId: null,
      setActiveBusId: (id) => set({ activeBusId: id }),

      nextStopAlertEnabled: true,
      silentMode: false,
      setNextStopAlertEnabled: (v) => set({ nextStopAlertEnabled: v }),
      setSilentMode: (v) => set({ silentMode: v }),

      sosAlerts: [],
      addSOSAlert: (alert) =>
        set((s) => ({ sosAlerts: [alert, ...s.sosAlerts].slice(0, 50) })),
      resolveSOSAlert: (id) =>
        set((s) => ({
          sosAlerts: s.sosAlerts.map((a) => (a.id === id ? { ...a, resolved: true } : a)),
        })),

      routes: [],
      setRoutes: (routes) => set({ routes }),
    }),
    {
      name: 'busnow-store',
      partialize: (s) => ({
        theme: s.theme,
        language: s.language,
        nextStopAlertEnabled: s.nextStopAlertEnabled,
        silentMode: s.silentMode,
      }),
    }
  )
);
