import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Bus, USER_LOCATION } from "@/lib/mockData";

// Fix default icon (we use custom anyway)
delete (L.Icon.Default.prototype as any)._getIconUrl;

const busDivIcon = (route: string, active: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="bus-marker ${active ? "active" : ""}"><span>${route}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });

const userDivIcon = L.divIcon({
  className: "",
  html: `<div class="user-marker"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function FlyToBus({ bus }: { bus: Bus | null }) {
  const map = useMap();
  useEffect(() => {
    if (bus) map.flyTo([bus.lat, bus.lng], 15, { duration: 0.8 });
  }, [bus, map]);
  return null;
}

interface Props {
  buses: Bus[];
  activeBusId?: string | null;
  onSelectBus?: (id: string) => void;
  showUser?: boolean;
  className?: string;
}

export const TransitMap = ({ buses, activeBusId, onSelectBus, showUser = true, className }: Props) => {
  const activeBus = useMemo(() => buses.find((b) => b.id === activeBusId) || null, [buses, activeBusId]);

  return (
    <div className={className}>
      <MapContainer
        center={[USER_LOCATION.lat, USER_LOCATION.lng]}
        zoom={13}
        zoomControl={true}
        className="h-full w-full"
        style={{ background: "hsl(197 60% 9%)" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        {showUser && (
          <Marker position={[USER_LOCATION.lat, USER_LOCATION.lng]} icon={userDivIcon} />
        )}
        {buses.map((b) => (
          <Marker
            key={b.id}
            position={[b.lat, b.lng]}
            icon={busDivIcon(b.route, b.id === activeBusId)}
            eventHandlers={{ click: () => onSelectBus?.(b.id) }}
          />
        ))}
        <FlyToBus bus={activeBus} />
      </MapContainer>
    </div>
  );
};
