// @ts-nocheck

import { useCallback, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { PageContent } from "@/components/composites/page-content";

const routeApi = getRouteApi("/$companySlug/_authed/_home/team");
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCompany } from "@/features/company/tenant-provider";
import {
  useCompanyTeam,
  useDepartmentTeam,
  useTeamMember,
} from "@/lib/data/team/hooks";
import type { TeamMember } from "@/lib/data/team/client";
import {
  IconUsers,
  IconBuilding,
  IconBuildingStore,
  IconMail,
  IconClock,
  IconPhone,
  IconCopy,
  IconCheck,
  IconCalendar,
  IconExternalLink,
} from "@tabler/icons-react";
import Image from "@/components/composites/next-image-shim";

function getInitials(firstName: string | null, lastName: string | null, email: string) {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  return email[0].toUpperCase();
}

function formatName(firstName: string | null, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ") || null;
}

function formatLastSeen(lastSeen: string | null) {
  if (!lastSeen) return "Never";
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <IconCheck className="size-3.5 text-emerald-500" />
          ) : (
            <IconCopy className="size-3.5" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {copied ? "Copied!" : `Copy ${label}`}
      </TooltipContent>
    </Tooltip>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  copyable,
  href,
}: {
  icon: typeof IconMail;
  label: string;
  value: string;
  copyable?: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-center gap-1">
          {href ? (
            <a
              href={href}
              className="truncate text-sm font-medium text-foreground underline-offset-2 hover:underline"
            >
              {value}
            </a>
          ) : (
            <span className="truncate text-sm font-medium">{value}</span>
          )}
          {copyable && <CopyButton value={value} label={label.toLowerCase()} />}
          {href && (
            <a
              href={href}
              className="inline-flex rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={`Open ${label.toLowerCase()}`}
            >
              <IconExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberDetailSheet({
  companyId,
  memberId,
  open,
  onOpenChange,
}: {
  companyId: string;
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Reads from the per-member detail cache seeded by the team list
  // queries, so this returns `data` synchronously on the click tick -
  // no network round trip between "click card" and "sheet painted".
  const { data: member } = useTeamMember(companyId, memberId);

  // Keep the last member visible while the sheet animates closed so we
  // don't flash an empty sheet during the exit transition.
  const lastMemberRef = useRef<TeamMember | null>(null);
  if (member) lastMemberRef.current = member;
  const display = member ?? lastMemberRef.current;
  if (!display) return null;

  const name = formatName(display.firstName, display.lastName);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md" showCloseButton>
        <SheetHeader className="sr-only">
          <SheetTitle>{name ?? display.email}</SheetTitle>
          <SheetDescription>Team member details</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col overflow-y-auto">
          <div className="h-24 bg-muted/60" />
          <div className="relative px-6 pb-6">
            <Avatar className="-mt-10 size-20 ring-4 ring-background">
              {display.profilePictureUrl && (
                <AvatarImage src={display.profilePictureUrl} alt={name ?? display.email} />
              )}
              <AvatarFallback className="text-2xl">
                {getInitials(display.firstName, display.lastName, display.email)}
              </AvatarFallback>
            </Avatar>

            <div className="mt-4">
              {name ? (
                <h2 className="text-lg font-semibold">{name}</h2>
              ) : (
                <h2 className="text-lg font-semibold text-muted-foreground">
                  {display.email.split("@")[0]}
                </h2>
              )}
              {display.titleName && (
                <p className="mt-0.5 text-sm capitalize text-muted-foreground">
                  {display.titleName.toLowerCase()}
                </p>
              )}
              {display.departmentName && (
                <Badge variant="secondary" className="mt-2 capitalize">
                  {display.departmentName.toLowerCase()}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="px-6 py-2">
            <p className="mb-1 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Contact
            </p>
            <DetailRow
              icon={IconMail}
              label="Email"
              value={display.email}
              copyable
              href={`mailto:${display.email}`}
            />
            {display.phone && (
              <DetailRow
                icon={IconPhone}
                label="Phone"
                value={display.phone}
                copyable
                href={`tel:${display.phone}`}
              />
            )}
          </div>

          <Separator />

          <div className="px-6 py-2">
            <p className="mb-1 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Details
            </p>
            {display.departmentName && (
              <DetailRow
                icon={IconBuilding}
                label="Department"
                value={display.departmentName.toLowerCase()}
              />
            )}
            <DetailRow
              icon={IconCalendar}
              label="Member since"
              value={formatDate(display.memberSince)}
            />
            <DetailRow
              icon={IconClock}
              label="Last active"
              value={formatLastSeen(display.lastSeen)}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MemberCard({
  member,
  onClick,
}: {
  member: TeamMember;
  onClick: () => void;
}) {
  const name = formatName(member.firstName, member.lastName);

  return (
    <Card
      className="cursor-pointer gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <div className="h-16 bg-muted/60" />
      <div className="relative px-5 pb-5">
        <Avatar className="-mt-7 size-14 ring-4 ring-card">
          {member.profilePictureUrl && (
            <AvatarImage src={member.profilePictureUrl} alt={name ?? member.email} />
          )}
          <AvatarFallback className="text-lg">
            {getInitials(member.firstName, member.lastName, member.email)}
          </AvatarFallback>
        </Avatar>

        <div className="mt-3 min-w-0">
          {name ? (
            <p className="truncate text-sm font-semibold">{name}</p>
          ) : (
            <p className="truncate text-sm font-semibold text-muted-foreground">
              {member.email.split("@")[0]}
            </p>
          )}
          {member.titleName && (
            <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
              {member.titleName.toLowerCase()}
            </p>
          )}
        </div>

        <div className="mt-3 space-y-1.5">
          {member.departmentName && (
            <div className="flex items-center gap-2">
              <IconBuilding className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-xs capitalize text-muted-foreground">
                {member.departmentName.toLowerCase()}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <IconMail className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-xs text-muted-foreground">{member.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <IconClock className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatLastSeen(member.lastSeen)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="gap-0 overflow-hidden py-0">
          <Skeleton className="h-16 rounded-none" />
          <div className="relative px-5 pb-5">
            <Skeleton className="-mt-7 size-14 rounded-full ring-4 ring-card" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function DepartmentTable({
  members,
  onMemberClick,
}: {
  members: TeamMember[];
  onMemberClick: (member: TeamMember) => void;
}) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <IconUsers className="mb-3 size-10 opacity-40" />
        <p className="text-sm">No team members found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Member</TableHead>
          <TableHead>Title</TableHead>
          <TableHead className="text-right">Last Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const name = formatName(member.firstName, member.lastName);
          return (
            <TableRow
              key={member.id}
              className="cursor-pointer"
              onClick={() => onMemberClick(member)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    {member.profilePictureUrl && (
                      <AvatarImage src={member.profilePictureUrl} alt={name ?? member.email} />
                    )}
                    <AvatarFallback>
                      {getInitials(member.firstName, member.lastName, member.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    {name && <p className="truncate text-sm font-medium">{name}</p>}
                    <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {member.titleName ? (
                  <Badge variant="secondary" className="capitalize">
                    {member.titleName.toLowerCase()}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <span className="text-xs text-muted-foreground">
                  {formatLastSeen(member.lastSeen)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="size-6 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-48" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TeamPage() {
  const { company, companyUser } = useCompany();
  const companyId = company?.companyId ?? "";
  const { tab, member: memberId } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const setTab = (t: "company" | "department") =>
    navigate({ search: (prev) => ({ ...prev, tab: t }) });
  const setMemberId = (id: string | undefined) =>
    navigate({ search: (prev) => ({ ...prev, member: id }) });

  const openMemberSheet = useCallback((m: TeamMember) => {
    setMemberId(m.id);
  }, []);

  const {
    data: companyMembers,
    isLoading: companyLoading,
  } = useCompanyTeam(companyId);

  const {
    data: departmentData,
    isLoading: deptLoading,
  } = useDepartmentTeam(companyId, companyUser?.companyUserId ?? "");

  const companyName = company?.name ?? "Company";

  return (
    <>
      <PageContent className="space-y-4">
        <div className="flex items-center gap-3 pb-4">
          {company?.logo_url ? (
            <Image
              src={company.logo_url}
              alt={companyName}
              width={28}
              height={28}
              className="size-7 shrink-0 rounded-md object-contain"
            />
          ) : (
            <IconBuildingStore className="size-7 shrink-0 text-muted-foreground" />
          )}
          <h2 className="text-lg font-bold uppercase tracking-wide">
            {companyName} <span className="text-muted-foreground">Team</span>
          </h2>
        </div>
        <Separator />
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="company" className="gap-1.5">
              <IconBuilding className="size-3.5" />
              Company
            </TabsTrigger>
            <TabsTrigger value="department" className="gap-1.5">
              <IconUsers className="size-3.5" />
              Department
            </TabsTrigger>
          </TabsList>

          <TabsContent value="department" className="mt-4">
            {deptLoading ? (
              <TableSkeleton />
            ) : departmentData?.departmentName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium">{departmentData.departmentName}</h2>
                  <Badge variant="outline" className="text-xs">
                    {departmentData.members.length} {departmentData.members.length === 1 ? "member" : "members"}
                  </Badge>
                </div>
                <DepartmentTable
                  members={departmentData.members}
                  onMemberClick={openMemberSheet}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IconBuilding className="mb-3 size-10 opacity-40" />
                <p className="text-sm">You are not assigned to a department</p>
                <p className="mt-1 text-xs">Contact your administrator to be assigned.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="company" className="mt-4">
            {companyLoading ? (
              <CardGridSkeleton />
            ) : (companyMembers?.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IconUsers className="mb-3 size-10 opacity-40" />
                <p className="text-sm">No team members found</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium">All Members</h2>
                  <Badge variant="outline" className="text-xs">
                    {companyMembers!.length} {companyMembers!.length === 1 ? "member" : "members"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {companyMembers!.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onClick={() => openMemberSheet(member)}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageContent>

      <MemberDetailSheet
        companyId={companyId}
        memberId={memberId ?? null}
        open={!!memberId}
        onOpenChange={(open) => !open && setMemberId(undefined)}
      />
    </>
  );
}
