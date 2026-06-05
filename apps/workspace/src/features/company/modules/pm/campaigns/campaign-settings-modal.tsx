// @ts-nocheck
/**
 * Unified settings surface for a campaign — mirrors the SaaS
 * `CompanyEditDialog` shell (`SettingsModal` + left sidebar) so the
 * dimensions stay fixed as the user flips between tabs. Four sections:
 *
 *   General    — name / code / category / dates / description / cover
 *   Team       — campaign-level teams + member rosters
 *   Categories — company-wide category CRUD (affects every campaign)
 *   Danger     — delete campaign
 *
 * Data for the Team section (campaign teams + company roster) is
 * prefetched by the campaign detail route loader, so this modal opens
 * with every section already warm — no loading flicker on tab switch.
 */
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  Check,
  Pencil,
  Plus,
  Settings,
  Tags,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  SettingsBody,
  SettingsHeader,
  SettingsModal,
  SettingsPane,
  SettingsSectionHeader,
  SettingsSidebar,
  type SettingsSection as SettingsSectionType,
} from "@/components/ui/settings-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  useCampaignCategories,
  useCreateCampaignCategory,
  useDeleteCampaign,
  useDeleteCampaignCategory,
  useUpdateCampaign,
  useUpdateCampaignCategory,
} from "@/lib/data/pm/campaigns/hooks";
import type {
  PmCampaignCategory,
  PmCampaignDetail,
  PmCampaignWithCategory,
} from "@/lib/data/pm/campaigns/client";
import { useCompanyTeam } from "@/lib/data/team/hooks";
import type { TeamMember } from "@/lib/data/team/client";
import {
  useAddCampaignTeamMember,
  useCampaignTeams,
  useCreateCampaignTeam,
  useDeleteCampaignTeam,
  useRemoveCampaignTeamMember,
  useRenameCampaignTeam,
} from "@/lib/data/pm/campaign-teams/hooks";
import type { PmCampaignTeamWithMembers } from "@/lib/data/pm/campaign-teams/client";
import {
  PmUserAvatar,
  displayName,
} from "@/features/company/modules/pm/shared/user-avatar";

type SectionKey = "general" | "team" | "categories" | "danger";

const SECTIONS: ReadonlyArray<SettingsSectionType<SectionKey>> = [
  { key: "general", label: "General", icon: Building2 },
  { key: "team", label: "Team", icon: Users },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "danger", label: "Danger zone", icon: AlertTriangle },
];

export function CampaignSettingsModal({
  open,
  onOpenChange,
  companyId,
  companySlug,
  campaign,
  initialTab = "general",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  companySlug: string;
  campaign: PmCampaignWithCategory | PmCampaignDetail;
  initialTab?: SectionKey;
}) {
  const [section, setSection] = React.useState<SectionKey>(initialTab);

  React.useEffect(() => {
    if (open) setSection(initialTab);
  }, [open, initialTab]);

  const sectionLabel =
    SECTIONS.find((s) => s.key === section)?.label ?? section;

  return (
    <SettingsModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Settings for ${campaign.name}`}
      description="Manage campaign details, teams, categories and deletion."
    >
      <SettingsSidebar
        title="Campaign settings"
        icon={Settings}
        sections={SECTIONS}
        active={section}
        onChange={setSection}
      />

      <SettingsPane>
        <SettingsHeader
          leadLabel={campaign.name}
          trail={[{ label: sectionLabel }]}
          onClose={() => onOpenChange(false)}
        />

        <SettingsBody>
          {section === "general" ? (
            <GeneralSection
              companyId={companyId}
              companySlug={companySlug}
              campaign={campaign}
              onDone={() => onOpenChange(false)}
            />
          ) : null}
          {section === "team" ? (
            <TeamSection
              companyId={companyId}
              companySlug={companySlug}
              campaignId={campaign.id}
            />
          ) : null}
          {section === "categories" ? (
            <CategoriesSection
              companyId={companyId}
              companySlug={companySlug}
              currentCategoryId={campaign.category_id}
            />
          ) : null}
          {section === "danger" ? (
            <DangerSection
              companyId={companyId}
              companySlug={companySlug}
              campaign={campaign}
              onDeleted={() => onOpenChange(false)}
            />
          ) : null}
        </SettingsBody>
      </SettingsPane>
    </SettingsModal>
  );
}

// ---------- General ------------------------------------------------

type FormState = {
  name: string;
  campaign_code: string;
  category_id: string;
  description: string;
  start_date: string;
  end_date: string;
  campaign_image_url: string;
};

function toInputDate(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function fromInputDate(value: string): string | null {
  return value ? value : null;
}

function GeneralSection({
  companyId,
  companySlug,
  campaign,
  onDone,
}: {
  companyId: string;
  companySlug: string;
  campaign: PmCampaignWithCategory | PmCampaignDetail;
  onDone: () => void;
}) {
  const { data: categories } = useCampaignCategories(companyId);
  const updateCampaign = useUpdateCampaign(companyId, companySlug);
  const createCategory = useCreateCampaignCategory(companyId, companySlug);

  const [form, setForm] = React.useState<FormState>(() => ({
    name: campaign.name,
    campaign_code: campaign.campaign_code ?? "",
    category_id: campaign.category_id ?? "",
    description: campaign.description ?? "",
    start_date: toInputDate(campaign.start_date),
    end_date: toInputDate(campaign.end_date),
    campaign_image_url: campaign.campaign_image_url ?? "",
  }));

  const [newCatOpen, setNewCatOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");

  const canSubmit =
    form.name.trim().length > 0 &&
    !!form.category_id &&
    !updateCampaign.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    await updateCampaign.mutateAsync({
      id: campaign.id,
      name: form.name.trim(),
      category_id: form.category_id,
      campaign_code: form.campaign_code.trim() || null,
      description: form.description.trim() || null,
      start_date: fromInputDate(form.start_date),
      end_date: fromInputDate(form.end_date),
      campaign_image_url: form.campaign_image_url.trim() || null,
    });
    onDone();
  }

  async function handleCreateCategory() {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const cat = await createCategory.mutateAsync({
      company_id: companyId,
      name: trimmed,
    });
    setForm((f) => ({ ...f, category_id: cat.id }));
    setNewCatName("");
    setNewCatOpen(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2.5">
      <SettingsSectionHeader
        title="General"
        description="Top-record data shown on the campaign list and every downstream surface."
      />
      <Separator orientation="horizontal" className="w-full bg-border" />

      <div className="grid gap-2">
        <Label htmlFor="settings-name">Name *</Label>
        <Input
          id="settings-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="settings-code">Code</Label>
          <Input
            id="settings-code"
            value={form.campaign_code}
            onChange={(e) =>
              setForm({ ...form, campaign_code: e.target.value })
            }
            placeholder="SP26"
          />
        </div>

        <div className="grid gap-2">
          <Label>Category *</Label>
          <div className="flex gap-1.5">
            <Select
              value={form.category_id}
              onValueChange={(v) => setForm({ ...form, category_id: v })}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => setNewCatOpen((v) => !v)}
              aria-label="Add category"
            >
              <Plus className="size-4" />
            </Button>
          </div>
          {newCatOpen ? (
            <div className="flex gap-1.5 pt-1">
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="New category name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCategory();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateCategory}
                disabled={!newCatName.trim() || createCategory.isPending}
              >
                Add
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="settings-start">Start date</Label>
          <Input
            id="settings-start"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="settings-end">End date</Label>
          <Input
            id="settings-end"
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="settings-image">Cover image URL</Label>
        <Input
          id="settings-image"
          value={form.campaign_image_url}
          onChange={(e) =>
            setForm({ ...form, campaign_image_url: e.target.value })
          }
          placeholder="https://…"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="settings-description">Description</Label>
        <Textarea
          id="settings-description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="mt-2 flex items-center justify-end gap-2 pb-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {updateCampaign.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

// ---------- Team ---------------------------------------------------

function TeamSection({
  companyId,
  companySlug,
  campaignId,
}: {
  companyId: string;
  companySlug: string;
  campaignId: string;
}) {
  const teamsQuery = useCampaignTeams(campaignId);
  const companyTeamQuery = useCompanyTeam(companyId);
  const createTeam = useCreateCampaignTeam(campaignId, companyId, companySlug);
  const [newTeamName, setNewTeamName] = React.useState("");

  async function handleCreateTeam() {
    const name = newTeamName.trim();
    if (!name) return;
    await createTeam.mutateAsync({ name });
    setNewTeamName("");
  }

  const teams = teamsQuery.data ?? [];
  const companyUsers = companyTeamQuery.data ?? [];

  return (
    <div className="flex flex-col gap-3 pt-2.5 pb-2">
      <SettingsSectionHeader
        title="Team"
        description="Group members into campaign teams (e.g. Design, Dev). Teams scope who shows up in task assignments."
      />
      <Separator orientation="horizontal" className="w-full bg-border" />

      <div className="flex gap-2">
        <Input
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="New team name (e.g. Design)"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreateTeam();
            }
          }}
        />
        <Button
          size="sm"
          onClick={handleCreateTeam}
          disabled={!newTeamName.trim() || createTeam.isPending}
        >
          <Plus className="size-4" />
          Add team
        </Button>
      </div>

      {teamsQuery.isLoading && teams.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Loading teams…
        </p>
      ) : teams.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No teams yet. Create one above to start assigning people.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {teams.map((team) => (
            <CampaignTeamCard
              key={team.id}
              team={team}
              companyUsers={companyUsers}
              companyId={companyId}
              companySlug={companySlug}
              campaignId={campaignId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignTeamCard({
  team,
  companyUsers,
  companyId,
  companySlug,
  campaignId,
}: {
  team: PmCampaignTeamWithMembers;
  companyUsers: TeamMember[];
  companyId: string;
  companySlug: string;
  campaignId: string;
}) {
  const addMember = useAddCampaignTeamMember(
    campaignId,
    companyId,
    companySlug,
  );
  const removeMember = useRemoveCampaignTeamMember(
    campaignId,
    companyId,
    companySlug,
  );
  const renameTeam = useRenameCampaignTeam(campaignId, companyId, companySlug);
  const deleteTeam = useDeleteCampaignTeam(campaignId, companyId, companySlug);

  const [editingName, setEditingName] = React.useState(false);
  const [nextName, setNextName] = React.useState(team.name);
  const [picking, setPicking] = React.useState(false);

  const availableUsers = React.useMemo(() => {
    const taken = new Set(team.members.map((m) => m.company_user_id));
    return companyUsers.filter((u) => !taken.has(u.id));
  }, [companyUsers, team.members]);

  return (
    <div className="rounded-md border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        {editingName ? (
          <>
            <Input
              value={nextName}
              onChange={(e) => setNextName(e.target.value)}
              className="h-7 text-sm"
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={async () => {
                const trimmed = nextName.trim();
                if (trimmed && trimmed !== team.name) {
                  await renameTeam.mutateAsync({ id: team.id, name: trimmed });
                }
                setEditingName(false);
              }}
            >
              <Check className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => {
                setNextName(team.name);
                setEditingName(false);
              }}
            >
              <X className="size-3.5" />
            </Button>
          </>
        ) : (
          <>
            <span className="text-sm font-medium">{team.name}</span>
            <Badge variant="secondary" className="text-[10px]">
              {team.members.length}
            </Badge>
            <div className="ml-auto flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={() => {
                  setNextName(team.name);
                  setEditingName(true);
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => deleteTeam.mutate({ id: team.id })}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3">
        {team.members.length === 0 ? (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No members yet.
          </p>
        ) : (
          team.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50"
            >
              <PmUserAvatar user={m} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{displayName(m)}</div>
                {m.email ? (
                  <div className="truncate text-xs text-muted-foreground">
                    {m.email}
                  </div>
                ) : null}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => removeMember.mutate({ id: m.id })}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))
        )}

        {picking ? (
          <div className="rounded-md border bg-background p-2">
            {availableUsers.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">
                All company users are already on this team.
              </p>
            ) : (
              <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="flex items-center gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-accent"
                    onClick={async () => {
                      await addMember.mutateAsync({
                        campaign_team_id: team.id,
                        company_user_id: u.id,
                      });
                      setPicking(false);
                    }}
                  >
                    <PmUserAvatar user={u} size="sm" />
                    <span className="min-w-0 flex-1 truncate">
                      {displayName(u)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                onClick={() => setPicking(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="mt-1 h-7 w-full justify-start text-muted-foreground"
            onClick={() => setPicking(true)}
          >
            <UserPlus className="size-3.5" />
            Add member
          </Button>
        )}
      </div>
    </div>
  );
}

// ---------- Categories --------------------------------------------

function CategoriesSection({
  companyId,
  companySlug,
  currentCategoryId,
}: {
  companyId: string;
  companySlug: string;
  currentCategoryId: string | null;
}) {
  const { data: categories } = useCampaignCategories(companyId);
  const createCategory = useCreateCampaignCategory(companyId, companySlug);
  const [newName, setNewName] = React.useState("");

  return (
    <div className="flex flex-col gap-3 pt-2.5 pb-2">
      <SettingsSectionHeader
        title="Categories"
        description="Shared across every campaign for this company. Renaming one updates the label everywhere; deletion is blocked while any campaign still references it."
      />
      <Separator orientation="horizontal" className="w-full bg-border" />

      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (newName.trim()) {
                await createCategory.mutateAsync({
                  company_id: companyId,
                  name: newName.trim(),
                });
                setNewName("");
              }
            }
          }}
        />
        <Button
          size="sm"
          onClick={async () => {
            if (!newName.trim()) return;
            await createCategory.mutateAsync({
              company_id: companyId,
              name: newName.trim(),
            });
            setNewName("");
          }}
          disabled={!newName.trim() || createCategory.isPending}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <div className="flex flex-col divide-y divide-muted rounded-md border border-border">
        {(categories ?? []).length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          (categories ?? []).map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              companyId={companyId}
              companySlug={companySlug}
              isCurrent={cat.id === currentCategoryId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CategoryRow({
  category,
  companyId,
  companySlug,
  isCurrent,
}: {
  category: PmCampaignCategory;
  companyId: string;
  companySlug: string;
  isCurrent: boolean;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(category.name);
  const update = useUpdateCampaignCategory(companyId, companySlug);
  const del = useDeleteCampaignCategory(companyId, companySlug);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {editing ? (
        <>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-7 text-sm"
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={async () => {
              const trimmed = name.trim();
              if (trimmed && trimmed !== category.name) {
                await update.mutateAsync({
                  id: category.id,
                  patch: { name: trimmed },
                });
              }
              setEditing(false);
            }}
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => {
              setName(category.name);
              setEditing(false);
            }}
          >
            <X className="size-3.5" />
          </Button>
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-sm">{category.name}</span>
          {isCurrent ? (
            <Badge variant="outline" className="text-[10px]">
              current
            </Badge>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => {
              setName(category.name);
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-muted-foreground hover:text-destructive"
            disabled={isCurrent || del.isPending}
            onClick={async () => {
              setError(null);
              try {
                await del.mutateAsync({ id: category.id });
              } catch (e) {
                setError(
                  e instanceof Error && /foreign key/i.test(e.message)
                    ? "In use by one or more campaigns."
                    : (e as Error).message,
                );
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
          {error ? (
            <span className="text-[10px] text-destructive">{error}</span>
          ) : null}
        </>
      )}
    </div>
  );
}

// ---------- Danger ------------------------------------------------

function DangerSection({
  companyId,
  companySlug,
  campaign,
  onDeleted,
}: {
  companyId: string;
  companySlug: string;
  campaign: PmCampaignWithCategory | PmCampaignDetail;
  onDeleted: () => void;
}) {
  const navigate = useNavigate();
  const deleteCampaign = useDeleteCampaign(companyId, companySlug);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-3 pt-2.5 pb-2">
      <SettingsSectionHeader
        title="Danger zone"
        description="Destructive actions that cannot be undone."
      />
      <Separator orientation="horizontal" className="w-full bg-border" />

      <div className="flex flex-row items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50/50 p-3">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="space-y-1">
            <div className="text-sm font-semibold text-red-700">
              Delete campaign
            </div>
            <p className="text-xs text-red-600/80">
              Permanently removes{" "}
              <span className="font-medium">{campaign.name}</span>, every
              colorway, every project linked to it, and all team
              assignments.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-red-600 hover:bg-red-100 hover:text-red-700"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${campaign.name}?`}
        description="This permanently removes the campaign and all its colorways, projects, and team assignments."
        confirmText={deleteCampaign.isPending ? "Deleting…" : "Delete"}
        tone="destructive"
        onConfirm={async () => {
          await deleteCampaign.mutateAsync({ id: campaign.id });
          setConfirmOpen(false);
          onDeleted();
          navigate({ to: `/${companySlug}/pm/campaigns` });
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
