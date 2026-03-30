import { motion } from "framer-motion";
import { ArrowLeft, Award, Gift, Star, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const rewardTiers = [
  { name: "Eco Starter", minPoints: 0, icon: "🌱", color: "from-emerald-400 to-teal-500" },
  { name: "Green Guardian", minPoints: 500, icon: "🛡️", color: "from-primary to-eco-leaf" },
  { name: "Earth Champion", minPoints: 1500, icon: "🏆", color: "from-amber-400 to-orange-500" },
  { name: "Planet Hero", minPoints: 5000, icon: "🌍", color: "from-violet-500 to-purple-600" },
];

const Rewards = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("total_points")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setTotalPoints(data.total_points);
      });
  }, [user]);

  const currentTier = [...rewardTiers].reverse().find((t) => totalPoints >= t.minPoints) || rewardTiers[0];
  const nextTier = rewardTiers[rewardTiers.indexOf(currentTier) + 1];
  const progress = nextTier ? Math.min(100, ((totalPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100) : 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-4 pb-8 pt-12">
        <div className="relative z-10">
          <button onClick={() => navigate("/profile")} className="mb-4 flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-white">Rewards & Points</h1>
          <p className="mt-1 text-sm text-white/70">Track your eco-impact</p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </header>

      <main className="px-4 pt-2">
        {/* Points Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card -mt-4 rounded-2xl p-6 text-center">
          <Award className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-2 text-4xl font-bold text-foreground">{totalPoints}</p>
          <p className="text-sm text-muted-foreground">Total Points Earned</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-2xl">{currentTier.icon}</span>
            <span className="font-semibold text-foreground">{currentTier.name}</span>
          </div>
          {nextTier && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentTier.name}</span>
                <span>{nextTier.name}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{nextTier.minPoints - totalPoints} points to next tier</p>
            </div>
          )}
        </motion.div>

        {/* How to Earn */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">How to Earn Points</h2>
          <div className="space-y-3">
            {[
              { icon: "📸", label: "Scan waste items", points: "+10 pts", desc: "Identify and classify waste" },
              { icon: "✅", label: "Dispose correctly", points: "+20 pts", desc: "Confirm proper disposal" },
              { icon: "🔥", label: "Daily streak", points: "+5 pts/day", desc: "Log in & scan daily" },
              { icon: "🏆", label: "Complete challenges", points: "+50-150 pts", desc: "Finish eco-challenges" },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="glass-card flex items-center gap-4 rounded-xl p-4">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-sm font-semibold text-primary">{item.points}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reward Tiers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Reward Tiers</h2>
          <div className="space-y-3">
            {rewardTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className={`glass-card flex items-center gap-4 rounded-xl p-4 ${totalPoints >= tier.minPoints ? "ring-2 ring-primary/30" : "opacity-60"}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tier.color}`}>
                  <span className="text-xl">{tier.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{tier.name}</p>
                  <p className="text-xs text-muted-foreground">{tier.minPoints}+ points</p>
                </div>
                {totalPoints >= tier.minPoints && <Star className="h-5 w-5 fill-primary text-primary" />}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Rewards;
