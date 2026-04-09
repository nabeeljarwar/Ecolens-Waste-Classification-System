import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Check, X, Loader2 } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface DisposalItem {
  id: string;
  category: string;
  bin_color: string;
  image_url: string | null;
  verification_status: string;
  created_at: string;
  user_id: string;
  disposed: boolean;
  points_earned: number;
}

const AdminDisposals = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<DisposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const fetchItems = async () => {
    let query = supabase.from("scan_history").select("*").order("created_at", { ascending: false });
    if (filter !== "all") {
      query = query.eq("verification_status", filter);
    }
    const { data } = await query.limit(50);
    setItems((data as DisposalItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [filter]);

  const handleVerify = async (id: string, status: "approved" | "rejected") => {
    if (!user) return;
    setProcessing(id);

    const pointsToAward = status === "approved" ? 25 : 0;

    const { error } = await supabase
      .from("scan_history")
      .update({
        verification_status: status,
        disposed: status === "approved",
        points_earned: pointsToAward,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update");
      setProcessing(null);
      return;
    }

    // Award points to user if approved
    if (status === "approved") {
      const item = items.find((i) => i.id === id);
      if (item) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("id", item.user_id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ total_points: profile.total_points + pointsToAward })
            .eq("id", item.user_id);
        }
      }
    }

    toast.success(status === "approved" ? "Disposal approved! Points awarded." : "Disposal rejected.");
    setProcessing(null);
    fetchItems();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 px-4 pb-8 pt-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <CheckSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Verify Disposals</span>
          </div>
          <p className="mt-2 text-sm text-white/70">Review and approve waste disposal submissions</p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </header>

      <main className="px-4 -mt-2">
        {/* Filter tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No {filter} disposals found</div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-2xl">🗑️</div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold capitalize text-foreground">{item.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </p>
                    <p className="text-xs text-muted-foreground">User: {item.user_id.slice(0, 8)}...</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${
                    item.verification_status === "approved" ? "bg-green-100 text-green-700"
                    : item.verification_status === "rejected" ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {item.verification_status}
                  </span>
                </div>

                {item.verification_status === "pending" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleVerify(item.id, "approved")}
                      disabled={processing === item.id}
                      className="flex-1 gap-1 rounded-xl bg-green-600 text-white hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerify(item.id, "rejected")}
                      disabled={processing === item.id}
                      className="flex-1 gap-1 rounded-xl"
                    >
                      <X className="h-4 w-4" /> Reject
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

export default AdminDisposals;
