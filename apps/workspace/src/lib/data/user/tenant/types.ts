// @ts-nocheck
import type { Database } from "@/lib/datasource/supabase/types/database.types";

export type TenantComapnyUserRow = Database["public"]["Tables"]["app_company_users"]["Row"];
export type appUserProfileRow = Database["public"]["Tables"]["app_user_profiles"]["Row"];

export type CompanyUser = TenantComapnyUserRow & {
  app_user_profiles: Pick<appUserProfileRow, "first_name" | "last_name" | "profile_picture_url"> | null;
};

