import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Sprout, Camera, Upload, Loader2, Plus, Clock, Info, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const plantTypes = [
  {
    name: "Neem Tree",
    type: "tree",
    days: 90,
    impact: "high",
    emoji: "🌳",
    pointsPerUpdate: 30,
    tips: [
      "Water deeply once a week — neem prefers less frequent, deep watering",
      "Place in full sunlight (6-8 hours daily)",
      "Use well-drained sandy soil for best growth",
      "Neem grows slowly at first — be patient for the first month",
      "Protect seedlings from strong winds with a small barrier",
    ],
    ecoFact: "One neem tree absorbs ~12 kg of CO₂ per year and provides natural pest control for surrounding plants.",
  },
  {
    name: "Aloe Vera",
    type: "succulent",
    days: 30,
    impact: "medium",
    emoji: "🌿",
    pointsPerUpdate: 20,
    tips: [
      "Water only when soil is completely dry (every 2-3 weeks)",
      "Place in indirect bright sunlight — direct sun can burn leaves",
      "Use a pot with drainage holes to prevent root rot",
      "Don't water the center of the rosette, pour around the base",
      "Aloe thrives in room temperature (15-27°C)",
    ],
    ecoFact: "Aloe vera purifies indoor air by removing formaldehyde and benzene, and requires very little water.",
  },
  {
    name: "Basil (Tulsi)",
    type: "herb",
    days: 21,
    impact: "medium",
    emoji: "🌱",
    pointsPerUpdate: 20,
    tips: [
      "Water every 2 days — keep soil moist but not waterlogged",
      "Pinch off flower buds to encourage bushy leaf growth",
      "Place in a spot with 4-6 hours of sunlight daily",
      "Tulsi grows fast — harvest leaves regularly to promote growth",
      "Can be grown indoors on a windowsill easily",
    ],
    ecoFact: "Tulsi releases oxygen for 20 hours a day and absorbs CO₂, making it one of the best air-purifying plants.",
  },
  {
    name: "Sunflower",
    type: "flower",
    days: 45,
    impact: "medium",
    emoji: "🌻",
    pointsPerUpdate: 20,
    tips: [
      "Plant in full sun — sunflowers need 6-8 hours of direct sunlight",
      "Water deeply but infrequently; let soil dry between watering",
      "Support tall varieties with a stake as they grow",
      "Sunflowers are heliotropic — young ones follow the sun!",
      "Seeds can be harvested and used for food or bird feeders",
    ],
    ecoFact: "Sunflowers are phytoremediators — they can absorb toxic metals from soil, helping clean contaminated land.",
  },
  {
    name: "Moringa",
    type: "tree",
    days: 60,
    impact: "high",
    emoji: "🌿",
    pointsPerUpdate: 30,
    tips: [
      "Water sparingly — moringa is drought-resistant once established",
      "Plant in well-drained soil; avoid waterlogged areas",
      "Full sunlight is essential — at least 6 hours daily",
      "Prune regularly to keep the tree manageable and bushy",
      "Leaves can be harvested and consumed after 2 months",
    ],
    ecoFact: "Moringa absorbs 20x more CO₂ than regular trees. Its leaves, seeds, and roots are all edible and highly nutritious.",
  },
];

interface Challenge {
  id: string;
  plant_name: string;
  plant_type: string;
  eco_impact_level: string;
  target_days: number;
  status: string;
  total_points_earned: number;
  started_at: string;
  points_per_update: number;
}

interface Update {
  id: string;
  status: string;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  points_awarded: number;
}

const PlantChallenge = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchChallenges = async () => {
    if (!user) return;
    const { data } = await supabase.from("plant_challenges").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setChallenges((data as Challenge[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchChallenges(); }, [user]);

  const fetchUpdates = async (challengeId: string) => {
    const { data } = await supabase.from("plant_updates").select("*").eq("challenge_id", challengeId).order("created_at", { ascending: false });
    setUpdates((data as Update[]) || []);
  };

  const handleSelectChallenge = (c: Challenge) => {
    setSelectedChallenge(c);
    fetchUpdates(c.id);
    setShowUpdateForm(false);
    setShowTips(false);
  };

  const startChallenge = async (plant: typeof plantTypes[0]) => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("plant_challenges").insert({
      user_id: user.id,
      plant_name: plant.name,
      plant_type: plant.type,
      eco_impact_level: plant.impact,
      target_days: plant.days,
      points_per_update: plant.pointsPerUpdate,
    });
    if (error) {
      toast.error("Failed to start challenge");
    } else {
      toast.success(`${plant.name} challenge started! 🌱`);
      setShowNew(false);
      fetchChallenges();
    }
    setSubmitting(false);
  };

  const submitUpdate = async () => {
    if (!user || !selectedChallenge) return;
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/plant-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("scan-images").upload(path, imageFile, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("scan-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("plant_updates").insert({
      challenge_id: selectedChallenge.id,
      user_id: user.id,
      image_url: imageUrl,
      notes: notes.trim() || null,
    });

    if (error) {
      toast.error("Failed to submit update");
    } else {
      toast.success("Update submitted for review! 🌿");
      setShowUpdateForm(false);
      setNotes("");
      setImageFile(null);
      fetchUpdates(selectedChallenge.id);
    }
    setSubmitting(false);
  };

  const getPlantInfo = (name: string) => plantTypes.find((p) => p.name === name);

  // List view
  if (!selectedChallenge) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 px-4 pb-8 pt-12">
          <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate("/challenges")} className="flex items-center gap-2 text-white/80">
            <ArrowLeft className="h-5 w-5" /><span className="text-sm">Back</span>
          </motion.button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4">
            <h1 className="text-2xl font-bold text-white">Plant Care Challenges</h1>
            <p className="mt-1 text-sm text-white/70">Grow plants & earn points with weekly updates</p>
          </motion.div>
          <div className="absolute -bottom-1 left-0 right-0">
            <svg viewBox="0 0 1440 60" className="w-full"><path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" /></svg>
          </div>
        </header>

        <main className="px-4 -mt-2">
          <Button onClick={() => setShowNew(true)} className="mb-4 w-full gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Start New Challenge
          </Button>

          {showNew && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Choose a plant to grow:</h3>
              {plantTypes.map((plant) => (
                <button key={plant.name} onClick={() => startChallenge(plant)} disabled={submitting} className="glass-card flex w-full items-center gap-3 rounded-xl p-3 text-left">
                  <span className="text-2xl">{plant.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{plant.name}</p>
                    <p className="text-xs text-muted-foreground">{plant.days} days • {plant.impact} eco-impact</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{plant.ecoFact.slice(0, 60)}...</p>
                  </div>
                  <span className="text-xs font-medium text-primary">+{plant.pointsPerUpdate}/update</span>
                </button>
              ))}
            </motion.div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : challenges.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No active challenges yet. Start one above!</div>
          ) : (
            <div className="space-y-3">
              {challenges.map((c, i) => {
                const info = getPlantInfo(c.plant_name);
                return (
                  <motion.button key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => handleSelectChallenge(c)} className="glass-card flex w-full items-center gap-3 rounded-2xl p-4 text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl">
                      {info?.emoji || "🌱"}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{c.plant_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Started {formatDistanceToNow(new Date(c.started_at), { addSuffix: true })} • {c.target_days} day goal
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{c.total_points_earned} pts</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{c.status}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  const plantInfo = getPlantInfo(selectedChallenge.plant_name);

  // Detail view
  return (
    <div className="min-h-screen bg-background pb-8">
      <input ref={fileRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }} />
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 px-4 pb-8 pt-12">
        <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => setSelectedChallenge(null)} className="flex items-center gap-2 text-white/80">
          <ArrowLeft className="h-5 w-5" /><span className="text-sm">Back</span>
        </motion.button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4">
          <h1 className="text-2xl font-bold text-white">{selectedChallenge.plant_name}</h1>
          <p className="mt-1 text-sm text-white/70">{selectedChallenge.target_days} day challenge • {selectedChallenge.eco_impact_level} impact • +{selectedChallenge.points_per_update} pts/update</p>
        </motion.div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full"><path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" /></svg>
        </div>
      </header>

      <main className="px-4 -mt-2 space-y-4">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-primary">{selectedChallenge.total_points_earned}</p>
          <p className="text-sm text-muted-foreground">Points earned so far</p>
        </div>

        {/* Eco Fact */}
        {plantInfo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground text-sm">Eco Impact</h3>
            </div>
            <p className="text-xs text-muted-foreground">{plantInfo.ecoFact}</p>
          </motion.div>
        )}

        {/* Tips Toggle */}
        {plantInfo && (
          <Button variant="outline" onClick={() => setShowTips(!showTips)} className="w-full gap-2 rounded-xl">
            <Lightbulb className="h-4 w-4" /> {showTips ? "Hide" : "Show"} Care Tips
          </Button>
        )}

        {showTips && plantInfo && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card rounded-2xl p-4">
            <h3 className="font-semibold text-foreground text-sm mb-2">🌱 Care Tips for {plantInfo.name}</h3>
            <ul className="space-y-2">
              {plantInfo.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                  <span className="text-primary font-bold">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {selectedChallenge.status === "active" && (
          <Button onClick={() => setShowUpdateForm(!showUpdateForm)} className="w-full gap-2 rounded-xl">
            <Camera className="h-4 w-4" /> Submit Weekly Update
          </Button>
        )}

        {showUpdateForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="glass-card space-y-3 rounded-2xl p-4">
            <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center rounded-xl border-2 border-dashed border-muted-foreground/20 p-4">
              {imageFile ? (
                <p className="text-sm text-primary">{imageFile.name}</p>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-1 text-xs text-muted-foreground">Upload photo/video of your plant</p>
                </>
              )}
            </button>
            <Textarea placeholder="Notes about your plant's progress (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button onClick={submitUpdate} disabled={submitting || !imageFile} className="w-full rounded-xl">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for Review"}
            </Button>
          </motion.div>
        )}

        <h3 className="text-lg font-semibold text-foreground">Update History</h3>
        {updates.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No updates yet. Submit your first weekly update!</p>
        ) : (
          <div className="space-y-3">
            {updates.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card flex gap-3 rounded-xl p-3">
                {u.image_url ? (
                  <img src={u.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-xl">🌱</div>
                )}
                <div className="flex-1">
                  {u.notes && <p className="text-sm text-foreground line-clamp-2">{u.notes}</p>}
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${u.status === "approved" ? "bg-green-100 text-green-700" : u.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{u.status}</span>
                  {u.points_awarded > 0 && <p className="mt-1 text-xs font-bold text-primary">+{u.points_awarded} pts</p>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PlantChallenge;
