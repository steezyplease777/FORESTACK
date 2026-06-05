'use client'

/**
 * Company-settings dialog. Implements the shadcn `sidebar-13` pattern:
 * a centered modal with a left sidebar of section tabs and a main area
 * with its own scrollable content.
 *
 * Data flow: the dialog reads from TanStack Query via
 * `useCompanySnapshot(companyId)`.  On the companies page the list
 * endpoint returns a full snapshot per company and seeds the detail
 * cache (see `src/lib/data/organizations/hooks.ts`), so by the time the
 * user clicks "Edit" the cache is already warm and the modal paints
 * fully hydrated on the same tick as the click - no network hop in the
 * hot path.
 *
 * Fallback: deep-link to `/companies?edit=<id>` from a cold tab hits
 * the per-company snapshot endpoint through `getCompanyEditSnapshotFn`.
 * The modal still opens immediately and shows a loading spinner in the
 * content pane until the snapshot resolves.
 *
 * Mutations: each server fn returns the fresh `CompanyEditSnapshot`
 * in the same HTTP round trip as the write.  We forward that snapshot
 * up through `onMutated(snap)`; the page writes it into both the
 * detail cache and the matching list entry.  One mutation = one
 * network request, no follow-up refetch, the modal hydrates off the
 * cache write on the next render.
 */

import { useEffect, useMemo, useState } from 'react'
import type { Area } from 'react-easy-crop'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  ChevronRight,
  Globe,
  Layers,
  Loader2,
  Palette,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  ColorPicker,
  ColorPickerAlphaSlider,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from '@/components/ui/color-picker'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  SettingsBody,
  SettingsHeader,
  SettingsModal,
  SettingsPane,
  SettingsSectionHeader,
  SettingsSidebar,
  type SettingsBreadcrumb,
  type SettingsSection as SettingsSectionType,
} from '@/components/ui/settings-modal'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  addCompanyMemberFn,
  createDepartmentFn,
  createTitleFn,
  deleteDepartmentFn,
  deleteTitleFn,
  removeCompanyMemberFn,
  setCompanyMemberTitleFn,
  updateCompanyFn,
  updateDepartmentFn,
  type CompanyEditSnapshot,
} from '@/lib/data/company-editor/server'
import { type OrgUserSummary } from '@/lib/data/organizations/server'
import {
  useCompanySnapshot,
  useOrgUsers,
} from '@/lib/data/organizations/hooks'
import {
  companyLogoPath,
  tryRemoveLogo,
  uploadCompanyLogo,
} from '@/lib/data/storage/logos'
import { cn } from '@/lib/utils'
import { cropAndConvertToWebp } from '@/lib/utils/image-crop'
import { ProfilePictureCrop } from '@/components/profile-picture-crop'

type SectionKey = 'general' | 'branding' | 'members' | 'departments'

type MembersView = 'list' | 'create'

/**
 * Departments tab has three sub-views now that titles live inside the
 * department detail:
 *   - list   → searchable table of departments
 *   - create → standalone form, submits then jumps to `detail` for the
 *              newly minted row
 *   - detail → single-department view with Titles + Members panels
 * Lifted to the dialog so the breadcrumb can render the full path
 * (`Departments › Create new` / `Departments › {name}`).
 */
type DepartmentsView =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'detail'; departmentId: string }

const SECTIONS: ReadonlyArray<SettingsSectionType<SectionKey>> = [
  { key: 'general', label: 'General', icon: Building2 },
  { key: 'branding', label: 'Branding', icon: Palette },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'departments', label: 'Departments', icon: Layers },
]

export function CompanyEditDialog({
  companyId,
  open,
  onOpenChange,
  onMutated,
}: {
  /**
   * Target company id.  `null` means the modal is closed (or opening
   * without a target, which shouldn't happen - the parent guards via
   * `open`).  The dialog calls `useCompanySnapshot(companyId)` which
   * reads from the list-seeded detail cache synchronously when
   * available and falls back to a single-company fetch for deep-links.
   */
  companyId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Invoked after every successful mutation with the post-mutation
   * snapshot returned by the server fn.  Parent writes it into the
   * detail + list caches so both views update without a refetch.
   */
  onMutated: (snap: CompanyEditSnapshot) => void | Promise<void>
}) {
  const [section, setSection] = useState<SectionKey>('general')
  /**
   * Two sections have a nested sub-view:
   *   - Members (list | create-new)
   *   - Departments (list | create | detail)
   * Both live on the dialog so the breadcrumb can reflect the path.
   */
  const [membersView, setMembersView] = useState<MembersView>('list')
  const [departmentsView, setDepartmentsView] = useState<DepartmentsView>({
    kind: 'list',
  })

  /**
   * Lifted "busy" flag: sections with heavy async work (currently just
   * the branding logo upload+save) call `onBusyChange(true)` around
   * their save. The shell (`SettingsModal`) reads this to lock dismiss
   * paths (overlay / Esc / close button) and arm `useBeforeUnload`.
   */
  const [busy, setBusy] = useState(false)

  // Read from the TanStack Query cache.  If the companies list already
  // loaded (normal path) this returns `data` on the first render with
  // `isLoading: false` - zero round trip between click and paint.
  const { data: snapshot, isLoading, isFetching } = useCompanySnapshot(
    companyId,
  )

  // Reset to the first tab every time the dialog is re-opened on a
  // different company.  Keyed on the company id (not `open`) so closing
  // + re-opening on the same company preserves the user's last tab.
  useEffect(() => {
    if (open && companyId) {
      setSection('general')
      setMembersView('list')
      setDepartmentsView({ kind: 'list' })
    }
  }, [open, companyId])

  // Switching away via the sidebar discards in-flight sub-views so
  // returning later starts clean on the respective list.
  const changeSection = (next: SectionKey) => {
    setSection(next)
    if (next !== 'members') setMembersView('list')
    if (next !== 'departments') setDepartmentsView({ kind: 'list' })
  }

  // Resolve the active department for breadcrumb copy.  If the id on
  // the view state no longer exists in the snapshot (e.g. the dept was
  // deleted in another tab), the name falls back to "Department" so
  // the breadcrumb still renders something sensible.
  const activeDepartment =
    departmentsView.kind === 'detail'
      ? snapshot?.departments.find((d) => d.id === departmentsView.departmentId) ?? null
      : null

  // Normalise the parent's `onMutated` to `Promise<void>` so every
  // section can `await onMutated(snap)` without type gymnastics.
  const handleMutated = async (snap: CompanyEditSnapshot): Promise<void> => {
    await onMutated(snap)
  }

  /*
   * Build the breadcrumb trail past the muted tenant-name root. The
   * section name is always the leaf unless a sub-view is active, in
   * which case the section turns into a back-link and the sub-view
   * becomes the leaf.
   */
  const trail: Array<SettingsBreadcrumb> = (() => {
    const sectionLabel =
      SECTIONS.find((s) => s.key === section)?.label ?? section
    if (section === 'members' && membersView === 'create') {
      return [
        { label: sectionLabel, onBack: () => setMembersView('list') },
        { label: 'Create New' },
      ]
    }
    if (section === 'departments' && departmentsView.kind !== 'list') {
      return [
        {
          label: sectionLabel,
          onBack: () => setDepartmentsView({ kind: 'list' }),
        },
        {
          label:
            departmentsView.kind === 'create'
              ? 'Create New'
              : activeDepartment?.name ?? 'Department',
        },
      ]
    }
    return [{ label: sectionLabel }]
  })()

  return (
    <SettingsModal
      open={open}
      onOpenChange={onOpenChange}
      busy={busy}
      title={
        snapshot
          ? `Settings for ${snapshot.company.name}`
          : 'Company settings'
      }
      description="Manage company details, branding, members, departments and titles."
    >
      <SettingsSidebar
        title="Company settings"
        icon={Building2}
        sections={SECTIONS}
        active={section}
        onChange={changeSection}
      />

      <SettingsPane>
        <SettingsHeader
          leadLabel={snapshot?.company.name ?? 'Company'}
          trail={trail}
          refreshing={Boolean(snapshot) && isFetching}
          onClose={() => onOpenChange(false)}
          closeDisabled={busy}
        />

        <SettingsBody>
          {snapshot ? (
            <SectionView
              section={section}
              snap={snapshot}
              onMutated={handleMutated}
              membersView={membersView}
              onMembersViewChange={setMembersView}
              departmentsView={departmentsView}
              onDepartmentsViewChange={setDepartmentsView}
              onBusyChange={setBusy}
            />
          ) : isLoading ? (
            /*
             * Only reached on a cold deep-link (list wasn't loaded
             * yet, so the detail cache is empty and the fallback
             * `getCompanyEditSnapshotFn` is fetching). The modal shell
             * already opened instantly; this is the wait for the body
             * content specifically.
             */
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading company settings…</span>
            </div>
          ) : open ? (
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load this company. It may have been removed or
              you no longer have access.
            </p>
          ) : null}
        </SettingsBody>
      </SettingsPane>
    </SettingsModal>
  )
}

type MutatedHandler = (snap: CompanyEditSnapshot) => Promise<void>

function SectionView({
  section,
  snap,
  onMutated,
  membersView,
  onMembersViewChange,
  departmentsView,
  onDepartmentsViewChange,
  onBusyChange,
}: {
  section: SectionKey
  snap: CompanyEditSnapshot
  onMutated: MutatedHandler
  membersView: MembersView
  onMembersViewChange: (view: MembersView) => void
  departmentsView: DepartmentsView
  onDepartmentsViewChange: (view: DepartmentsView) => void
  onBusyChange: (busy: boolean) => void
}) {
  switch (section) {
    case 'general':
      return <GeneralSection snap={snap} onMutated={onMutated} />
    case 'branding':
      return (
        <BrandingSection
          snap={snap}
          onMutated={onMutated}
          onBusyChange={onBusyChange}
        />
      )
    case 'members':
      return (
        <MembersSection
          snap={snap}
          onMutated={onMutated}
          view={membersView}
          onViewChange={onMembersViewChange}
        />
      )
    case 'departments':
      return (
        <DepartmentsSection
          snap={snap}
          onMutated={onMutated}
          view={departmentsView}
          onViewChange={onDepartmentsViewChange}
          
        />
      )
  }
}

// ----- General ------------------------------------------------------

function GeneralSection({
  snap,
  onMutated,
}: {
  snap: CompanyEditSnapshot
  onMutated: MutatedHandler
}) {
  const [name, setName] = useState(snap.company.name)
  const [websiteUrl, setWebsiteUrl] = useState(snap.company.websiteUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canEdit = snap.viewerIsAdmin

  const dirty =
    name.trim() !== snap.company.name ||
    (websiteUrl || '').trim() !== (snap.company.websiteUrl ?? '')

  const save = async () => {
    setError(null)
    setSaving(true)
    try {
      const next = await updateCompanyFn({
        data: {
          companyId: snap.company.id,
          name: name.trim(),
          websiteUrl: websiteUrl.trim(),
        },
      })
      await onMutated(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 pt-2.5">
      <SectionHeader
        title="General"
        description="Basic company information visible to every member."
      />
      <Separator orientation="horizontal" className="w-full bg-border" />

      <div className="grid gap-2">
        <Label htmlFor="ce-name">Company name</Label>
        <Input
          id="ce-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit || saving}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ce-slug">URL handle</Label>
        <Input
          id="ce-slug"
          value={snap.company.slug ?? ''}
          readOnly
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          URL handle is permanent. Delete and recreate the company if you need
          a different one.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="ce-website">
          <Globe className="mr-1 inline h-3.5 w-3.5" />
          Website
        </Label>
        <Input
          id="ce-website"
          placeholder="https://acme.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          disabled={!canEdit || saving}
        />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {canEdit ? (
        <div className="flex justify-end">
          <Button size="sm" disabled={!dirty || saving} onClick={save}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only owners and admins can edit company info.
        </p>
      )}
    </div>
  )
}

// ----- Branding -----------------------------------------------------

function ColorPickerField({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  disabled,
}: {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  // ColorPicker is always controlled with a real hex so the swatch renders
  // correctly; the `value` state itself can stay empty (= "not set").
  const pickerValue = value.trim() || placeholder || '#000000'

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <ColorPicker
        value={pickerValue}
        onValueChange={(next) => onValueChange(next)}
        disabled={disabled}
      >
        <ColorPickerTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            className="inline-flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-2 text-left text-sm font-mono shadow-xs transition-[color,box-shadow] outline-none hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ColorPickerSwatch className="size-6 shrink-0 rounded-sm" />
            <span className="flex-1 truncate">
              {value.trim() ? (
                <span className="text-foreground">{value.trim()}</span>
              ) : (
                <span className="text-muted-foreground">
                  {placeholder ?? 'Pick a color'}
                </span>
              )}
            </span>
          </button>
        </ColorPickerTrigger>
        <ColorPickerContent align="start" className="w-[300px] gap-3 p-3">
          <ColorPickerArea className="h-40 rounded-md" />
          <div className="flex items-center gap-2">
            <ColorPickerEyeDropper />
            <div className="flex flex-1 flex-col gap-2">
              <ColorPickerHueSlider />
              <ColorPickerAlphaSlider />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ColorPickerFormatSelect className="w-[84px]" />
            <ColorPickerInput />
          </div>
        </ColorPickerContent>
      </ColorPicker>
    </div>
  )
}

type StagedLogo = {
  blob: Blob
  previewUrl: string
}

function BrandingSection({
  snap,
  onMutated,
  onBusyChange,
}: {
  snap: CompanyEditSnapshot
  onMutated: MutatedHandler
  /**
   * Reports save-in-flight state up to `CompanyEditDialog` so the
   * parent can lock dismiss + arm the `beforeunload` prompt while the
   * logo is uploading. Called with `true` when save starts and `false`
   * when it ends (success or failure).
   */
  onBusyChange: (busy: boolean) => void
}) {
  /**
   * Three-state logo model for the staged edit:
   *   - staged blob  → user picked a new image; preview shown, no upload yet
   *   - 'clear'      → user hit Remove; persisted logo will be cleared on save
   *   - null         → no local change; preview falls through to `snap.company.logoUrl`
   */
  const [staged, setStaged] = useState<StagedLogo | null>(null)
  const [logoCleared, setLogoCleared] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [primary, setPrimary] = useState(snap.company.primaryColorHex ?? '')
  const [secondary, setSecondary] = useState(
    snap.company.secondaryColorHex ?? '',
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canEdit = snap.viewerIsAdmin

  // Bubble `saving` up so the parent can lock close + arm beforeunload.
  useEffect(() => {
    onBusyChange(saving)
  }, [saving, onBusyChange])

  // Release the parent's busy flag on unmount in case we navigated
  // away mid-save (shouldn't happen - dismiss is blocked - but safe).
  useEffect(() => () => onBusyChange(false), [onBusyChange])

  // Free the object URL used for the cropped preview when the user
  // swaps images or the section unmounts.
  useEffect(() => {
    if (!staged) return
    return () => URL.revokeObjectURL(staged.previewUrl)
  }, [staged])

  const logoChanged = staged !== null || logoCleared
  const colorsChanged =
    primary.trim() !== (snap.company.primaryColorHex ?? '') ||
    secondary.trim() !== (snap.company.secondaryColorHex ?? '')
  const dirty = logoChanged || colorsChanged

  const effectivePreview = staged
    ? staged.previewUrl
    : logoCleared
    ? null
    : snap.company.logoUrl

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

  const save = async () => {
    if (!dirty || saving) return
    setError(null)
    setSaving(true)

    let uploadedPath: string | null = null
    try {
      const payload: {
        companyId: string
        logoUrl?: string | null
        primaryColorHex?: string | null
        secondaryColorHex?: string | null
      } = { companyId: snap.company.id }

      if (staged) {
        const url = await uploadCompanyLogo({
          orgId: snap.company.organizationId,
          companyId: snap.company.id,
          blob: staged.blob,
        })
        uploadedPath = companyLogoPath(
          snap.company.organizationId,
          snap.company.id,
        )
        payload.logoUrl = url
      } else if (logoCleared) {
        // empty string tells the RPC to clear the column
        payload.logoUrl = ''
      }

      if (colorsChanged) {
        payload.primaryColorHex = primary.trim()
        payload.secondaryColorHex = secondary.trim()
      }

      const next = await updateCompanyFn({ data: payload })

      // User cleared the old logo — best-effort remove the storage
      // object now that the DB has forgotten about it.
      if (logoCleared && !staged) {
        await tryRemoveLogo(
          companyLogoPath(snap.company.organizationId, snap.company.id),
        )
      }

      await onMutated(next)
      setStaged(null)
      setLogoCleared(false)
      toast.success('Branding updated')
    } catch (err) {
      // If DB write failed after the upload succeeded, clean up the
      // just-uploaded object so a retry is idempotent.
      if (uploadedPath) await tryRemoveLogo(uploadedPath)
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 pt-2.5">
        <SectionHeader
          title="Branding"
          description="Logo and theme shown on the tenant portal for this company."
        />
        <Separator orientation="horizontal" className="w-full bg-border" />

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-lg">
            {effectivePreview ? (
              <AvatarImage src={effectivePreview} alt="Logo" />
            ) : null}
            <AvatarFallback className="rounded-lg bg-foreground text-lg text-white">
              {snap.company.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCropOpen(true)}
              disabled={!canEdit || saving}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {effectivePreview ? 'Replace logo' : 'Upload logo'}
            </Button>
            {effectivePreview ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={!canEdit || saving}
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

        <div className="grid grid-cols-2 gap-3">
          <ColorPickerField
            id="ce-primary"
            label="Primary color"
            value={primary}
            onValueChange={setPrimary}
            placeholder="#191918"
            disabled={!canEdit || saving}
          />
          <ColorPickerField
            id="ce-secondary"
            label="Secondary color"
            value={secondary}
            onValueChange={setSecondary}
            placeholder="#f4f2ec"
            disabled={!canEdit || saving}
          />
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        {saving ? (
          <p className="text-xs text-muted-foreground">
            Uploading and saving — please don&apos;t close this window.
          </p>
        ) : null}

        {canEdit ? (
          <div className="flex justify-end">
            <Button size="sm" disabled={!dirty || saving} onClick={save}>
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
        ) : (
          <p className="text-xs text-muted-foreground">
            Only owners and admins can change branding.
          </p>
        )}
      </div>

      <ProfilePictureCrop
        open={cropOpen}
        onOpenChange={setCropOpen}
        onConfirm={handleCropConfirm}
        title="Upload company logo"
        description="Select and crop the logo to a square."
        successMessage="Ready to save"
        cropShape="rect"
      />
    </>
  )
}

// ----- Members ------------------------------------------------------

const ADD_MEMBER_TITLE_NONE = '__none__'

/**
 * Members section has two sub-views sharing the same snapshot:
 *   - `list`: search + roster + "Add member" entry point.
 *   - `create`: full-width form with Cancel/Create buttons.
 *
 * Switching views doesn't re-fetch; both read from the single
 * `CompanyEditSnapshot` the dialog already has in cache.  Success /
 * failure is surfaced via app-global `sonner` toasts so the feedback
 * survives the `create → list` transition and stacks above the modal.
 */
function MembersSection({
  snap,
  onMutated,
  view,
  onViewChange,
}: {
  snap: CompanyEditSnapshot
  onMutated: MutatedHandler
  view: MembersView
  onViewChange: (view: MembersView) => void
}) {
  if (view === 'create') {
    return (
      <CreateMemberForm
        snap={snap}
        onMutated={onMutated}
        onCancel={() => onViewChange('list')}
      />
    )
  }
  return (
    <MembersList
      snap={snap}
      onMutated={onMutated}
      onAddClick={() => onViewChange('create')}
    />
  )
}

function MembersList({
  snap,
  onMutated,
  onAddClick,
}: {
  snap: CompanyEditSnapshot
  onMutated: MutatedHandler
  /**
   * Called when the user picks "Create member" from the popover footer.
   * Parent swaps `membersView` to `'create'` which swaps this component
   * out for the full form sub-page.
   */
  onAddClick: () => void
}) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const canEdit = snap.viewerIsAdmin

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return snap.members
    return snap.members.filter((m) => {
      const display = [m.firstName, m.lastName].filter(Boolean).join(' ')
      return (
        m.email.toLowerCase().includes(q) ||
        display.toLowerCase().includes(q) ||
        (m.departmentTitleName ?? '').toLowerCase().includes(q)
      )
    })
  }, [snap.members, search])

  const remove = async (companyUserId: string) => {
    setPendingId(companyUserId)
    try {
      const next = await removeCompanyMemberFn({ data: { companyUserId } })
      await onMutated(next)
      toast.success('Member removed from company')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Remove failed')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 pt-2.5">
      <SectionHeader
        title="Members"
        description={`${snap.members.length} ${
          snap.members.length === 1 ? 'person has' : 'people have'
        } access to this company portal.`}
      />
      <Separator orientation="horizontal" className="w-full bg-border" />
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
            className="pl-7"
          />
        </div>
        {canEdit ? (
          <AddMemberPopover
            snap={snap}
            onMutated={onMutated}
            onCreateNew={onAddClick}
          />
        ) : null}
      </div>

      <div className="flex flex-col divide-y divide-muted rounded-md border border-border">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {search
              ? 'No members match that search.'
              : 'No members yet. Add the first one above.'}
          </p>
        ) : (
          filtered.map((m) => {
            const display =
              [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email
            const initials = (display || m.email)
              .split(/\s+/)
              .slice(0, 2)
              .map((s) => s[0]?.toUpperCase() ?? '')
              .join('')
            return (
              <div
                key={m.companyUserId}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <Avatar className="h-8 w-8">
                  {m.profilePictureUrl ? (
                    <AvatarImage src={m.profilePictureUrl} alt={display} />
                  ) : null}
                  <AvatarFallback className="bg-foreground text-xs text-white">
                    {initials || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {display}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.departmentTitleName ? ` · ${m.departmentTitleName}` : ''}
                  </p>
                </div>
                {m.role ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {m.role}
                  </span>
                ) : null}
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-muted-foreground hover:text-red-600"
                    onClick={() => remove(m.companyUserId)}
                    disabled={pendingId === m.companyUserId}
                    title="Remove from company"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

/**
 * Popover launched from the "Add member" button.  Shows the roster of
 * org users who are NOT yet in this company (profile pic + first+last
 * name, falling back to email).  Clicking a row attaches them to the
 * company in one network round trip and keeps the popover open so the
 * admin can add several people in a row without re-opening it.  The
 * fixed footer button escapes into the full "Create member" sub-page
 * for adding a brand-new user by email.
 *
 * Fetches org users lazily (only when the popover opens for the first
 * time) via TanStack Query keyed on the parent org id.  After every
 * successful add we `setQueryData` to drop the added user from the
 * cached list, so the popover stays in sync without a refetch.
 */
function AddMemberPopover({
  snap,
  onMutated,
  onCreateNew,
}: {
  snap: CompanyEditSnapshot
  onMutated: MutatedHandler
  onCreateNew: () => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const orgId = snap.company.organizationId

  // Shares the `['orgUsers', 'list', orgId]` cache with the org
  // dashboard's users page, so inviting a user from either surface
  // surfaces the new row in both views without a refetch.
  const orgUsersQuery = useOrgUsers(orgId, { enabled: open })

  // Fast membership lookup by org_user_id; filters out users already
  // attached so they don't appear as addable.
  const memberOrgUserIds = useMemo(
    () => new Set(snap.members.map((m) => m.orgUserId)),
    [snap.members],
  )

  const candidates = useMemo(() => {
    const rows = (orgUsersQuery.data ?? []).filter(
      (u) => !memberOrgUserIds.has(u.id),
    )
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((u) => {
      const display = [u.firstName, u.lastName].filter(Boolean).join(' ')
      return (
        u.email.toLowerCase().includes(q) ||
        display.toLowerCase().includes(q)
      )
    })
  }, [orgUsersQuery.data, memberOrgUserIds, search])

  const attach = async (user: OrgUserSummary) => {
    setPendingId(user.id)
    try {
      // `add_company_member` is idempotent on `(company_id, org_user_id)`
      // and uses email to resolve the org user, so passing the existing
      // user's email re-uses their org_user row instead of creating a
      // duplicate.
      const next = await addCompanyMemberFn({
        data: { companyId: snap.company.id, email: user.email },
      })
      await onMutated(next)
      toast.success('Member added to company')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Add failed')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="shrink-0">
          <UserPlus className="mr-1 h-3.5 w-3.5" />
          Add member
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[320px] p-0"
      >
        <div className="flex flex-col">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search org users…"
                className="h-8 pl-7 text-sm"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[260px] overflow-y-auto">
            {orgUsersQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : candidates.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {search
                  ? 'No org users match that search.'
                  : orgUsersQuery.data?.length
                    ? 'Everyone in this org is already a member.'
                    : 'No other org users yet.'}
              </p>
            ) : (
              <ul className="flex flex-col p-1">
                {candidates.map((u) => {
                  const display =
                    [u.firstName, u.lastName].filter(Boolean).join(' ') ||
                    u.email
                  const initials = (display || u.email)
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase() ?? '')
                    .join('')
                  const busy = pendingId === u.id
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => attach(u)}
                        disabled={busy || pendingId !== null}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors',
                          'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60',
                        )}
                      >
                        <Avatar className="h-7 w-7">
                          {u.profilePictureUrl ? (
                            <AvatarImage
                              src={u.profilePictureUrl}
                              alt={display}
                            />
                          ) : null}
                          <AvatarFallback className="bg-foreground text-[10px] text-white">
                            {initials || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {display}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setOpen(false)
                onCreateNew()
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create member
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CreateMemberForm({
  snap,
  onMutated,
  onCancel,
}: {
  snap: CompanyEditSnapshot
  onMutated: MutatedHandler
  onCancel: () => void
}) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [titleId, setTitleId] = useState<string>(ADD_MEMBER_TITLE_NONE)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canEdit = snap.viewerIsAdmin

  // Same title grouping logic as the list filter, kept local so the
  // form component is self-contained.
  const titleGroups = useMemo(() => {
    const byDept = new Map<
      string,
      { name: string; titles: Array<{ id: string; name: string }> }
    >()
    for (const dept of snap.departments) {
      byDept.set(dept.id, { name: dept.name, titles: [] })
    }
    for (const t of snap.titles) {
      const group = byDept.get(t.departmentId)
      if (group) group.titles.push({ id: t.id, name: t.name })
    }
    return Array.from(byDept.values()).filter((g) => g.titles.length > 0)
  }, [snap.departments, snap.titles])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setAdding(true)
    try {
      const next = await addCompanyMemberFn({
        data: {
          companyId: snap.company.id,
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          departmentTitleId:
            titleId === ADD_MEMBER_TITLE_NONE ? null : titleId,
        },
      })
      await onMutated(next)
      toast.success('Member added to company')
      onCancel()
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Add failed'
      setError(text)
      toast.error(text)
    } finally {
      setAdding(false)
    }
  }

  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        Only owners and admins can add members.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <SectionHeader
        title="Add a member"
        description="They'll get access to this company's tenant portal once they log in with this email."
      />

      <div className="grid gap-2">
        <Label htmlFor="ce-new-email">Email</Label>
        <Input
          id="ce-new-email"
          type="email"
          placeholder="person@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={adding}
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          If this email isn&apos;t an org user yet, one will be created
          automatically (role: <span className="font-mono">COMPANY</span>)
          and added to this company.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="ce-new-first">First name</Label>
          <Input
            id="ce-new-first"
            placeholder="Optional"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={adding}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ce-new-last">Last name</Label>
          <Input
            id="ce-new-last"
            placeholder="Optional"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={adding}
          />
        </div>
      </div>

      {titleGroups.length > 0 ? (
        <div className="grid gap-2">
          <Label htmlFor="ce-new-title">Title</Label>
          <Select
            value={titleId}
            onValueChange={setTitleId}
            disabled={adding}
          >
            <SelectTrigger id="ce-new-title" className="w-full">
              <SelectValue placeholder="No title" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ADD_MEMBER_TITLE_NONE}>No title</SelectItem>
              {titleGroups.map((group) => (
                <SelectGroup key={group.name}>
                  <SelectLabel>{group.name}</SelectLabel>
                  {group.titles.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="mt-1 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={adding}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={adding || email.trim().length === 0}
        >
          {adding ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3.5 w-3.5" />
          )}
          {adding ? 'Creating…' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// ----- Departments --------------------------------------------------
//
// Three-view section (list | create | detail) — titles are no longer a
// top-level sidebar entry; they live inside a department's detail view.
// View state is lifted to the dialog so the breadcrumb can reflect the
// active path (see `DepartmentsView` at the top of this file).

function DepartmentsSection({
  snap,
  onMutated,
  view,
  onViewChange,
}: {
  snap: CompanyEditSnapshot
  onMutated: MutatedHandler
  view: DepartmentsView
  onViewChange: (view: DepartmentsView) => void
}) {
  // If the currently-open department gets deleted underneath us (another
  // tab, another admin) bounce back to the list so we don't render a
  // stale header with no content.
  useEffect(() => {
    if (
      view.kind === 'detail' &&
      !snap.departments.some((d) => d.id === view.departmentId)
    ) {
      onViewChange({ kind: 'list' })
    }
  }, [view, snap.departments, onViewChange])

  if (view.kind === 'create') {
    return (
      <DepartmentCreateView
        snap={snap}
        onMutated={onMutated}
        onCancel={() => onViewChange({ kind: 'list' })}
        onCreated={(deptId) =>
          onViewChange({ kind: 'detail', departmentId: deptId })
        }
      />
    )
  }

  if (view.kind === 'detail') {
    const dept = snap.departments.find((d) => d.id === view.departmentId)
    if (!dept) return null
    return (
      <DepartmentDetailView
        snap={snap}
        dept={dept}
        onMutated={onMutated}
        onBack={() => onViewChange({ kind: 'list' })}
      />
    )
  }

  return (
    <DepartmentListView
      snap={snap}
      onCreate={() => onViewChange({ kind: 'create' })}
      onSelect={(deptId) =>
        onViewChange({ kind: 'detail', departmentId: deptId })
      }
    />
  )
}

// --- list ----------------------------------------------------------

/**
 * Overlapping avatar stack for a department row.
 *
 * Rules (per the user's spec):
 *  - No members -> render nothing.
 *  - 1-5 members -> one avatar circle per member.
 *  - >5 members  -> first 4 avatars, then a "+N" bubble in the 5th
 *                   slot where N counts the members not shown.
 */
function DepartmentAvatarGroup({
  members,
}: {
  members: Array<CompanyEditSnapshot['members'][number]>
}) {
  const MAX_CIRCLES = 5

  if (members.length === 0) return null

  const hasOverflow = members.length > MAX_CIRCLES
  const visible = hasOverflow ? members.slice(0, MAX_CIRCLES - 1) : members
  const overflowCount = hasOverflow
    ? members.length - (MAX_CIRCLES - 1)
    : 0

  return (
    <div className="flex -space-x-2">
      {visible.map((m) => {
        const fullName =
          [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email
        const initials =
          fullName
            .split(/\s+/)
            .slice(0, 2)
            .map((s) => s[0]?.toUpperCase() ?? '')
            .join('') || '?'
        return (
          <Avatar
            key={m.companyUserId}
            className="h-9 w-9 border-2 border-white"
            title={fullName}
          >
            {m.profilePictureUrl ? (
              <AvatarImage src={m.profilePictureUrl} alt={fullName} />
            ) : null}
            <AvatarFallback className="bg-foreground text-[11px] text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        )
      })}
      {overflowCount > 0 ? (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-muted text-[11px] font-medium text-muted-foreground"
          aria-label={`${overflowCount} more`}
          title={`${overflowCount} more`}
        >
          +{overflowCount}
        </div>
      ) : null}
    </div>
  )
}

function DepartmentListView({
  snap,
  onCreate,
  onSelect,
}: {
  snap: CompanyEditSnapshot
  onCreate: () => void
  onSelect: (departmentId: string) => void
}) {
  const [query, setQuery] = useState('')
  const canEdit = snap.viewerIsAdmin
  const q = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return snap.departments
    return snap.departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false),
    )
  }, [snap.departments, q])

  // Per-row counters (titles + members) derived on the fly.  We also
  // collect the full member records per department so the row can
  // render an avatar group (capped at 5 circles with a `+N` overflow
  // bubble) rather than just a "N members" count.
  const counts = useMemo(() => {
    const titlesByDept = new Map<string, number>()
    for (const t of snap.titles) {
      titlesByDept.set(t.departmentId, (titlesByDept.get(t.departmentId) ?? 0) + 1)
    }
    const titleToDept = new Map<string, string>()
    for (const t of snap.titles) titleToDept.set(t.id, t.departmentId)
    const membersByDept = new Map<
      string,
      Array<CompanyEditSnapshot['members'][number]>
    >()
    for (const m of snap.members) {
      if (!m.departmentTitleId) continue
      const deptId = titleToDept.get(m.departmentTitleId)
      if (!deptId) continue
      const arr = membersByDept.get(deptId) ?? []
      arr.push(m)
      membersByDept.set(deptId, arr)
    }
    return { titlesByDept, membersByDept }
  }, [snap.titles, snap.members])

  return (
    <div className="flex flex-col gap-3 pt-2.5" >
      <SectionHeader
        title="Departments"
        description="Groups of titles and members. Open a department to manage its titles and assign members."
      />
      <Separator orientation="horizontal" className="w-full bg-border" />

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search departments"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        {canEdit ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Create
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
          {snap.departments.length === 0
            ? canEdit
              ? 'No departments yet. Click Create to add one.'
              : 'No departments yet.'
            : 'No departments match your search.'}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-muted rounded-md border border-border">
          {filtered.map((d) => {
            const titleCount = counts.titlesByDept.get(d.id) ?? 0
            const deptMembers = counts.membersByDept.get(d.id) ?? []
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => onSelect(d.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-background"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-foreground">
                      {d.name}
                    </p>
                    {d.description ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {d.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="hidden shrink-0 items-center gap-3 sm:flex">
                    <DepartmentAvatarGroup members={deptMembers} />
                    <span className="text-xs text-muted-foreground">
                      {titleCount} {titleCount === 1 ? 'title' : 'titles'}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// --- create --------------------------------------------------------

function DepartmentCreateView({
  snap,
  onMutated,
  onCancel,
  onCreated,
}: {
  snap: CompanyEditSnapshot
  onMutated: MutatedHandler
  onCancel: () => void
  onCreated: (departmentId: string) => void
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canEdit = snap.viewerIsAdmin

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit || pending || name.trim().length === 0) return
    setError(null)
    setPending(true)
    // Remember the pre-create ids so we can pick out the brand-new one
    // from the snapshot the RPC hands us back - the RPC only returns
    // the full snapshot, not the created id.
    const priorIds = new Set(snap.departments.map((d) => d.id))
    try {
      const next = await createDepartmentFn({
        data: {
          companyId: snap.company.id,
          name: name.trim(),
          description: desc.trim() || undefined,
        },
      })
      await onMutated(next)
      const created = next.departments.find((d) => !priorIds.has(d.id))
      if (created) {
        onCreated(created.id)
      } else {
        // Defensive: if we couldn't identify the new row for any reason
        // just drop back to the list.  Should never happen in practice.
        onCancel()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 pt-2.5">
      <SectionHeader
        title="Create department"
        description="A department groups job titles together. After creating, you can add titles and assign members."
      />
      <Separator orientation="horizontal" className="w-full bg-border" />
      <div className="grid gap-2">
        <Label htmlFor="dept-new-name">Name</Label>
        <Input
          id="dept-new-name"
          placeholder="Engineering"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending || !canEdit}
          autoFocus
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="dept-new-desc">Description (optional)</Label>
        <Input
          id="dept-new-desc"
          placeholder="Software development team"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          disabled={pending || !canEdit}
        />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending || name.trim().length === 0 || !canEdit}
        >
          {pending ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3.5 w-3.5" />
          )}
          {pending ? 'Creating…' : 'Create department'}
        </Button>
      </div>
    </form>
  )
}

// --- detail --------------------------------------------------------

type DepartmentRow = CompanyEditSnapshot['departments'][number]

type DepartmentDetailTab = 'titles' | 'members' | 'settings'

function DepartmentDetailView({
  snap,
  dept,
  onMutated,
  onBack,
}: {
  snap: CompanyEditSnapshot
  dept: DepartmentRow
  onMutated: MutatedHandler
  onBack: () => void
}) {
  const canEdit = snap.viewerIsAdmin
  const [tab, setTab] = useState<DepartmentDetailTab>('members')

  // Reset to the first tab whenever the user navigates into a different
  // department - otherwise a quick hop from one dept's Settings tab to
  // another would land on Settings, which is surprising.
  useEffect(() => {
    setTab('members')
  }, [dept.id])

  // Scope the snapshot down to just what this department cares about.
  const deptTitles = useMemo(
    () => snap.titles.filter((t) => t.departmentId === dept.id),
    [snap.titles, dept.id],
  )
  const deptTitleIds = useMemo(
    () => new Set(deptTitles.map((t) => t.id)),
    [deptTitles],
  )
  const deptMembers = useMemo(
    () =>
      snap.members.filter(
        (m) => m.departmentTitleId && deptTitleIds.has(m.departmentTitleId),
      ),
    [snap.members, deptTitleIds],
  )

  // One header row for the entire detail view: back arrow + dept name
  // on the left, the tab pills on the right.  Collapsing title + tabs
  // into a single line keeps the panel from feeling stacked and gives
  // the cards below room to breathe.  Detailed copy (like the dept
  // description) lives in the Settings tab; re-printing it up top was
  // just noise alongside the breadcrumb.
  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as DepartmentDetailTab)}
      className="flex min-h-full min-w-full flex-col gap-1 rounded-sm"
      orientation="horizontal"
    >
      {/*
       * Row 1 (header): back arrow + horizontal tabs.
       * The tabs replace the "DEPT SETTINGS" label - their active pill
       * already tells you which sub-view you're on, so a second title
       * would be redundant.  The muted wrapper is kept around the
       * TabsList to give the row the "chip group" feel.
       */}
      {/*
       * Negative margins pull the bar through the scroll container's
       * `px-2 py-1 sm:px-5` padding so the muted background is flush
       * with the modal edges.  Internal `px-*`/`py-*` restores
       * breathing room for the back arrow + tab pills.
       */}
      <div className="flex items-center gap-1 border-b px-2 sm:-mx-5 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="-ml-0.5 h-7 w-7 rounded-[6px] text-muted-foreground hover:text-foreground"
          aria-label="Back to departments"
          title="Back to departments"
        >
          <ArrowLeft className="h-2 w-2" />
        </Button>
        <div className="rounded-md">
          {/*
           * `after:bg-primary` overrides the default `after:bg-foreground`
           * baked into TabsTrigger, swapping the active-tab underline
           * from black to the theme green (--primary).
           */}
          <TabsList variant="line" className="h-auto w-fit bg-transparent p-0">
            <TabsTrigger
              value="members"
              className="h-[80%] rounded-sm after:bg-primary"
            >
              Members
              <span className="ml-1.5 rounded-full bg-border px-1.5 text-[10px] font-medium text-muted-foreground">
                {deptMembers.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="titles"
              className="h-[80%] rounded-sm after:bg-primary"
            >
              Titles
              <span className="ml-1.5 rounded-full bg-border px-1.5 text-[10px] font-medium text-muted-foreground">
                {deptTitles.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="h-[80%] rounded-sm after:bg-primary"
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {/*
       * Row 2 (content): active tab fills the remaining height of the
       * modal body thanks to `min-h-full` on the root + `min-h-0 flex-1`
       * here.  `px-1 sm:px-2 pt-3` gives each panel a small inset from
       * the edge-to-edge header bar so the content reads as narrower
       * than the tab strip.
       */}
      <TabsContent
        value="members"
        className="flex min-h-0 flex-1 flex-col px-1 pt-1 pb-4 sm:px-2"
      >
        <DepartmentMembersPanel
          allMembers={snap.members}
          dept={dept}
          titles={deptTitles}
          members={deptMembers}
          canEdit={canEdit}
          onMutated={onMutated}
        />
      </TabsContent>

      <TabsContent
        value="titles"
        className="flex min-h-0 flex-1 flex-col pt-1 pb-4 sm:px-2"
      >
        <DepartmentTitlesPanel
          companyId={snap.company.id}
          dept={dept}
          titles={deptTitles}
          canEdit={canEdit}
          onMutated={onMutated}
        />
      </TabsContent>

      <TabsContent
        value="settings"
        className="flex min-h-0 flex-1 flex-col pt-1 pb-4 sm:px-2"
      >
        <DepartmentSettingsPanel
          dept={dept}
          canEdit={canEdit}
          onMutated={onMutated}
          onDeleted={onBack}
        />
      </TabsContent>
    </Tabs>
  )
}

// --- detail: settings panel ---------------------------------------

function DepartmentSettingsPanel({
  dept,
  canEdit,
  onMutated,
  onDeleted,
}: {
  dept: DepartmentRow
  canEdit: boolean
  onMutated: MutatedHandler
  /**
   * Fired after a successful delete so the parent can pop the user
   * back to the department list view.  The snapshot is already
   * refreshed via `onMutated` before this runs.
   */
  onDeleted: () => void
}) {
  const [name, setName] = useState(dept.name)
  const [desc, setDesc] = useState(dept.description ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirm, dialog: confirmDialog } = useConfirm()

  // Sync local form state if the dept gets mutated from elsewhere (e.g.
  // a rename committed in another tab).  Keyed on the dept row so we
  // reset cleanly when navigating between departments too.
  useEffect(() => {
    setName(dept.name)
    setDesc(dept.description ?? '')
    setError(null)
  }, [dept.id, dept.name, dept.description])

  const trimmedName = name.trim()
  const trimmedDesc = desc.trim()
  const dirty =
    trimmedName !== dept.name || trimmedDesc !== (dept.description ?? '')

  const save = async () => {
    if (!canEdit || !dirty || saving || trimmedName.length === 0) return
    setError(null)
    setSaving(true)
    try {
      const next = await updateDepartmentFn({
        data: {
          departmentId: dept.id,
          name: trimmedName,
          // Empty string explicitly clears the description column; we
          // always send a string here (never undefined) because the
          // user may be clearing an existing description.
          description: trimmedDesc,
        },
      })
      await onMutated(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const deleteDept = async () => {
    if (!canEdit || deleting) return
    const ok = await confirm({
      title: `Delete ${dept.name}?`,
      description:
        'All titles inside this department will be deleted. Members assigned a title here will lose it (they stay in the company). This cannot be undone.',
      confirmText: 'Delete department',
      tone: 'destructive',
    })
    if (!ok) return
    setError(null)
    setDeleting(true)
    try {
      const next = await deleteDepartmentFn({
        data: { departmentId: dept.id },
      })
      await onMutated(next)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  return (
    /*
     * `flex-1 min-h-0` lets the panel grow to fill the TabsContent's
     * height; `mt-auto` on the danger zone card then pushes it to the
     * bottom edge while the form stays pinned to the top.
     */
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-col">
        <h3 className="text-md font-semibold text-foreground">Settings</h3>
        <p className="text-xs text-muted-foreground">
          Update this department&apos;s name and description.
        </p>
      </div>
      <Separator orientation="horizontal" className="w-full bg-border" />
      <div className="grid grid-flow-col grid-rows-2 pt-1 gap-2 pb-2">
      <div className="row-span-1">
        <Label htmlFor="dept-settings-name" className="text-sm text-font-semibold pb-1">Name</Label>
        <Input
          id="dept-settings-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit || saving || deleting}
          />
      </div>

      <div className=" row-span-1 ">
        <Label htmlFor="dept-settings-desc" className="text-sm text-font-semibold pb-1">Description</Label>
        <Input
          id="dept-settings-desc"
          placeholder="Software development team"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          disabled={!canEdit || saving || deleting}
        />
      </div>
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      {canEdit ? (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={save}
            disabled={!dirty || saving || deleting || trimmedName.length === 0}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only owners and admins can edit departments.
        </p>
      )}

      {canEdit ? (
        <div className="mt-auto flex flex-row items-center justify-between gap-2 rounded-md border border-red-200 bg-red-50/50 p-3">
          <div className="flex flex-col gap-1 justify-start">
            <h6 className="text-sm font-semibold text-red-700">Danger zone</h6>
            <p className="text-xs text-red-600/80">
              Deleting this department Will Delete All Associated Titles and Members.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-100 hover:text-red-700"
              onClick={deleteDept}
              disabled={deleting || saving}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              {deleting ? 'Deleting…' : 'Delete department'}
            </Button>
          </div>
        </div>
      ) : null}

      {confirmDialog}
    </div>
  )
}

// --- detail: titles panel -----------------------------------------

function DepartmentTitlesPanel({
  companyId,
  dept,
  titles,
  canEdit,
  onMutated,
}: {
  companyId: string
  dept: DepartmentRow
  titles: CompanyEditSnapshot['titles']
  canEdit: boolean
  onMutated: MutatedHandler
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const { confirm, dialog: confirmDialog } = useConfirm()

  const filteredTitles = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return titles
    return titles.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false),
    )
  }, [titles, query])

  const remove = async (titleId: string) => {
    const ok = await confirm({
      title: 'Delete title?',
      description: 'Members assigned this title will be left without one.',
      confirmText: 'Delete title',
      tone: 'destructive',
    })
    if (!ok) return
    setError(null)
    setPendingDelete(titleId)
    try {
      const next = await deleteTitleFn({ data: { titleId } })
      await onMutated(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader
        title="Titles"
        description={`Titles Associated with ${dept.name}`}
      />
      <Separator orientation="horizontal" className="w-full bg-border" />
      {/*
       * Search on the left, primary action on the right - mirrors the
       * Members tab so the two feel like siblings.
       */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles"
            className="h-8 pl-8"
          />
        </div>
        {canEdit ? (
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline" className="shrink-0">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add title
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[320px] p-0">
              <AddTitleForm
                companyId={companyId}
                departmentId={dept.id}
                onCancel={() => setAddOpen(false)}
                onDone={async (next) => {
                  await onMutated(next)
                  setAddOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      {titles.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
          No titles yet.
        </div>
      ) : filteredTitles.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
          No titles match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        /*
         * Single-column stack of full-width cards - mirrors the Members
         * panel's one-per-row rhythm so the two tabs feel like siblings.
         */
        <div className="flex flex-col gap-2">
          {filteredTitles.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-md border border-border bg-white p-3 transition-colors hover:border-border"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {t.name}
                </p>
                {t.description ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs italic text-[#a8a69d]">
                    No description
                  </p>
                )}
              </div>
              {canEdit ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-1 -mt-1 h-7 shrink-0 text-muted-foreground hover:text-red-600"
                  onClick={() => remove(t.id)}
                  disabled={pendingDelete === t.id}
                  title="Delete title"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {confirmDialog}
    </div>
  )
}

/**
 * Compact "Add title" popover, structured like `AddDeptMemberForm` so
 * the two headers in the department detail view behave identically
 * from the user's perspective.
 */
function AddTitleForm({
  companyId,
  departmentId,
  onCancel,
  onDone,
}: {
  companyId: string
  departmentId: string
  onCancel: () => void
  onDone: (snap: CompanyEditSnapshot) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pending || name.trim().length === 0) return
    setError(null)
    setPending(true)
    try {
      const next = await createTitleFn({
        data: {
          companyId,
          departmentId,
          name: name.trim(),
          description: desc.trim() || undefined,
        },
      })
      await onDone(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-3">
      <div className="grid gap-1.5">
        <Label htmlFor="add-t-name" className="text-xs">
          Name
        </Label>
        <Input
          id="add-t-name"
          placeholder="Staff Accountant"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          autoFocus
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="add-t-desc" className="text-xs">
          Description (optional)
        </Label>
        <Input
          id="add-t-desc"
          placeholder="Owns month-end close"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          disabled={pending}
        />
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending || name.trim().length === 0}
        >
          {pending ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3.5 w-3.5" />
          )}
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </form>
  )
}

// --- detail: members panel ----------------------------------------

type CompanyMember = CompanyEditSnapshot['members'][number]

function DepartmentMembersPanel({
  allMembers,
  dept,
  titles,
  members,
  canEdit,
  onMutated,
}: {
  allMembers: Array<CompanyMember>
  dept: DepartmentRow
  titles: CompanyEditSnapshot['titles']
  members: Array<CompanyMember>
  canEdit: boolean
  onMutated: MutatedHandler
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const { confirm, dialog: confirmDialog } = useConfirm()

  // "Available" = anyone in the company who isn't already wearing a
  // title in this department.  Picking someone from another dept here
  // reassigns their title; we surface their current assignment in the
  // picker so that reassignment isn't surprising.
  const memberIdsInDept = useMemo(
    () => new Set(members.map((m) => m.companyUserId)),
    [members],
  )
  const availableMembers = useMemo(
    () => allMembers.filter((m) => !memberIdsInDept.has(m.companyUserId)),
    [allMembers, memberIdsInDept],
  )

  // Lightweight case-insensitive filter across display name, email and
  // the member's assigned title - covers the three things someone is
  // most likely to type when scanning a large dept.
  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter((m) => {
      const name = memberDisplayName(m).toLowerCase()
      const email = m.email.toLowerCase()
      const title = m.departmentTitleName?.toLowerCase() ?? ''
      return name.includes(q) || email.includes(q) || title.includes(q)
    })
  }, [members, query])

  const removeFromDept = async (m: CompanyMember) => {
    const ok = await confirm({
      title: `Remove ${memberDisplayName(m)} from ${dept.name}?`,
      description:
        'The member stays in the company without a title. You can re-assign them any time from any department.',
      confirmText: 'Remove',
      tone: 'destructive',
    })
    if (!ok) return
    setError(null)
    setPendingRemove(m.companyUserId)
    try {
      const next = await setCompanyMemberTitleFn({
        data: { companyUserId: m.companyUserId, departmentTitleId: null },
      })
      await onMutated(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    } finally {
      setPendingRemove(null)
    }
  }

  const addDisabledReason =
    titles.length === 0
      ? 'Create a title first'
      : availableMembers.length === 0
      ? 'Every company member is already in this department'
      : undefined

  return (
    <div className="flex flex-col gap-2">
      <SectionHeader
        title="Members"
        description={`Manage Members Assigned to ${dept.name}`}
      />
      <Separator orientation="horizontal" className="w-full bg-border" />
      {/*
       * Search on the left, primary action on the right - mirrors the
       * department list page so the two feel like siblings.
       */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members"
            className="h-8 pl-8"
          />
        </div>
        {canEdit ? (
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={addDisabledReason !== undefined}
                title={addDisabledReason}
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                Add member
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[320px] p-0">
              <AddDeptMemberForm
                availableMembers={availableMembers}
                titles={titles}
                onCancel={() => setAddOpen(false)}
                onDone={async (next) => {
                  await onMutated(next)
                  setAddOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        ) : null}
      </div>

      <div className="rounded-md border border-border">
        {members.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No members in this department yet.
          </p>
        ) : filteredMembers.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No members match &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <ul className="divide-y divide-muted">
            {filteredMembers.map((m) => {
              const fullName = memberDisplayName(m)
              const initials = fullName
                .split(/\s+/)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase() ?? '')
                .join('')
              return (
                <li
                  key={m.companyUserId}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Avatar className="h-8 w-8">
                    {m.profilePictureUrl ? (
                      <AvatarImage src={m.profilePictureUrl} alt={fullName} />
                    ) : null}
                    <AvatarFallback className="bg-foreground text-[10px] text-white">
                      {initials || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.email}
                      {m.departmentTitleName
                        ? ` · ${m.departmentTitleName}`
                        : ''}
                    </p>
                  </div>
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-muted-foreground hover:text-red-600"
                      onClick={() => removeFromDept(m)}
                      disabled={pendingRemove === m.companyUserId}
                      title="Remove from department"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {confirmDialog}
    </div>
  )
}

function AddDeptMemberForm({
  availableMembers,
  titles,
  onCancel,
  onDone,
}: {
  availableMembers: Array<CompanyMember>
  titles: CompanyEditSnapshot['titles']
  onCancel: () => void
  onDone: (snap: CompanyEditSnapshot) => Promise<void>
}) {
  const [companyUserId, setCompanyUserId] = useState<string>('')
  const [titleId, setTitleId] = useState<string>(titles[0]?.id ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyUserId || !titleId || pending) return
    setError(null)
    setPending(true)
    try {
      const next = await setCompanyMemberTitleFn({
        data: { companyUserId, departmentTitleId: titleId },
      })
      await onDone(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Add failed')
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-3">
      <div className="grid gap-1.5">
        <Label htmlFor="add-dm-member" className="text-xs">
          Member
        </Label>
        <Select
          value={companyUserId}
          onValueChange={setCompanyUserId}
          disabled={pending}
        >
          <SelectTrigger id="add-dm-member" className="w-full">
            <SelectValue placeholder="Select a member" />
          </SelectTrigger>
          <SelectContent>
            {availableMembers.map((m) => (
              <SelectItem key={m.companyUserId} value={m.companyUserId}>
                {memberDisplayName(m)}
                {m.departmentTitleName
                  ? ` — currently ${m.departmentTitleName}`
                  : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="add-dm-title" className="text-xs">
          Title
        </Label>
        <Select value={titleId} onValueChange={setTitleId} disabled={pending}>
          <SelectTrigger id="add-dm-title" className="w-full">
            <SelectValue placeholder="Select a title" />
          </SelectTrigger>
          <SelectContent>
            {titles.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending || !companyUserId || !titleId}
        >
          {pending ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3.5 w-3.5" />
          )}
          {pending ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </form>
  )
}

function memberDisplayName(m: CompanyMember): string {
  const full = [m.firstName, m.lastName].filter(Boolean).join(' ').trim()
  return full || m.email
}

// ----- shared ------------------------------------------------------

// `SectionHeader` was pulled up into `@/components/ui/settings-modal`
// so both this dialog and the account dialog share the same heading
// style. We keep the local alias so the many call sites in this file
// don't need to change.
const SectionHeader = SettingsSectionHeader
