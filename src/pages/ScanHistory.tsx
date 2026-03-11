import { motion } from "framer-motion";
import { ArrowLeft, Search, Calendar, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface ScanRecord {
  id: string;
  category: string;
  bin_color: string | null;
  points_earned: number;
  disposed: boolean;
  created_at: string;
  image_url: string | null;
}

const binColorMap: Record<string, string> = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  black: "bg-gray-800",
};

const ScanHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("scan_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setScans(data);
        setLoading(false);
      });
  }, [user]);

  const filtered = scans.filter((s) =>
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-eco-forest to-eco-forest-dark px-4 pb-8 pt-12">
        <div className="relative z-10">
          <button onClick={() => navigate("/profile")} className="mb-4 flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-primary-foreground">Scan History</h1>
          <p className="mt-1 text-sm text-primary-foreground/70">{scans.length} items scanned</p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </header>

      <main className="px-4 pt-2">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search scans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-border bg-card"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-20 text-center">
            <Trash2 className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 font-medium text-muted-foreground">No scans yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Start scanning waste to build your history</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((scan, index) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card flex items-center gap-4 rounded-xl p-4"
              >
                <div className={`h-10 w-10 rounded-xl overflow-hidden ${scan.image_url ? '' : (binColorMap[scan.bin_color || ""] || "bg-muted")} flex items-center justify-center`}>
                  {scan.image_url ? (
                    <img src={scan.image_url} alt={scan.category} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg">♻️</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground capitalize">{scan.category}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(scan.created_at), "MMM d, yyyy • h:mm a")}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">+{scan.points_earned}</p>
                  <p className="text-[10px] text-muted-foreground">{scan.disposed ? "Disposed" : "Pending"}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ScanHistory;
