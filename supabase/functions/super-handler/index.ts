import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Hono } from "jsr:@hono/hono";

const app = new Hono();

app.post("/super-handler/:id/:action", (c) => {
  const id = c.req.param("id");
  const action = c.req.param("action");

  return c.json({
    success: true,
    id,
    action,
    path: c.req.path,
    method: c.req.method,
  });
});

Deno.serve(app.fetch);