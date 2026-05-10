import { useEffect, useRef } from 'react';
import {
  MapContainer, TileLayer, Marker, Popup, Polyline,
  useMap, CircleMarker,
} from 'react-leaflet';
import L from 'leaflet';
import { cn } from '@/lib/utils';
import type { BusPlus } from '@/store/useAppStore';
import { crowdBg } from '@/lib/mockData';

/* ─── Custom Icons ──────────────────────────────────────────────────── */
const makeBusIcon = (route: string, active: boolean) =>
  L.divIcon({
    className: 'bus-marker-wrapper',
    html: `<div class="bus-marker${active ? ' active' : ''}"><span>${route}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });

const userIcon = L.divIcon({
  className: '',
  html: '<div class="user-marker"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/* ─── Map auto-panner ───────────────────────────────────────────────── */
function PanToActive({ buses, activeBusId }: { buses: BusPlus[]; activeBusId: string | null }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);
  useEffect(() => {
    if (!activeBusId || activeBusId === prevId.current) return;
    const bus = buses.find((b) => b.id === activeBusId);
    if (bus) {
      map.flyTo([bus.lat, bus.lng], 15, { duration: 1.4, easeLinearity: 0.35 });
      prevId.current = activeBusId;
    }
  }, [activeBusId, buses, map]);
  return null;
}

/* ─── Main Map Component ──────────────────────────────────────────────  */
interface TransitMapPlusProps {
  buses: BusPlus[];
  activeBusId?: string | null;
  onSelectBus?: (id: string) => void;
  showUser?: boolean;
  className?: string;
  showRoutePolyline?: boolean;
}

const USER_LOC: [number, number] = [16.2045, 77.3482];

export function TransitMapPlus({
  buses,
  activeBusId,
  onSelectBus,
  showUser = true,
  className,
  showRoutePolyline = true,
}: TransitMapPlusProps) {
  const activeBus = buses.find((b) => b.id === activeBusId);

  // Build polyline from active bus stops
  const routeCoords: [number, number][] =
    activeBus?.stops.map((s) => [s.lat, s.lng]) ?? [];

  return (
    <MapContainer
      center={USER_LOC}
      zoom={13}
      zoomControl={false}
      className={cn('w-full h-full', className)}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <PanToActive buses={buses} activeBusId={activeBusId ?? null} />

      {/* User location */}
      {showUser && (
        <Marker position={USER_LOC} icon={userIcon}>
          <Popup className="glass-strong">
            <strong>📍 Your Location</strong>
          </Popup>
        </Marker>
      )}

      {/* Route polyline for active bus */}
      {showRoutePolyline && routeCoords.length > 1 && (
        <Polyline
          positions={routeCoords}
          pathOptions={{
            color: 'hsl(16, 100%, 60%)',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 5',
            className: 'route-path',
          }}
        />
      )}

      {/* Stop markers for active bus */}
      {showRoutePolyline && activeBus?.stops.map((s) => (
        <CircleMarker
          key={s.id}
          center={[s.lat, s.lng]}
          radius={6}
          pathOptions={{
            fillColor: s.reached ? '#10b981' : '#f97316',
            fillOpacity: 1,
            color: 'white',
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm font-semibold">{s.name}</div>
            {s.etaMin !== undefined && (
              <div className="text-xs text-muted-foreground">ETA: {s.etaMin} min</div>
            )}
          </Popup>
        </CircleMarker>
      ))}

      {/* Bus markers */}
      {buses.map((bus) => (
        <Marker
          key={bus.id}
          position={[bus.lat, bus.lng]}
          icon={makeBusIcon(bus.route, bus.id === activeBusId)}
          eventHandlers={{
            click: () => onSelectBus?.(bus.id),
          }}
        >
          <Popup>
            <div className="min-w-[180px] space-y-1.5 py-1">
              <div className="font-bold text-sm">{bus.id}</div>
              <div className="text-xs text-muted-foreground">{bus.routeName}</div>
              <div className="flex gap-2 text-xs">
                <span>🚌 {bus.speed} km/h</span>
                <span>⏱ {bus.etaMin} min</span>
              </div>
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                crowdBg(bus.crowd)
              )}>
                {bus.crowd}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
