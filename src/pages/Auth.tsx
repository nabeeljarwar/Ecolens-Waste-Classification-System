import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Leaf, Mail, Lock, User, ArrowRight, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { syncAccountAccess } from "@/lib/syncAccountAccess";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      void (async () => {
        try {
          const access = await syncAccountAccess();
          navigate(access.role === "admin" ? "/admin" : "/", { replace: true });
        } catch {
          navigate("/", { replace: true });
        }
      })();
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          const access = await syncAccountAccess();
          const isAdmin = access.role === "admin";

          if (isAdminMode && !isAdmin) {
            toast.error("This account does not have admin access.");
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }

          if (isAdmin) {
            toast.success("Welcome back, Admin! 🛡️");
            navigate("/admin", { replace: true });
          } else {
            toast.success("Welcome back! 🌿");
            navigate("/", { replace: true });
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || (isAdminMode ? "Admin" : "EcoUser"),
              requested_admin: isAdminMode,
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.user && data.session) {
          const access = await syncAccountAccess();

          if (access.role === "admin") {
            toast.success("Admin account is ready! 🛡️");
            navigate("/admin", { replace: true });
            return;
          }
        }

        toast.success(
          isAdminMode
            ? "Verify your email, then sign in from the admin tab to activate admin access. 📧"
            : "Check your email to verify your account! 📧"
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-eco-forest to-eco-forest-dark px-6 pb-16 pt-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
        />
        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
          >
            {isAdminMode ? <Shield className="h-8 w-8 text-white" /> : <Leaf className="h-8 w-8 text-white" />}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 text-2xl font-bold text-white">
            {isAdminMode ? "Admin Portal" : "EcoLens"}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-1 text-sm text-white/70">
            {isAdminMode ? "Administrative Access" : "Smart Waste Classification"}
          </motion.p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </header>

      <main className="flex-1 px-6 -mt-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
          {/* Mode Toggle */}
          <div className="mb-4 flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setIsAdminMode(false)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${!isAdminMode ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              User
            </button>
            <button
              onClick={() => setIsAdminMode(true)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${isAdminMode ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Admin
            </button>
          </div>

          {/* Login/Signup Toggle */}
          <h2 className="text-xl font-bold text-foreground">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin
              ? isAdminMode ? "Sign in to admin dashboard" : "Sign in to continue your eco journey"
              : isAdminMode ? "Create the first admin account for your workspace" : "Join EcoLens and start saving the planet"}
          </p>

          {!isLogin && isAdminMode && (
            <p className="mt-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              No access code needed. If no admin exists yet, this account becomes the first admin after verification and sign in.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" disabled={loading} className="w-full gap-2 rounded-xl bg-primary text-primary-foreground">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-primary hover:underline">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Auth;
