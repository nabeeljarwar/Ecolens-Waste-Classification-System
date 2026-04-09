import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Users, CheckSquare, FileText, Sprout, TrendingUp } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDisposals: 0,
    pendingReports: 0,
    activePlants: 0,
    totalPointsAwarded: 0,
    totalScans: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, disposals, reports, plants] = await Promise.all([
        supabase.from("profiles").select("id, total_points, total_scans", { count: "exact" }),
        supabase.from("scan_history").select("id", { count: "exact", head: true }).eq("verification_status", "pending").eq("disposed", false),
        supabase.from("eco_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("plant_challenges").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);

      const totalPoints = profiles.data?.reduce((sum: number, p: any) => sum + (p.total_points || 0), 0) || 0;
      const totalScans = profiles.data?.reduce((sum: number, p: any) => sum + (p.total_scans || 0), 0) || 0;

      setStats({
        totalUsers: profiles.count || 0,
        pendingDisposals: disposals.count || 0,
        pendingReports: reports.count || 0,
        activePlants: plants.count || 0,
        totalPointsAwarded: totalPoints,
        totalScans: totalScans,
      });
    };

    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "from-blue-500 to-cyan-500" },
    { label: "Pending Disposals", value: stats.pendingDisposals, icon: CheckSquare, color: "from-amber-500 to-orange-500" },
    { label: "Pending Reports", value: stats.pendingReports, icon: FileText, color: "from-red-500 to-pink-500" },
    { label: "Active Plant Challenges", value: stats.activePlants, icon: Sprout, color: "from-emerald-500 to-teal-500" },
    { label: "Total Points Awarded", value: stats.totalPointsAwarded.toLocaleString(), icon: TrendingUp, color: "from-violet-500 to-purple-500" },
    { label: "Total Scans", value: stats.totalScans, icon: LayoutDashboard, color: "from-primary to-eco-forest" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 px-4 pb-8 pt-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Admin Dashboard</span>
          </div>
          <p className="mt-2 text-sm text-white/70">System overview & management</p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </header>

      <main className="px-4 -mt-2">
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-2xl p-4"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <AdminNav />
    </div>
  );
};

export default AdminDashboard;
