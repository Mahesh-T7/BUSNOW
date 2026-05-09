import { Bus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Logo = ({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) => {
  const dim = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={`${dim} rounded-xl gradient-brand flex items-center justify-center shadow-brand`}>
        <Bus className="h-1/2 w-1/2 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${text} font-black tracking-tight font-sans`}>
          BUS<span className="text-gradient-brand">NOW</span>
          <span className="text-gradient-brand">+</span>
        </span>
        {size !== "sm" && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
            Smart City Transit
          </span>
        )}
      </div>
    </div>
  );
};
