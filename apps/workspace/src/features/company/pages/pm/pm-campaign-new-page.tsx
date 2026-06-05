// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconPhoto,
  IconPlus,
  IconSpeakerphone,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  useCampaignCategories,
  useCreateCampaign,
  useCreateCampaignCategory,
} from "@/lib/data/pm/campaigns/hooks";

const routeApi = getRouteApi(
  "/$companySlug/_authed/pm/campaigns/new",
);

type StepId = 1 | 2 | 3;

type FormState = {
  name: string;
  campaign_code: string;
  category_id: string;
  description: string;
  start_date: string;
  end_date: string;
  campaign_image_url: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  campaign_code: "",
  category_id: "",
  description: "",
  start_date: "",
  end_date: "",
  campaign_image_url: "",
};

const STEPS: Array<{
  id: StepId;
  label: string;
  description: string;
}> = [
  {
    id: 1,
    label: "Basics",
    description: "Name, code, and category.",
  },
  {
    id: 2,
    label: "Schedule & cover",
    description: "Window, cover imagery, and brief.",
  },
  {
    id: 3,
    label: "Review",
    description: "Confirm and create.",
  },
];

/**
 * Multi-step campaign creation flow.
 *
 * The flow lives at a dedicated route (`…/pm/campaigns/new`) so the
 * browser back button, deep links, and agent navigation all work
 * naturally. The current step is held in the URL as `?step=N` which
 * means refreshing the page preserves position, and the "Back" /
 * "Next" buttons are plain navigations (no modal state to reason
 * about).
 *
 * Step state (the actual form fields) is local React state. We only
 * hit the database on the final Review → Create submission, after
 * which we navigate straight to the new campaign's detail page. That
 * avoids half-created campaign rows lingering in the DB if the user
 * abandons the flow mid-way.
 */
export function PmCampaignNewPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;
  const campaignsHref = `${basePath}/pm/campaigns`;

  const { step: stepFromUrl } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const step = (stepFromUrl ?? 1) as StepId;

  const { data: categories } = useCampaignCategories(companyId);
  const createCampaign = useCreateCampaign(companyId, companySlug);
  const createCategory = useCreateCampaignCategory(companyId, companySlug);

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [newCatOpen, setNewCatOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const canAdvanceFrom = (id: StepId): boolean => {
    if (id === 1) return form.name.trim().length > 0 && !!form.category_id;
    if (id === 2) return true;
    return true;
  };

  const goToStep = (next: StepId) => {
    // Prevent skipping forward past an incomplete step. Jumping
    // backwards to an earlier step is always allowed so the user can
    // tweak a value and come back.
    if (next > step) {
      for (let i = step; i < next; i = (i + 1) as StepId) {
        if (!canAdvanceFrom(i as StepId)) return;
      }
    }
    navigate({ search: (prev) => ({ ...prev, step: next }), replace: false });
  };

  const handleNext = () => {
    if (!canAdvanceFrom(step)) return;
    if (step < 3) goToStep((step + 1) as StepId);
  };

  const handleBack = () => {
    if (step === 1) return;
    goToStep((step - 1) as StepId);
  };

  const handleCreateCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const cat = await createCategory.mutateAsync({
      company_id: companyId,
      name: trimmed,
    });
    setForm((f) => ({ ...f, category_id: cat.id }));
    setNewCatName("");
    setNewCatOpen(false);
  };

  const handleSubmit = async () => {
    if (!canAdvanceFrom(1)) {
      goToStep(1);
      return;
    }
    setSubmitError(null);
    try {
      const created = await createCampaign.mutateAsync({
        company_id: companyId,
        name: form.name.trim(),
        category_id: form.category_id,
        campaign_code: form.campaign_code.trim() || null,
        description: form.description.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        campaign_image_url: form.campaign_image_url.trim() || null,
      });
      navigate({
        to: `${basePath}/pm/campaigns/${created.id}`,
        replace: true,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Couldn't create campaign.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        eyebrow="Project management"
        title="New campaign"
        description="Set up a new seasonal program. You can edit everything later."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={campaignsHref}>Cancel</Link>
          </Button>
        }
      />

      <Stepper step={step} onSelect={goToStep} canAdvanceFrom={canAdvanceFrom} />

      <section>
        <header className="mb-4">
          <h2 className="text-base font-semibold">{STEPS[step - 1].label}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {STEPS[step - 1].description}
          </p>
        </header>
        {step === 1 ? (
          <BasicsStep
            form={form}
            setForm={setForm}
            categories={categories ?? []}
            newCatOpen={newCatOpen}
            setNewCatOpen={setNewCatOpen}
            newCatName={newCatName}
            setNewCatName={setNewCatName}
            createCategoryPending={createCategory.isPending}
            onCreateCategory={handleCreateCategory}
          />
        ) : step === 2 ? (
          <ScheduleStep form={form} setForm={setForm} />
        ) : (
          <ReviewStep
            form={form}
            categoryName={
              (categories ?? []).find((c) => c.id === form.category_id)
                ?.name ?? null
            }
            error={submitError}
          />
        )}
      </section>

      <div className="flex items-center justify-between gap-2">
        {step === 1 ? (
          <Button variant="ghost" size="sm" asChild>
            <Link to={campaignsHref}>
              <IconArrowLeft className="size-4" />
              Back to campaigns
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={handleBack}>
            <IconArrowLeft className="size-4" />
            Back
          </Button>
        )}

        {step < 3 ? (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!canAdvanceFrom(step)}
          >
            Continue
            <IconArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={createCampaign.isPending || !canAdvanceFrom(1)}
          >
            <IconCheck className="size-4" />
            {createCampaign.isPending ? "Creating…" : "Create campaign"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({
  step,
  onSelect,
  canAdvanceFrom,
}: {
  step: StepId;
  onSelect: (next: StepId) => void;
  canAdvanceFrom: (id: StepId) => boolean;
}) {
  return (
    <ol className="flex w-full items-center gap-2">
      {STEPS.map((s, idx) => {
        const isCurrent = s.id === step;
        const isComplete = s.id < step;
        const isReachable =
          s.id < step ||
          s.id === step ||
          STEPS.slice(0, s.id - 1).every((prev) => canAdvanceFrom(prev.id));
        const isLast = idx === STEPS.length - 1;
        return (
          <React.Fragment key={s.id}>
            <li>
              <button
                type="button"
                onClick={() => isReachable && onSelect(s.id)}
                disabled={!isReachable}
                className={cn(
                  "flex items-center gap-2 rounded-md py-1.5 text-left transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border border-primary/60 text-primary"
                        : "border text-muted-foreground",
                  )}
                >
                  {isComplete ? <IconCheck className="size-3.5" /> : idx + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:inline",
                    isCurrent
                      ? "text-foreground"
                      : isComplete
                        ? "text-foreground/80"
                        : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
            {!isLast ? (
              <li
                aria-hidden
                className={cn(
                  "h-px flex-1",
                  isComplete ? "bg-primary/40" : "bg-border",
                )}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function BasicsStep({
  form,
  setForm,
  categories,
  newCatOpen,
  setNewCatOpen,
  newCatName,
  setNewCatName,
  createCategoryPending,
  onCreateCategory,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  categories: Array<{ id: string; name: string }>;
  newCatOpen: boolean;
  setNewCatOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  newCatName: string;
  setNewCatName: (v: string) => void;
  createCategoryPending: boolean;
  onCreateCategory: () => void;
}) {
  return (
    <div className="grid gap-5">
      <div className="space-y-1.5">
        <Label htmlFor="campaign-name">Name *</Label>
        <Input
          id="campaign-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Spring Capsule '26"
          autoFocus
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="campaign-code">Code</Label>
          <Input
            id="campaign-code"
            value={form.campaign_code}
            onChange={(e) =>
              setForm((f) => ({ ...f, campaign_code: e.target.value }))
            }
            placeholder="SP26"
          />
          <p className="text-xs text-muted-foreground">
            Short identifier used in filenames and downstream exports.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Category *</Label>
          <div className="flex gap-1.5">
            <Select
              value={form.category_id}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, category_id: v }))
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
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
                    onCreateCategory();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={onCreateCategory}
                disabled={!newCatName.trim() || createCategoryPending}
              >
                Add
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ScheduleStep({
  form,
  setForm,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="campaign-start">Start date</Label>
          <Input
            id="campaign-start"
            type="date"
            value={form.start_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, start_date: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="campaign-end">End date</Label>
          <Input
            id="campaign-end"
            type="date"
            value={form.end_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, end_date: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="campaign-image">Cover image URL</Label>
        <Input
          id="campaign-image"
          value={form.campaign_image_url}
          onChange={(e) =>
            setForm((f) => ({ ...f, campaign_image_url: e.target.value }))
          }
          placeholder="https://…"
        />
        {form.campaign_image_url ? (
          <div className="mt-2 overflow-hidden rounded-md border bg-muted/30">
            <img
              src={form.campaign_image_url}
              alt=""
              className="h-32 w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="campaign-description">Description</Label>
        <Textarea
          id="campaign-description"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Short internal brief for this campaign."
        />
      </div>
    </div>
  );
}

function ReviewStep({
  form,
  categoryName,
  error,
}: {
  form: FormState;
  categoryName: string | null;
  error: string | null;
}) {
  const hasWindow = !!form.start_date || !!form.end_date;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="shrink-0">
          {form.campaign_image_url ? (
            <img
              src={form.campaign_image_url}
              alt=""
              className="size-24 rounded-lg border object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <IconPhoto className="size-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <IconSpeakerphone className="size-4 text-muted-foreground" />
            <h2 className="truncate text-lg font-semibold leading-tight">
              {form.name.trim() || "Untitled campaign"}
            </h2>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {categoryName ? (
              <Badge variant="secondary">{categoryName}</Badge>
            ) : null}
            {form.campaign_code ? (
              <span className="font-mono text-xs text-muted-foreground">
                {form.campaign_code}
              </span>
            ) : null}
          </div>
          {form.description ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {form.description}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="grid gap-3 rounded-md border bg-muted/20 p-4 text-sm sm:grid-cols-2">
        <ReviewRow
          icon={<IconCalendar className="size-4" />}
          label="Window"
          value={
            hasWindow
              ? `${formatDate(form.start_date) ?? "—"} → ${formatDate(form.end_date) ?? "—"}`
              : "Not scheduled"
          }
        />
        <ReviewRow
          icon={<IconPhoto className="size-4" />}
          label="Cover image"
          value={form.campaign_image_url ? "Set" : "None"}
        />
      </dl>

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function ReviewRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
      </div>
    </div>
  );
}

function formatDate(iso: string): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString();
}
