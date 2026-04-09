import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { syncAccountAccess } from "@/lib/syncAccountAccess";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const loadRole = async () => {
      try {
        await syncAccountAccess();

        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (!mounted) return;

        if (data && data.length > 0) {
          const isAdmin = data.some((r: any) => r.role === "admin");
          setRole(isAdmin ? "admin" : "user");
        } else {
          setRole("user");
        }
      } catch (error) {
        if (mounted) {
          console.error("Failed to load user role", error);
          setRole("user");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadRole();

    return () => {
      mounted = false;
    };
  }, [user]);

  return { role, isAdmin: role === "admin", loading };
};
