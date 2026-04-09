import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Loader2, Award, Scan, Flame, ShieldCheck, Shield } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  display_name: string | null;
  total_points: number;
  total_scans: number;
  streak_days: number;
  created_at: string;
  isAdmin?: boolean;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("total_points", { ascending: false }).limit(100),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    const adminIds = new Set((rolesRes.data || []).map((r: any) => r.user_id));
    const enriched = (profilesRes.data || []).map((u: any) => ({ ...u, isAdmin: adminIds.has(u.id) }));
    setUsers(enriched as UserProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const promoteToAdmin = async (userId: string) => {
    setPromoting(userId);
    try {
      const { error } = await supabase.functions.invoke("promote-user", {
        body: { targetUserId: userId },
      });
      if (error) throw error;
      toast.success("User promoted to admin!");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to promote user");
    } finally {
      setPromoting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-4 pb-8 pt-12">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">User Management</span>
          </div>
          <p className="mt-2 text-sm text-white/70">View and manage all users</p>
        </div>
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" className="w-full"><path fill="hsl(var(--background))" d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,45 1440,30 L1440,60 L0,60 Z" /></svg>
        </div>
      </header>

      <main className="px-4 -mt-2">
        <p className="mb-4 text-sm text-muted-foreground">{users.length} users registered</p>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {users.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card flex items-center gap-3 rounded-2xl p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {(u.display_name || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{u.display_name || "Anonymous"}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Award className="h-3 w-3" /> {u.total_points} pts</span>
                    <span className="flex items-center gap-1"><Scan className="h-3 w-3" /> {u.total_scans} scans</span>
                    <span className="flex items-center gap-1"><Flame className="h-3 w-3" /> {u.streak_days}d</span>
                  </div>
                </div>
                {u.isAdmin ? (
                  <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={promoting === u.id}
                    onClick={() => promoteToAdmin(u.id)}
                    className="gap-1 text-xs"
                  >
                    {promoting === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                    Make Admin
                  </Button>
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

export default AdminUsers;
