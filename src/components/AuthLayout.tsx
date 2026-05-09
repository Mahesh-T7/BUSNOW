import { ReactNode } from "react";
import { Logo } from "./Logo";

export const AuthLayout = ({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) => {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand/30 blur-[120px] animate-float" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-info/20 blur-[120px] animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="w-full max-w-md animate-scale-in">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="glass-strong rounded-3xl p-8 shadow-glass">
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </header>
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 BUSNOW+ · Smart City Transit Platform
        </p>
      </div>
    </main>
  );
};
