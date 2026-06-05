// @ts-nocheck
"use client";

import { HeaderUserMenu } from "@/features/company/components/header-user-menu";
import { GlobalSearch } from "@/features/company/components/header/global-search";
import { PortalHeaderShell } from "@/features/company/components/header/portal-header-shell";
import { TenantBrand } from "@/features/company/components/header/tenant-brand";
import { useCompany } from "@/features/company/tenant-provider";

/**
 * Single header used across every company portal (home, wms, crm,
 * erp, pm, plm). Composed from shared atoms:
 *
 *   [ TenantBrand ] [ GlobalSearch ] [ HeaderUserMenu ]
 *
 * Rendered inside `PortalShell`, so every portal picks it up
 * automatically — no per-portal header wiring. If a portal ever
 * needs a portal-specific affordance, prefer putting it in the
 * page body (or a sub-header inside the page) rather than
 * fragmenting the global header again.
 *
 * The My Stack trigger lives in `MyStackFab` (bottom-right floating
 * launcher) — deliberately kept off the header so the top bar stays
 * focused on tenant identity, search, and account.
 */
export function PortalHeader({
  showMobileSidebarTrigger = true,
}: {
  /**
   * Pass `false` when rendering the header OUTSIDE a `SidebarProvider`
   * (e.g. the standalone account page). The default trigger expects
   * shadcn's sidebar context and will throw without it.
   */
  showMobileSidebarTrigger?: boolean;
} = {}) {
  const { authUser, companySlug, companyUser } = useCompany();

  const name =
    [companyUser?.firstName, companyUser?.lastName].filter(Boolean).join(" ") ||
    authUser?.email?.split("@")[0] ||
    "User";
  const user = {
    name,
    email: authUser?.email ?? "",
    avatar: companyUser?.profilePictureUrl ?? "",
  };

  return (
    <PortalHeaderShell showMobileSidebarTrigger={showMobileSidebarTrigger}>
      <TenantBrand />

      <div className="mx-auto hidden md:flex flex-1 justify-center px-4 max-w-xl">
        <GlobalSearch />
      </div>

      <div className="ml-auto md:ml-0 flex items-center gap-1">
        <HeaderUserMenu user={user} companySlug={companySlug} />
      </div>
    </PortalHeaderShell>
  );
}
