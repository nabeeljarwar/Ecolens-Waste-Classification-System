import { motion } from "framer-motion";
import { Trophy, Camera, Leaf, Sprout, Award } from "lucide-react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, addDays, isSameDay, parseISO } from "date-fns";

const challenges = [
  {
    title: "Eco-Reporting",
    description: "Report illegal dumping sites in your area",
    points: 150,
    icon: Camera,
    color: "from-red-500 to-orange-500",
    progress: 0,
  },
  {
    title: "Green Habits",
    description: "Log your daily eco-friendly activities",
    points: 75,
    icon: Leaf,
    color: "from-eco-forest to-eco-leaf",
    progress: 0,
  },
  {
    title: "Plant Care",
    description: "Document and nurture your plants",
    points: 100,
    icon: Sprout,
    color: "from-emerald-400 to-teal-500",
    progress: 0,
  },
];

const Challenges = () => {
  const { user } = useAuth();
  const [totalPoints, setTotalPoints] = useState(0);
  const [activeDays, setActiveDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("total_points, streak_days")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setTotalPoints(data.total_points);
          setStreakCount(data.streak_days);
        }
      });

    // Fetch this week's activity from scan_history
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    supabase
      .from("scan_history")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekStart.toISOString())
      .lt("created_at", weekEnd.toISOString())
      .then(({ data }) => {
        if (!data) return;
        const days = [false, false, false, false, false, false, false];
        data.forEach((scan) => {
          const scanDate = parseISO(scan.created_at);
          for (let i = 0; i < 7; i++) {
            if (isSameDay(scanDate, addDays(weekStart, i))) {
              days[i] = true;
            }
          }
        });
        setActiveDays(days);
      });
  }, [user]);

  const activeDayCount = activeDays.filter(Boolean).length;
  const todayIndex = (new Date().getDay() + 6) % 7; // Mon=0

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 px-4 pb-8 pt-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Challenges</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h1 className="text-2xl font-bold text-white">Earn While You Save</h1>
            <p className="mt-1 text-sm text-white/80">
              Complete challenges to earn points and unlock rewards
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-2 gap-3"
          >
            <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-200" />
                <span className="text-sm font-medium text-white/80">Total Points</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-white">{totalPoints.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-200" />
                <span className="text-sm font-medium text-white/80">Streak</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-white">{streakCount} days</p>
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
        <div className="-mt-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-4 flex items-center justify-between"
          >
            <h2 className="text-lg font-semibold text-foreground">Active Challenges</h2>
          </motion.div>

          <div className="space-y-4">
            {challenges.map((challenge, index) => (
              <ChallengeCard key={challenge.title} {...challenge} index={index} />
            ))}
          </div>
        </div>

        {/* Weekly Streak - real data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <h2 className="mb-3 text-lg font-semibold text-foreground">Weekly Activity</h2>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                const isActive = activeDays[index];
                const isToday = index === todayIndex;
                return (
                  <motion.div
                    key={day}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-xs text-muted-foreground">{day}</span>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-gradient-to-br from-primary to-eco-leaf"
                          : "bg-muted"
                      } ${isToday ? "ring-2 ring-primary ring-offset-2" : ""}`}
                    >
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.8 + index * 0.05 }}
                          className="text-lg"
                        >
                          🔥
                        </motion.span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {activeDayCount > 0 ? (
                <>
                  <span className="font-semibold text-primary">{activeDayCount} day{activeDayCount > 1 ? "s" : ""} active this week!</span> Keep it up! 🎉
                </>
              ) : (
                <span>No activity this week yet. Start scanning! 📸</span>
              )}
            </p>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Challenges;
