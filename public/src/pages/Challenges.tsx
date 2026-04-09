import { motion } from "framer-motion";
import { Trophy, Camera, Leaf, Sprout, Award, Lock, Gift, Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Challenges = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [totalPoints, setTotalPoints] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [plantCount, setPlantCount] = useState(0);
  const [currentStreakDay, setCurrentStreakDay] = useState(0);
  const [lastStreakClaim, setLastStreakClaim] = useState<string | null>(null);
  const [claimingStreak, setClaimingStreak] = useState(false);

  useEffect(() => {
    if (!user) return;

    supabase.from("profiles").select("total_points, streak_days, current_streak_day, last_streak_claim").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setTotalPoints(data.total_points);
        setStreakCount(data.streak_days);
        setCurrentStreakDay((data as any).current_streak_day || 0);
        setLastStreakClaim((data as any).last_streak_claim || null);
      }
    });

    supabase.from("eco_reports").select("id", { count: "exact", head: true }).eq("user_id", user.id).then(({ count }) => setReportCount(count || 0));
    supabase.from("plant_challenges").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active").then(({ count }) => setPlantCount(count || 0));
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const alreadyClaimed = lastStreakClaim === today;

  const getNextStreakPoints = (day: number) => (day + 1) * 5; // Day 1: 5, Day 2: 10, Day 3: 15...

  const canClaimStreak = () => {
    if (alreadyClaimed) return false;
    if (!lastStreakClaim) return true;
    const lastDate = new Date(lastStreakClaim);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 1;
  };

  const isStreakBroken = () => {
    if (!lastStreakClaim) return false;
    const lastDate = new Date(lastStreakClaim);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 1;
  };

  const handleClaimStreak = async () => {
    if (!user || !canClaimStreak()) return;
    setClaimingStreak(true);

    const broken = isStreakBroken();
    const newDay = broken ? 1 : currentStreakDay + 1;
    const pointsToAdd = newDay * 5;

    const { data: profile } = await supabase.from("profiles").select("total_points, streak_days").eq("id", user.id).single();
    if (!profile) { setClaimingStreak(false); return; }

    const { error } = await supabase.from("profiles").update({
      current_streak_day: newDay,
      last_streak_claim: today,
      streak_days: broken ? 1 : profile.streak_days + 1,
      total_points: profile.total_points + pointsToAdd,
    } as any).eq("id", user.id);

    if (error) {
      toast.error("Failed to claim streak");
    } else {
      toast.success(`Day ${newDay} claimed! +${pointsToAdd} points 🔥`);
      setCurrentStreakDay(newDay);
      setLastStreakClaim(today);
      setStreakCount(broken ? 1 : profile.streak_days + 1);
      setTotalPoints(profile.total_points + pointsToAdd);
    }
    setClaimingStreak(false);
  };

  const challenges = [
    {
      title: "Eco-Reporting",
      description: `Report illegal dumping sites • ${reportCount} submitted`,
      points: 30,
      icon: Camera,
      color: "from-red-500 to-orange-500",
      action: () => navigate("/eco-report"),
      active: true,
    },
    {
      title: "Green Habits",
      description: "Log your daily eco-friendly activities",
      points: 15,
      icon: Leaf,
      color: "from-eco-forest to-eco-leaf",
      action: () => {},
      active: false,
    },
    {
      title: "Plant Care",
      description: `Grow & document plants • ${plantCount} active`,
      points: "20-30",
      icon: Sprout,
      color: "from-emerald-400 to-teal-500",
      action: () => navigate("/plant-challenge"),
      active: true,
    },
  ];

  // Generate streak days display
  const streakDays = Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    const points = dayNum * 5;
    const isClaimed = dayNum <= currentStreakDay;
    const isNext = dayNum === currentStreakDay + 1;
    return { dayNum, points, isClaimed, isNext };
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-4 pb-8 pt-12">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }} className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm"><Trophy className="h-5 w-5 text-white" /></div>
            <span className="text-xl font-bold text-white">Challenges</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
            <h1 className="text-2xl font-bold text-white">Earn While You Save</h1>
            <p className="mt-1 text-sm text-white/80">Complete challenges, get verified by admin, earn points</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2"><Award className="h-5 w-5 text-yellow-200" /><span className="text-sm font-medium text-white/80">Total Points</span></div>
              <p className="mt-1 text-2xl font-bold text-white">{totalPoints.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-200" /><span className="text-sm font-medium text-white/80">Streak</span></div>
              <p className="mt-1 text-2xl font-bold text-white">{streakCount} days</p>
            </div>
          </motion.div>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full"><path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" /></svg>
        </div>
      </header>

      <main className="px-4">
        {/* Daily Streak Redeem */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="-mt-2 mb-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">🔥 Daily Streak</h2>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              {streakDays.map((day) => (
                <motion.div key={day.dayNum} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + day.dayNum * 0.05 }} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">Day {day.dayNum}</span>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    day.isClaimed
                      ? "bg-gradient-to-br from-primary to-eco-leaf"
                      : day.isNext && canClaimStreak()
                        ? "bg-primary/20 ring-2 ring-primary ring-offset-2"
                        : "bg-muted"
                  }`}>
                    {day.isClaimed ? <span className="text-lg">🔥</span> : <span className="text-[10px] font-bold text-muted-foreground">+{day.points}</span>}
                  </div>
                </motion.div>
              ))}
            </div>

            {currentStreakDay >= 7 && (
              <p className="text-center text-xs text-primary font-semibold mb-2">🎉 Week complete! Streak continues with +{(currentStreakDay + 1) * 5} pts next</p>
            )}

            {isStreakBroken() && !alreadyClaimed && (
              <p className="text-center text-xs text-destructive mb-2">⚠️ You missed a day! Streak resets to Day 1</p>
            )}

            <Button
              onClick={handleClaimStreak}
              disabled={!canClaimStreak() || claimingStreak}
              className="w-full gap-2 rounded-xl"
            >
              {claimingStreak ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : alreadyClaimed ? (
                <>✅ Claimed Today — Come back tomorrow!</>
              ) : (
                <><Gift className="h-4 w-4" /> Claim Day {isStreakBroken() ? 1 : currentStreakDay + 1} (+{(isStreakBroken() ? 1 : currentStreakDay + 1) * 5} pts)</>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Active Challenges */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Active Challenges</h2>
          <div className="space-y-4">
            {challenges.map((challenge, index) => (
              <motion.button
                key={challenge.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={challenge.action}
                disabled={!challenge.active}
                className="glass-card flex w-full items-center gap-4 rounded-2xl p-4 text-left disabled:opacity-60"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${challenge.color}`}>
                  <challenge.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{challenge.title}</p>
                    {!challenge.active && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Coming Soon</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{challenge.description}</p>
                </div>
                <span className="text-sm font-bold text-primary">+{challenge.points}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Points info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-6 glass-card rounded-2xl p-4">
          <h3 className="font-semibold text-foreground">📋 How Points Work</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>• Daily streak: <strong className="text-foreground">Day × 5 pts</strong> (Day 1 = 5, Day 2 = 10...)</li>
            <li>• Disposal verification: <strong className="text-foreground">+25 pts</strong> (after admin approval)</li>
            <li>• Eco-report resolved: <strong className="text-foreground">+30 pts</strong> (after admin review)</li>
            <li>• Plant update: <strong className="text-foreground">+20-30 pts</strong> (based on eco-impact)</li>
            <li>• Miss a day? Streak resets to Day 1!</li>
          </ul>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Challenges;
