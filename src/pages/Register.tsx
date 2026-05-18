import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { RoleSelector } from "@/components/RoleSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAuth, Role } from "@/lib/mockData";
import { api } from "@/lib/api";
import { toast } from "sonner";

const Register = () => {
  const nav = useNavigate();
  const role: Role = "passenger";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Please fill all fields");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const { user } = await api.register({ name, email, password, role });
      toast.success(`Welcome aboard, ${user.name}!`);
      const dest = user.role === "admin" ? "/admin" : user.role === "driver" ? "/driver" : "/user";
      nav(dest);
    } catch (err: any) {
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        console.warn("[Register] Backend offline — using mock auth");
        saveAuth(role, email);
        toast.success("Account created (offline mode)!");
        nav("/user");
      } else {
        toast.error(err.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join thousands tracking smarter every day">
      <form onSubmit={submit} className="space-y-5">


        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:ring-brand" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" type="email" placeholder="you@varadtrack.app"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:ring-brand" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type="password" placeholder="At least 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/10 focus-visible:ring-brand" />
          </div>
        </div>

        <Button type="submit" disabled={loading}
          className="w-full h-11 gradient-brand hover:opacity-95 shadow-brand text-white font-semibold border-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-brand hover:text-brand-glow font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
