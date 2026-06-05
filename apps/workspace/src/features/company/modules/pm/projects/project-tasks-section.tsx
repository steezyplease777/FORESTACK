// @ts-nocheck
import * as React from "react";
import {
  IconCalendar,
  IconCheck,
  IconChecklist,
  IconChevronRight,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useProjectMembers } from "@/lib/data/pm/members/hooks";
import {
  useCreateProjectTaskFromTemplate,
  useCreateProjectTaskItem,
  useDeleteProjectTask,
  useDeleteProjectTaskItem,
  useProjectTask,
  useProjectTasks,
  useSetProjectTaskAssignees,
  useSetProjectTaskItemAssignees,
  useUpdateProjectTask,
  useUpdateProjectTaskItem,
} from "@/lib/data/pm/project-tasks/hooks";
import type {
  PmProjectTaskDetail,
  PmProjectTaskItemWithAssignees,
  PmProjectTaskWithRefs,
} from "@/lib/data/pm/project-tasks/client";
import {
  useCreateTaskTemplate,
  useTaskCategories,
  useTaskTemplates,
} from "@/lib/data/pm/task-templates/hooks";
import {
  PmAvatarStack,
  PmUserAvatar,
  displayName,
  type UserAvatarFields,
} from "@/features/company/modules/pm/shared/user-avatar";

const TASK_STATUSES: Array<{ value: string; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const ITEM_STATUSES: Array<{ value: string; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

/**
 * Full tasks module for the project detail page. Composes:
 *
 *   - List card (with "Add task" launcher)
 *   - TemplatePickerModal — pick an existing template or create one
 *     inline; calls `create_pm_project_task_from_template` RPC
 *   - TaskDetailDrawer — slide-in editor for a single instance task
 *     with sub-items, multi-assignee picker, and delete
 *
 * All assignee pickers are scoped to `pm_project_members` so you
 * can never accidentally assign a non-member, and the dashboard's
 * "who's on this" answer stays stable.
 */
export function ProjectTasksSection({
  projectId,
  companyId,
  companySlug,
}: {
  projectId: string;
  companyId: string;
  companySlug: string;
}) {
  const tasksQuery = useProjectTasks(projectId);
  const membersQuery = useProjectMembers(projectId);

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(null);

  const tasks = tasksQuery.data ?? [];
  const memberByCompanyUserId = React.useMemo(() => {
    const map = new Map<string, UserAvatarFields>();
    for (const m of membersQuery.data ?? []) {
      map.set(m.company_user_id, m);
    }
    return map;
  }, [membersQuery.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconChecklist className="size-4 text-muted-foreground" />
          Tasks
        </CardTitle>
        <CardDescription>
          {tasks.length === 0
            ? "Instantiate a template to add work to this project."
            : `${tasks.length} task${tasks.length === 1 ? "" : "s"}`}
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={() => setPickerOpen(true)}>
            <IconPlus className="size-4" />
            Add task
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-1 pt-0">
        {tasksQuery.isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading tasks…
          </p>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center">
            <IconChecklist className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No tasks yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start from a template to seed default sub-steps.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => setPickerOpen(true)}
            >
              <IconPlus className="size-3.5" />
              Add task
            </Button>
          </div>
        ) : (
          tasks.map((task, idx) => (
            <React.Fragment key={task.id}>
              {idx > 0 ? <Separator /> : null}
              <TaskListRow
                task={task}
                memberByCompanyUserId={memberByCompanyUserId}
                onOpen={() => setOpenTaskId(task.id)}
              />
            </React.Fragment>
          ))
        )}
      </CardContent>

      <TemplatePickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        projectId={projectId}
        companyId={companyId}
        companySlug={companySlug}
        onInstantiated={(newTaskId) => {
          setPickerOpen(false);
          setOpenTaskId(newTaskId);
        }}
      />

      <TaskDetailDrawer
        taskId={openTaskId}
        onClose={() => setOpenTaskId(null)}
        projectId={projectId}
        companyId={companyId}
        companySlug={companySlug}
        memberByCompanyUserId={memberByCompanyUserId}
      />
    </Card>
  );
}

// ---------- List row ----------

function TaskListRow({
  task,
  memberByCompanyUserId,
  onOpen,
}: {
  task: PmProjectTaskWithRefs;
  memberByCompanyUserId: Map<string, UserAvatarFields>;
  onOpen: () => void;
}) {
  const assignees = task.assignee_company_user_ids
    .map((id) => memberByCompanyUserId.get(id))
    .filter((u): u is UserAvatarFields => !!u);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {task.template?.name ?? "Task"}
          </span>
          {task.status ? (
            <StatusBadge status={task.status} />
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <IconChecklist className="size-3" />
            {task.item_done_count}/{task.item_count}
          </span>
          {task.due_date ? (
            <span className="inline-flex items-center gap-1">
              <IconCalendar className="size-3" />
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      </div>
      {assignees.length > 0 ? (
        <PmAvatarStack users={assignees} max={3} size="sm" />
      ) : null}
      <IconChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <Badge variant="secondary" className={tone}>
      {humanize(status)}
    </Badge>
  );
}

function statusTone(status: string): string {
  switch (status) {
    case "done":
      return "bg-emerald-100 text-emerald-800 border-transparent";
    case "blocked":
      return "bg-rose-100 text-rose-800 border-transparent";
    case "in_progress":
      return "bg-amber-100 text-amber-800 border-transparent";
    default:
      return "";
  }
}

function humanize(s: string): string {
  return s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

// ---------- Template picker ----------

function TemplatePickerModal({
  open,
  onOpenChange,
  projectId,
  companyId,
  companySlug,
  onInstantiated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
  companyId: string;
  companySlug: string;
  onInstantiated: (newTaskId: string) => void;
}) {
  const templatesQuery = useTaskTemplates(companyId);
  const createFromTemplate = useCreateProjectTaskFromTemplate(
    projectId,
    companyId,
    companySlug,
  );
  const [search, setSearch] = React.useState("");
  const [creatingTemplate, setCreatingTemplate] = React.useState(false);

  const templates = templatesQuery.data ?? [];
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category?.name.toLowerCase().includes(q),
    );
  }, [search, templates]);

  async function handlePick(templateId: string) {
    const id = await createFromTemplate.mutateAsync({ template_id: templateId });
    onInstantiated(id);
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="sm:max-w-lg p-0">
        <div className="border-b p-6 pb-4">
          <ModalTitle>Add task</ModalTitle>
          <ModalDescription>
            Start from a template — sub-steps are copied into this project
            and can be edited independently afterward.
          </ModalDescription>
        </div>

        {creatingTemplate ? (
          <InlineCreateTemplate
            companyId={companyId}
            companySlug={companySlug}
            onDone={(template) => {
              setCreatingTemplate(false);
              if (template) void handlePick(template.id);
            }}
          />
        ) : (
          <>
            <div className="p-6 pb-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                autoFocus
              />
            </div>
            <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto px-6 pb-3">
              {templatesQuery.isLoading ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Loading…
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {templates.length === 0
                    ? "No templates yet. Create one below."
                    : "No matches."}
                </p>
              ) : (
                filtered.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={createFromTemplate.isPending}
                    onClick={() => handlePick(t.id)}
                    className="flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent disabled:opacity-50"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
                      <IconChecklist className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {t.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t.category?.name ?? "Uncategorized"} · {t.items.length}{" "}
                        default item{t.items.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    <IconChevronRight className="size-4 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-6 py-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCreatingTemplate(true)}
              >
                <IconPlus className="size-4" />
                Create template
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

function InlineCreateTemplate({
  companyId,
  companySlug,
  onDone,
}: {
  companyId: string;
  companySlug: string;
  onDone: (template: { id: string } | null) => void;
}) {
  const categoriesQuery = useTaskCategories(companyId);
  const createTemplate = useCreateTaskTemplate(companyId, companySlug);

  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [items, setItems] = React.useState<string[]>([""]);

  function setItemAt(idx: number, value: string) {
    setItems((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const cleanItems = items
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .map((v) => ({ name: v }));
    const tpl = await createTemplate.mutateAsync({
      company_id: companyId,
      name: trimmedName,
      category_id: categoryId || null,
      items: cleanItems,
    });
    onDone(tpl);
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col">
      <div className="grid max-h-80 gap-4 overflow-y-auto p-6">
        <div className="space-y-1.5">
          <Label htmlFor="template-name">Name *</Label>
          <Input
            id="template-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Design review"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Uncategorized" />
            </SelectTrigger>
            <SelectContent>
              {(categoriesQuery.data ?? []).map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Default sub-steps</Label>
          <div className="flex flex-col gap-2">
            {items.map((value, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={value}
                  onChange={(e) => setItemAt(idx, e.target.value)}
                  placeholder={`Step ${idx + 1}`}
                />
                {items.length > 1 ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="shrink-0"
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <IconX className="size-4" />
                  </Button>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setItems((prev) => [...prev, ""])}
              className="self-start"
            >
              <IconPlus className="size-3.5" />
              Add step
            </Button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDone(null)}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!name.trim() || createTemplate.isPending}
        >
          {createTemplate.isPending ? "Creating…" : "Create & add"}
        </Button>
      </div>
    </form>
  );
}

// ---------- Task detail drawer ----------

function TaskDetailDrawer({
  taskId,
  onClose,
  projectId,
  companyId,
  companySlug,
  memberByCompanyUserId,
}: {
  taskId: string | null;
  onClose: () => void;
  projectId: string;
  companyId: string;
  companySlug: string;
  memberByCompanyUserId: Map<string, UserAvatarFields>;
}) {
  const open = !!taskId;
  const taskQuery = useProjectTask(taskId);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {taskQuery.isLoading || !taskQuery.data ? (
          <div className="p-6">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-32 animate-pulse rounded bg-muted/50" />
          </div>
        ) : (
          <TaskDrawerBody
            task={taskQuery.data}
            projectId={projectId}
            companyId={companyId}
            companySlug={companySlug}
            memberByCompanyUserId={memberByCompanyUserId}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TaskDrawerBody({
  task,
  projectId,
  companyId,
  companySlug,
  memberByCompanyUserId,
  onClose,
}: {
  task: PmProjectTaskDetail;
  projectId: string;
  companyId: string;
  companySlug: string;
  memberByCompanyUserId: Map<string, UserAvatarFields>;
  onClose: () => void;
}) {
  const updateTask = useUpdateProjectTask(projectId, companyId, companySlug);
  const setAssignees = useSetProjectTaskAssignees(
    projectId,
    companyId,
    companySlug,
  );
  const deleteTask = useDeleteProjectTask(projectId, companyId, companySlug);

  const [status, setStatus] = React.useState<string | null>(task.status);
  const [description, setDescription] = React.useState(task.description ?? "");
  const [dueDate, setDueDate] = React.useState(
    task.due_date ? task.due_date.slice(0, 10) : "",
  );
  const [descDirty, setDescDirty] = React.useState(false);

  // Re-sync when switching between tasks (the drawer persists
  // mounted between opens, so state needs to re-hydrate from data).
  React.useEffect(() => {
    setStatus(task.status);
    setDescription(task.description ?? "");
    setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    setDescDirty(false);
  }, [task.id]);

  async function saveDescription() {
    if (!descDirty) return;
    await updateTask.mutateAsync({
      id: task.id,
      patch: { description: description.trim() || null },
    });
    setDescDirty(false);
  }

  return (
    <>
      <SheetHeader className="border-b p-6 pb-4">
        <SheetTitle className="text-base">
          {task.template?.name ?? "Task"}
        </SheetTitle>
        <SheetDescription className="text-xs">
          Instance of template · {task.items.length} sub-step
          {task.items.length === 1 ? "" : "s"}
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status ?? ""}
              onValueChange={async (value) => {
                setStatus(value);
                await updateTask.mutateAsync({
                  id: task.id,
                  patch: { status: value || null },
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Open" />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={async (e) => {
                const next = e.target.value;
                setDueDate(next);
                await updateTask.mutateAsync({
                  id: task.id,
                  patch: { due_date: next ? next : null },
                });
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDescDirty(true);
            }}
            onBlur={saveDescription}
            placeholder="What needs to happen?"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Assignees</Label>
          <AssigneePicker
            projectId={projectId}
            selectedIds={task.assignee_company_user_ids}
            memberByCompanyUserId={memberByCompanyUserId}
            onChange={(ids) =>
              setAssignees.mutate({
                project_task_id: task.id,
                company_user_ids: ids,
              })
            }
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Sub-steps</Label>
          <SubItemList
            items={task.items}
            taskId={task.id}
            projectId={projectId}
            companyId={companyId}
            companySlug={companySlug}
            memberByCompanyUserId={memberByCompanyUserId}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-6 py-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={async () => {
            await deleteTask.mutateAsync({ id: task.id });
            onClose();
          }}
        >
          <IconTrash className="size-4" />
          Delete task
        </Button>
        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </>
  );
}

function AssigneePicker({
  projectId,
  selectedIds,
  memberByCompanyUserId,
  onChange,
}: {
  projectId: string;
  selectedIds: string[];
  memberByCompanyUserId: Map<string, UserAvatarFields & { company_user_id?: string }>;
  onChange: (ids: string[]) => void;
}) {
  const membersQuery = useProjectMembers(projectId);
  const [expanded, setExpanded] = React.useState(false);

  const members = membersQuery.data ?? [];
  const selected = new Set(selectedIds);

  function toggle(companyUserId: string) {
    if (selected.has(companyUserId)) {
      onChange(selectedIds.filter((id) => id !== companyUserId));
    } else {
      onChange([...selectedIds, companyUserId]);
    }
  }

  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <div className="flex items-center gap-2">
        {selectedIds.length > 0 ? (
          <PmAvatarStack
            users={selectedIds
              .map((id) => memberByCompanyUserId.get(id))
              .filter((u): u is UserAvatarFields => !!u)}
            max={5}
            size="sm"
          />
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide" : "Edit"}
        </Button>
      </div>
      {expanded ? (
        <div className="mt-2 flex max-h-40 flex-col gap-0.5 overflow-y-auto">
          {members.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No project members — add some from the Members card.
            </p>
          ) : (
            members.map((m) => {
              const checked = selected.has(m.company_user_id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.company_user_id)}
                  className="flex items-center gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-accent"
                >
                  <PmUserAvatar user={m} size="sm" />
                  <span className="min-w-0 flex-1 truncate">
                    {displayName(m)}
                  </span>
                  {checked ? (
                    <IconCheck className="size-4 text-primary" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function SubItemList({
  items,
  taskId,
  projectId,
  companyId,
  companySlug,
  memberByCompanyUserId,
}: {
  items: PmProjectTaskItemWithAssignees[];
  taskId: string;
  projectId: string;
  companyId: string;
  companySlug: string;
  memberByCompanyUserId: Map<string, UserAvatarFields>;
}) {
  const updateItem = useUpdateProjectTaskItem(
    projectId,
    companyId,
    companySlug,
  );
  const setItemAssignees = useSetProjectTaskItemAssignees(
    projectId,
    companyId,
    companySlug,
  );
  const deleteItem = useDeleteProjectTaskItem(
    projectId,
    companyId,
    companySlug,
  );
  const createItem = useCreateProjectTaskItem(
    projectId,
    companyId,
    companySlug,
  );

  const [newName, setNewName] = React.useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await createItem.mutateAsync({
      project_task_id: taskId,
      name,
      sort_order: items.length,
    });
    setNewName("");
  }

  return (
    <div className="flex flex-col gap-1">
      {items.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">
          No sub-steps.
        </p>
      ) : (
        items.map((item) => (
          <SubItemRow
            key={item.id}
            item={item}
            projectId={projectId}
            memberByCompanyUserId={memberByCompanyUserId}
            onToggle={(next) =>
              updateItem.mutate({ id: item.id, patch: { status: next } })
            }
            onRename={(name) =>
              updateItem.mutate({ id: item.id, patch: { name } })
            }
            onSetAssignees={(ids) =>
              setItemAssignees.mutate({
                project_task_item_id: item.id,
                company_user_ids: ids,
              })
            }
            onDelete={() => deleteItem.mutate({ id: item.id })}
          />
        ))
      )}
      <form onSubmit={handleCreate} className="mt-2 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Add a sub-step"
          className="h-8"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newName.trim() || createItem.isPending}
        >
          <IconPlus className="size-4" />
        </Button>
      </form>
    </div>
  );
}

function SubItemRow({
  item,
  projectId,
  memberByCompanyUserId,
  onToggle,
  onRename,
  onSetAssignees,
  onDelete,
}: {
  item: PmProjectTaskItemWithAssignees;
  projectId: string;
  memberByCompanyUserId: Map<string, UserAvatarFields>;
  onToggle: (status: string) => void;
  onRename: (name: string) => void;
  onSetAssignees: (ids: string[]) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(item.name);
  const [assigneeOpen, setAssigneeOpen] = React.useState(false);
  const done = item.status === "done";

  const assignees = item.assignee_company_user_ids
    .map((id) => memberByCompanyUserId.get(id))
    .filter((u): u is UserAvatarFields => !!u);

  return (
    <div className="group rounded-md border bg-background/60">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button
          type="button"
          onClick={() => onToggle(done ? "open" : "done")}
          aria-label={done ? "Mark open" : "Mark done"}
          className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-muted-foreground/30 hover:border-primary"
          }`}
        >
          {done ? <IconCheck className="size-3" /> : null}
        </button>
        {editing ? (
          <>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (name.trim() && name.trim() !== item.name) {
                    onRename(name.trim());
                  }
                  setEditing(false);
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0"
              onClick={() => {
                if (name.trim() && name.trim() !== item.name) {
                  onRename(name.trim());
                }
                setEditing(false);
              }}
            >
              <IconCheck className="size-3.5" />
            </Button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className={`min-w-0 flex-1 truncate text-left text-sm ${
                done ? "text-muted-foreground line-through" : ""
              }`}
            >
              {item.name}
            </button>
            <Select
              value={item.status ?? ""}
              onValueChange={(value) => onToggle(value)}
            >
              <SelectTrigger className="h-7 w-auto gap-1 border-none bg-transparent px-2 py-0 text-xs shadow-none hover:bg-accent">
                <SelectValue placeholder="Open" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => setAssigneeOpen((v) => !v)}
              aria-label="Assign"
            >
              {assignees.length > 0 ? (
                <PmUserAvatar user={assignees[0]} size="sm" />
              ) : (
                <IconPlus className="size-3.5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete sub-step"
            >
              <IconX className="size-3.5" />
            </Button>
          </>
        )}
      </div>
      {assigneeOpen ? (
        <AssigneePicker
          projectId={projectId}
          selectedIds={item.assignee_company_user_ids}
          memberByCompanyUserId={memberByCompanyUserId}
          onChange={onSetAssignees}
        />
      ) : null}
    </div>
  );
}
