import { motion } from "framer-motion";
import { ArrowLeft, Award, Star, Trophy, Gift, Check, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  required_count: number;
  points_reward: number;
}

interface UserBadge {
  badge_id: string;
  claimed_at: string;
}

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
  const [totalScans, setTotalScans] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [claimedBadges, setClaimedBadges] = useState<UserBadge[]>([]);
  const [approvedDisposals, setApprovedDisposals] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [completedPlants, setCompletedPlants] = useState(0);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, badgesRes, claimedRes, disposalRes, reportsRes, plantsRes] = await Promise.all([
        supabase.from("profiles").select("total_points, total_scans, streak_days").eq("id", user.id).single(),
        supabase.from("badges").select("*").order("required_count"),
        supabase.from("user_badges").select("badge_id, claimed_at").eq("user_id", user.id),
        supabase.from("scan_history").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("verification_status", "approved"),
        supabase.from("eco_reports").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "resolved"),
        supabase.from("plant_challenges").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
      ]);

      if (profileRes.data) {
        setTotalPoints(profileRes.data.total_points);
        setTotalScans(profileRes.data.total_scans);
        setStreakDays(profileRes.data.streak_days);
      }
      setBadges((badgesRes.data as Badge[]) || []);
      setClaimedBadges((claimedRes.data as UserBadge[]) || []);
      setApprovedDisposals(disposalRes.count || 0);
      setReportCount(reportsRes.count || 0);
      setCompletedPlants(plantsRes.count || 0);
    };

    fetchData();
  }, [user]);

  const getProgress = (badge: Badge): number => {
    switch (badge.category) {
      case "scanning": return Math.min(totalScans, badge.required_count);
      case "disposal": return Math.min(approvedDisposals, badge.required_count);
      case "reporting": return Math.min(reportCount, badge.required_count);
      case "planting": return Math.min(completedPlants, badge.required_count);
      case "streak": return Math.min(streakDays, badge.required_count);
      default: return 0;
    }
  };

  const canClaim = (badge: Badge): boolean => {
    return getProgress(badge) >= badge.required_count && !claimedBadges.some((cb) => cb.badge_id === badge.id);
  };

  const isClaimed = (badge: Badge): boolean => {
    return claimedBadges.some((cb) => cb.badge_id === badge.id);
  };

  const handleClaim = async (badge: Badge) => {
    if (!user) return;
    setClaiming(badge.id);

    const { error: badgeError } = await supabase.from("user_badges").insert({ user_id: user.id, badge_id: badge.id });
    if (badgeError) {
      toast.error("Failed to claim badge");
      setClaiming(null);
      return;
    }

    // Award badge points
    const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({ total_points: profile.total_points + badge.points_reward }).eq("id", user.id);
      setTotalPoints(profile.total_points + badge.points_reward);
    }

    setClaimedBadges([...claimedBadges, { badge_id: badge.id, claimed_at: new Date().toISOString() }]);
    toast.success(`Badge "${badge.name}" claimed! +${badge.points_reward} points 🎉`);
    setClaiming(null);
  };

  const currentTier = [...rewardTiers].reverse().find((t) => totalPoints >= t.minPoints) || rewardTiers[0];
  const nextTier = rewardTiers[rewardTiers.indexOf(currentTier) + 1];
  const progress = nextTier ? Math.min(100, ((totalPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100) : 100;

  const groupedBadges = {
    scanning: badges.filter((b) => b.category === "scanning"),
    disposal: badges.filter((b) => b.category === "disposal"),
    reporting: badges.filter((b) => b.category === "reporting"),
    planting: badges.filter((b) => b.category === "planting"),
    streak: badges.filter((b) => b.category === "streak"),
  };

  const categoryLabels: Record<string, string> = {
    scanning: "🔍 Scanning Badges",
    disposal: "✅ Disposal Badges",
    reporting: "📋 Reporting Badges",
    planting: "🌱 Plant Care Badges",
    streak: "🔥 Streak Badges",
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-4 pb-8 pt-12">
        <div className="relative z-10">
          <button onClick={() => navigate("/profile")} className="mb-4 flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft className="h-5 w-5" /><span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-white">Rewards & Badges</h1>
          <p className="mt-1 text-sm text-white/70">Earn badges, claim rewards</p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full"><path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" /></svg>
        </div>
      </header>

      <main className="px-4 pt-2">
        {/* Points Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card -mt-4 rounded-2xl p-6 text-center">
          <Award className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-2 text-4xl font-bold text-foreground">{totalPoints}</p>
          <p className="text-sm text-muted-foreground">Total Points</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-2xl">{currentTier.icon}</span>
            <span className="font-semibold text-foreground">{currentTier.name}</span>
          </div>
          {nextTier && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground"><span>{currentTier.name}</span><span>{nextTier.name}</span></div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{nextTier.minPoints - totalPoints} points to next tier</p>
            </div>
          )}
        </motion.div>

        {/* Badges by Category */}
        {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
          categoryBadges.length > 0 && (
            <motion.div key={category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">{categoryLabels[category]}</h2>
              <div className="space-y-3">
                {categoryBadges.map((badge) => {
                  const prog = getProgress(badge);
                  const claimed = isClaimed(badge);
                  const claimable = canClaim(badge);
                  const pct = Math.min(100, (prog / badge.required_count) * 100);

                  return (
                    <div key={badge.id} className={`glass-card rounded-xl p-4 ${claimed ? "ring-2 ring-primary/30" : ""}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{badge.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{badge.name}</p>
                            {claimed && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{badge.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{prog}/{badge.required_count}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {claimed ? (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">Claimed</span>
                          ) : claimable ? (
                            <Button size="sm" onClick={() => handleClaim(badge)} disabled={claiming === badge.id} className="rounded-full text-xs">
                              {claiming === badge.id ? <Loader2 className="h-3 w-3 animate-spin" /> : `Claim +${badge.points_reward}`}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">+{badge.points_reward} pts</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )
        ))}

        {/* Reward Tiers */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Reward Tiers</h2>
          <div className="space-y-3">
            {rewardTiers.map((tier, i) => (
              <div key={tier.name} className={`glass-card flex items-center gap-4 rounded-xl p-4 ${totalPoints >= tier.minPoints ? "ring-2 ring-primary/30" : "opacity-60"}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tier.color}`}>
                  <span className="text-xl">{tier.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{tier.name}</p>
                  <p className="text-xs text-muted-foreground">{tier.minPoints}+ points</p>
                </div>
                {totalPoints >= tier.minPoints && <Star className="h-5 w-5 fill-primary text-primary" />}
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Rewards;
