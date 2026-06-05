import { badRequest } from "./errors.ts";

export async function parseJsonBody<T>(req: Request): Promise<T> {
  if (req.method === "GET" || req.method === "HEAD") {
    return {} as T;
  }
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {} as T;
  }
  try {
    return (await req.json()) as T;
  } catch {
    badRequest("Invalid JSON body");
    return {} as T;
  }
}
