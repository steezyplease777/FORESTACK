// @ts-nocheck
import * as React from "react";
import { IconUserPlus, IconUsers, IconX } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

import { useCompanyTeam } from "@/lib/data/team/hooks";
import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
} from "@/lib/data/pm/members/hooks";
import {
  PmUserAvatar,
  displayName,
} from "@/features/company/modules/pm/shared/user-avatar";

/**
 * Roster of assignable users for a project. This is the canonical
 * source of truth the task assignee picker reads from — the UI
 * deliberately won't offer anyone who isn't already listed here, so
 * every assignee can be drilled into from the dashboard.
 */
export function ProjectMembersCard({
  projectId,
  companyId,
}: {
  projectId: string;
  companyId: string;
}) {
  const membersQuery = useProjectMembers(projectId);
  const companyTeamQuery = useCompanyTeam(companyId);
  const addMember = useAddProjectMember(projectId, companyId);
  const removeMember = useRemoveProjectMember(projectId, companyId);

  const [picking, setPicking] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const members = membersQuery.data ?? [];
  const companyUsers = companyTeamQuery.data ?? [];

  const availableUsers = React.useMemo(() => {
    const taken = new Set(members.map((m) => m.company_user_id));
    const base = companyUsers.filter((u) => !taken.has(u.id));
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
      return (
        name.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [companyUsers, members, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconUsers className="size-4 text-muted-foreground" />
          Members
        </CardTitle>
        <CardDescription>
          {members.length === 0
            ? "Add people to assign tasks."
            : `${members.length} member${members.length === 1 ? "" : "s"}`}
        </CardDescription>
        <CardAction>
          <Button
            size="sm"
            variant={picking ? "ghost" : "default"}
            onClick={() => setPicking((v) => !v)}
          >
            <IconUserPlus className="size-4" />
            {picking ? "Close" : "Add"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        {members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No members yet.
          </p>
        ) : (
          members.map((m, idx) => (
            <React.Fragment key={m.id}>
              {idx > 0 ? <Separator /> : null}
              <div className="flex items-center gap-2 py-1">
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
                  <IconX className="size-3.5" />
                </Button>
              </div>
            </React.Fragment>
          ))
        )}

        {picking ? (
          <div className="mt-2 rounded-md border bg-muted/30 p-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people…"
              className="h-8 bg-background"
              autoFocus
            />
            <div className="mt-2 flex max-h-60 flex-col gap-0.5 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  {companyUsers.length === 0
                    ? "Loading…"
                    : "No matches — everyone else is already on this project."}
                </p>
              ) : (
                availableUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="flex items-center gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-accent"
                    onClick={async () => {
                      await addMember.mutateAsync({ company_user_id: u.id });
                      setSearch("");
                    }}
                  >
                    <PmUserAvatar user={u} size="sm" />
                    <span className="min-w-0 flex-1 truncate">
                      {displayName(u)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
