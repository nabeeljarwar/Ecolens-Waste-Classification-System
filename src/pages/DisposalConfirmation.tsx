import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Clock, Check, Video, Trash2, Recycle, Leaf, Cpu, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

type WasteCategory = "recyclable" | "non-recyclable" | "organic" | "e-waste";

interface PendingItem {
  id: string;
  category: WasteCategory;
  scannedAt: string;
  status: "pending" | "uploading" | "submitted";
  imageUrl: string | null;
}

const categoryDisplay: Record<WasteCategory, { icon: typeof Recycle; colorClass: string; label: string }> = {
  recyclable: { icon: Recycle, colorClass: "text-blue-500 bg-blue-500/10", label: "Recyclable" },
  "non-recyclable": { icon: XCircle, colorClass: "text-gray-500 bg-gray-500/10", label: "Non-Recyclable" },
  organic: { icon: Leaf, colorClass: "text-green-500 bg-green-500/10", label: "Organic" },
  "e-waste": { icon: Cpu, colorClass: "text-red-500 bg-red-500/10", label: "E-Waste" },
};

const DisposalConfirmation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("scan_history")
      .select("id, category, created_at, image_url")
      .eq("user_id", user.id)
      .eq("disposed", false)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setItems(
            data.map((s: any) => ({
              id: s.id,
              category: s.category as WasteCategory,
              scannedAt: formatDistanceToNow(new Date(s.created_at), { addSuffix: true }),
              status: "pending" as const,
              imageUrl: s.image_url || null,
            }))
          );
        }
        setLoading(false);
      });
  }, [user]);

  const handleUpload = (id: string) => {
    setUploadingId(id);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "uploading" } : item))
    );
    // Simulate upload, then mark as disposed in DB
    setTimeout(async () => {
      await supabase
        .from("scan_history")
        .update({ disposed: true })
        .eq("id", id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: "submitted" } : item))
      );
      setUploadingId(null);
    }, 3000);
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const submittedCount = items.filter((i) => i.status === "submitted").length;

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-eco-forest to-eco-forest-dark px-4 pb-8 pt-12">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/80"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4">
          <h1 className="text-2xl font-bold text-white">Disposal Confirmation</h1>
          <p className="mt-1 text-sm text-white/70">Upload video proof to verify proper disposal</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 flex gap-4">
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <Clock className="h-4 w-4 text-yellow-200" />
            <span className="text-sm font-medium text-white">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm">
            <Check className="h-4 w-4 text-green-200" />
            <span className="text-sm font-medium text-white">{submittedCount} Submitted</span>
          </div>
        </motion.div>

        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </header>

      <main className="px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card -mt-4 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">How it works</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Record a 5-second video showing you disposing the item in the correct bin. This helps verify proper waste management and earns you points.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Your Items</h2>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-16 text-center">
              <Check className="h-12 w-12 text-primary/40" />
              <p className="mt-4 font-medium text-muted-foreground">No pending disposals</p>
              <p className="mt-1 text-sm text-muted-foreground/70">Scan items and they'll appear here for disposal verification</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {items.map((item, index) => {
                  const display = categoryDisplay[item.category] || categoryDisplay["non-recyclable"];
                  const IconComp = display.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card overflow-hidden rounded-2xl"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden ${item.imageUrl ? '' : display.colorClass.split(" ")[1]}`}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={display.label} className="h-full w-full object-cover" />
                            ) : (
                              <IconComp className={`h-7 w-7 ${display.colorClass.split(" ")[0]}`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{display.label}</h3>
                            <p className="text-sm text-muted-foreground">Scanned {item.scannedAt}</p>
                          </div>
                          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "pending" ? "bg-yellow-100 text-yellow-700"
                              : item.status === "uploading" ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {item.status === "pending" ? "Pending" : item.status === "uploading" ? "Uploading..." : "Verified ✓"}
                          </div>
                        </div>

                        {item.status === "pending" && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4">
                            <Button onClick={() => handleUpload(item.id)} className="w-full gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
                              <Upload className="h-4 w-4" />
                              Upload Video Proof
                            </Button>
                          </motion.div>
                        )}

                        {item.status === "uploading" && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 3 }} className="h-full rounded-full bg-gradient-to-r from-primary to-eco-leaf" />
                            </div>
                            <p className="mt-2 text-center text-xs text-muted-foreground">Processing video...</p>
                          </motion.div>
                        )}

                        {item.status === "submitted" && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-3">
                            <Check className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Disposal verified! +25 points earned</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {items.length > 0 && pendingCount === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }} className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-eco-leaf/10">
              <span className="text-4xl">🎉</span>
            </motion.div>
            <h3 className="text-lg font-bold text-foreground">All Done!</h3>
            <p className="mt-1 text-sm text-muted-foreground">Great job! All your items have been verified.</p>
            <Button onClick={() => navigate("/")} className="mt-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              Back to Home
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default DisposalConfirmation;
