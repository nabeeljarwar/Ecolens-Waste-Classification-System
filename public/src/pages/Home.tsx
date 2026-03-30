import { motion } from "framer-motion";
import { Leaf, Sparkles } from "lucide-react";
import { StatusCard } from "@/components/StatusCard";
import { EcoCarousel } from "@/components/EcoCarousel";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalScans, setTotalScans] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Fetch profile stats
    supabase
      .from("profiles")
      .select("total_points, total_scans")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setTotalPoints(data.total_points);
          setTotalScans(data.total_scans);
        }
      });

    // Fetch pending disposals count
    supabase
      .from("scan_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("disposed", false)
      .then(({ count }) => {
        setPendingCount(count ?? 0);
      });
  }, [user]);

  const co2Saved = (totalScans * 0.22).toFixed(1);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-eco-forest to-eco-forest-dark px-4 pb-8 pt-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5"
        />
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-8 h-24 w-24 rounded-full bg-eco-leaf/20"
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">EcoLens</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6"
          >
            <p className="text-sm font-medium text-white/70">Welcome back!</p>
            <h1 className="mt-1 text-2xl font-bold text-white">Make Every Scan Count</h1>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-semibold text-white">{totalPoints} pts</span>
              </div>
              <span className="text-sm text-white/70">
                {totalPoints >= 5000 ? "Planet Hero" : totalPoints >= 1500 ? "Earth Champion" : totalPoints >= 500 ? "Green Guardian" : "Eco Starter"}
              </span>
            </div>
          </motion.div>
        </div>

        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </header>

      <main className="px-4">
        <div className="-mt-4">
          <StatusCard pendingCount={pendingCount} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Eco Facts</h2>
            <span className="text-xs text-muted-foreground">Auto-sliding</span>
          </div>
          <EcoCarousel />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 grid grid-cols-2 gap-4"
        >
          <div className="glass-card rounded-2xl p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco-ocean/10">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-eco-ocean" fill="currentColor">
                <path d="M11.5 3C10.12 3 9 4.12 9 5.5V6H6.5C5.67 6 5 6.67 5 7.5V8H19V7.5C19 6.67 18.33 6 17.5 6H15V5.5C15 4.12 13.88 3 12.5 3H11.5M5 9V20C5 21.1 5.9 22 7 22H17C18.1 22 19 21.1 19 20V9H5Z" />
              </svg>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{totalScans}</p>
            <p className="text-xs text-muted-foreground">Items Recycled</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco-leaf/10">
              <Leaf className="h-5 w-5 text-eco-leaf" />
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground">{co2Saved} kg</p>
            <p className="text-xs text-muted-foreground">CO₂ Saved</p>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Home;
