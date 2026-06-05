import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SOFTR_DATABASE_ID = "0f87a821-5bca-44d7-9406-a2a701299d62";
const SOFTR_TABLE_ID = "QIJTzouh4BU8v3";
const LINKED_FIELD_ID = "6oy1u";
const EXAMPLE_TABLE_FIELD_ID = "e2Eik";
const DATA_FIELD_ID_FIELD = "zGLai";  // Field containing the field ID in the data table
const EXAMPLE_DATA_LIMIT = 20;

const DEFAULT_STYLE_CONFIG = {
  page: { bgColor: "#fafafa" },
  title: { show: true, size: 24, alignment: "LEFT", color: "#1f2937", fontWeight: "400", fontFamily: "inherit" },
  table: {
    headerSize: 12, headerColor: "#374151", headerBgColor: "#f9fafb", cellSize: 12, rowSize: "default",
    rowHoverBg: "#f3f4f6", outerBorderColor: "#e5e7eb", rowBorderColor: "#e5e7eb", columnBorderColor: "#e5e7eb",
    stripedRows: false, compactMode: false, bgColor: "#ffffff"
  },
  toolbar: { show: true, position: "top", bgColor: "#ffffff", iconColor: "#6b7280" },
  features: {
    search: true, filters: true, sorting: true, groupBy: true, columnToggle: true, rowSizeSelector: true,
    exportCSV: true, columnResize: true, columnReorder: true, pagination: true, rowSelection: false
  },
  pagination: { pageSize: 25, pageSizeOptions: [10, 25, 50, 100], showPageInfo: true },
  forcedFilters: { active: false, filterLogic: "AND", filters: [] },
  emptyState: { message: "No data to display", showIcon: true }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface SoftrRecord {
  id: string;
  tableId: string;
  fields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface SoftrResponse {
  data: SoftrRecord[];
  metadata: { offset: number; limit: number; total: number; };
}

// Helper: Get view config records (data table ID + configured field IDs)
async function getViewConfigRecords(
  linkedRecordId: string,
  filterFieldId: string,
  SOFTR_API_KEY: string
): Promise<{ filteredRecords: SoftrRecord[]; dataTableId: string | null; configuredFieldIds: string[] }> {
  const allRecords: SoftrRecord[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `https://tables-api.softr.io/api/v1/databases/${SOFTR_DATABASE_ID}/tables/${SOFTR_TABLE_ID}/records?offset=${offset}&limit=${limit}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Softr-Api-Key": SOFTR_API_KEY, "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Softr API error: ${response.status} - ${errorText}`);
    }
    const data: SoftrResponse = await response.json();
    allRecords.push(...data.data);
    if (data.data.length < limit || allRecords.length >= data.metadata.total) hasMore = false;
    else offset += limit;
  }

  // Filter to find records linked to this objectId (where 6oy1u.id = linkedRecordId)
  const filteredRecords = allRecords.filter((record) => {
    const fieldValue = record.fields[filterFieldId];
    if (!fieldValue) return false;
    if (typeof fieldValue === "string") return fieldValue === linkedRecordId;
    if (Array.isArray(fieldValue)) {
      return fieldValue.some((item) => {
        if (typeof item === "string") return item === linkedRecordId;
        if (typeof item === "object" && item !== null) return (item as { id?: string }).id === linkedRecordId;
        return false;
      });
    }
    if (typeof fieldValue === "object" && fieldValue !== null) {
      return (fieldValue as { id?: string }).id === linkedRecordId;
    }
    return false;
  });

  // Extract data table ID and configured field IDs
  let dataTableId: string | null = null;
  const configuredFieldIds: string[] = [];

  for (const record of filteredRecords) {
    // Get data table ID (e2Eik)
    if (!dataTableId) {
      const tableId = record.fields[EXAMPLE_TABLE_FIELD_ID];
      if (tableId != null) {
        dataTableId = typeof tableId === "string" ? tableId : String(tableId);
      }
    }
    // Get data field ID (zGLai) - the field ID in the data table
    const dataFieldId = record.fields[DATA_FIELD_ID_FIELD];
    if (dataFieldId != null) {
      const fieldIdStr = typeof dataFieldId === "string" ? dataFieldId : String(dataFieldId);
      if (fieldIdStr && !configuredFieldIds.includes(fieldIdStr)) {
        configuredFieldIds.push(fieldIdStr);
      }
    }
  }

  return { filteredRecords, dataTableId, configuredFieldIds };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SOFTR_API_KEY = Deno.env.get("SOFTR_API_KEY");
    if (!SOFTR_API_KEY) throw new Error("SOFTR_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let linkedRecordId: string | null = null;
    let singleRecordId: string | null = null;
    let includeExampleData = false;
    let customTableId: string | null = null;
    let customFilterFieldId: string | null = null;
    let customLabelFieldId: string | null = null;
    let styleConfigId: string | null = null;
    let styleConfigAction: string | null = null;
    let styleConfigData: Record<string, unknown> | null = null;
    let createdBySoftrUser: string | null = null;
    let dataAction: string | null = null;
    let dataOffset: number = 0;
    let dataLimit: number = 50;
    
    if (req.method === "POST") {
      const body = await req.json();
      linkedRecordId = body.linkedRecordId || body.viewReferenceId || null;
      singleRecordId = body.recordId || null;
      includeExampleData = body.includeExampleData === true;
      customTableId = body.tableId || null;
      customFilterFieldId = body.filterFieldId || null;
      customLabelFieldId = body.labelFieldId || null;
      styleConfigId = body.styleConfigId || null;
      styleConfigAction = body.styleConfigAction || null;
      styleConfigData = body.styleConfigData || null;
      createdBySoftrUser = body.createdBySoftrUser || null;
      dataAction = body.dataAction || null;
      dataOffset = typeof body.offset === 'number' ? body.offset : 0;
      dataLimit = typeof body.limit === 'number' ? body.limit : 50;
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      linkedRecordId = url.searchParams.get("linkedRecordId") || url.searchParams.get("viewReferenceId");
      singleRecordId = url.searchParams.get("recordId");
      includeExampleData = url.searchParams.get("includeExampleData") === "true";
      customTableId = url.searchParams.get("tableId");
      customFilterFieldId = url.searchParams.get("filterFieldId");
      customLabelFieldId = url.searchParams.get("labelFieldId");
      styleConfigId = url.searchParams.get("styleConfigId");
      styleConfigAction = url.searchParams.get("styleConfigAction");
      dataAction = url.searchParams.get("dataAction");
      dataOffset = parseInt(url.searchParams.get("offset") || "0", 10);
      dataLimit = parseInt(url.searchParams.get("limit") || "50", 10);
    }

    // ========== STYLE CONFIG OPERATIONS ==========
    if (styleConfigAction) {
      if (styleConfigAction === "get" && styleConfigId) {
        const { data, error } = await supabase.from("softr_data_view_styles").select("*").eq("id", styleConfigId).single();
        if (error) return new Response(JSON.stringify({ success: false, error: error.message }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ success: true, styleConfig: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (styleConfigAction === "create") {
        if (!createdBySoftrUser) return new Response(JSON.stringify({ success: false, error: "createdBySoftrUser is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data, error } = await supabase.from("softr_data_view_styles").insert({ styleConfig: styleConfigData || DEFAULT_STYLE_CONFIG, created_by_softr_user: createdBySoftrUser }).select().single();
        if (error) return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ success: true, styleConfig: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (styleConfigAction === "update" && styleConfigId) {
        if (!styleConfigData) return new Response(JSON.stringify({ success: false, error: "styleConfigData is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const { data, error } = await supabase.from("softr_data_view_styles").update({ styleConfig: styleConfigData }).eq("id", styleConfigId).select().single();
        if (error) return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ success: true, styleConfig: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const tableIdToUse = customTableId || SOFTR_TABLE_ID;
    const filterFieldIdToUse = customFilterFieldId || LINKED_FIELD_ID;
    const labelFieldIdToUse = customLabelFieldId || "86R8J";

    // ========== DATA FETCH WITH PAGINATION ==========
    if (dataAction === "fetch" && linkedRecordId) {
      // Get view config (data table ID + configured field IDs)
      const { dataTableId, configuredFieldIds } = await getViewConfigRecords(linkedRecordId, filterFieldIdToUse, SOFTR_API_KEY);

      if (!dataTableId) {
        return new Response(
          JSON.stringify({ success: false, error: "No data table configured for this view" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch actual data from the data table
      const dataUrl = `https://tables-api.softr.io/api/v1/databases/${SOFTR_DATABASE_ID}/tables/${dataTableId}/records?offset=${dataOffset}&limit=${dataLimit}`;
      const dataResponse = await fetch(dataUrl, {
        method: "GET",
        headers: { "Softr-Api-Key": SOFTR_API_KEY, "Content-Type": "application/json" },
      });

      if (!dataResponse.ok) {
        const errorText = await dataResponse.text();
        throw new Error(`Softr API error: ${dataResponse.status} - ${errorText}`);
      }

      const dataResult: SoftrResponse = await dataResponse.json();
      
      // Only return configured fields (from zGLai)
      const transformedData = dataResult.data.map((record) => {
        const filtered: Record<string, unknown> = { id: record.id };
        if (configuredFieldIds.length > 0) {
          for (const fieldId of configuredFieldIds) {
            if (fieldId in record.fields) filtered[fieldId] = record.fields[fieldId];
          }
        } else {
          Object.assign(filtered, record.fields);
        }
        return filtered;
      });

      return new Response(
        JSON.stringify({
          success: true,
          exampleData: transformedData,
          configuredFieldIds,
          metadata: {
            offset: dataOffset,
            limit: dataLimit,
            total: dataResult.metadata.total,
            hasMore: (dataOffset + dataResult.data.length) < dataResult.metadata.total,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // MODE 1: Fetch single record by ID
    if (singleRecordId) {
      const singleRecordUrl = `https://tables-api.softr.io/api/v1/databases/${SOFTR_DATABASE_ID}/tables/${tableIdToUse}/records/${singleRecordId}`;
      const singleResponse = await fetch(singleRecordUrl, {
        method: "GET",
        headers: { "Softr-Api-Key": SOFTR_API_KEY, "Content-Type": "application/json" },
      });
      if (!singleResponse.ok) {
        const errorText = await singleResponse.text();
        throw new Error(`Softr API error: ${singleResponse.status} - ${errorText}`);
      }
      const singleRecord = await singleResponse.json();

      let styleConfig = null;
      if (styleConfigId) {
        const { data, error } = await supabase.from("softr_data_view_styles").select("*").eq("id", styleConfigId).single();
        if (!error && data) styleConfig = data;
      }

      return new Response(
        JSON.stringify({ success: true, record: singleRecord, ...(styleConfig ? { styleConfig } : {}) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // MODE 2: Filter records by linked field
    if (!linkedRecordId) {
      return new Response(
        JSON.stringify({ error: "Missing linkedRecordId or recordId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const returnAllRecords = linkedRecordId === "__ALL__" || filterFieldIdToUse === "__NONE__";
    const isDefaultTable = !customTableId || customTableId === SOFTR_TABLE_ID;

    // Only use getViewConfigRecords for the default view config table
    // Custom tables (like object items) should use simple fetch + filter
    let filteredRecords: SoftrRecord[] = [];
    let dataTableId: string | null = null;
    let configuredFieldIds: string[] = [];

    if (!returnAllRecords && isDefaultTable) {
      // Default view config table - use getViewConfigRecords for zGLai field filtering
      const viewConfig = await getViewConfigRecords(linkedRecordId, filterFieldIdToUse, SOFTR_API_KEY);
      filteredRecords = viewConfig.filteredRecords;
      dataTableId = viewConfig.dataTableId;
      configuredFieldIds = viewConfig.configuredFieldIds;
    } else {
      // Custom table or return all - fetch and filter normally
      const allRecords: SoftrRecord[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const url = `https://tables-api.softr.io/api/v1/databases/${SOFTR_DATABASE_ID}/tables/${tableIdToUse}/records?offset=${offset}&limit=${limit}`;
        const response = await fetch(url, {
          method: "GET",
          headers: { "Softr-Api-Key": SOFTR_API_KEY, "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Softr API error: ${response.status} - ${errorText}`);
        }
        const data: SoftrResponse = await response.json();
        allRecords.push(...data.data);
        if (data.data.length < limit || allRecords.length >= data.metadata.total) hasMore = false;
        else offset += limit;
      }

      // Filter if not returning all
      if (returnAllRecords) {
        filteredRecords = allRecords;
      } else {
        filteredRecords = allRecords.filter((record) => {
          const fieldValue = record.fields[filterFieldIdToUse];
          if (!fieldValue) return false;
          if (typeof fieldValue === "string") return fieldValue === linkedRecordId;
          if (Array.isArray(fieldValue)) {
            return fieldValue.some((item) => {
              if (typeof item === "string") return item === linkedRecordId;
              if (typeof item === "object" && item !== null) return (item as { id?: string }).id === linkedRecordId;
              return false;
            });
          }
          if (typeof fieldValue === "object" && fieldValue !== null) {
            return (fieldValue as { id?: string }).id === linkedRecordId;
          }
          return false;
        });
      }
    }

    const dropdownOptions = filteredRecords.map((record) => {
      const fields = record.fields;
      const labelValue = fields[labelFieldIdToUse];
      const label = labelValue != null && labelValue !== "" ? String(labelValue) : record.id;
      return { id: record.id, label, fields };
    });

    // Fetch example data - only return configured fields (from zGLai) when using default table
    let exampleData: Record<string, unknown>[] = [];

    if (includeExampleData && dataTableId) {
      const exampleUrl = `https://tables-api.softr.io/api/v1/databases/${SOFTR_DATABASE_ID}/tables/${dataTableId}/records?limit=${EXAMPLE_DATA_LIMIT}`;
      const exampleRes = await fetch(exampleUrl, {
        method: "GET",
        headers: { "Softr-Api-Key": SOFTR_API_KEY, "Content-Type": "application/json" },
      });
      if (exampleRes.ok) {
        const exampleJson: SoftrResponse = await exampleRes.json();
        exampleData = (exampleJson.data || []).map((record) => {
          const filtered: Record<string, unknown> = { id: record.id };
          if (configuredFieldIds.length > 0) {
            for (const fieldId of configuredFieldIds) {
              if (fieldId in record.fields) filtered[fieldId] = record.fields[fieldId];
            }
          } else {
            Object.assign(filtered, record.fields);
          }
          return filtered;
        });
      }
    }

    // Fetch style config
    let styleConfig = null;
    if (styleConfigId) {
      const { data, error } = await supabase.from("softr_data_view_styles").select("*").eq("id", styleConfigId).single();
      if (!error && data) styleConfig = data;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: dropdownOptions,
        total: dropdownOptions.length,
        ...(isDefaultTable ? { configuredFieldIds } : {}),
        ...(exampleData.length > 0 ? { exampleData } : {}),
        ...(styleConfig ? { styleConfig } : {}),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
