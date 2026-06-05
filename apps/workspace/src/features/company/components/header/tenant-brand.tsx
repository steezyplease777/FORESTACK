// @ts-nocheck
"use client";

import { Link } from "@tanstack/react-router";
import { IconBuildingStore } from "@tabler/icons-react";

import Image from "@/components/composites/next-image-shim";
import { useCompany } from "@/features/company/tenant-provider";

/**
 * Tenant brand lockup used in every portal header.
 *
 * Links back to the company home dashboard so the company brand doubles
 * as the "home" affordance, the way most SaaS tenant portals behave.
 * The whole block is one clickable target; logo falls back to a generic
 * storefront icon when the tenant hasn't uploaded a logo yet.
 */
export function TenantBrand() {
  const { company, companySlug } = useCompany();

  return (
    <Link
      to={`/${companySlug}/dashboard`}
      className="flex items-center gap-2 shrink-0 rounded-md px-1.5 py-1 -ml-1.5 hover:bg-muted/60 transition-colors"
      aria-label={`${company?.name ?? "Company"} home`}
    >
      {company?.logo_url ? (
        <Image
          src={company.logo_url}
          alt={company?.name ?? ""}
          width={20}
          height={20}
          className="size-5 rounded-sm object-contain"
        />
      ) : (
        <IconBuildingStore className="size-5" />
      )}
      <span className="text-sm font-semibold tracking-tight truncate max-w-[200px]">
        {company?.name}
      </span>
    </Link>
  );
}
