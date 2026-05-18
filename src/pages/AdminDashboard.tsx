import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity, BarChart3, Bus as BusIcon, LayoutDashboard, LogOut,
  Users, TrendingUp, Clock, Route, AlertTriangle, ShieldAlert,
  MapPin, Zap, DollarSign, CheckCircle2, XCircle, Plus, Trash2, Edit, Calendar, Share2, MessageSquare, Mail
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Logo } from '@/components/Logo';
import { TransitMapPlus } from '@/components/TransitMapPlus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { generateBusesPlus, tickBusesPlus, clearAuth, ROUTES_DATA } from '@/lib/mockData';
import { api } from '@/lib/api';
import type { BusPlus } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'buses', label: 'Buses', icon: BusIcon },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'routes', label: 'Routes', icon: Route },
  { id: 'schedules', label: 'Schedules', icon: Calendar },
];

const usageData = Array.from({ length: 12 }).map((_, i) => ({
  hour: `${i * 2}:00`,
  buses: Math.round(20 + Math.sin(i / 2) * 12 + Math.random() * 6),
  passengers: Math.round(200 + Math.sin(i / 2) * 80 + Math.random() * 40),
}));

const revenueData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => ({
  day: d,
  revenue: Math.round(8000 + Math.random() * 5000),
  target: 10000,
}));

const crowdData = [
  { name: 'Low', value: 35, color: '#10b981' },
  { name: 'Medium', value: 40, color: '#f59e0b' },
  { name: 'High', value: 18, color: '#f97316' },
  { name: 'Full', value: 7, color: '#ef4444' },
];

const DRIVERS_LIST = [
  { name: 'R. Sharma', bus: 'BUS-4201', route: '42 · Wardha Rd', status: 'Active', trips: 12, rating: 4.8 },
  { name: 'A. Patil', bus: 'BUS-1702', route: '17 · Civil Lines', status: 'Active', trips: 9, rating: 4.6 },
  { name: 'S. Deshmukh', bus: 'BUS-0803', route: '08 · Sadar', status: 'Offline', trips: 0, rating: 4.5 },
  { name: 'K. Verma', bus: 'BUS-2304', route: '23 · IT Park', status: 'Active', trips: 11, rating: 4.9 },
  { name: 'M. Khan', bus: 'BUS-5505', route: '55 · Airport', status: 'Active', trips: 7, rating: 4.7 },
  { name: 'D. Joshi', bus: 'BUS-3106', route: '31 · Variety Sq', status: 'Offline', trips: 0, rating: 4.3 },
  { name: 'P. Nair', bus: 'BUS-0907', route: '09 · Dharampeth', status: 'Active', trips: 8, rating: 4.8 },
  { name: 'V. Reddy', bus: 'BUS-1208', route: '12 · Nandanvan', status: 'Active', trips: 10, rating: 4.6 },
];

const SOS_ALERTS = [
  { id: '1', bus: 'BUS-4201', driver: 'R. Sharma', type: 'Breakdown', time: '2 min ago', resolved: false },
  { id: '2', bus: 'BUS-5505', driver: 'M. Khan', type: 'Medical', time: '18 min ago', resolved: true },
];

const TOOLTIP_STYLE = {
  background: 'hsla(222,40%,9%,0.95)',
  border: '1px solid hsla(0,0%,100%,0.1)',
  borderRadius: 12,
  fontSize: 12,
};

const AdminDashboard = () => {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { theme } = useAppStore();
  const [section, setSection] = useState('dashboard');
  const [buses, setBuses] = useState<BusPlus[]>(() => generateBusesPlus());
  const [routesList, setRoutesList] = useState(() => ROUTES_DATA);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setBuses((p) => tickBusesPlus(p)), 3000);
    return () => clearInterval(id);
  }, []);

  const activeBuses = buses.filter((b) => b.isLive).length;
  const avgEta = Math.round(buses.reduce((s, b) => s + b.etaMin, 0) / buses.length);
  const driversOnline = DRIVERS_LIST.filter((d) => d.status === 'Active').length;
  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const unresolvedSOS = SOS_ALERTS.filter((a) => !a.resolved).length;

  const handleLogout = () => { clearAuth(); nav('/login'); };

  return (
    <div className={cn('min-h-screen flex', theme)}>
      {/* SIDEBAR */}
      <aside className={cn(
        'hidden md:flex flex-col p-4 gap-3 glass-strong border-r border-white/10 transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {sidebarOpen && <Logo />}
        {!sidebarOpen && (
          <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm mx-auto">
            B+
          </div>
        )}

        <nav className="flex flex-col gap-1 mt-4">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              title={item.label}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                section === item.id
                  ? 'gradient-brand text-white shadow-brand'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && item.label}
            </button>
          ))}
        </nav>

        {unresolvedSOS > 0 && sidebarOpen && (
          <button
            onClick={() => setSection('sos')}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm animate-pulse hover:bg-red-500/20 text-left transition-colors"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{unresolvedSOS} SOS Alert{unresolvedSOS > 1 ? 's' : ''}</span>
          </button>
        )}

        <div className="mt-auto space-y-2">
          {sidebarOpen && (
            <div className="glass rounded-xl p-3 text-xs">
              <p className="text-muted-foreground">Logged in as</p>
              <p className="font-semibold truncate">{localStorage.getItem('vt_email') || 'admin@busnow.app'}</p>
            </div>
          )}
          <Button variant="ghost" onClick={handleLogout} className={cn('w-full hover:bg-white/10', sidebarOpen ? 'justify-start' : 'justify-center px-0')}>
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="ml-2">{t('signOut')}</span>}
          </Button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-50 glass-strong border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((v) => !v)} className="hidden md:block text-muted-foreground hover:text-foreground">
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <Logo size="sm" className="md:hidden" />
            <div className="hidden md:block">
              <h1 className="text-lg font-bold capitalize">{section}</h1>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" /> All systems operational
            </span>
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" onClick={handleLogout} className="md:hidden" size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-2 overflow-x-auto p-3 border-b border-white/10">
          {NAV.map((i) => (
            <button key={i.id} onClick={() => setSection(i.id)}
              className={cn('px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border flex items-center gap-1.5',
                section === i.id ? 'gradient-brand text-white border-transparent' : 'glass border-white/10')}>
              <i.icon className="h-3 w-3" />{i.label}
            </button>
          ))}
        </div>

        {section === 'users' && <AdminUsersView />}
        {section === 'dashboard' && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* SOS Banner */}
          {unresolvedSOS > 0 && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400"
            >
              <ShieldAlert className="h-5 w-5 animate-pulse shrink-0" />
              <span className="text-sm font-semibold">🚨 {unresolvedSOS} active SOS alert — immediate action required</span>
              <button onClick={() => setSection('dashboard')} className="ml-auto text-xs underline">View</button>
            </motion.div>
          )}

          {/* Stats */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BusIcon, label: t('activeBuses'), value: activeBuses, delta: `of ${buses.length} total`, tone: 'brand' },
              { icon: Users, label: t('driversOnline'), value: driversOnline, delta: `${DRIVERS_LIST.length - driversOnline} offline`, tone: 'info' },
              { icon: Clock, label: t('avgEta'), value: `${avgEta}m`, delta: '-8% vs yesterday', tone: 'success' },
              { icon: DollarSign, label: 'Weekly Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, delta: '+12% vs last week', tone: 'warning' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
              >
                <StatCard {...s} />
              </motion.div>
            ))}
          </section>

          {/* Map + SOS */}
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 glass-strong rounded-2xl overflow-hidden border border-white/10">
              <div className="p-4 flex items-center justify-between border-b border-white/10">
                <div>
                  <h2 className="font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-brand" /> Live Fleet Map</h2>
                  <p className="text-xs text-muted-foreground">Tracking {activeBuses} vehicles in real time</p>
                </div>
              </div>
              <TransitMapPlus buses={buses} showUser={false} className="h-[340px]" showRoutePolyline={false} />
            </div>

            {/* SOS Alerts */}
            <div className="glass-strong rounded-2xl border border-white/10 p-4 flex flex-col gap-3">
              <h2 className="font-semibold flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-red-400" /> SOS Alerts
              </h2>
              {SOS_ALERTS.map((alert) => (
                <div key={alert.id} className={cn(
                  'rounded-xl p-3 border text-sm',
                  alert.resolved ? 'bg-white/3 border-white/8 opacity-60' : 'bg-red-500/10 border-red-500/30'
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{alert.bus}</span>
                    {alert.resolved
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      : <XCircle className="h-4 w-4 text-red-400 animate-pulse" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.driver} · {alert.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.time}</p>
                  {!alert.resolved && (
                    <button className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> View on map
                    </button>
                  )}
                </div>
              ))}

              {/* Crowd Donut */}
              <div className="mt-auto">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Crowd Distribution</p>
                <div className="flex items-center gap-3">
                  <ResponsiveContainer width={80} height={80}>
                    <PieChart>
                      <Pie data={crowdData} dataKey="value" innerRadius={25} outerRadius={38} strokeWidth={0}>
                        {crowdData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1">
                    {crowdData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                        <span className="font-semibold ml-auto">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Bus Usage Today" subtitle="Vehicles in service per 2-hour window" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={usageData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(16,100%,60%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(16,100%,60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.06)" />
                  <XAxis dataKey="hour" stroke="hsl(200 12% 60%)" fontSize={10} />
                  <YAxis stroke="hsl(200 12% 60%)" fontSize={10} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="buses" stroke="hsl(16,100%,60%)" strokeWidth={2.5} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Daily Revenue" subtitle="Actual vs target (₹)" icon={DollarSign}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.06)" />
                  <XAxis dataKey="day" stroke="hsl(200 12% 60%)" fontSize={10} />
                  <YAxis stroke="hsl(200 12% 60%)" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} />
                  <Bar dataKey="revenue" fill="hsl(16,100%,60%)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="target" fill="hsla(199,89%,56%,0.3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Driver roster */}
          <section className="glass-strong rounded-2xl overflow-hidden border border-white/10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Driver Roster</h2>
                <p className="text-xs text-muted-foreground">{driversOnline} online · {DRIVERS_LIST.length - driversOnline} offline</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
                    {['Driver', 'Bus', 'Route', 'Trips Today', 'Rating', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DRIVERS_LIST.map((d) => (
                    <tr key={d.bus} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
                            {d.name.split(' ').map((p) => p[0]).join('')}
                          </div>
                          <span className="font-medium">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{d.bus}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{d.route}</td>
                      <td className="px-4 py-3 font-semibold">{d.trips}</td>
                      <td className="px-4 py-3">
                        <span className="text-amber-400 font-semibold">★ {d.rating}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
                          d.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-white/5 text-muted-foreground border-white/10'
                        )}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', d.status === 'Active' ? 'bg-emerald-400' : 'bg-muted-foreground')} />
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        )}

        {section === 'buses' && (
          <BusesView buses={buses} setBuses={setBuses} />
        )}

        {section === 'drivers' && <DriversView />}
        {section === 'analytics' && <AnalyticsView usage={usageData} revenue={revenueData} />}
        {section === 'routes' && <RoutesView routes={routesList} setRoutes={setRoutesList} />}
        {section === 'schedules' && <AdminSchedulesView />}
        {section === 'sos' && <SOSView alerts={SOS_ALERTS} setSection={setSection} />}
      </main>
    </div>
  );
};

const BusesView = ({ buses, setBuses }: { buses: BusPlus[], setBuses: React.Dispatch<React.SetStateAction<BusPlus[]>> }) => {
  const [open, setOpen] = useState(false);
  const [dbBuses, setDbBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    busNumber: `BUS-${Math.floor(1000 + Math.random() * 9000)}`,
    routeNumber: '',
    routeName: '',
    from: '',
    to: '',
    fare: '20',
    totalSeats: '50',
  });

  useEffect(() => { fetchDbBuses(); }, []);

  const fetchDbBuses = async () => {
    try {
      const data = await api.getAdminBuses();
      setDbBuses(data.buses || []);
    } catch { /* use mock fallback shown via buses prop */ }
  };

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.busNumber || !formData.routeName) {
      toast.error('Bus Number and Route Name are required'); return;
    }
    setLoading(true);
    try {
      const route = ROUTES_DATA.find(r => r.number === formData.routeNumber);
      await api.createAdminBus({
        busNumber: formData.busNumber,
        routeNumber: formData.routeNumber,
        routeName: formData.routeName,
        from: formData.from || route?.from || 'Origin',
        to: formData.to || route?.to || 'Destination',
        fare: parseInt(formData.fare) || 20,
        totalSeats: parseInt(formData.totalSeats) || 50,
        stops: route?.stops || [],
      });
      toast.success(`Bus ${formData.busNumber} saved to database!`);
      setOpen(false);
      setFormData({ busNumber: `BUS-${Math.floor(1000 + Math.random() * 9000)}`, routeNumber: '', routeName: '', from: '', to: '', fare: '20', totalSeats: '50' });
      fetchDbBuses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add bus');
    } finally { setLoading(false); }
  };

  // Use MongoDB _id for delete (dbBuses rows), fall back to busNumber display
  const handleRemoveBus = async (mongoId: string, busNumber: string) => {
    if (!confirm(`Delete ${busNumber} from the database?`)) return;
    try {
      await api.deleteAdminBus(mongoId);
      toast.success(`Bus ${busNumber} deleted`);
      fetchDbBuses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><BusIcon className="h-6 w-6 text-brand" /> Manage Fleet</h2>
          <p className="text-xs text-muted-foreground mt-1">Add, remove, or monitor your buses. Changes save to the database.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white border-0 shadow-brand">
              <Plus className="h-4 w-4 mr-2" /> Add Bus
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass border-white/10 text-foreground">
            <form onSubmit={handleAddBus}>
              <DialogHeader>
                <DialogTitle>Add New Bus</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="busNumber">Bus Number</Label>
                  <Input id="busNumber" value={formData.busNumber} onChange={(e) => setFormData(p => ({ ...p, busNumber: e.target.value }))} className="bg-white/5 border-white/10" required />
                </div>
                <div className="grid gap-2">
                  <Label>Assign Route</Label>
                  <Select
                    value={formData.routeNumber}
                    onValueChange={(val) => {
                      const r = ROUTES_DATA.find(r => r.number === val);
                      setFormData(p => ({ ...p, routeNumber: val, routeName: r?.name || '', from: r?.from || '', to: r?.to || '' }));
                    }}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select a route" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTES_DATA.map(r => (
                        <SelectItem key={r.number} value={r.number}>{r.number} – {r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>From</Label>
                    <Input value={formData.from} onChange={(e) => setFormData(p => ({ ...p, from: e.target.value }))} className="bg-white/5 border-white/10" placeholder="Origin" />
                  </div>
                  <div className="grid gap-2">
                    <Label>To</Label>
                    <Input value={formData.to} onChange={(e) => setFormData(p => ({ ...p, to: e.target.value }))} className="bg-white/5 border-white/10" placeholder="Destination" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="fare">Base Fare (₹)</Label>
                    <Input id="fare" type="number" value={formData.fare} onChange={(e) => setFormData(p => ({ ...p, fare: e.target.value }))} className="bg-white/5 border-white/10" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="seats">Total Seats</Label>
                    <Input id="seats" type="number" value={formData.totalSeats} onChange={(e) => setFormData(p => ({ ...p, totalSeats: e.target.value }))} className="bg-white/5 border-white/10" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading} className="gradient-brand text-white border-0">
                  {loading ? 'Saving…' : 'Save to DB'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* DB buses table */}
      <div className="glass-strong rounded-2xl overflow-hidden border border-white/10">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing {dbBuses.length} bus{dbBuses.length !== 1 ? 'es' : ''} from database</p>
          <button onClick={fetchDbBuses} className="text-xs text-brand hover:underline">↻ Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
                <th className="px-4 py-3 font-medium">Bus Number</th>
                <th className="px-4 py-3 font-medium">Route</th>
                <th className="px-4 py-3 font-medium">From → To</th>
                <th className="px-4 py-3 font-medium">Fare / Seats</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dbBuses.map((bus) => (
                <tr key={bus._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 font-semibold text-brand font-mono">{bus.busNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{bus.routeNumber} · {bus.routeName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{bus.from} → {bus.to}</td>
                  <td className="px-4 py-3 text-xs">₹{bus.fare} · {bus.totalSeats} seats</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveBus(bus._id, bus.busNumber)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {dbBuses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No buses in database yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, delta, tone }: any) => {
  const tones: Record<string, string> = {
    brand: 'from-orange-500/20 to-orange-500/0 text-orange-400',
    info: 'from-sky-500/20 to-sky-500/0 text-sky-400',
    success: 'from-emerald-500/20 to-emerald-500/0 text-emerald-400',
    warning: 'from-amber-500/20 to-amber-500/0 text-amber-400',
  };
  return (
    <div className="glass-strong rounded-2xl p-4 relative overflow-hidden border border-white/10">
      <div className={cn('absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl opacity-60', tones[tone])} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <Icon className={cn('h-4 w-4', tones[tone].split(' ').pop())} />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{delta}</p>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, icon: Icon, children }: any) => (
  <div className="glass-strong rounded-2xl p-4 border border-white/10">
    <div className="mb-4">
      <h3 className="font-semibold flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-brand" /> {title}
      </h3>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
    {children}
  </div>
);

const DriversView = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', driverId: '', phoneNumber: '', email: '',
    assignedBus: '', assignedRoute: '', licenseNumber: '',
    dutyTimings: '', weeklyOffDay: ''
  });

  useEffect(() => { fetchDrivers(); }, []);

  const fetchDrivers = async () => {
    try {
      const data = await api.getAdminDrivers();
      setDrivers(data.drivers?.length > 0 ? data.drivers : DRIVERS_LIST);
    } catch {
      setDrivers(DRIVERS_LIST);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) { toast.error('Name and Email are required'); return; }
    setLoading(true);
    try {
      if (editingId) {
        await api.updateAdminDriver(editingId, formData);
        toast.success('Driver updated');
      } else {
        const data = await api.createAdminDriver(formData);
        toast.success('Driver created & saved to database!');
        if (data.generatedPassword) {
          toast.success('Auto-Generated Credentials', {
            duration: 20000,
            description: `Email: ${formData.email}\nDriver ID: ${data.driverId}\nPassword: ${data.generatedPassword}`,
            action: {
              label: 'Copy',
              onClick: () => {
                navigator.clipboard.writeText(`Email: ${formData.email}\nDriver ID: ${data.driverId}\nPassword: ${data.generatedPassword}`);
                toast.success('Copied!');
              }
            }
          });
        }
      }
      setOpen(false);
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save driver');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this driver? Their account will be deleted from the database.')) return;
    try {
      await api.deleteAdminDriver(id);
      toast.success('Driver removed from database');
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const filtered = drivers.filter(d => 
    d.name?.toLowerCase().includes(search.toLowerCase()) || 
    d.driverId?.toLowerCase().includes(search.toLowerCase()) ||
    d.bus?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-brand" /> Drivers Management</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage and monitor your driver workforce.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 bg-white/5 border-white/10" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingId(null); setFormData({name: '', driverId: '', phoneNumber: '', email: '', assignedBus: '', assignedRoute: '', licenseNumber: '', dutyTimings: '', weeklyOffDay: ''}); }} className="gradient-brand text-white border-0 shadow-brand whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" /> Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass border-white/10">
              <form onSubmit={handleSave}>
                <DialogHeader><DialogTitle>{editingId ? 'Edit Driver' : 'Add New Driver'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Full Name</Label><Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required className="bg-white/5 border-white/10" /></div>
                    <div className="grid gap-2"><Label>Driver ID</Label><Input placeholder="Auto-generated" value={formData.driverId} onChange={e => setFormData(p => ({...p, driverId: e.target.value}))} className="bg-white/5 border-white/10" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} required className="bg-white/5 border-white/10" /></div>
                    <div className="grid gap-2"><Label>Phone Number</Label><Input value={formData.phoneNumber} onChange={e => setFormData(p => ({...p, phoneNumber: e.target.value}))} required className="bg-white/5 border-white/10" /></div>
                  </div>
                  <div className="grid gap-2"><Label>License Number</Label><Input value={formData.licenseNumber} onChange={e => setFormData(p => ({...p, licenseNumber: e.target.value}))} required className="bg-white/5 border-white/10" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Duty Timings</Label><Input placeholder="08:00 AM - 04:00 PM" value={formData.dutyTimings} onChange={e => setFormData(p => ({...p, dutyTimings: e.target.value}))} className="bg-white/5 border-white/10" /></div>
                    <div className="grid gap-2"><Label>Weekly Off</Label><Input placeholder="Sunday" value={formData.weeklyOffDay} onChange={e => setFormData(p => ({...p, weeklyOffDay: e.target.value}))} className="bg-white/5 border-white/10" /></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="gradient-brand text-white border-0">Save Driver</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <section className="glass-strong rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Bus/Route</th>
                <th className="px-4 py-3 font-medium">Credentials</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d: any) => (
                <tr key={d._id || d.driverId || d.name} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-white">
                        {d.name?.split(' ').map((p: string) => p[0]).join('') || 'D'}
                      </div>
                      <div>
                        <span className="font-medium block">{d.name}</span>
                        <span className="text-xs text-muted-foreground">{d.driverId || 'ID N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div className="truncate w-32" title={d.email}>{d.email || 'N/A'}</div>
                    <div>{d.phoneNumber || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{d.assignedBus || d.bus || 'Unassigned'}</div>
                    <div>{d.assignedRoute || d.route || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {d.generatedPassword ? (
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-brand bg-brand/10 px-2 py-1 rounded inline-block">
                          PW: {d.generatedPassword}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-white/10"
                            >
                              Share <Share2 className="h-3 w-3 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass border-white/10">
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(`Driver Login ID: ${d.driverId || d.email}\nPassword: ${d.generatedPassword}`);
                              toast.success('Credentials copied to clipboard!');
                            }}>
                              <Share2 className="h-4 w-4 mr-2" /> Copy to Clipboard
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const text = encodeURIComponent(`VaradTrack Driver Login\nID: ${d.driverId || d.email}\nPassword: ${d.generatedPassword}`);
                              window.open(`https://wa.me/?text=${text}`, '_blank');
                            }}>
                              <MessageSquare className="h-4 w-4 mr-2 text-emerald-400" /> WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const body = encodeURIComponent(`VaradTrack Driver Login\nID: ${d.driverId || d.email}\nPassword: ${d.generatedPassword}`);
                              window.open(`sms:?body=${body}`, '_self');
                            }}>
                              <MessageSquare className="h-4 w-4 mr-2 text-sky-400" /> SMS
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const subject = encodeURIComponent('Your VaradTrack Driver Credentials');
                              const body = encodeURIComponent(`Hello ${d.name},\n\nHere are your login credentials for VaradTrack:\n\nLogin ID: ${d.driverId || d.email}\nPassword: ${d.generatedPassword}\n\nPlease keep these secure.\n\nThanks,\nAdmin Team`);
                              window.open(`mailto:${d.email}?subject=${subject}&body=${body}`, '_self');
                            }}>
                              <Mail className="h-4 w-4 mr-2 text-red-400" /> Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Encrypted</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border', d.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-muted-foreground border-white/10')}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', d.status === 'Active' ? 'bg-emerald-400' : 'bg-muted-foreground')} />
                      {d.status || 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(d._id || d.driverId); setFormData({name: d.name||'', driverId: d.driverId||'', phoneNumber: d.phoneNumber||'', email: d.email||'', assignedBus: d.assignedBus||'', assignedRoute: d.assignedRoute||'', licenseNumber: d.licenseNumber||'', dutyTimings: d.dutyTimings||'', weeklyOffDay: d.weeklyOffDay||''}); setOpen(true); }} className="h-8 w-8 p-0 text-sky-400 hover:text-sky-300 hover:bg-sky-400/10 mr-1"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(d._id || d.driverId)} className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No drivers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const AnalyticsView = ({ usage, revenue }: any) => (
  <div className="p-4 sm:p-6 space-y-6">
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-brand" /> Analytics</h2>
      <p className="text-xs text-muted-foreground mt-1">Deep dive into performance metrics.</p>
    </div>
    <div className="grid lg:grid-cols-2 gap-4">
      <ChartCard title="Bus Usage Today" subtitle="Vehicles in service per 2-hour window" icon={TrendingUp}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={usage}>
            <defs>
              <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(16,100%,60%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(16,100%,60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.06)" />
            <XAxis dataKey="hour" stroke="hsl(200 12% 60%)" fontSize={10} />
            <YAxis stroke="hsl(200 12% 60%)" fontSize={10} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="buses" stroke="hsl(16,100%,60%)" strokeWidth={2.5} fill="url(#areaGrad2)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="Daily Revenue" subtitle="Actual vs target (₹)" icon={DollarSign}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.06)" />
            <XAxis dataKey="day" stroke="hsl(200 12% 60%)" fontSize={10} />
            <YAxis stroke="hsl(200 12% 60%)" fontSize={10} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} />
            <Bar dataKey="revenue" fill="hsl(16,100%,60%)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="target" fill="hsla(199,89%,56%,0.3)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  </div>
);

const RoutesView = ({ routes, setRoutes }: { routes: any[], setRoutes: any }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    from: '',
    to: '',
    fare: '',
    distanceKm: '',
  });
  const [stops, setStops] = useState<string[]>(['']);

  const handleAddStop = () => setStops([...stops, '']);
  const handleStopChange = (index: number, value: string) => {
    const newStops = [...stops];
    newStops[index] = value;
    setStops(newStops);
  };
  const handleRemoveStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchDbRoutes(); }, []);

  const fetchDbRoutes = async () => {
    try {
      const data = await api.getAdminRoutes();
      if (data.routes?.length > 0) setRoutes(data.routes);
    } catch { /* keep mock ROUTES_DATA as fallback */ }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.number || !formData.name || !formData.from || !formData.to) {
      toast.error('Please fill in all required fields'); return;
    }
    setLoading(true);
    try {
      const allStops = [
        { name: formData.from, lat: 16.2045, lng: 77.3482 },
        ...stops.filter(s => s.trim()).map(s => ({ name: s.trim(), lat: 16.2045 + Math.random() * 0.05, lng: 77.3482 + Math.random() * 0.05 })),
        { name: formData.to, lat: 16.2045 + 0.05, lng: 77.3482 + 0.05 },
      ];
      const dist = parseFloat(formData.distanceKm) || 10;
      await api.createAdminRoute({
        number: formData.number,
        name: formData.name,
        from: formData.from,
        to: formData.to,
        stops: allStops,
        distanceKm: dist,
        durationMin: Math.round(dist * 2),
        fare: parseInt(formData.fare) || 20,
        peakFare: (parseInt(formData.fare) || 20) + 10,
      });
      toast.success(`Route ${formData.number} saved to database!`);
      setOpen(false);
      setFormData({ number: '', name: '', from: '', to: '', fare: '', distanceKm: '' });
      setStops(['']);
      fetchDbRoutes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add route');
    } finally { setLoading(false); }
  };

  const handleRemoveRoute = async (id: string) => {
    if (!confirm('Delete this route from the database?')) return;
    try {
      await api.deleteAdminRoute(id);
      toast.success('Route deleted');
      fetchDbRoutes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Route className="h-6 w-6 text-brand" /> Routes</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage active transit routes.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white border-0 shadow-brand">
              <Plus className="h-4 w-4 mr-2" /> Add Route
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass border-white/10 text-foreground">
            <form onSubmit={handleAddRoute}>
              <DialogHeader>
                <DialogTitle>Add New Route</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="number">Route Number</Label>
                    <Input id="number" value={formData.number} onChange={(e) => setFormData(p => ({ ...p, number: e.target.value }))} className="bg-white/5 border-white/10" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fare">Base Fare (₹)</Label>
                    <Input id="fare" type="number" value={formData.fare} onChange={(e) => setFormData(p => ({ ...p, fare: e.target.value }))} className="bg-white/5 border-white/10" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Route Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-white/10" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="from">Origin</Label>
                    <Input id="from" value={formData.from} onChange={(e) => setFormData(p => ({ ...p, from: e.target.value }))} className="bg-white/5 border-white/10" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="to">Destination</Label>
                    <Input id="to" value={formData.to} onChange={(e) => setFormData(p => ({ ...p, to: e.target.value }))} className="bg-white/5 border-white/10" required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Intermediate Stops</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={handleAddStop} className="h-6 text-xs px-2 text-brand">
                      <Plus className="h-3 w-3 mr-1" /> Add Stop
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input 
                          placeholder={`Stop ${index + 1} name`} 
                          value={stop} 
                          onChange={(e) => handleStopChange(index, e.target.value)} 
                          className="bg-white/5 border-white/10 h-8 text-sm" 
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveStop(index)}
                          className="h-8 w-8 text-red-400 hover:text-red-300 shrink-0 hover:bg-white/5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {stops.length === 0 && <p className="text-xs text-muted-foreground">No intermediate stops added.</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input id="distance" type="number" step="0.1" value={formData.distanceKm} onChange={(e) => setFormData(p => ({ ...p, distanceKm: e.target.value }))} className="bg-white/5 border-white/10" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="gradient-brand text-white border-0">Save Route</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((r) => (
          <div key={r._id || r.id || r.number} className="glass-strong rounded-2xl p-4 border border-white/10 flex flex-col gap-3 group">
            <div className="flex items-center justify-between">
              <span className="px-2 py-1 rounded-md bg-white/5 text-xs font-mono font-bold border border-white/10">{r.number}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-brand">₹{r.fare}{r.peakFare ? ` – ₹${r.peakFare}` : ''}</span>
                {/* Use MongoDB _id for delete; fall back to r.id for mock data */}
                <button onClick={() => handleRemoveRoute(r._id || r.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 rounded hover:bg-white/5">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-sm">{r.name}</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {r.from} → {r.to}</p>
              <p className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> {r.distanceKm ?? '?'} km · {r.durationMin ?? '?'} mins</p>
              <p className="flex items-center gap-1.5"><Route className="h-3 w-3" /> {r.stops?.length ?? 0} Stops</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SOSView = ({ alerts, setSection }: any) => (
  <div className="p-4 sm:p-6 space-y-6">
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="sm" onClick={() => setSection('dashboard')}>&larr; Back</Button>
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-red-400"><ShieldAlert className="h-6 w-6" /> SOS Alerts Center</h2>
        <p className="text-xs text-muted-foreground mt-1">Manage emergency alerts from fleet drivers.</p>
      </div>
    </div>
    <div className="space-y-4">
      {alerts.map((alert: any) => (
        <div key={alert.id} className={cn(
          'rounded-2xl p-4 border flex items-center justify-between gap-4',
          alert.resolved ? 'bg-white/3 border-white/8 opacity-60' : 'bg-red-500/10 border-red-500/30'
        )}>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="font-bold">{alert.bus}</span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs">{alert.driver}</span>
              {alert.resolved
                ? <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Resolved</span>
                : <span className="flex items-center gap-1 text-xs text-red-400 animate-pulse"><XCircle className="h-3 w-3" /> Active Alert</span>}
            </div>
            <p className="text-sm font-medium">Emergency Type: <span className="text-red-400">{alert.type}</span></p>
            <p className="text-xs text-muted-foreground mt-1">Reported: {alert.time}</p>
          </div>
          {!alert.resolved && (
            <div className="flex flex-col gap-2">
              <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white border-0">Resolve Alert</Button>
              <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">View Location</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const AdminSchedulesView = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    busNumber: '', routeNumber: '', routeName: '', departureTime: '', arrivalTime: '',
    fare: '20', recurring: 'Daily', type: 'Local', timeOfDay: 'Morning'
  });

  useEffect(() => { fetchSchedules(); }, []);

  const fetchSchedules = async () => {
    try {
      const data = await api.getAdminSchedules();
      if (data.schedules) setSchedules(data.schedules);
    } catch (e) { console.error(e); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.busNumber || !formData.routeNumber || !formData.departureTime || !formData.arrivalTime) {
      toast.error('Bus number, route number, departure and arrival times are required'); return;
    }
    try {
      await api.createAdminSchedule({ ...formData, fare: parseInt(formData.fare) || 20 });
      toast.success('Schedule saved to database!');
      setOpen(false);
      setFormData({ busNumber: '', routeNumber: '', routeName: '', departureTime: '', arrivalTime: '', fare: '20', recurring: 'Daily', type: 'Local', timeOfDay: 'Morning' });
      fetchSchedules();
    } catch (err: any) {
      // Show real error — do NOT silently add a local-only record
      toast.error(err.message || 'Failed to save schedule to database');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this schedule from the database?')) return;
    try {
      await api.deleteAdminSchedule(id);
      toast.success('Schedule deleted from database');
      fetchSchedules();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete schedule');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6 text-brand" /> Bus Schedules</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage departure/arrival times, assignments, and recurrences.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-white border-0 shadow-brand">
              <Plus className="h-4 w-4 mr-2" /> Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] glass border-white/10">
            <form onSubmit={handleSave}>
              <DialogHeader><DialogTitle>New Bus Schedule</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Bus Number</Label><Input value={formData.busNumber} onChange={e=>setFormData(p=>({...p, busNumber: e.target.value}))} required className="bg-white/5 border-white/10"/></div>
                  <div className="grid gap-2"><Label>Route Number</Label><Input value={formData.routeNumber} onChange={e=>setFormData(p=>({...p, routeNumber: e.target.value}))} required className="bg-white/5 border-white/10"/></div>
                </div>
                <div className="grid gap-2"><Label>Route Name</Label><Input value={formData.routeName} onChange={e=>setFormData(p=>({...p, routeName: e.target.value}))} required className="bg-white/5 border-white/10"/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Departure Time</Label><Input type="time" value={formData.departureTime} onChange={e=>setFormData(p=>({...p, departureTime: e.target.value}))} required className="bg-white/5 border-white/10"/></div>
                  <div className="grid gap-2"><Label>Arrival Time</Label><Input type="time" value={formData.arrivalTime} onChange={e=>setFormData(p=>({...p, arrivalTime: e.target.value}))} required className="bg-white/5 border-white/10"/></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={v=>setFormData(p=>({...p, type: v}))}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger>
                      <SelectContent><SelectItem value="Express">Express</SelectItem><SelectItem value="Local">Local</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Recurring</Label>
                    <Select value={formData.recurring} onValueChange={v=>setFormData(p=>({...p, recurring: v}))}>
                      <SelectTrigger className="bg-white/5 border-white/10"><SelectValue/></SelectTrigger>
                      <SelectContent><SelectItem value="Daily">Daily</SelectItem><SelectItem value="Weekdays">Weekdays</SelectItem><SelectItem value="Weekends">Weekends</SelectItem><SelectItem value="Once">Once</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2"><Label>Fare (₹)</Label><Input type="number" value={formData.fare} onChange={e=>setFormData(p=>({...p, fare: e.target.value}))} required className="bg-white/5 border-white/10"/></div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="gradient-brand text-white border-0">Save Schedule</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-strong rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
                <th className="px-4 py-3 font-medium">Bus & Route</th>
                <th className="px-4 py-3 font-medium">Timings</th>
                <th className="px-4 py-3 font-medium">Type & Recurrence</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s: any) => (
                <tr key={s._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold block text-brand">{s.busNumber}</span>
                    <span className="text-xs text-muted-foreground">{s.routeNumber} - {s.routeName}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex items-center gap-2"><span className="text-emerald-400 font-mono">{s.departureTime}</span> &rarr; <span className="font-mono text-amber-400">{s.arrivalTime}</span></div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div><span className={cn('px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider', s.type === 'Express' ? 'bg-orange-500/20 text-orange-400' : 'bg-sky-500/20 text-sky-400')}>{s.type}</span></div>
                    <div className="mt-1 text-muted-foreground">{s.recurring}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s._id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No schedules configured.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminUsersView = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        throw new Error((data as any).message || 'Failed to fetch users');
      }
    } catch (e) {
      // Fallback
      const demoUsers = [
        { _id: '1', name: 'Passenger One', email: 'passenger@busnow.app', role: 'passenger', isActive: true },
        { _id: '2', name: 'R. Sharma', email: 'rsharma@busnow.app', role: 'driver', isActive: true },
        { _id: '3', name: 'Admin', email: 'admin@busnow.app', role: 'admin', isActive: true },
      ];
      setUsers(demoUsers);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;
    try {
      await api.deleteAdminUser(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (e) {
      toast.error('Deleted (Local)');
      setUsers(users.filter(u => u._id !== id));
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-brand" /> Users Management</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage system access, roles, and passenger accounts.</p>
        </div>
      </div>
      <section className="glass-strong rounded-2xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-white/10">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider', 
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                      u.role === 'driver' ? 'bg-brand/20 text-brand' : 'bg-white/10 text-white')}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-semibold', u.isActive !== false ? 'text-emerald-400' : 'text-red-400')}>
                      {u.isActive !== false ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== 'admin' && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u._id, u.email)} className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
