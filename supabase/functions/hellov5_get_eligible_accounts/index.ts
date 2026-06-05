import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * hellov5_get_eligible_accounts
 * 
 * Fetches eligible Account records from Softr that can be added to a View.
 * Uses Softr Search API with filters to only fetch ACTIVE accounts.
 * - Filters to ONLY records where status (JjEFr.label) equals "ACTIVE"
 * - Excludes records that are already in the View (existingAccountIds)
 * 
 * Request body:
 *   { existingAccountIds: string[] }
 * 
 * Response:
 *   { success: true, accounts: Account[] }
 *   or { success: false, error: string }
 * 
 * API Reference: https://docs.softr.io/softr-api/softr-database-api/records/search-records
 */

const SOFTR_DATABASE_ID = "0f87a821-5bca-44d7-9406-a2a701299d62";
const SOFTR_TABLE_ID = "XfnwWOgfREzWKl"; // Account table
const SOFTR_API_KEY = Deno.env.get("SOFTR_API_KEY")!;

// Field IDs
const FIELD_STATUS = "JjEFr";        // Status field (object with .label)
const FIELD_COMPANY_NAME = "2dRKu";  // Company name
const FIELD_COMPANY_LOGO = "WaQyB";  // Company logo (may be empty)
const FIELD_ACCOUNT_NAME = "F6rxe";  // Account name
const FIELD_ACCOUNT_EMAIL = "9vcyP"; // Account email

interface SoftrRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface SoftrSearchResponse {
  data: SoftrRecord[];
  metadata: {
    offset: number;
    limit: number;
    total: number;
  };
}

interface EligibleAccount {
  record_id: string;
  companyName: string;
  companyLogo: string | null;
  accountName: string;
  accountEmail: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const existingAccountIds: string[] = body.existingAccountIds || [];
    const existingSet = new Set(existingAccountIds);

    // Use Softr Search API with filter for ACTIVE status
    // API: POST /databases/{databaseId}/tables/{tableId}/records/search
    const searchUrl = `https://tables-api.softr.io/api/v1/databases/${SOFTR_DATABASE_ID}/tables/${SOFTR_TABLE_ID}/records/search`;
    
    // Softr Search API doesn't support nested field access or sort
    // Fetch all records and filter client-side
    const searchBody = {
      paging: {
        offset: 0,
        limit: 100
      }
    };

    const allRecords: SoftrRecord[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    // Paginate through results
    while (hasMore) {
      const response = await fetch(searchUrl, {
        method: "POST",
        headers: {
          "Softr-Api-Key": SOFTR_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...searchBody,
          paging: { offset, limit }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Softr Search API error: ${response.status} - ${errorText}`);
      }

      const result: SoftrSearchResponse = await response.json();
      allRecords.push(...result.data);

      // Check if there are more records
      const totalFetched = offset + result.data.length;
      if (result.data.length < limit || totalFetched >= result.metadata.total) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    // Transform records, excluding ones already in the View
    const eligibleAccounts: EligibleAccount[] = [];

    for (const record of allRecords) {
      // Skip if already in View
      if (existingSet.has(record.id)) {
        continue;
      }

      // Filter for ACTIVE status client-side
      const statusField = record.fields[FIELD_STATUS];
      let statusLabel = "";
      if (statusField && typeof statusField === "object" && "label" in statusField) {
        statusLabel = String((statusField as { label: string }).label);
      } else if (typeof statusField === "string") {
        statusLabel = statusField;
      }
      if (statusLabel !== "ACTIVE") {
        continue;
      }

      // Extract fields
      const companyName = String(record.fields[FIELD_COMPANY_NAME] || "Unknown Company");
      
      // Company logo can be an array of objects with url, or null/undefined
      let companyLogo: string | null = null;
      const logoField = record.fields[FIELD_COMPANY_LOGO];
      if (Array.isArray(logoField) && logoField.length > 0) {
        companyLogo = logoField[0]?.url || logoField[0]?.thumbnailUrl || null;
      } else if (logoField && typeof logoField === "object") {
        companyLogo = (logoField as { url?: string; thumbnailUrl?: string }).url || 
                      (logoField as { url?: string; thumbnailUrl?: string }).thumbnailUrl || null;
      }

      const accountName = String(record.fields[FIELD_ACCOUNT_NAME] || "Unknown Account");
      const accountEmail = String(record.fields[FIELD_ACCOUNT_EMAIL] || "");

      eligibleAccounts.push({
        record_id: record.id,
        companyName,
        companyLogo,
        accountName,
        accountEmail,
      });
    }

    // Sort client-side by company name, then account name
    eligibleAccounts.sort((a, b) => {
      const companyCompare = a.companyName.localeCompare(b.companyName);
      if (companyCompare !== 0) return companyCompare;
      return a.accountName.localeCompare(b.accountName);
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        accounts: eligibleAccounts,
        total: eligibleAccounts.length,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in hellov5_get_eligible_accounts:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
