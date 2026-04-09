import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, History, Leaf, Sparkles, ArrowRight, Recycle, Trash2, Cpu } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { MockCamera } from "@/components/MockCamera";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const categoryMeta: Record<string, { icon: string; color: string }> = {
  recyclable: { icon: "♻️", color: "#3B82F6" },
  organic: { icon: "🌿", color: "#22C55E" },
  "e-waste": { icon: "⚡", color: "#EF4444" },
  "non-recyclable": { icon: "🗑️", color: "#6B7280" },
};

const categories = [
  { name: "Recyclable", icon: Recycle, color: "bg-blue-500/10", textColor: "text-blue-500", desc: "Plastics, glass, paper, metals" },
  { name: "Non-Recyclable", icon: Trash2, color: "bg-gray-500/10", textColor: "text-gray-500", desc: "Mixed waste, contaminated items" },
  { name: "Organic", icon: Leaf, color: "bg-green-500/10", textColor: "text-green-500", desc: "Food scraps, garden waste" },
  { name: "E-Waste", icon: Cpu, color: "bg-red-500/10", textColor: "text-red-500", desc: "Electronics, batteries, cables" },
];

const Scan = () => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentScans, setRecentScans] = useState<{ category: string; time: string; icon: string; color: string; imageUrl: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("scan_history")
      .select("category, created_at, image_url")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) {
          setRecentScans(
            data.map((s: any) => {
              const meta = categoryMeta[s.category] || { icon: "🗑️", color: "#6B7280" };
              return {
                category: s.category.charAt(0).toUpperCase() + s.category.slice(1),
                time: formatDistanceToNow(new Date(s.created_at), { addSuffix: true }),
                icon: meta.icon,
                color: meta.color,
                imageUrl: s.image_url || null,
              };
            })
          );
        }
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pb-4 pt-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Scan Waste</h1>
            <p className="text-sm text-muted-foreground">AI-powered classification</p>
          </div>
        </motion.div>
      </header>

      <main className="px-4">
        {/* Main Scan Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mt-4"
        >
          <div className="glass-card overflow-hidden rounded-3xl">
            <div className="relative bg-gradient-to-br from-primary/5 via-eco-mint to-eco-mint-accent p-8">
              <motion.div
                animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute right-8 top-4"
              >
                <Leaf className="h-8 w-8 text-primary/20" />
              </motion.div>
              <motion.div
                animate={{ y: [10, -10, 10], rotate: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute bottom-4 left-8"
              >
                <Sparkles className="h-6 w-6 text-eco-leaf/30" />
              </motion.div>

              <div className="flex flex-col items-center text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCameraOpen(true)}
                  className="relative"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-primary/30"
                  />
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-eco-forest shadow-glow">
                    <Camera className="h-12 w-12 text-white" />
                  </div>
                </motion.button>

                <h2 className="mt-6 text-xl font-bold text-foreground">Tap to Scan</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Point your camera at any waste item for instant classification
                </p>

                <Button
                  onClick={() => setCameraOpen(true)}
                  className="mt-6 gap-2 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                >
                  Open Camera
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Categories we detect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6"
        >
          <h3 className="mb-3 text-lg font-semibold text-foreground">What We Classify</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="glass-card rounded-xl p-3"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cat.color}`}>
                  <cat.icon className={`h-4 w-4 ${cat.textColor}`} />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6"
        >
          <h3 className="mb-3 text-lg font-semibold text-foreground">How it works</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: "1", title: "Scan", desc: "Point camera" },
              { step: "2", title: "Classify", desc: "AI analyzes" },
              { step: "3", title: "Dispose", desc: "Follow guide" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className="glass-card rounded-xl p-4 text-center"
              >
                <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {item.step}
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Scans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6"
        >
           <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Recent Scans</h3>
            <button onClick={() => navigate("/scan-history")} className="flex items-center gap-1 text-sm text-primary">
              <History className="h-4 w-4" />
              View all
            </button>
          </div>
          {recentScans.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No scans yet. Start scanning!</p>
          ) : (
          <div className="space-y-3">
            {recentScans.map((scan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                className="glass-card flex items-center gap-4 rounded-xl p-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted overflow-hidden">
                  {scan.imageUrl ? (
                    <img src={scan.imageUrl} alt={scan.category} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">{scan.icon}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{scan.category}</p>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: scan.color }} />
                    <p className="text-sm text-muted-foreground">{scan.category} Waste</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{scan.time}</span>
              </motion.div>
            ))}
          </div>
          )}
        </motion.div>
      </main>

      <MockCamera isOpen={cameraOpen} onClose={() => setCameraOpen(false)} />
      <BottomNav />
    </div>
  );
};

export default Scan;
