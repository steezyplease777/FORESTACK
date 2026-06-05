// Setup type definitions for built-in Supabase Runtime APIs
// deno-lint-ignore-file no-import-prefix
// deno-lint-ignore no-unversioned-import
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { type Id } from "./utils.ts";

type DataTypes = {
    product: {
        created_by: string;
        sourcing_id: string;
        campaign_id: string;
        style_id: string;
        colorway_id: string;
        internal_product_code: string;
        company_id: string;
        name: string | null;
        seo_description: string | null;
        retail_description: string | null;
        msrp: number;
    },
    projectStyles: {
        project_id: string;
        style_id: string;
        company_id: string;
        created_by: string;
    }
}

export type Product = DataTypes["product"] & Id;
export type ProjectStyles = DataTypes["projectStyles"];