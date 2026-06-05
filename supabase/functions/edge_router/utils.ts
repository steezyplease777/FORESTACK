// Setup type definitions for built-in Supabase Runtime APIs
// deno-lint-ignore-file no-import-prefix

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { HttpError } from "./errors.ts";


export function getEnv(name: string): string {
    const v = Deno.env.get(name);
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

export type Id = { id: string };

export function isValidUuid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidRegex.test(id);
}

export type AuthContext = {
    authUserId: string;
    companyId: string;
};

export type RequestContext = {
    auth: AuthContext;
};

type SoftrRequestData = {
    user_id?: unknown;
    company_id?: unknown;
};

export const supabase = helloSupabase();

export function helloSupabase() {
    return createClient(getEnv("SUPABASE_URL"), getEnv("SUPABASE_SERVICE_ROLE_KEY"), {
        auth: { persistSession: false },
    });
}

export async function getRequestContext(req: Request, requestData: unknown): Promise<RequestContext> {
    const softrSecret = req.headers.get("x-softr-secret");

    if (!softrSecret) {
        throw new HttpError(401, "Missing x-softr-secret header");
    }

    if (softrSecret !== getEnv("SOFTR_SHARED_SECRET")) {
        throw new HttpError(401, "Invalid x-softr-secret header");
    }

    const { userId, companyId } = extractSoftrAuth(requestData);
    const { data, error } = await supabase
        .from("app_organization_users")
        .select("id")
        .eq("user_id", userId);

    if (error) {
        throw new HttpError(400, error.message);
    }

    const orgUserIds = data.map((row) => row.id);
    if (!orgUserIds.length) {
        throw new HttpError(403, "User is not assigned to an organization");
    }

    const { data: companyUsers, error: companyError } = await supabase
        .from("app_company_users")
        .select("company_id")
        .eq("company_id", companyId)
        .in("org_user_id", orgUserIds)
        .limit(1);

    if (companyError) {
        throw new HttpError(400, companyError.message);
    }

    if (!companyUsers.length) {
        throw new HttpError(403, "User is not assigned to that company");
    }

    return {
        auth: {
            authUserId: userId,
            companyId,
        },
    };
}

function extractSoftrAuth(requestData: unknown): { userId: string; companyId: string } {
    const source = Array.isArray(requestData) ? requestData[0] : requestData;
    if (!source || typeof source !== "object") {
        throw new HttpError(400, "requestData must be an object");
    }

    const { user_id, company_id } = source as SoftrRequestData;
    if (typeof user_id !== "string" || typeof company_id !== "string") {
        throw new HttpError(400, "requestData must include user_id and company_id");
    }

    if (!isValidUuid(user_id) || !isValidUuid(company_id)) {
        throw new HttpError(400, "user_id and company_id must be valid UUIDs");
    }

    return { userId: user_id, companyId: company_id };
}