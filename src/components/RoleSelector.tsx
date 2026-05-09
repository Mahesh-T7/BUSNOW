import { User, Bus, Shield } from "lucide-react";
import { Role } from "@/lib/mockData";
import { cn } from "@/lib/utils";

const roles: { value: Role; label: string; icon: typeof User }[] = [
  { value: "passenger", label: "Passenger", icon: User },
  { value: "driver", label: "Driver", icon: Bus },
  { value: "admin", label: "Admin", icon: Shield },
];

export const RoleSelector = ({ value, onChange }: { value: Role; onChange: (r: Role) => void }) => (
  <div className="grid grid-cols-3 gap-2">
    {roles.map(({ value: v, label, icon: Icon }) => (
      <button
        key={v}
        type="button"
        onClick={() => onChange(v)}
        className={cn(
          "flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-300",
          value === v
            ? "gradient-brand border-transparent shadow-brand text-white scale-[1.02]"
            : "glass border-white/10 hover:border-white/25 hover:bg-white/5"
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="text-xs font-medium">{label}</span>
      </button>
    ))}
  </div>
);
