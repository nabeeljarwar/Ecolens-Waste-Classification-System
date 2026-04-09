import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, publishableKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const requestedAdmin = user.user_metadata?.requested_admin === true;
    const displayName = typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()
      ? user.user_metadata.display_name.trim()
      : "EcoUser";

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });

    if (profileError) {
      throw profileError;
    }

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) {
      throw rolesError;
    }

    const hasAdminRole = roles?.some((entry) => entry.role === "admin") ?? false;

    if (!roles || roles.length === 0) {
      let role: "admin" | "user" = "user";

      if (requestedAdmin) {
        const { count: adminCount, error: adminCountError } = await supabaseAdmin
          .from("user_roles")
          .select("id", { head: true, count: "exact" })
          .eq("role", "admin");

        if (adminCountError) throw adminCountError;
        if ((adminCount ?? 0) === 0) role = "admin";
      }

      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: user.id, role });

      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }

      return json({ success: true, role, adminAssigned: role === "admin" });
    }

    if (!hasAdminRole && requestedAdmin) {
      const { count: adminCount, error: adminCountError } = await supabaseAdmin
        .from("user_roles")
        .select("id", { head: true, count: "exact" })
        .eq("role", "admin");

      if (adminCountError) throw adminCountError;

      if ((adminCount ?? 0) === 0) {
        const { error: promoteError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: user.id, role: "admin" });

        if (promoteError && promoteError.code !== "23505") {
          throw promoteError;
        }

        return json({ success: true, role: "admin", adminAssigned: true });
      }
    }

    return json({ success: true, role: hasAdminRole ? "admin" : "user", adminAssigned: false });
  } catch (error: any) {
    return json({ error: error.message ?? "Unexpected error" }, 500);
  }
});
