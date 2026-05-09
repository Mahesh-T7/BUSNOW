import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { BusPlus } from '@/store/useAppStore';
import { crowdBg, crowdColor, etaColor } from '@/lib/mockData';
import {
  Bus, Clock, Users, MapPin, ChevronDown, ChevronUp,
  Navigation, Zap, CreditCard, Wifi, WifiOff,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';

interface BusCardPlusProps {
  bus: BusPlus;
  active?: boolean;
  onTrack?: () => void;
  compact?: boolean;
}

export function BusCardPlus({ bus, active, onTrack, compact }: BusCardPlusProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const occupancyPct = Math.round((bus.occupiedSeats / bus.totalSeats) * 100);

  const crowdBarColor =
    bus.crowd === 'Low' ? 'bg-emerald-400' :
    bus.crowd === 'Medium' ? 'bg-amber-400' :
    bus.crowd === 'High' ? 'bg-orange-400' : 'bg-red-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'glass-strong rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer',
        active
          ? 'border-orange-500/50 shadow-[0_0_24px_-4px_hsla(16,100%,60%,0.45)]'
          : 'border-white/8 hover:border-white/20 hover:shadow-lg'
      )}
    >
      {/* Main row */}
      <div
        className="p-4 flex items-center gap-4"
        onClick={() => onTrack?.()}
      >
        {/* Route badge */}
        <div className="h-14 w-14 rounded-xl gradient-brand flex items-center justify-center font-bold text-white text-lg shadow-brand shrink-0 relative">
          {bus.route}
          {bus.isLive && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 pulse-dot border border-background" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm truncate">{bus.id}</span>
            {!bus.isLive && (
              <WifiOff className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            {bus.isLive && (
              <Wifi className="h-3 w-3 text-emerald-400 shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{bus.routeName}</p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className={cn('font-semibold', etaColor(bus.etaMin))}>
              <Clock className="inline h-3 w-3 mr-0.5" />
              {bus.etaMin} min
            </span>
            <span className="text-muted-foreground">
              <Navigation className="inline h-3 w-3 mr-0.5" />
              {bus.distanceKm} km
            </span>
            <span className="text-muted-foreground">
              <Zap className="inline h-3 w-3 mr-0.5" />
              {bus.speed} km/h
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold border',
            crowdBg(bus.crowd)
          )}>
            <Users className="h-3 w-3" />
            {t(bus.crowd.toLowerCase())}
          </span>
          <span className="text-xs font-medium text-emerald-400">
            <CreditCard className="inline h-3 w-3 mr-0.5" />
            ₹{bus.fare}
          </span>
          {!compact && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Crowd bar */}
      <div className="px-4 pb-3">
        <div className="crowd-bar">
          <motion.div
            className={cn('crowd-fill', crowdBarColor)}
            initial={{ width: 0 }}
            animate={{ width: `${occupancyPct}%` }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>{bus.occupiedSeats}/{bus.totalSeats} seats</span>
          <span>{occupancyPct}% full</span>
        </div>
      </div>

      {/* Expanded section — Stop timeline + seat details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 p-4 space-y-4">
              {/* Stop Timeline */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Route Timeline
                </h4>
                <div className="space-y-0">
                  {bus.stops.map((s, i) => (
                    <div key={s.id} className={cn('flex items-start gap-3 pb-3', i < bus.stops.length - 1 && 'stop-line')}>
                      <div className={cn(
                        'stop-dot mt-0.5',
                        s.reached ? 'reached' : i === 1 ? '' : 'upcoming'
                      )} />
                      <div className="flex-1 min-w-0 flex justify-between">
                        <span className={cn(
                          'text-xs font-medium',
                          s.reached ? 'text-emerald-400' : 'text-foreground/80'
                        )}>
                          {s.name}
                        </span>
                        {s.etaMin !== undefined && (
                          <span className={cn('text-[11px]', s.reached ? 'text-emerald-400' : 'text-muted-foreground')}>
                            {s.reached ? '✓' : `${s.etaMin} min`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seat breakdown */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Bus className="h-3 w-3" /> Seat Availability
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Available', count: bus.totalSeats - bus.occupiedSeats, cls: 'seat-available', color: 'text-emerald-400' },
                    { label: 'Occupied', count: bus.occupiedSeats, cls: 'seat-occupied', color: 'text-red-400' },
                    { label: 'Women', count: bus.womenSeats, cls: 'seat-women', color: 'text-purple-400' },
                    { label: 'Senior', count: bus.seniorSeats, cls: 'seat-reserved', color: 'text-amber-400' },
                  ].map((s) => (
                    <div key={s.label} className={cn('rounded-lg p-2 text-center', s.cls)}>
                      <div className={cn('text-base font-bold', s.color)}>{s.count}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Track button */}
              <Button
                onClick={() => onTrack?.()}
                className="w-full gradient-brand text-white border-0 shadow-brand font-semibold"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Track on Map
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
