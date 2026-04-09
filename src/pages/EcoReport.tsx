import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, MapPin, Send, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { toast } from "sonner";

const EcoReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { latitude, longitude } = useGeolocation();
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user || !description.trim()) {
      toast.error("Please add a description");
      return;
    }
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/report-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("scan-images").upload(path, imageFile, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("scan-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    }

    const { error } = await supabase.from("eco_reports").insert({
      user_id: user.id,
      description: description.trim(),
      location_name: locationName.trim() || null,
      location_lat: latitude,
      location_lng: longitude,
      image_url: imageUrl,
    });

    if (error) {
      toast.error("Failed to submit report");
      console.error(error);
    } else {
      toast.success("Report submitted! It will be reviewed by admin. 📋");
      navigate("/challenges");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="relative overflow-hidden bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 px-4 pb-8 pt-12">
        <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate("/challenges")} className="flex items-center gap-2 text-white/80">
          <ArrowLeft className="h-5 w-5" /><span className="text-sm">Back</span>
        </motion.button>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4">
          <h1 className="text-2xl font-bold text-white">Report Illegal Dumping</h1>
          <p className="mt-1 text-sm text-white/70">Help keep our campus clean • Earn 30 pts after approval</p>
        </motion.div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full"><path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" /></svg>
        </div>
      </header>

      <main className="px-4 -mt-2 space-y-4">
        {/* Photo upload */}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} onClick={() => fileRef.current?.click()} className="glass-card flex cursor-pointer flex-col items-center rounded-2xl p-6">
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="h-48 w-full rounded-xl object-cover" />
          ) : (
            <>
              <Camera className="h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">Tap to take a photo</p>
              <p className="text-xs text-muted-foreground">Capture the dumping site</p>
            </>
          )}
        </motion.div>

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <label className="mb-1 block text-sm font-medium text-foreground">Description *</label>
          <Textarea placeholder="Describe the illegal dumping site..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
        </motion.div>

        {/* Location */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <label className="mb-1 block text-sm font-medium text-foreground">Location Name</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="e.g., Near Admin Block" value={locationName} onChange={(e) => setLocationName(e.target.value)} className="pl-10" />
          </div>
          {latitude && longitude && (
            <p className="mt-1 text-xs text-muted-foreground">📍 GPS auto-detected: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
          )}
        </motion.div>

        <Button onClick={handleSubmit} disabled={submitting || !description.trim()} className="w-full gap-2 rounded-2xl bg-primary py-6 text-primary-foreground">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit Report
        </Button>
      </main>
    </div>
  );
};

export default EcoReport;
