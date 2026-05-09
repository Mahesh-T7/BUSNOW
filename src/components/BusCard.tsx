import { Bus, crowdBg, etaColor } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Bell, Crosshair, Gauge, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  bus: Bus;
  active?: boolean;
  onTrack: () => void;
}

export const BusCard = ({ bus, active, onTrack }: Props) => {
  return (
    <article
      className={cn(
        "glass rounded-2xl p-4 transition-all duration-300 cursor-pointer",
        "hover:bg-white/[0.12] hover:border-white/20",
        active && "ring-2 ring-brand bg-white/[0.12] shadow-brand"
      )}
      onClick={onTrack}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl gradient-brand flex items-center justify-center font-bold text-white shadow-brand">
            {bus.route}
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{bus.id}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{bus.routeName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-2xl font-bold leading-none", etaColor(bus.etaMin))}>
            {bus.etaMin}
            <span className="text-xs font-medium text-muted-foreground ml-1">min</span>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">ETA</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Stat icon={Gauge} label="Speed" value={`${bus.speed} km/h`} />
        <Stat icon={MapPin} label="Distance" value={`${bus.distanceKm} km`} />
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" /> Crowd
          </span>
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md border w-fit", crowdBg(bus.crowd))}>
            {bus.crowd}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={(e) => { e.stopPropagation(); onTrack(); }}
          className="flex-1 gradient-brand text-white border-0 hover:opacity-90 shadow-brand">
          <Crosshair className="h-3.5 w-3.5 mr-1.5" /> Track Live
        </Button>
        <Button size="sm" variant="outline"
          onClick={(e) => { e.stopPropagation(); toast.success(`Alert set for ${bus.id}`); }}
          className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20">
          <Bell className="h-3.5 w-3.5 mr-1.5" /> Set Alert
        </Button>
      </div>
    </article>
  );
};

const Stat = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
      <Icon className="h-3 w-3" /> {label}
    </span>
    <span className="text-xs font-semibold">{value}</span>
  </div>
);
