// @ts-nocheck
import * as React from "react";
import { IconPlus } from "@tabler/icons-react";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "@/components/ui/modal";
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
import { Badge } from "@/components/ui/badge";

import {
  useCreateProject,
  useCreateProjectType,
  useProjectTypes,
  useUpdateProject,
} from "@/lib/data/pm/projects/hooks";
import { useCampaigns } from "@/lib/data/pm/campaigns/hooks";
import type {
  PmProject,
  PmProjectWithRefs,
} from "@/lib/data/pm/projects/client";

/**
 * Single modal used for every project flow: creating standalone
 * (from the Projects tab), creating campaign-scoped (from a Campaign
 * detail page with `lockedCampaignId` set), or editing an existing
 * project.
 *
 * The campaign selector has three modes:
 *   1. `lockedCampaignId` — pre-selected + disabled. Used when the
 *      user opens this modal from inside a specific campaign.
 *   2. No `lockedCampaignId`, no `project` — empty selector with an
 *      explicit "No campaign (standalone)" option on top.
 *   3. Edit — hydrated with the project's current `campaign_id` (or
 *      the standalone option) so the user can freely move a project
 *      between a campaign and standalone.
 */
export function ProjectFormModal({
  open,
  onOpenChange,
  companyId,
  companySlug,
  project,
  lockedCampaignId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  companySlug: string;
  project?: PmProjectWithRefs | PmProject | null;
  lockedCampaignId?: string;
}) {
  const isEdit = !!project;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg">
        <div className="flex flex-col gap-1 border-b p-6 pb-4">
          <ModalTitle>{isEdit ? "Edit Project" : "New Project"}</ModalTitle>
          <ModalDescription>
            {isEdit
              ? "Update project details, timing, or the campaign it's linked to."
              : lockedCampaignId
                ? "Create a project linked to this campaign."
                : "Create a standalone project or link it to an existing campaign."}
          </ModalDescription>
        </div>
        {/* Re-mount the body when the row changes so form state
            hydrates cleanly for every edit target and when switching
            between create and edit modes. */}
        <ProjectFormBody
          key={project?.id ?? (lockedCampaignId ?? "new-standalone")}
          project={project ?? null}
          companyId={companyId}
          companySlug={companySlug}
          lockedCampaignId={lockedCampaignId}
          onDone={() => onOpenChange(false)}
        />
      </ModalContent>
    </Modal>
  );
}

type FormState = {
  name: string;
  type_id: string;
  campaign_id: string; // "" = standalone
  description: string;
  status: string;
  start_date: string;
  end_date: string;
};

const STANDALONE_VALUE = "__standalone__";

function toInputDate(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function fromInputDate(value: string): string | null {
  return value ? value : null;
}

function ProjectFormBody({
  project,
  companyId,
  companySlug,
  lockedCampaignId,
  onDone,
}: {
  project: PmProjectWithRefs | PmProject | null;
  companyId: string;
  companySlug: string;
  lockedCampaignId?: string;
  onDone: () => void;
}) {
  const { data: types } = useProjectTypes(companyId);
  // Cap campaigns at a generous 200 here — same cap as categories.
  // If a company somehow has > 200 campaigns we'll switch to a
  // searchable combobox (next iteration).
  const { data: campaignsPage } = useCampaigns(companyId, {
    pageSize: 200,
  });
  const campaigns = campaignsPage?.rows ?? [];

  const createProject = useCreateProject(companyId, companySlug);
  const updateProject = useUpdateProject(companyId, companySlug);
  const createType = useCreateProjectType(companyId, companySlug);

  const [form, setForm] = React.useState<FormState>(() => ({
    name: project?.name ?? "",
    type_id: project?.type_id ?? "",
    campaign_id: lockedCampaignId ?? project?.campaign_id ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "",
    start_date: toInputDate(project?.start_date),
    end_date: toInputDate(project?.end_date),
  }));

  const [newTypeOpen, setNewTypeOpen] = React.useState(false);
  const [newTypeName, setNewTypeName] = React.useState("");

  // Translate the `<Select>` value (which can't be empty string as a
  // radix value) to the form's real campaign_id, where "" means
  // standalone / no campaign.
  const campaignSelectValue = form.campaign_id || STANDALONE_VALUE;
  const handleCampaignChange = (v: string) => {
    setForm((f) => ({
      ...f,
      campaign_id: v === STANDALONE_VALUE ? "" : v,
    }));
  };

  const canSubmit =
    form.name.trim().length > 0 && !!form.type_id && !isPending();

  function isPending() {
    return createProject.isPending || updateProject.isPending;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      name: form.name.trim(),
      type_id: form.type_id,
      campaign_id: form.campaign_id || null,
      description: form.description.trim() || null,
      status: form.status.trim() || null,
      start_date: fromInputDate(form.start_date),
      end_date: fromInputDate(form.end_date),
    };

    if (project) {
      await updateProject.mutateAsync({ id: project.id, ...payload });
    } else {
      await createProject.mutateAsync({
        company_id: companyId,
        ...payload,
      });
    }
    onDone();
  }

  async function handleCreateType() {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    const t = await createType.mutateAsync({
      company_id: companyId,
      name: trimmed,
    });
    setForm((f) => ({ ...f, type_id: t.id }));
    setNewTypeName("");
    setNewTypeOpen(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="grid gap-4 overflow-y-auto p-6">
        <div className="space-y-1.5">
          <Label htmlFor="project-name">Name *</Label>
          <Input
            id="project-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Spring 26 Development"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <div className="flex gap-1.5">
              <Select
                value={form.type_id}
                onValueChange={(v) => setForm({ ...form, type_id: v })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {(types ?? []).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => setNewTypeOpen((v) => !v)}
                aria-label="Add project type"
              >
                <IconPlus className="size-4" />
              </Button>
            </div>
            {newTypeOpen ? (
              <div className="flex gap-1.5 pt-1">
                <Input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="New type name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateType();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateType}
                  disabled={!newTypeName.trim() || createType.isPending}
                >
                  Add
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Campaign</Label>
            {lockedCampaignId ? (
              // When the modal is opened from a specific campaign
              // detail page we render the campaign as a read-only
              // badge to reinforce that the new project is being
              // linked into this campaign (and can be re-parented
              // later via the Projects tab's edit flow).
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-2.5 text-sm">
                <Badge variant="secondary" className="font-normal">
                  {campaigns.find((c) => c.id === lockedCampaignId)?.name ??
                    "This campaign"}
                </Badge>
              </div>
            ) : (
              <Select
                value={campaignSelectValue}
                onValueChange={handleCampaignChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={STANDALONE_VALUE}>
                    No campaign (standalone)
                  </SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.campaign_code ? ` · ${c.campaign_code}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="project-start">Start date</Label>
            <Input
              id="project-start"
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="project-end">End date</Label>
            <Input
              id="project-end"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="project-status">Status</Label>
          <Input
            id="project-status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            placeholder="Planning, In progress, Blocked…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Short internal brief for this project."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-6 py-4">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {isPending()
            ? project
              ? "Saving…"
              : "Creating…"
            : project
              ? "Save changes"
              : "Create project"}
        </Button>
      </div>
    </form>
  );
}
