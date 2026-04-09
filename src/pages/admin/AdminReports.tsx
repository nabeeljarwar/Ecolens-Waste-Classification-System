import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Check, X, Loader2, MapPin } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface EcoReport {
  id: string;
  user_id: string;
  description: string;
  location_name: string | null;
  image_url: string | null;
  status: string;
  points_awarded: number;
  created_at: string;
}

const AdminReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<EcoReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "reviewed" | "resolved" | "all">("pending");

  const fetchReports = async () => {
    let query = supabase.from("eco_reports").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query.limit(50);
    setReports((data as EcoReport[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const handleReview = async (id: string, status: "reviewed" | "resolved") => {
    if (!user) return;
    setProcessing(id);
    const pointsToAward = status === "resolved" ? 30 : 0;

    await supabase.from("eco_reports").update({ status, points_awarded: pointsToAward }).eq("id", id);

    if (pointsToAward > 0) {
      const report = reports.find((r) => r.id === id);
      if (report) {
        const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", report.user_id).single();
        if (profile) {
          await supabase.from("profiles").update({ total_points: profile.total_points + pointsToAward }).eq("id", report.user_id);
        }
      }
    }

    toast.success(status === "resolved" ? "Report resolved! +30 points awarded." : "Report marked as reviewed.");
    setProcessing(null);
    fetchReports();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 px-4 pb-8 pt-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Eco Reports</span>
          </div>
          <p className="mt-2 text-sm text-white/70">Review illegal dumping reports</p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full"><path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" /></svg>
        </div>
      </header>

      <main className="px-4 -mt-2">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {(["pending", "reviewed", "resolved", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : reports.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No {filter} reports</div>
        ) : (
          <div className="space-y-3">
            {reports.map((report, i) => (
              <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-4">
                <div className="flex gap-3">
                  {report.image_url ? (
                    <img src={report.image_url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted text-3xl">📸</div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{report.description}</p>
                    {report.location_name && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {report.location_name}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</p>
                  </div>
                  <span className={`self-start rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${
                    report.status === "resolved" ? "bg-green-100 text-green-700"
                    : report.status === "reviewed" ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                  }`}>{report.status}</span>
                </div>

                {report.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleReview(report.id, "resolved")} disabled={processing === report.id} className="flex-1 gap-1 rounded-xl bg-green-600 text-white hover:bg-green-700">
                      <Check className="h-4 w-4" /> Resolve (+30pts)
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReview(report.id, "reviewed")} disabled={processing === report.id} className="flex-1 gap-1 rounded-xl">
                      Mark Reviewed
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <AdminNav />
    </div>
  );
};

export default AdminReports;
