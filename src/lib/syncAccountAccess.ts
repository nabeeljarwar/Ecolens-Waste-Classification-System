import { supabase } from "@/integrations/supabase/client";

type AccountRole = "admin" | "user";

interface SyncAccountResponse {
  success: boolean;
  role: AccountRole;
  adminAssigned?: boolean;
  error?: string;
}

export const syncAccountAccess = async () => {
  const { data, error } = await supabase.functions.invoke("register-admin");

  if (error) throw error;

  const response = data as SyncAccountResponse | null;

  if (!response) {
    throw new Error("Unable to sync account access.");
  }

  if (response.error) {
    throw new Error(response.error);
  }

  return response;
};