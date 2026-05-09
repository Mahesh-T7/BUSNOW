import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TransitMapPlus } from '@/components/TransitMapPlus';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Activity, AlertTriangle, Gauge, LogOut, MapPin, Navigation,
  Pause, Play, Satellite, Wifi, WifiOff, Clock, Users, Zap, Radio,
  PhoneCall, ShieldAlert, BarChart3, Calendar, Download, FileText
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { cn } from '@/lib/utils';
import { clearAuth, generateBusesPlus } from '@/lib/mockData';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import type { BusPlus } from '@/store/useAppStore';

const ROUTES_LIST = [
  { value: 'r42', label: '42 · Raichur → Sindhanur' },
  { value: 'r17', label: '17 · Station → Gunj' },
  { value: 'r08', label: '08 · Raichur → Shaktinagar' },
  { value: 'r23', label: '23 · Raichur → Mantralayam' },
  { value: 'r55', label: '55 · Raichur → Lingsugur' },
  { value: 'r31', label: '31 · Manvi → Kavital' },
  { value: 'r09', label: '09 · Sindhanur → Maski' },
  { value: 'r12', label: '12 · Raichur → Devadurga' },
];

const DriverDashboard = () => {
  const nav = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme } = useAppStore();

  const [busId, setBusId] = useState('BUS-4201');
  const [selectedRoute, setSelectedRoute] = useState('r42');
  const [crowd, setCrowd] = useState('Medium');
  const [sharing, setSharing] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [duration, setDuration] = useState(0);
  const [connected, setConnected] = useState(true);
  const [gpsSignal, setGpsSignal] = useState(4);
  const [currentLat, setCurrentLat] = useState(16.2045);
  const [currentLng, setCurrentLng] = useState(77.3482);
  const [heading, setHeading] = useState(45);
  const [sosActive, setSosActive] = useState(false);
  const [showSosMenu, setShowSosMenu] = useState(false);
  const [mapBuses, setMapBuses] = useState<BusPlus[]>([]);
  const [activeTab, setActiveTab] = useState<'console' | 'analytics' | 'duty'>('console');
  const tick = useRef<number | null>(null);

  useEffect(() => {
    // Generate mock buses for map
    setMapBuses(generateBusesPlus());
  }, []);

  useEffect(() => {
    if (sharing) {
      tick.current = window.setInterval(() => {
        const newSpeed = Math.max(0, Math.round(20 + Math.random() * 35));
        setSpeed(newSpeed);
        setAccuracy(+(2 + Math.random() * 4).toFixed(1));
        setDuration((d) => d + 1);
        setHeading((h) => (h + Math.round((Math.random() - 0.5) * 20) + 360) % 360);
        setCurrentLat((l) => l + (Math.random() - 0.5) * 0.0005);
        setCurrentLng((l) => l + (Math.random() - 0.5) * 0.0005);
        setGpsSignal(Math.round(2 + Math.random() * 2));

        if (Math.random() < 0.02) {
          setConnected(false);
          setTimeout(() => setConnected(true), 1500);
        }
      }, 1000);
    } else {
      setSpeed(0); setAccuracy(0); setGpsSignal(4);
    }
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [sharing]);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60); const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  const handleLogout = () => { clearAuth(); nav('/login'); };

  const toggle = () => {
    setSharing((v) => {
      if (!v) {
        toast.success('Location sharing started', { description: `${busId} is now live` });
        setDuration(0);
      } else {
        toast.info('Location sharing stopped');
      }
      return !v;
    });
  };

  const handleSOS = (type: string) => {
    setSosActive(true);
    setShowSosMenu(false);
    toast.error(`🚨 SOS Alert — ${type}`, {
      description: 'Emergency services have been notified',
      duration: 8000,
    });
    // Speak alert
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(`Emergency SOS activated. ${type} reported.`);
      window.speechSynthesis.speak(utter);
    }
  };

  const routeLabel = ROUTES_LIST.find((r) => r.value === selectedRoute)?.label ?? '';

  const gpsColor = gpsSignal >= 4 ? 'text-emerald-400' : gpsSignal >= 2 ? 'text-amber-400' : 'text-red-400';

  // Build live map bus for this driver
  const driverBus: BusPlus = {
    id: busId,
    route: selectedRoute.replace('r', ''),
    routeName: routeLabel,
    from: '', to: '',
    lat: currentLat, lng: currentLng,
    speed, heading,
    etaMin: 0, distanceKm: 0,
    crowd: crowd as any,
    driver: localStorage.getItem('vt_email') ?? 'Driver',
    totalSeats: 50, occupiedSeats: 20,
    reservedSeats: 4, womenSeats: 6, seniorSeats: 4,
    stops: [], fare: 15, isLive: sharing,
    nextStop: 'Next Stop',
  };

  const allMapBuses = sharing ? [...mapBuses.slice(0, 5), driverBus] : mapBuses.slice(0, 5);

  return (
    <div className={cn('min-h-screen', theme)}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between mb-6"
        >
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" onClick={handleLogout} className="hover:bg-white/10 gap-1.5">
              <LogOut className="h-4 w-4" /> {t('signOut')}
            </Button>
          </div>
        </motion.header>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
          {[
            { id: 'console', label: 'Console', icon: Activity },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'duty', label: 'Duty & Schedule', icon: Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border',
                activeTab === tab.id ? 'gradient-brand text-white border-transparent shadow-brand' : 'glass border-white/10 text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'console' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Controls */}
          <div className="space-y-5">
            {/* Console form */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong rounded-3xl p-6 sm:p-8 border border-white/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                  <Radio className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{t('driverConsole')}</h1>
                  <p className="text-sm text-muted-foreground">Configure shift & start sharing</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t('busId')}</Label>
                  <Input
                    value={busId}
                    onChange={(e) => setBusId(e.target.value)}
                    disabled={sharing}
                    className="h-11 bg-white/5 border-white/10 focus-visible:ring-brand font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Route</Label>
                  <Select value={selectedRoute} onValueChange={setSelectedRoute} disabled={sharing}>
                    <SelectTrigger className="h-11 bg-white/5 border-white/10 focus:ring-brand">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-white/10">
                      {ROUTES_LIST.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Crowd Level</Label>
                  <Select value={crowd} onValueChange={setCrowd} disabled={sharing}>
                    <SelectTrigger className="h-11 bg-white/5 border-white/10 focus:ring-brand">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass-strong border-white/10">
                      <SelectItem value="Low">🟢 Low — plenty of seats</SelectItem>
                      <SelectItem value="Medium">🟡 Medium — some seats</SelectItem>
                      <SelectItem value="High">🟠 High — standing room only</SelectItem>
                      <SelectItem value="Full">🔴 Full — no seats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.section>

            {/* Big toggle button */}
            <motion.button
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onClick={toggle}
              className={cn(
                'relative w-full rounded-3xl p-7 font-bold text-xl text-white transition-all duration-300 overflow-hidden',
                sharing
                  ? 'bg-red-600/90 hover:bg-red-600 shadow-[0_10px_40px_-10px_hsla(0,84%,60%,0.7)]'
                  : 'gradient-brand shadow-brand hover:scale-[1.01]'
              )}
            >
              {sharing && (
                <span className="absolute inset-0 rounded-3xl border-2 border-white/20 animate-ping pointer-events-none" />
              )}
              <span className="relative flex items-center justify-center gap-3">
                {sharing ? <><Pause className="h-7 w-7" /> {t('stopSharing')}</> : <><Play className="h-7 w-7" /> {t('startSharing')}</>}
              </span>
            </motion.button>

            {sharing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground"
              >
                {t('sharingFor')} <span className="text-foreground font-semibold">{fmtTime(duration)}</span> · {busId}
              </motion.p>
            )}

            {/* Stats grid */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              <StatCard
                label="Status"
                value={sharing ? 'LIVE' : 'Stopped'}
                icon={<Activity className={cn('h-5 w-5', sharing ? 'text-emerald-400' : 'text-muted-foreground')} />}
                accent={sharing}
                highlight={sharing ? 'emerald' : undefined}
              />
              <StatCard label={t('speed')} value={`${speed}`} unit="km/h" icon={<Gauge className="h-5 w-5 text-brand" />} />
              <StatCard label="GPS Accuracy" value={`±${accuracy || 0}`} unit="m"
                icon={<Satellite className={cn('h-5 w-5', gpsColor)} />}
              />
              <StatCard
                label="Connection"
                value={connected ? 'Stable' : 'Reconnecting'}
                icon={connected
                  ? <Wifi className="h-5 w-5 text-emerald-400" />
                  : <WifiOff className="h-5 w-5 text-amber-400 animate-pulse" />}
              />
            </motion.section>

            {/* GPS Signal bars */}
            {sharing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-4 flex items-center gap-4"
              >
                <MapPin className="h-4 w-4 text-brand" />
                <div className="flex-1 text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">GPS: </span>
                  {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
                </div>
                <div className="flex items-end gap-0.5">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      style={{ height: `${bar * 5 + 4}px` }}
                      className={cn(
                        'w-2 rounded-sm transition-all',
                        bar <= gpsSignal ? 'bg-emerald-400' : 'bg-white/15'
                      )}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* SOS Panel */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={cn(
                'rounded-2xl border p-4',
                sosActive
                  ? 'bg-red-500/10 border-red-500/40 animate-pulse'
                  : 'glass-strong border-white/10'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={cn('h-5 w-5', sosActive ? 'text-red-400' : 'text-muted-foreground')} />
                  <span className="font-semibold text-sm">Emergency SOS</span>
                  {sosActive && (
                    <span className="text-xs text-red-400 font-bold animate-pulse">ACTIVE</span>
                  )}
                </div>
                {sosActive && (
                  <Button size="sm" variant="ghost" onClick={() => setSosActive(false)} className="text-xs">
                    Resolve
                  </Button>
                )}
              </div>

              {!sosActive ? (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Panic Alert', icon: AlertTriangle, type: 'Panic' },
                    { label: 'Medical Emergency', icon: PhoneCall, type: 'Medical' },
                    { label: 'Accident', icon: ShieldAlert, type: 'Accident' },
                    { label: 'Breakdown', icon: Zap, type: 'Breakdown' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleSOS(item.type)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium transition-all"
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-400">🚨 Emergency services notified. Stay calm.</p>
              )}
            </motion.div>
          </div>

          {/* Right: Live Map */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div className="glass-strong rounded-3xl overflow-hidden border border-white/10">
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-brand" />
                    Live Position
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {sharing ? `Streaming at ${speed} km/h heading ${heading}°` : 'Start sharing to go live'}
                  </p>
                </div>
                {sharing && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
                    LIVE
                  </span>
                )}
              </div>
              <TransitMapPlus
                buses={allMapBuses}
                activeBusId={sharing ? busId : undefined}
                showUser={true}
                className="h-[380px]"
                showRoutePolyline={false}
              />
            </div>

            {/* Trip stats (when sharing) */}
            <AnimatePresence>
              {sharing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-3 gap-3"
                >
                  {[
                    { icon: Clock, label: 'Duration', value: fmtTime(duration) },
                    { icon: Navigation, label: 'Heading', value: `${heading}°` },
                    { icon: Users, label: 'Crowd', value: crowd },
                  ].map((item) => (
                    <div key={item.label} className="glass-strong rounded-2xl p-4 text-center border border-white/10">
                      <item.icon className="h-4 w-4 text-brand mx-auto mb-2" />
                      <div className="text-lg font-bold">{item.value}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        )}

        {activeTab === 'analytics' && <DriverAnalyticsView />}
        {activeTab === 'duty' && <DriverDutyView />}
      </div>
    </div>
  );
};

const DriverAnalyticsView = () => {
  const weeklyData = [
    { day: 'Mon', hours: 8, trips: 5 },
    { day: 'Tue', hours: 7.5, trips: 4 },
    { day: 'Wed', hours: 8.5, trips: 6 },
    { day: 'Thu', hours: 0, trips: 0 },
    { day: 'Fri', hours: 8, trips: 5 },
    { day: 'Sat', hours: 9, trips: 7 },
    { day: 'Sun', hours: 6, trips: 3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Hours" value="164h" unit="this month" icon={<Clock className="h-5 w-5 text-brand" />} />
        <StatCard label="Completed Trips" value="86" unit="this month" icon={<Navigation className="h-5 w-5 text-sky-400" />} />
        <StatCard label="Duty Days" value="21" unit="/ 26 days" icon={<Calendar className="h-5 w-5 text-emerald-400" />} />
        <StatCard label="Avg Trip Time" value="1h 15m" icon={<Activity className="h-5 w-5 text-amber-400" />} />
      </div>

      <div className="glass-strong rounded-2xl p-6 border border-white/10">
        <div className="mb-4">
          <h3 className="font-bold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-brand" /> Weekly Working Hours</h3>
          <p className="text-xs text-muted-foreground">Hours logged per day this week.</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.06)" />
            <XAxis dataKey="day" stroke="hsl(200 12% 60%)" fontSize={12} />
            <YAxis stroke="hsl(200 12% 60%)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'hsla(222,40%,9%,0.95)', border: '1px solid hsla(0,0%,100%,0.1)', borderRadius: 12 }} />
            <Bar dataKey="hours" fill="hsl(16,100%,60%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const DriverDutyView = () => {
  const handleDownload = (format: 'pdf' | 'csv') => {
    toast.info(`Generating ${format.toUpperCase()} report...`);
    setTimeout(() => {
      const data = "Date,Shift,Route,Trips,Hours\n2023-10-01,Morning,42,4,8\n2023-10-02,Morning,42,5,8";
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `duty_report.${format}`;
      a.click();
      toast.success(`${format.toUpperCase()} downloaded`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6 text-brand" /> Duty & Schedule</h2>
          <p className="text-xs text-muted-foreground mt-1">View your assigned routes and upcoming shifts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleDownload('csv')} className="border-white/10 hover:bg-white/5"><FileText className="h-4 w-4 mr-2" /> Export CSV</Button>
          <Button variant="outline" onClick={() => handleDownload('pdf')} className="border-white/10 hover:bg-white/5"><Download className="h-4 w-4 mr-2" /> Export PDF</Button>
        </div>
      </div>

      <div className="glass-strong rounded-2xl overflow-hidden border border-white/10 p-6">
        <h3 className="font-bold mb-4">Upcoming Duties</h3>
        <div className="space-y-3">
          {[
            { date: 'Tomorrow, Oct 12', shift: 'Morning (06:00 AM - 02:00 PM)', route: '42 · Wardha Rd Exp', status: 'Assigned' },
            { date: 'Friday, Oct 13', shift: 'Morning (06:00 AM - 02:00 PM)', route: '42 · Wardha Rd Exp', status: 'Assigned' },
            { date: 'Saturday, Oct 14', shift: 'Evening (02:00 PM - 10:00 PM)', route: '17 · Civil Lines Local', status: 'Pending' },
          ].map((d, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 gap-3">
              <div>
                <p className="font-bold text-sm text-brand">{d.date}</p>
                <p className="text-xs text-muted-foreground">{d.shift}</p>
              </div>
              <div className="text-sm font-medium">{d.route}</div>
              <span className={cn('px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider', d.status === 'Assigned' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  label, value, unit, icon, accent, highlight
}: {
  label: string; value: string; unit?: string; icon: React.ReactNode; accent?: boolean; highlight?: string;
}) => (
  <div className={cn(
    'glass rounded-2xl p-4 transition-all border',
    accent ? 'ring-1 ring-emerald-500/40 bg-emerald-500/5 border-emerald-500/20' : 'border-white/8'
  )}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {icon}
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold">{value}</span>
      {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
    </div>
  </div>
);

export default DriverDashboard;
