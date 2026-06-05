import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeIdentifier(value: string) {
  return /^[a-zA-Z0-9_]+$/.test(value);
}

function applyFilters(query: any, filters: Record<string, unknown>) {
  return Object.entries(filters).reduce((currentQuery, [key, value]) => {
    if (!isSafeIdentifier(key) || value === undefined || value === null || value === "") {
      return currentQuery;
    }

    if (Array.isArray(value)) {
      return currentQuery.in(key, value);
    }

    return currentQuery.eq(key, value);
  }, query);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceRoleKey) {
      return jsonResponse(500, { error: "Missing Supabase environment variables." });
    }

    const supabase = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "";
    const entity = typeof body?.entity === "string" ? body.entity : "";

    if (!action) {
      return jsonResponse(400, { error: "Missing action." });
    }

    if (!entity || !isSafeIdentifier(entity)) {
      return jsonResponse(400, { error: "Invalid entity." });
    }

    if (action === "create-record") {
      const payload = isPlainObject(body?.payload) ? body.payload : null;

      if (!payload) {
        return jsonResponse(400, { error: "Missing payload for create-record." });
      }

      const { data, error } = await supabase
        .from(entity)
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        return jsonResponse(400, { error: error.message, details: error });
      }

      return jsonResponse(200, { record: data });
    }

    if (action === "load-options") {
      const select = typeof body?.select === "string" && body.select.trim() ? body.select : "*";
      const filters = isPlainObject(body?.filters) ? body.filters : {};
      let query = supabase.from(entity).select(select);
      query = applyFilters(query, filters);

      const { data, error } = await query;

      if (error) {
        return jsonResponse(400, { error: error.message, details: error });
      }

      return jsonResponse(200, { options: data ?? [] });
    }

    return jsonResponse(400, { error: `Unsupported action: ${action}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(500, { error: message });
  }
});
