import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell, ChevronDown, LogOut, Search, User as UserIcon,
  Sparkles, MapPin, Volume2, VolumeX, X, SlidersHorizontal,
  Navigation, Bus, AlertTriangle, Menu, Home, Calendar, Heart,
  Globe, HelpCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { TransitMapPlus } from '@/components/TransitMapPlus';
import { BusCardPlus } from '@/components/BusCardPlus';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  generateBusesPlus, tickBusesPlus, etaColor, clearAuth,
  fuzzySearch, ALL_STOPS,
} from '@/lib/mockData';
import type { BusPlus } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { connectSocket, disconnectSocket } from '@/lib/api';

type FilterTab = 'all' | 'low' | 'medium' | 'high';

/** Convert a raw socket session payload → BusPlus shape */
function socketSessionToBus(s: any): BusPlus {
  return {
    id: s.busId ?? s.sessionId,
    sessionId: s.sessionId,
    route: s.route ?? '',
    routeName: s.routeName ?? '',
    from: '', to: '',
    lat: s.lat ?? 16.2045,
    lng: s.lng ?? 77.3482,
    speed: s.speed ?? 0,
    heading: s.heading ?? 0,
    etaMin: 1,
    distanceKm: 0,
    crowd: (s.crowd ?? s.crowdLevel ?? 'Medium') as any,
    driver: s.driverName ?? s.driver ?? 'Driver',
    totalSeats: 50,
    occupiedSeats: 25,
    reservedSeats: 4, womenSeats: 6, seniorSeats: 4,
    stops: [],
    fare: 20,
    isLive: true,
    nextStop: undefined,
  };
}

const PassengerDashboard = () => {
  const nav = useNavigate();
  const { t } = useTranslation();
  const {
    activeBusId, setActiveBusId,
    nextStopAlertEnabled, silentMode,
    setSilentMode, setNextStopAlertEnabled,
    theme,
  } = useAppStore();

  // ── Bus data: real socket first, mock fallback ─────────────────────────
  const mockBusesRef = useRef<BusPlus[]>(generateBusesPlus());
  const [liveBuses, setLiveBuses] = useState<Record<string, BusPlus>>({}); // keyed by sessionId
  const [buses, setBuses] = useState<BusPlus[]>(() => mockBusesRef.current);
  const isLiveRef = useRef(false);

  // Connect to socket and listen for real bus events
  useEffect(() => {
    const socket = connectSocket();

    // Server sends all currently active buses on connect
    socket.on('bus:snapshot', (sessions: any[]) => {
      if (!sessions.length) return;
      isLiveRef.current = true;
      const map: Record<string, BusPlus> = {};
      sessions.forEach((s) => {
        map[s.sessionId] = socketSessionToBus(s);
      });
      setLiveBuses(map);
    });

    // Incremental location update from a driver
    socket.on('bus:update', (payload: any) => {
      isLiveRef.current = true;
      setLiveBuses((prev) => ({
        ...prev,
        [payload.sessionId]: socketSessionToBus(payload),
      }));
    });

    // A driver went offline
    socket.on('bus:offline', ({ sessionId }: { sessionId: string }) => {
      setLiveBuses((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        if (!Object.keys(next).length) isLiveRef.current = false;
        return next;
      });
    });

    return () => {
      socket.off('bus:snapshot');
      socket.off('bus:update');
      socket.off('bus:offline');
      disconnectSocket();
    };
  }, []);

  // Merge live + mock: real buses take priority, mock fill the rest
  useEffect(() => {
    const liveList = Object.values(liveBuses);
    if (liveList.length > 0) {
      // Show real buses at top + some mock buses for visual richness
      const mockFill = mockBusesRef.current.slice(0, Math.max(0, 5 - liveList.length));
      setBuses([...liveList, ...mockFill]);
    } else {
      // No live buses — use simulated mock data
      setBuses(mockBusesRef.current);
    }
  }, [liveBuses]);

  // Tick mock buses every 3s (keeps map alive even with no real drivers)
  useEffect(() => {
    const id = window.setInterval(() => {
      mockBusesRef.current = tickBusesPlus(mockBusesRef.current);
      setLiveBuses((prev) => ({ ...prev })); // trigger re-merge
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Auto-pick nearest on mount
  useEffect(() => {
    if (!activeBusId && buses.length) {
      const nearest = [...buses].sort((a, b) => a.etaMin - b.etaMin)[0];
      setActiveBusId(nearest.id);
    }
  }, [buses, activeBusId, setActiveBusId]);

  // Next stop alert simulation
  useEffect(() => {
    const alertTimer = setInterval(() => {
      if (!nextStopAlertEnabled) return;
      const activeBus = buses.find((b) => b.id === activeBusId);
      if (activeBus?.nextStop) {
        setNextStopName(activeBus.nextStop);
        setShowNextStopAlert(true);
        if (!silentMode) {
          speakAlert(`Next stop: ${activeBus.nextStop}`);
        }
        setTimeout(() => setShowNextStopAlert(false), 5000);
      }
    }, 25000); // every 25 seconds
    return () => clearInterval(alertTimer);
  }, [activeBusId, buses, nextStopAlertEnabled, silentMode]);

  const speakAlert = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      utter.pitch = 1;
      speechRef.current = utter;
      window.speechSynthesis.speak(utter);
    }
  };

  // Stop suggestions for fuzzy search
  const handleStopInput = useCallback((val: string, field: 'source' | 'dest') => {
    if (field === 'source') setSourceStop(val);
    else setDestStop(val);
    setActiveField(field);

    if (val.length > 1) {
      const matches = ALL_STOPS
        .filter((s) => s.name.toLowerCase().includes(val.toLowerCase()))
        .map((s) => s.name)
        .slice(0, 5);
      setStopSuggestions(matches);
    } else {
      setStopSuggestions([]);
    }
  }, []);

  const selectSuggestion = (name: string) => {
    if (activeField === 'source') setSourceStop(name);
    else setDestStop(name);
    setStopSuggestions([]);
    setActiveField(null);
  };

  // Filter buses
  const filtered = useMemo(() => {
    let result = fuzzySearch(query || `${sourceStop} ${destStop}`.trim(), buses)
      .sort((a, b) => a.etaMin - b.etaMin);
    if (filterTab !== 'all') {
      result = result.filter((b) => b.crowd.toLowerCase() === filterTab);
    }
    return result;
  }, [buses, query, sourceStop, destStop, filterTab]);

  const nearest = filtered[0];

  const handleLogout = () => {
    clearAuth();
    toast.success('Signed out successfully');
    nav('/login');
  };

  const FILTER_TABS: { id: FilterTab; label: string; color: string }[] = [
    { id: 'all', label: 'All', color: 'text-foreground' },
    { id: 'low', label: 'Low', color: 'text-emerald-400' },
    { id: 'medium', label: 'Medium', color: 'text-amber-400' },
    { id: 'high', label: 'High', color: 'text-orange-400' },
  ];

  return (
    <div className={cn('h-screen w-full overflow-hidden relative', theme)}>
      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <header className="absolute top-0 inset-x-0 z-[1000] p-3 sm:p-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong rounded-2xl px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3"
        >
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-9 w-9 hover:bg-white/10 shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
          <Logo size="sm" />

          {/* Search bar desktop */}
          <div className="flex-1 max-w-xl mx-auto hidden sm:block">
            <div className="relative flex items-center gap-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={() => setShowSearch(true)}
                className="pl-9 h-9 bg-white/5 border-white/10 focus-visible:ring-brand text-sm"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowSearch((v) => !v)}
                className="h-9 w-9 shrink-0 hover:bg-white/10"
                title="Advanced search"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Online status */}
            <button
              onClick={() => setOnline((v) => !v)}
              className={cn(
                'hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                online
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
              )}
            >
              <span className={cn('inline-block h-2 w-2 rounded-full', online ? 'bg-emerald-400 pulse-dot' : 'bg-red-400')} />
              {online ? t('live') : t('offline')}
            </button>

            {/* Voice toggle */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => { setSilentMode(!silentMode); toast.info(silentMode ? 'Voice alerts ON' : 'Silent mode ON'); }}
              className="h-9 w-9 hover:bg-white/10"
              title="Toggle voice alerts"
            >
              {silentMode ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
            </Button>

            <LanguageSwitcher />
            <ThemeToggle />

            <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-white/10" onClick={() => toast.info('No new alerts')}>
              <Bell className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full gradient-brand text-white hover:opacity-90">
                  <UserIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong border-white/10 w-52">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-semibold">{localStorage.getItem('vt_email') || 'Passenger'}</div>
                  <div className="text-xs text-muted-foreground">Passenger</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => { setNextStopAlertEnabled(!nextStopAlertEnabled); }}
                  className="cursor-pointer"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Stop alerts: {nextStopAlertEnabled ? 'ON' : 'OFF'}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400">
                  <LogOut className="h-4 w-4 mr-2" /> {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Mobile search */}
        <div className="sm:hidden mt-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => setShowSearch(true)}
            className="pl-9 h-10 glass-strong border-white/10 focus-visible:ring-brand text-sm"
          />
        </div>

        {/* Advanced search panel */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden mt-2"
            >
              <div className="glass-strong rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand" /> Route Search
                  </span>
                  <button onClick={() => setShowSearch(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-emerald-400" />
                    <Input
                      placeholder="From stop..."
                      value={sourceStop}
                      onChange={(e) => handleStopInput(e.target.value, 'source')}
                      onFocus={() => setActiveField('source')}
                      className="pl-8 bg-white/5 border-white/10 focus-visible:ring-brand"
                    />
                    {activeField === 'source' && stopSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 glass-strong rounded-xl border border-white/10 z-50 overflow-hidden">
                        {stopSuggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => selectSuggestion(s)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/8 flex items-center gap-2"
                          >
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-400" />
                    <Input
                      placeholder="To stop..."
                      value={destStop}
                      onChange={(e) => handleStopInput(e.target.value, 'dest')}
                      onFocus={() => setActiveField('dest')}
                      className="pl-8 bg-white/5 border-white/10 focus-visible:ring-brand"
                    />
                    {activeField === 'dest' && stopSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 glass-strong rounded-xl border border-white/10 z-50 overflow-hidden">
                        {stopSuggestions.map((s) => (
                          <button
                            key={s}
                            onClick={() => selectSuggestion(s)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/8 flex items-center gap-2"
                          >
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Search + Clear row */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={() => {
                      setStopSuggestions([]);
                      setActiveField(null);
                      setShowSearch(false);
                    }}
                    className="flex-1 h-11 gradient-brand text-white border-0 shadow-brand font-semibold gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Search className="h-4 w-4" />
                    Search Buses
                  </Button>
                  {(sourceStop || destStop) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSourceStop(''); setDestStop(''); setStopSuggestions([]); }}
                      className="h-11 px-4 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10 border border-white/10 rounded-xl"
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Clear
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── MAP ───────────────────────────────────────────────────────────── */}
      <TransitMapPlus
        buses={buses}
        activeBusId={activeBusId}
        onSelectBus={(id) => { setActiveBusId(id); }}
        className="absolute inset-0 z-0"
        showRoutePolyline={true}
      />

      {/* ── NEXT STOP ALERT POPUP ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showNextStopAlert && (
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-[1100]"
          >
            <div className="glass-strong rounded-2xl px-5 py-3.5 border border-brand/30 shadow-brand flex items-center gap-3 min-w-[280px]">
              <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                <Navigation className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('nextStopAlert')}</p>
                <p className="font-bold text-sm">{nextStopName}</p>
              </div>
              <button onClick={() => setShowNextStopAlert(false)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AI QUICK STATS FLOATING ───────────────────────────────────────── */}
      <div className="absolute top-24 right-4 z-[900] hidden lg:flex flex-col gap-2">
        {nearest && (
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong rounded-2xl p-4 w-52 border border-white/10 floating-card"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-brand" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Insight</span>
            </div>
            <p className="text-sm font-bold mb-1">{nearest.id}</p>
            <p className="text-xs text-muted-foreground mb-2">{nearest.routeName}</p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Predicted ETA</span>
                <span className={cn('font-semibold', etaColor(nearest.etaMin))}>{nearest.etaMin} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crowd forecast</span>
                <span className="font-semibold text-amber-400">{nearest.crowd}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seats left</span>
                <span className="font-semibold text-emerald-400">{nearest.totalSeats - nearest.occupiedSeats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fare</span>
                <span className="font-semibold">₹{nearest.fare}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Live count widget */}
        <motion.div
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong rounded-2xl p-3 w-52 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Live Fleet</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{buses.filter((b) => b.isLive).length}</div>
              <div className="text-[10px] text-muted-foreground">Online</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">{buses.filter((b) => b.crowd === 'High' || b.crowd === 'Full').length}</div>
              <div className="text-[10px] text-muted-foreground">Crowded</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{buses.length}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
          </div>
        </motion.div>
      </div>



      {/* ── VIEWS ───────────────────────────────────────────── */}
      {activePage === 'live' && (
        <div className="absolute inset-0 z-[800] bg-background/95 backdrop-blur-md pt-20 px-4 pb-20 sm:pb-4 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-6 pt-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2"><Bus className="h-6 w-6 text-brand" /> {t('liveBuses')}</h2>
                <p className="text-sm text-muted-foreground mt-1">{filtered.length} buses · {t('updatedEvery')}</p>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
                    filterTab === tab.id
                      ? 'gradient-brand text-white border-transparent shadow-brand'
                      : 'glass border-white/10 hover:border-white/20',
                    tab.color
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filtered.map((b) => (
                  <BusCardPlus
                    key={b.id}
                    bus={b}
                    active={activeBusId === b.id}
                    onTrack={() => { setActiveBusId(b.id); setActivePage('home'); }}
                  />
                ))}
              </AnimatePresence>
              
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground glass-strong rounded-2xl border border-white/10">
                  <Bus className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{t('noResults')}</p>
                  <p className="text-sm mt-1 opacity-60">Try a different search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {activePage === 'schedule' && (
        <div className="absolute inset-0 z-[800] bg-background/95 backdrop-blur-md pt-20 px-4 pb-20 sm:pb-4 overflow-y-auto">
          <BusScheduleView />
        </div>
      )}
      {activePage === 'favorites' && (
        <div className="absolute inset-0 z-[800] bg-background/95 backdrop-blur-md pt-20 px-4 pb-20 sm:pb-4 overflow-y-auto">
          <FavoritesView />
        </div>
      )}
      {activePage === 'alerts' && (
        <div className="absolute inset-0 z-[800] bg-background/95 backdrop-blur-md pt-20 px-4 pb-20 sm:pb-4 overflow-y-auto">
          <AlertsView />
        </div>
      )}
      {activePage === 'help' && (
        <div className="absolute inset-0 z-[800] bg-background/95 backdrop-blur-md pt-20 px-4 pb-20 sm:pb-4 overflow-y-auto">
          <HelpView />
        </div>
      )}

      {/* ── SIDEBAR OVERLAY ───────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 z-[2001] w-72 glass-strong border-r border-white/10 p-5 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <Logo size="sm" />
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8 rounded-full hover:bg-white/10">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto pr-2">
                {[
                  { id: 'home', label: 'Home', icon: Home },
                  { id: 'live', label: 'Live Buses', icon: Bus },
                  { id: 'schedule', label: 'Bus Schedule', icon: Calendar },
                  { id: 'favorites', label: 'Favorite Routes', icon: Heart },
                  { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
                  { id: 'lang', label: 'Language Settings', icon: Globe },
                  { id: 'help', label: 'Help & Support', icon: HelpCircle },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'home') setActivePage('home');
                      else if (['live', 'schedule', 'favorites', 'alerts', 'help'].includes(item.id)) setActivePage(item.id as any);
                      else if (item.id === 'lang') toast.info('Use the language toggle in the top bar');
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      (item.id === activePage || (activePage === 'home' && item.id === 'live'))
                        ? "gradient-brand text-white shadow-brand"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-white/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── BOTTOM NAVIGATION MENU BAR (MOBILE) ───────────────────────── */}
      <div className="sm:hidden absolute bottom-0 inset-x-0 z-[1200] glass-strong border-t border-white/10 flex items-center justify-around h-16 pb-safe bg-background/80 backdrop-blur-xl">
        {[
          { id: 'home', icon: Home, label: 'Home' },
          { id: 'live', icon: Bus, label: 'Buses' },
          { id: 'schedule', icon: Calendar, label: 'Schedule' },
          { id: 'favorites', icon: Heart, label: 'Favorites' },
          { id: 'alerts', icon: Bell, label: 'Alerts' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id as any)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full",
              activePage === item.id || (item.id === 'home' && activePage === 'home') 
                ? "text-brand" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5", activePage === item.id && "fill-brand/20")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const BusScheduleView = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    fetch('http://localhost:5000/api/schedules')
      .then(r => r.json())
      .then(data => Array.isArray(data) ? setSchedules(data) : [])
      .catch(e => console.error(e));
  }, []);

  // Use dummy schedules if empty (for demo)
  const displaySchedules = schedules.length > 0 ? schedules : [
    { id: '1', busNumber: 'BUS-4201', routeName: 'Wardha Rd Exp', type: 'Express', timeOfDay: 'Morning', departureTime: '08:00 AM', arrivalTime: '09:30 AM', fare: 40, duration: '1h 30m', status: 'On Time' },
    { id: '2', busNumber: 'BUS-1702', routeName: 'Civil Lines Local', type: 'Local', timeOfDay: 'Afternoon', departureTime: '02:15 PM', arrivalTime: '03:00 PM', fare: 20, duration: '45m', status: 'Delayed' },
  ];

  const filtered = displaySchedules.filter(s => {
    const matchSearch = s.busNumber.toLowerCase().includes(search.toLowerCase()) || s.routeName.toLowerCase().includes(search.toLowerCase());
    const matchTime = timeFilter === 'All' || s.timeOfDay === timeFilter;
    const matchType = typeFilter === 'All' || s.type === typeFilter;
    return matchSearch && matchTime && matchType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6 text-brand" /> Full Bus Schedule</h2>
          <p className="text-sm text-muted-foreground mt-1">View, search and filter all upcoming bus timings.</p>
        </div>
      </div>

      <div className="glass-strong rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between border border-white/10">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search route or bus number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white/5 border-white/10" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            {['All', 'Morning', 'Afternoon', 'Night'].map(t => (
              <button key={t} onClick={() => setTimeFilter(t)} className={cn('px-3 py-1.5 rounded-md text-xs font-medium', timeFilter === t ? 'bg-white/10 text-white' : 'text-muted-foreground')}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            {['All', 'Express', 'Local'].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-3 py-1.5 rounded-md text-xs font-medium', typeFilter === t ? 'bg-white/10 text-white' : 'text-muted-foreground')}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => (
          <div key={s.id} className="glass-strong rounded-2xl p-5 border border-white/10 flex flex-col gap-4 hover:border-brand/50 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-white/10 text-xs font-bold font-mono">{s.busNumber}</span>
                <span className={cn('px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider', s.type === 'Express' ? 'bg-orange-500/20 text-orange-400' : 'bg-sky-500/20 text-sky-400')}>{s.type}</span>
              </div>
              <span className={cn('flex items-center gap-1.5 text-xs font-medium', s.status === 'On Time' ? 'text-emerald-400' : s.status === 'Delayed' ? 'text-red-400' : 'text-amber-400')}>
                <span className={cn('h-1.5 w-1.5 rounded-full', s.status === 'On Time' ? 'bg-emerald-400' : s.status === 'Delayed' ? 'bg-red-400' : 'bg-amber-400')} />
                {s.status}
              </span>
            </div>
            
            <div>
              <h3 className="font-bold text-lg leading-tight">{s.routeName}</h3>
              <div className="flex items-center justify-between mt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Departure</p>
                  <p className="font-semibold text-sm">{s.departureTime}</p>
                </div>
                <div className="flex-1 flex flex-col items-center px-4">
                  <span className="text-[10px] text-muted-foreground">{s.duration}</span>
                  <div className="w-full h-px bg-white/20 relative my-1">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(255,100,0,0.8)]" />
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">₹{s.fare}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Arrival</p>
                  <p className="font-semibold text-sm">{s.arrivalTime}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-white/10">
              <Button className="w-full gradient-brand text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity">
                Track Bus
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FavoritesView = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-6">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Heart className="h-6 w-6 text-brand fill-brand/20" /> Favorite Routes</h2>
          <p className="text-sm text-muted-foreground mt-1">Your frequently tracked routes for quick access.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { id: '1', route: 'Wardha Rd Exp', stops: 'Sitabuldi - Airport', duration: '45m' },
          { id: '2', route: 'Civil Lines Local', stops: 'High Court - Sadar', duration: '20m' },
        ].map(fav => (
          <div key={fav.id} className="glass-strong rounded-2xl p-5 border border-white/10 flex flex-col gap-4 hover:border-brand/50 transition-colors group">
             <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">{fav.route}</h3>
                <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-md">{fav.duration}</span>
             </div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {fav.stops}
             </div>
             <Button className="w-full mt-2 gradient-brand text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity">Track Now</Button>
          </div>
        ))}
        <button className="glass rounded-2xl p-5 border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-white/40 transition-colors h-40">
           <Heart className="h-8 w-8 opacity-50" />
           <span className="font-medium text-sm">Add New Favorite</span>
        </button>
      </div>
    </div>
  );
};

const AlertsView = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-6">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-brand fill-brand/20" /> Notifications & Alerts</h2>
          <p className="text-sm text-muted-foreground mt-1">Stay updated with route changes and system alerts.</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10">Mark all as read</Button>
      </div>
      <div className="space-y-4 max-w-3xl">
        <div className="glass-strong rounded-2xl p-5 border border-red-500/30 flex items-start gap-4">
           <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
             <AlertTriangle className="h-5 w-5 text-red-400" />
           </div>
           <div className="flex-1">
             <div className="flex justify-between items-start">
               <h3 className="font-bold text-foreground">Heavy Traffic on Wardha Rd</h3>
               <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">10 mins ago</span>
             </div>
             <p className="text-sm text-muted-foreground mt-1">Expect delays up to 15 mins for all buses on the Wardha Road route due to construction work.</p>
           </div>
        </div>
        <div className="glass-strong rounded-2xl p-5 border border-emerald-500/30 flex items-start gap-4">
           <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
             <Bus className="h-5 w-5 text-emerald-400" />
           </div>
           <div className="flex-1">
             <div className="flex justify-between items-start">
               <h3 className="font-bold text-foreground">New Route Added: MIHAN Direct</h3>
               <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">2 hours ago</span>
             </div>
             <p className="text-sm text-muted-foreground mt-1">Direct air-conditioned bus service from Sitabuldi to MIHAN is now active. Check the schedule for timings.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const HelpView = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-6">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><HelpCircle className="h-6 w-6 text-brand" /> Help & Support</h2>
          <p className="text-sm text-muted-foreground mt-1">Find answers to common questions or contact support.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <div className="glass-strong rounded-2xl p-6 border border-white/10 space-y-4">
          <h3 className="font-bold text-lg border-b border-white/10 pb-3">Frequently Asked Questions</h3>
          <div className="space-y-3">
            <details className="glass p-3 rounded-xl border border-white/5 cursor-pointer group">
              <summary className="font-medium outline-none flex justify-between items-center">
                How do I track a bus?
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-white/5">Go to the Home tab and search for your bus or destination stop. Select a bus from the map or list to view its real-time location and ETA.</p>
            </details>
            <details className="glass p-3 rounded-xl border border-white/5 cursor-pointer group">
              <summary className="font-medium outline-none flex justify-between items-center">
                How accurate are the ETAs?
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-white/5">Our ETAs are powered by real-time GPS data and AI traffic analysis. They are typically accurate within 1-2 minutes depending on network connectivity.</p>
            </details>
            <details className="glass p-3 rounded-xl border border-white/5 cursor-pointer group">
              <summary className="font-medium outline-none flex justify-between items-center">
                How do I enable voice alerts?
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-white/5">Click on the Volume/Speaker icon in the top right corner of the Home screen to toggle voice announcements for approaching stops.</p>
            </details>
          </div>
        </div>
        <div className="space-y-6">
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-lg mb-2">Need direct assistance?</h3>
            <p className="text-sm text-muted-foreground mb-4">Our support team is available 24/7 to help you with any issues.</p>
            <div className="space-y-3">
              <Button className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 text-foreground border border-white/10">
                <Globe className="h-4 w-4 text-brand" /> Visit Help Center
              </Button>
              <Button className="w-full justify-start gap-3 bg-white/5 hover:bg-white/10 text-foreground border border-white/10">
                <Bell className="h-4 w-4 text-brand" /> Report an Issue
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerDashboard;
