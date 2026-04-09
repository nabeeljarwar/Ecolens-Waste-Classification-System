import { motion } from "framer-motion";
import { ArrowLeft, User, Bell, Moon, Shield, HelpCircle, Info } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-primary via-eco-forest to-eco-forest-dark px-4 pb-8 pt-12">
        <div className="relative z-10">
          <button onClick={() => navigate("/profile")} className="mb-4 flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-2xl font-bold text-primary-foreground">Settings</h1>
          <p className="mt-1 text-sm text-primary-foreground/70">Manage your preferences</p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full">
            <path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </header>

      <main className="px-4 pt-2">
        {/* Profile Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Profile</h2>
          <div className="glass-card space-y-4 rounded-2xl p-4">
            <div>
              <label className="text-sm font-medium text-foreground">Display Name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 rounded-xl border-border bg-background"
                placeholder="Your display name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                value={user?.email || ""}
                disabled
                className="mt-1 rounded-xl border-border bg-muted"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Preferences</h2>
          <div className="glass-card space-y-0 divide-y divide-border rounded-2xl">
            {[
              { icon: Bell, label: "Push Notifications", desc: "Get reminders for challenges" },
              { icon: Moon, label: "Dark Mode", desc: "Reduce eye strain" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch />
              </div>
            ))}
          </div>
        </motion.div>

        {/* About */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">About</h2>
          <div className="glass-card space-y-0 divide-y divide-border rounded-2xl">
            {[
              { icon: HelpCircle, label: "Help & Support" },
              { icon: Shield, label: "Privacy Policy" },
              { icon: Info, label: "About EcoLens" },
            ].map((item) => (
              <button key={item.label} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <p className="mt-8 text-center text-xs text-muted-foreground">EcoLens v1.0.0</p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
