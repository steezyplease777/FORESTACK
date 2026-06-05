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

import {
  useCampaignCategories,
  useCreateCampaign,
  useCreateCampaignCategory,
  useUpdateCampaign,
} from "@/lib/data/pm/campaigns/hooks";
import type {
  PmCampaign,
  PmCampaignWithCategory,
} from "@/lib/data/pm/campaigns/client";

/**
 * Single modal used for both "create" and "edit" flows. `campaign`
 * is non-null when editing; absent when creating. We key the form
 * state off the modal's `open` transition so switching from one
 * row to another (or from edit→create) picks up the new values on
 * the next mount.
 */
export function CampaignFormModal({
  open,
  onOpenChange,
  companyId,
  companySlug,
  campaign,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  companySlug: string;
  campaign?: PmCampaignWithCategory | PmCampaign | null;
}) {
  const isEdit = !!campaign;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg">
        <div className="flex flex-col gap-1 border-b p-6 pb-4">
          <ModalTitle>
            {isEdit ? "Edit Campaign" : "New Campaign"}
          </ModalTitle>
          <ModalDescription>
            {isEdit
              ? "Update campaign details, timing, or cover imagery."
              : "Add a new campaign to this company's program."}
          </ModalDescription>
        </div>
        {/* We mount the form as a keyed child so opening the modal for
            a different campaign always hydrates with fresh defaults. */}
        <CampaignFormBody
          key={campaign?.id ?? "new"}
          campaign={campaign ?? null}
          companyId={companyId}
          companySlug={companySlug}
          onDone={() => onOpenChange(false)}
        />
      </ModalContent>
    </Modal>
  );
}

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
  // Database stores `timestamptz`; `<input type=date>` wants a bare
  // YYYY-MM-DD. Split on `T` and keep the date portion.
  return String(value).slice(0, 10);
}

function fromInputDate(value: string): string | null {
  return value ? value : null;
}

function CampaignFormBody({
  campaign,
  companyId,
  companySlug,
  onDone,
}: {
  campaign: PmCampaignWithCategory | PmCampaign | null;
  companyId: string;
  companySlug: string;
  onDone: () => void;
}) {
  const { data: categories } = useCampaignCategories(companyId);
  const createCampaign = useCreateCampaign(companyId, companySlug);
  const updateCampaign = useUpdateCampaign(companyId, companySlug);
  const createCategory = useCreateCampaignCategory(companyId, companySlug);

  const [form, setForm] = React.useState<FormState>(() => ({
    name: campaign?.name ?? "",
    campaign_code: campaign?.campaign_code ?? "",
    category_id: campaign?.category_id ?? "",
    description: campaign?.description ?? "",
    start_date: toInputDate(campaign?.start_date),
    end_date: toInputDate(campaign?.end_date),
    campaign_image_url: campaign?.campaign_image_url ?? "",
  }));

  const [newCatOpen, setNewCatOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");

  const canSubmit =
    form.name.trim().length > 0 && !!form.category_id && !isPending();

  function isPending() {
    return createCampaign.isPending || updateCampaign.isPending;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      name: form.name.trim(),
      category_id: form.category_id,
      campaign_code: form.campaign_code.trim() || null,
      description: form.description.trim() || null,
      start_date: fromInputDate(form.start_date),
      end_date: fromInputDate(form.end_date),
      campaign_image_url: form.campaign_image_url.trim() || null,
    };

    if (campaign) {
      await updateCampaign.mutateAsync({ id: campaign.id, ...payload });
    } else {
      await createCampaign.mutateAsync({
        company_id: companyId,
        ...payload,
      });
    }
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
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="grid gap-4 overflow-y-auto p-6">
        <div className="space-y-1.5">
          <Label htmlFor="campaign-name">Name *</Label>
          <Input
            id="campaign-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Spring Capsule '26"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="campaign-code">Code</Label>
            <Input
              id="campaign-code"
              value={form.campaign_code}
              onChange={(e) =>
                setForm({ ...form, campaign_code: e.target.value })
              }
              placeholder="SP26"
            />
          </div>

          <div className="space-y-1.5">
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
                <IconPlus className="size-4" />
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
          <div className="space-y-1.5">
            <Label htmlFor="campaign-start">Start date</Label>
            <Input
              id="campaign-start"
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campaign-end">End date</Label>
            <Input
              id="campaign-end"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaign-image">Cover image URL</Label>
          <Input
            id="campaign-image"
            value={form.campaign_image_url}
            onChange={(e) =>
              setForm({ ...form, campaign_image_url: e.target.value })
            }
            placeholder="https://…"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="campaign-description">Description</Label>
          <Textarea
            id="campaign-description"
            rows={3}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            placeholder="Short internal brief for this campaign."
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-6 py-4">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!canSubmit}>
          {isPending()
            ? campaign
              ? "Saving…"
              : "Creating…"
            : campaign
              ? "Save changes"
              : "Create campaign"}
        </Button>
      </div>
    </form>
  );
}
