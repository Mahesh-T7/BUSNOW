// Enhanced mock data for BUSNOW+ — Nagpur region
import type { BusPlus, BusStop, RouteInfo } from '@/store/useAppStore';

export type CrowdLevel = 'Low' | 'Medium' | 'High' | 'Full';

export const USER_LOCATION = { lat: 16.2045, lng: 77.3482 };

export const ALL_STOPS: BusStop[] = [
  { id: 's1',  name: 'Raichur Bus Stand',  lat: 16.2045, lng: 77.3482 },
  { id: 's2',  name: 'Railway Station',    lat: 16.2060, lng: 77.3400 },
  { id: 's3',  name: 'Gunj',               lat: 16.2100, lng: 77.3550 },
  { id: 's4',  name: 'Mukthal',            lat: 16.1500, lng: 77.3800 },
  { id: 's5',  name: 'Mantralayam Cross',  lat: 16.1000, lng: 77.4000 },
  { id: 's6',  name: 'Shaktinagar',        lat: 16.3500, lng: 77.3500 },
  { id: 's7',  name: 'Devasugur',          lat: 16.3000, lng: 77.3600 },
  { id: 's8',  name: 'Yeragera',           lat: 16.1500, lng: 77.2500 },
  { id: 's9',  name: 'Manvi',              lat: 15.9800, lng: 77.0500 },
  { id: 's10', name: 'Sindhanur',          lat: 15.7600, lng: 76.7600 },
  { id: 's11', name: 'Lingsugur',          lat: 16.1600, lng: 76.5300 },
  { id: 's12', name: 'Devadurga',          lat: 16.4200, lng: 76.9300 },
  { id: 's13', name: 'Maski',              lat: 15.9500, lng: 76.6500 },
  { id: 's14', name: 'Kavital',            lat: 16.0800, lng: 76.9000 },
  { id: 's15', name: 'Pothnal',            lat: 15.9500, lng: 76.9800 },
  { id: 's16', name: 'Jawalgery',          lat: 15.9000, lng: 76.8500 },
  { id: 's17', name: 'Askihal',            lat: 16.2000, lng: 77.3200 },
  { id: 's18', name: 'Yadlapur',           lat: 16.2200, lng: 77.3600 },
  { id: 's19', name: 'Gillesugur',         lat: 16.2500, lng: 77.3500 },
  { id: 's20', name: 'Kalmala',            lat: 16.1800, lng: 77.1500 },
];

export const ROUTES_DATA: RouteInfo[] = [
  {
    id: 'r42', number: '42', name: 'Raichur - Sindhanur Express',
    from: 'Raichur Bus Stand', to: 'Sindhanur',
    stops: [ALL_STOPS[0], ALL_STOPS[19], ALL_STOPS[8], ALL_STOPS[14], ALL_STOPS[9]],
    distanceKm: 85.5, durationMin: 120, fare: 90, peakFare: 110,
  },
  {
    id: 'r17', number: '17', name: 'City Link (Station to Gunj)',
    from: 'Railway Station', to: 'Gunj',
    stops: [ALL_STOPS[1], ALL_STOPS[16], ALL_STOPS[0], ALL_STOPS[17], ALL_STOPS[2]],
    distanceKm: 8.2, durationMin: 25, fare: 15, peakFare: 20,
  },
  {
    id: 'r08', number: '08', name: 'Raichur - Shaktinagar',
    from: 'Raichur Bus Stand', to: 'Shaktinagar',
    stops: [ALL_STOPS[0], ALL_STOPS[18], ALL_STOPS[6], ALL_STOPS[5]],
    distanceKm: 22.0, durationMin: 45, fare: 30, peakFare: 40,
  },
  {
    id: 'r23', number: '23', name: 'Raichur - Mantralayam',
    from: 'Raichur Bus Stand', to: 'Mantralayam Cross',
    stops: [ALL_STOPS[0], ALL_STOPS[3], ALL_STOPS[7], ALL_STOPS[4]],
    distanceKm: 42.8, durationMin: 70, fare: 50, peakFare: 65,
  },
  {
    id: 'r55', number: '55', name: 'Raichur - Lingsugur',
    from: 'Raichur Bus Stand', to: 'Lingsugur',
    stops: [ALL_STOPS[0], ALL_STOPS[19], ALL_STOPS[13], ALL_STOPS[10]],
    distanceKm: 90.5, durationMin: 135, fare: 100, peakFare: 120,
  },
  {
    id: 'r31', number: '31', name: 'Manvi Local',
    from: 'Manvi', to: 'Kavital',
    stops: [ALL_STOPS[8], ALL_STOPS[14], ALL_STOPS[13]],
    distanceKm: 20.3, durationMin: 40, fare: 25, peakFare: 30,
  },
  {
    id: 'r09', number: '09', name: 'Sindhanur - Maski',
    from: 'Sindhanur', to: 'Maski',
    stops: [ALL_STOPS[9], ALL_STOPS[15], ALL_STOPS[12]],
    distanceKm: 35.6, durationMin: 50, fare: 40, peakFare: 50,
  },
  {
    id: 'r12', number: '12', name: 'Raichur - Devadurga',
    from: 'Raichur Bus Stand', to: 'Devadurga',
    stops: [ALL_STOPS[0], ALL_STOPS[16], ALL_STOPS[11]],
    distanceKm: 55.1, durationMin: 85, fare: 65, peakFare: 80,
  },
];

const DRIVERS = [
  'R. Sharma', 'A. Patil', 'S. Deshmukh', 'K. Verma',
  'M. Khan', 'D. Joshi', 'P. Nair', 'V. Reddy',
];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

function getCrowd(roll: number): CrowdLevel {
  if (roll < 0.3) return 'Low';
  if (roll < 0.65) return 'Medium';
  if (roll < 0.88) return 'High';
  return 'Full';
}

export function generateBusesPlus(): BusPlus[] {
  return ROUTES_DATA.map((r, i) => {
    const startIdx = Math.floor(Math.random() * Math.max(1, r.stops.length - 1));
    const startStop = r.stops[startIdx] || { lat: USER_LOCATION.lat, lng: USER_LOCATION.lng };
    const lat = startStop.lat + rand(-0.001, 0.001);
    const lng = startStop.lng + rand(-0.001, 0.001);
    const dx = (lat - USER_LOCATION.lat) * 111;
    const dy = (lng - USER_LOCATION.lng) * 111;
    const distanceKm = +Math.sqrt(dx * dx + dy * dy).toFixed(2);
    const speed = +rand(15, 55).toFixed(0);
    const etaMin = Math.max(1, Math.round((distanceKm / Math.max(speed, 10)) * 60));
    const crowd = getCrowd(Math.random());
    const totalSeats = 40 + Math.floor(Math.random() * 20);
    const occupiedRatio = crowd === 'Low' ? rand(0.1, 0.4) : crowd === 'Medium' ? rand(0.4, 0.7) : crowd === 'High' ? rand(0.7, 0.9) : rand(0.9, 1.0);
    const occupiedSeats = Math.round(totalSeats * occupiedRatio);

    // Add ETA to each stop
    const stopsWithEta = r.stops.map((s, si) => ({
      ...s,
      etaMin: Math.max(0, etaMin + si * 4 - (si > 0 ? 2 : 0)),
      reached: si <= startIdx,
    }));

    return {
      id: `BUS-${r.number}${String(i + 1).padStart(2, '0')}`,
      route: r.number,
      routeName: r.name,
      from: r.from,
      to: r.to,
      lat, lng,
      speed,
      heading: Math.round(rand(0, 360)),
      etaMin,
      distanceKm,
      crowd,
      driver: DRIVERS[i % DRIVERS.length],
      totalSeats,
      occupiedSeats,
      reservedSeats: 4,
      womenSeats: 6,
      seniorSeats: 4,
      stops: stopsWithEta,
      fare: r.fare,
      isLive: Math.random() > 0.2,
      nextStop: stopsWithEta[1]?.name,
    };
  });
}

const waitTimers: Record<string, number> = {};

export function tickBusesPlus(buses: BusPlus[]): BusPlus[] {
  return buses.map((b) => {
    if (waitTimers[b.id] && waitTimers[b.id] > 0) {
      waitTimers[b.id]--;
      // Bus is waiting at the stop, keep coordinates identical
      return b;
    }

    const targetStopIndex = b.stops.findIndex(s => !s.reached);
    const targetStop = b.stops[targetStopIndex];
    let { lat, lng } = b;
    let stops = [...b.stops];
    let nextStop = b.nextStop;

    if (targetStop) {
      const dx = targetStop.lng - lng;
      const dy = targetStop.lat - lat;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = 0.0025; // 2.5x faster for demo purposes

      if (dist < step) {
        lat = targetStop.lat;
        lng = targetStop.lng;
        stops[targetStopIndex] = { ...targetStop, reached: true };
        
        const isFinalStop = targetStopIndex === stops.length - 1;
        if (isFinalStop) {
          nextStop = "Destination Reached";
          waitTimers[b.id] = 999999; // stay at destination forever
        } else {
          nextStop = stops[targetStopIndex + 1]?.name;
          waitTimers[b.id] = 2; // wait 2 ticks (6 seconds) at the stop
        }
      } else {
        lat += (dy / dist) * step;
        lng += (dx / dist) * step;
      }
    } else {
      nextStop = "Destination Reached";
      waitTimers[b.id] = 999999;
    }

    const dx = (lat - USER_LOCATION.lat) * 111;
    const dy = (lng - USER_LOCATION.lng) * 111;
    const distanceKm = +Math.sqrt(dx * dx + dy * dy).toFixed(2);
    const speed = Math.max(8, Math.min(65, b.speed + Math.round(rand(-4, 4))));
    const etaMin = Math.max(1, Math.round((distanceKm / Math.max(speed, 10)) * 60));
    const rollCrowd = Math.random();
    const crowd: CrowdLevel = rollCrowd < 0.05
      ? getCrowd(Math.random())
      : b.crowd;
    const occupiedSeats = Math.round(
      b.totalSeats * (crowd === 'Low' ? rand(0.1, 0.4) : crowd === 'Medium' ? rand(0.4, 0.7) : crowd === 'High' ? rand(0.7, 0.9) : 1.0)
    );
    return { ...b, lat, lng, stops, nextStop, speed, distanceKm, etaMin, crowd, occupiedSeats };
  });
}

export const crowdColor = (c: CrowdLevel) =>
  c === 'Low' ? 'text-emerald-400' :
  c === 'Medium' ? 'text-amber-400' :
  c === 'High' ? 'text-orange-400' : 'text-red-400';

export const crowdBg = (c: CrowdLevel) =>
  c === 'Low' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
  c === 'Medium' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
  c === 'High' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
  'bg-red-500/15 text-red-400 border-red-500/30';

export const etaColor = (eta: number) =>
  eta < 5 ? 'text-emerald-400' : eta <= 10 ? 'text-amber-400' : 'text-red-400';

// Auth helpers (kept compatible)
export type Role = 'passenger' | 'driver' | 'admin';
export const saveAuth = (role: Role, email: string) => {
  localStorage.setItem('vt_token', `mock.${role}.${Date.now()}`);
  localStorage.setItem('vt_role', role);
  localStorage.setItem('vt_email', email);
};
export const getRole = (): Role | null =>
  (localStorage.getItem('vt_role') as Role) || null;
export const clearAuth = () => {
  localStorage.removeItem('vt_token');
  localStorage.removeItem('vt_role');
  localStorage.removeItem('vt_email');
};

// Fuzzy search helper
export function fuzzySearch(query: string, buses: BusPlus[]): BusPlus[] {
  const q = query.trim().toLowerCase();
  if (!q) return buses;
  return buses.filter((b) =>
    b.id.toLowerCase().includes(q) ||
    b.route.includes(q) ||
    b.routeName.toLowerCase().includes(q) ||
    b.from.toLowerCase().includes(q) ||
    b.to.toLowerCase().includes(q) ||
    b.driver.toLowerCase().includes(q) ||
    b.stops.some((s) => s.name.toLowerCase().includes(q))
  );
}
