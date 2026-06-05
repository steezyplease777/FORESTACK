export type SupabaseErrorKind =
  | "RLS_DENIED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "NETWORK"
  | "UNKNOWN";

export interface NormalizedError {
  kind: SupabaseErrorKind;
  message: string;
  debug?: string;
}

export function normalizeSupabaseError(error: unknown): NormalizedError {
  if (!(error instanceof Error)) {
    return { kind: "UNKNOWN", message: "An unexpected error occurred" };
  }

  const msg = error.message.toLowerCase();

  if (
    msg.includes("permission denied") ||
    msg.includes("new row violates row-level security") ||
    msg.includes("row-level security")
  ) {
    return {
      kind: "RLS_DENIED",
      message: "You don't have access to that resource.",
      debug: error.message,
    };
  }

  if (msg.includes("pgrst116") || msg.includes("json object requested")) {
    return {
      kind: "NOT_FOUND",
      message: "The requested resource was not found.",
      debug: error.message,
    };
  }

  if (
    msg.includes("violates") ||
    msg.includes("invalid input") ||
    msg.includes("duplicate key") ||
    msg.includes("check constraint")
  ) {
    return {
      kind: "VALIDATION",
      message: "The data provided is invalid. Please check your input.",
      debug: error.message,
    };
  }

  if (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("timeout") ||
    msg.includes("econnrefused")
  ) {
    return {
      kind: "NETWORK",
      message: "Network error. Please check your connection and try again.",
      debug: error.message,
    };
  }

  return {
    kind: "UNKNOWN",
    message: error.message,
    debug: error.message,
  };
}
