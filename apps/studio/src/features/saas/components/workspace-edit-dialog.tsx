'use client'

/**
 * Workspace (org) settings edit modal.
 *
 * Identity fields an OWNER can change:
 *   - `name`    — required, plain text.
 *   - `logoUrl` — cropped to square via the shared `ProfilePictureCrop`
 *     component, uploaded into `org-config-assets` at
 *     `{orgId}/{orgId}_logo.webp` on save.
 *
 * Upload deferral: the crop dialog hands back a cropped `Blob` which we
 * stash in local state together with an object-URL preview. NO network
 * write happens until the user clicks "Save changes". That way a user
 * who picks a logo and then cancels never orphans a file in storage.
 *
 * Save atomicity: during the save we (1) upload the staged blob, (2)
 * call `updateOrganizationBasicsFn`. If the RPC rejects after the
 * upload succeeds, we best-effort remove the just-uploaded object so we
 * don't leak an orphan either. While the save is in flight the modal
 * close handler ignores user attempts to dismiss, and a `beforeunload`
 * listener arms the browser's native "leave site?" prompt — so a tab
 * close / refresh / back-button press can't sever the upload.
 */

import { useEffect, useState } from 'react'
import type { Area } from 'react-easy-crop'
import { IconUpload } from '@tabler/icons-react'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import { ProfilePictureCrop } from '@/components/profile-picture-crop'
import { useBeforeUnload } from '@/lib/hooks/use-before-unload'
import {
  orgLogoPath,
  tryRemoveLogo,
  uploadOrgLogo,
} from '@/lib/data/storage/logos'
import {
  updateOrganizationBasicsFn,
  type MyOrganizationDetail,
} from '@/lib/data/organizations/server'
import { cropAndConvertToWebp } from '@/lib/utils/image-crop'

type WorkspaceEditDialogProps = {
  org: MyOrganizationDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (fresh: MyOrganizationDetail) => void
}

type StagedLogo = {
  blob: Blob
  previewUrl: string
}

export function WorkspaceEditDialog({
  org,
  open,
  onOpenChange,
  onSaved,
}: WorkspaceEditDialogProps) {
  const [name, setName] = useState(org.name)
  /**
   * Three-state logo model:
   *   - staged blob  → user picked a new image; preview shown, no upload yet
   *   - 'clear'      → user hit Remove; persisted logo will be cleared on save
   *   - null         → no local change; preview falls through to `org.logoUrl`
   */
  const [staged, setStaged] = useState<StagedLogo | null>(null)
  const [logoCleared, setLogoCleared] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Arm the browser's "leave site?" prompt while a save is in flight.
  useBeforeUnload(saving)

  // Revoke the object URL created for the cropped preview so we don't
  // leak memory when the user swaps images repeatedly or closes the
  // dialog. Runs whenever `staged` changes (new preview replaces old)
  // and on unmount.
  useEffect(() => {
    if (!staged) return
    return () => URL.revokeObjectURL(staged.previewUrl)
  }, [staged])

  const trimmedName = name.trim()
  const nameChanged = trimmedName !== org.name
  const logoChanged = staged !== null || logoCleared
  const dirty = (nameChanged && trimmedName.length > 0) || logoChanged

  const effectivePreview = staged
    ? staged.previewUrl
    : logoCleared
    ? null
    : org.logoUrl

  const resetLocalState = () => {
    setName(org.name)
    setStaged(null)
    setLogoCleared(false)
    setError(null)
  }

  const handleCropConfirm = async (imageSrc: string, croppedArea: Area) => {
    try {
      const blob = await cropAndConvertToWebp(imageSrc, croppedArea)
      setStaged({ blob, previewUrl: URL.createObjectURL(blob) })
      setLogoCleared(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Crop failed'
      toast.error(msg)
      throw err
    }
  }

  const handleRemove = () => {
    setStaged(null)
    setLogoCleared(true)
  }

  const handleSave = async () => {
    if (!dirty || saving) return
    setError(null)
    setSaving(true)

    let uploadedPath: string | null = null
    try {
      const payload: {
        orgId: string
        name?: string
        logoUrl?: string | null
      } = { orgId: org.id }
      if (nameChanged) payload.name = trimmedName

      if (staged) {
        const url = await uploadOrgLogo({ orgId: org.id, blob: staged.blob })
        uploadedPath = orgLogoPath(org.id)
        payload.logoUrl = url
      } else if (logoCleared) {
        // empty string tells the RPC to clear the column
        payload.logoUrl = ''
      }

      const fresh = await updateOrganizationBasicsFn({ data: payload })

      // If the user cleared the logo, the old file is orphaned in
      // storage — best-effort remove it now that the DB has forgotten
      // it. Same path for both old and new logos because we always
      // upload to a deterministic filename.
      if (logoCleared && !staged) {
        await tryRemoveLogo(orgLogoPath(org.id))
      }

      onSaved(fresh)
      toast.success('Workspace updated')
      onOpenChange(false)
      resetLocalState()
    } catch (err) {
      // If the DB write failed after the upload went through, clean up
      // the just-uploaded object so a retry starts from a clean slate.
      if (uploadedPath) await tryRemoveLogo(uploadedPath)
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (saving) return
    if (!next) resetLocalState()
    onOpenChange(next)
  }

  return (
    <>
      <Modal open={open} onOpenChange={handleOpenChange}>
        <ModalContent className="max-w-md" showCloseButton={!saving}>
          <div className="flex flex-col">
            <div className="px-6 pb-4 pt-6">
              <ModalTitle>Edit workspace</ModalTitle>
              <ModalDescription className="mt-1">
                Update your workspace name and logo. Only the workspace
                owner can edit these.
              </ModalDescription>
            </div>

            <div className="border-t border-[#ece9e0] px-6 py-5">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 rounded-lg">
                    {effectivePreview ? (
                      <AvatarImage src={effectivePreview} alt={org.name} />
                    ) : null}
                    <AvatarFallback className="rounded-lg bg-foreground text-lg text-white">
                      {(trimmedName || org.name).slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCropOpen(true)}
                      disabled={saving}
                    >
                      <IconUpload className="mr-1.5 h-3.5 w-3.5" />
                      {effectivePreview ? 'Replace logo' : 'Upload logo'}
                    </Button>
                    {effectivePreview ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemove}
                        disabled={saving}
                        className="justify-start text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Remove
                      </Button>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, or WebP — cropped to square.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="workspace-name">Name</Label>
                  <Input
                    id="workspace-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saving}
                    maxLength={120}
                    placeholder="Acme, Inc."
                  />
                </div>

                {error ? (
                  <p className="text-sm text-red-500">{error}</p>
                ) : null}

                {saving ? (
                  <p className="text-xs text-muted-foreground">
                    Uploading and saving — please don&apos;t close this
                    window.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#ece9e0] px-6 py-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={!dirty || saving || trimmedName.length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </div>
        </ModalContent>
      </Modal>

      <ProfilePictureCrop
        open={cropOpen}
        onOpenChange={setCropOpen}
        onConfirm={handleCropConfirm}
        title="Upload workspace logo"
        description="Select and crop your logo to a square."
        successMessage="Ready to save"
        cropShape="rect"
      />
    </>
  )
}
