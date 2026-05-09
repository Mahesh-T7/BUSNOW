import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { RoleSelector } from "@/components/RoleSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAuth, Role } from "@/lib/mockData";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Login = () => {
  const nav = useNavigate();
  const [role, setRole] = useState<Role>("passenger");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");
    setLoading(true);
    try {
      // Try real backend first
      const { user } = await api.login(email, password, role);
      toast.success(`Welcome back, ${user.name}!`);
      const dest = user.role === "admin" ? "/admin" : user.role === "driver" ? "/driver" : "/user";
      nav(dest);
    } catch (err: any) {
      // Fallback to mock auth when backend is offline (dev mode)
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        console.warn("[Login] Backend offline — using mock auth");
        saveAuth(role, email);
        toast.success(`Welcome back (offline mode)!`);
        nav(role === "admin" ? "/admin" : role === "driver" ? "/driver" : "/user");
      } else {
        toast.error(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to track your ride in real-time">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">I am a</Label>
          <RoleSelector value={role} onChange={setRole} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{role === 'driver' ? 'Email or Driver ID' : 'Email'}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="text" placeholder={role === 'driver' ? 'driver@varadtrack.app or DRV-1234' : 'you@varadtrack.app'}
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:ring-brand" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:ring-brand" />
          </div>
        </div>

        <Button type="submit" disabled={loading}
          className="w-full h-11 gradient-brand hover:opacity-95 shadow-brand text-white font-semibold border-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/register" className="text-brand hover:text-brand-glow font-medium transition-colors">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
