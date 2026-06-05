import { createClient } from '@/lib/datasource/supabase/client'

const BUCKET = 'org-config-assets'

/**
 * `org-config-assets` bucket layout:
 *   {orgId}/{orgId}_logo.webp                     -- workspace (org) logo
 *   {orgId}/{companyId}/{companyId}_logo.webp     -- company logo
 *
 * Storage RLS on the bucket (see migration
 * `org_config_assets_storage_policies`) rejects writes whose first path
 * segment is not an org the caller is OWNER/ADMIN of, so these helpers
 * will surface a policy error if the caller lacks permission.
 *
 * These helpers take an already-encoded `Blob` because cropping happens
 * at crop-confirm time in the calling component, but the actual upload
 * is deferred until the user hits "Save". That way, if the user cancels
 * the edit we never orphaned an object in storage.
 */

function cacheBust(url: string): string {
  return `${url}?t=${Date.now()}`
}

async function uploadWebpBlob(path: string, blob: Blob): Promise<string> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return cacheBust(data.publicUrl)
}

export function orgLogoPath(orgId: string): string {
  return `${orgId}/${orgId}_logo.webp`
}

export function companyLogoPath(orgId: string, companyId: string): string {
  return `${orgId}/${companyId}/${companyId}_logo.webp`
}

export async function uploadOrgLogo(params: {
  orgId: string
  blob: Blob
}): Promise<string> {
  return uploadWebpBlob(orgLogoPath(params.orgId), params.blob)
}

export async function uploadCompanyLogo(params: {
  orgId: string
  companyId: string
  blob: Blob
}): Promise<string> {
  return uploadWebpBlob(
    companyLogoPath(params.orgId, params.companyId),
    params.blob,
  )
}

/**
 * Best-effort cleanup helper for the "upload succeeded but the
 * subsequent DB write failed" case. Failures here are swallowed — the
 * surface-level error the caller already saw is the more important one,
 * and a lingering file is cheaper than re-throwing and confusing the UX.
 */
export async function tryRemoveLogo(path: string): Promise<void> {
  try {
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove([path])
  } catch {
    // Intentional no-op — see JSDoc.
  }
}
