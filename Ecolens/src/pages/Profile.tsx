import { motion } from "framer-motion";
import { User, Settings, Award, History, LogOut, ChevronRight, Leaf, Medal, Target } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileData {
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
  total_scans: number;
  streak_days: number;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("display_name, avatar_url, total_points, total_scans, streak_days")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth", { replace: true });
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || "EcoUser";
  
  const scans = profile?.total_scans ?? 0;
  const points = profile?.total_points ?? 0;
  const streak = profile?.streak_days ?? 0;

  const achievements = [
    { name: "First Scan", icon: "🎯", earned: scans >= 1 },
    { name: "Eco Warrior", icon: "⚔️", earned: scans >= 10 },
    { name: "Plant Parent", icon: "🌱", earned: streak >= 7 },
    { name: "Zero Waste", icon: "♻️", earned: scans >= 50 },
    { name: "Community Hero", icon: "🦸", earned: points >= 1000 },
  ];
  const earnedCount = achievements.filter((a) => a.earned).length;

  const stats = [
    { label: "Total Scans", value: String(scans), icon: Target },
    { label: "Points Earned", value: String(points), icon: Award },
    { label: "Streak Days", value: String(streak), icon: Leaf },
  ];

  const menuItems = [
    { icon: History, label: "Scan History", action: () => navigate("/scan-history") },
    { icon: Award, label: "Rewards & Points", action: () => navigate("/rewards") },
    { icon: Settings, label: "Settings", action: () => navigate("/settings") },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-eco-forest to-eco-forest-dark px-4 pb-20 pt-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5"
        />

        <div className="relative z-10 flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-white" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-eco-leaf shadow-lg">
              <Medal className="h-4 w-4 text-white" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-xl font-bold text-white">{displayName}</h1>
            <p className="text-sm text-white/70">{user?.email}</p>
            <div className="mt-1 flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5">
              <span className="text-xs font-medium text-white">🌿 Eco Hero</span>
            </div>
          </motion.div>
        </div>

        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path
              fill="hsl(var(--background))"
              d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z"
            />
          </svg>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="-mt-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card grid grid-cols-3 gap-2 rounded-2xl p-4"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-center"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-2 text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <main className="mt-6 px-4">
        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
            <span className="text-sm text-primary">{earnedCount}/{achievements.length}</span>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex justify-between">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.name}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      achievement.earned ? "bg-primary/10" : "bg-muted"
                    }`}
                  >
                    <span className={`text-xl ${achievement.earned ? "" : "grayscale opacity-50"}`}>
                      {achievement.icon}
                    </span>
                  </div>
                  <span className="max-w-[50px] text-center text-[10px] text-muted-foreground">
                    {achievement.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.label}
                onClick={item.action}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="glass-card flex w-full items-center gap-4 rounded-xl p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </motion.button>
            ))}

            <motion.button
              onClick={handleSignOut}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 }}
              className="glass-card flex w-full items-center gap-4 rounded-xl p-4 text-destructive transition-colors hover:bg-destructive/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <span className="flex-1 text-left font-medium">Sign Out</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center text-xs text-muted-foreground"
        >
          EcoLens v1.0.0 • Made with 💚
        </motion.p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
