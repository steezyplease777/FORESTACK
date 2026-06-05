import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function createSupabaseFromRequest(req: Request): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  const authHeader = req.headers.get("Authorization") ?? "";

  return createClient(url, anonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function loadViewRecord(
  supabase: SupabaseClient,
  viewId: string,
): Promise<import("./types.ts").ViewRecord | null> {
  const { data, error } = await supabase
    .from("app_data_views")
    .select("*")
    .eq("id", viewId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load view: ${error.message}`);
  }
  if (!data) return null;
  return data as import("./types.ts").ViewRecord;
}
