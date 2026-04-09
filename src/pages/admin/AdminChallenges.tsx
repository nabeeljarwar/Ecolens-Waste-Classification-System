import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sprout, Check, Loader2 } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface PlantUpdate {
  id: string;
  challenge_id: string;
  user_id: string;
  image_url: string | null;
  video_url: string | null;
  notes: string | null;
  status: string;
  points_awarded: number;
  created_at: string;
}

const AdminChallenges = () => {
  const [updates, setUpdates] = useState<PlantUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const fetchUpdates = async () => {
    let query = supabase.from("plant_updates").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query.limit(50);
    setUpdates((data as PlantUpdate[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchUpdates(); }, [filter]);

  const handleVerify = async (id: string, status: "approved" | "rejected") => {
    setProcessing(id);
    const update = updates.find((u) => u.id === id);
    if (!update) return;

    // Get the challenge to determine points_per_update based on eco impact
    const { data: challenge } = await supabase.from("plant_challenges").select("points_per_update").eq("id", update.challenge_id).single();
    const pointsToAward = status === "approved" ? (challenge?.points_per_update || 20) : 0;

    await supabase.from("plant_updates").update({ status, points_awarded: pointsToAward }).eq("id", id);

    if (pointsToAward > 0) {
      const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", update.user_id).single();
      if (profile) {
        await supabase.from("profiles").update({ total_points: profile.total_points + pointsToAward }).eq("id", update.user_id);
      }
      // Update plant challenge total
      const { data: challenge } = await supabase.from("plant_challenges").select("total_points_earned").eq("id", update.challenge_id).single();
      if (challenge) {
        await supabase.from("plant_challenges").update({ total_points_earned: (challenge as any).total_points_earned + pointsToAward }).eq("id", update.challenge_id);
      }
    }

    toast.success(status === "approved" ? "Update approved! +20 points." : "Update rejected.");
    setProcessing(null);
    fetchUpdates();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 px-4 pb-8 pt-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Sprout className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Plant Challenge Updates</span>
          </div>
          <p className="mt-2 text-sm text-white/70">Review weekly plant care submissions</p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full"><path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" /></svg>
        </div>
      </header>

      <main className="px-4 -mt-2">
        <div className="mb-4 flex gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : updates.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No {filter} plant updates</div>
        ) : (
          <div className="space-y-3">
            {updates.map((update, i) => (
              <motion.div key={update.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-2xl p-4">
                <div className="flex gap-3">
                  {update.image_url ? (
                    <img src={update.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-2xl">🌱</div>
                  )}
                  <div className="flex-1">
                    {update.notes && <p className="text-sm text-foreground line-clamp-2">{update.notes}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}</p>
                    <p className="text-xs text-muted-foreground">User: {update.user_id.slice(0, 8)}...</p>
                  </div>
                  <span className={`self-start rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${
                    update.status === "approved" ? "bg-green-100 text-green-700"
                    : update.status === "rejected" ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                  }`}>{update.status}</span>
                </div>

                {update.status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleVerify(update.id, "approved")} disabled={processing === update.id} className="flex-1 gap-1 rounded-xl bg-green-600 text-white hover:bg-green-700">
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleVerify(update.id, "rejected")} disabled={processing === update.id} className="flex-1 gap-1 rounded-xl">
                      Reject
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

export default AdminChallenges;
