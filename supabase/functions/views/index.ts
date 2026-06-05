import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { app } from "./router.ts";

Deno.serve(app.fetch);
