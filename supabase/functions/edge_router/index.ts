// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
// deno-lint-ignore-file no-import-prefix
// deno-lint-ignore no-unversioned-import
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { publicApi } from "./router.ts";
import { HttpError } from "./errors.ts";
import { getRequestContext } from "./utils.ts";

type RequestBody = {
  requestData: unknown;
};

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);

    const api = parts[parts.length - 2];
    const apiRoute = parts[parts.length - 1];

    const { requestData }: RequestBody = await req.json();

    if (!api || !apiRoute || requestData == null) {
      return new Response(
        JSON.stringify({ error: "Missing required request fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const apiHandler = publicApi[api as keyof typeof publicApi];
    if (!apiHandler) {
      return new Response(
        JSON.stringify({ error: `Invalid api: ${api}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const routeHandler = apiHandler[apiRoute as keyof typeof apiHandler];
    if (typeof routeHandler !== "function") {
      return new Response(
        JSON.stringify({ error: `Invalid route: ${apiRoute}` }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const context = await getRequestContext(req, requestData);
    const apiResponse = await routeHandler({ requestData, context });

    return new Response(
      JSON.stringify(apiResponse),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error
      ? error.message
      : "Internal server error";

    return new Response(
      JSON.stringify({ error: message }),
      {
        status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
