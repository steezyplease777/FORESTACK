// @ts-nocheck
"use client";

import * as React from "react";
import type { Area } from "react-easy-crop";
import { getRouteApi, useRouter } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Lock, User } from "lucide-react";
import { IconArrowLeft, IconCamera } from "@tabler/icons-react";

import { PortalHeader } from "@/features/company/components/header/portal-header";
import { useCompany } from "@/features/company/tenant-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProfilePictureCrop } from "@/components/profile-picture-crop";
import { cn } from "@/lib/utils";

import { updateUserProfileFn } from "@/lib/data/user/profile/server";
import { uploadProfilePicture } from "@/lib/data/user/profile/upload-avatar";
import { useTenantUser } from "@/lib/data/user/tenant/hooks";
import { tenantUserKeys } from "@/lib/data/user/tenant/keys";

const routeApi = getRouteApi("/$companySlug/_authed/account");

type SectionKey = "profile" | "security" | "notifications";

const SECTIONS: Array<{
  key: SectionKey;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: "profile",
    label: "Profile",
    description: "Your name and photo shown to workspace members.",
    icon: User,
  },
  {
    key: "security",
    label: "Security",
    description: "Password, MFA, and active sessions.",
    icon: Lock,
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Which workspace events reach your inbox.",
    icon: Bell,
  },
];

/**
 * Account settings as a full page.
 *
 * Renders OUTSIDE `PortalShell` so it owns the entire viewport below
 * the tenant header — no left sidebar, no MyStack, no zoom wrapper.
 * Active section is held in the URL (`?section=…`) so browser back /
 * refresh / deep links all behave correctly.
 *
 * The "Back to Portal" button reads `?from=…` (set by the user menu
 * trigger) and returns the user to the exact path they came from.
 * On direct visits or deep links the param is missing and the button
 * falls back to the portal home (`/{companySlug}`) — so the action
 * always lands somewhere sensible.
 */
export function AccountSettingsPage() {
  const { companySlug } = useCompany();
  const { section: sectionFromUrl, from } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const router = useRouter();

  const section: SectionKey = sectionFromUrl ?? "profile";
  const active = SECTIONS.find((s) => s.key === section) ?? SECTIONS[0];

  const setSection = (next: SectionKey) => {
    navigate({
      // Preserve `from` across section changes — if the user
      // browses between Profile/Security/Notifications we don't want
      // to lose the "where I came from" anchor.
      search: (prev) => ({ ...prev, section: next }),
      replace: true,
    });
  };

  // `href` on the anchor means middle-click / ⌘-click still opens
  // the destination in a new tab. The `onClick` handler short-
  // circuits the default full-page navigation and does an SPA push
  // via the router — which correctly resolves the tenant slug prefix
  // for an arbitrary pathname like `/pm/campaigns/abc?tab=feed`.
  const backHref = from ?? `/${companySlug}`;
  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    if (from) {
      router.history.push(from);
    } else {
      navigate({ to: "/$companySlug", params: { companySlug } });
    }
  };

  return (
    // App-shell layout identical in spirit to `PortalShell` — locked
    // to viewport height so nothing scrolls at the document level —
    // but WITHOUT SidebarProvider / SidebarInset / MyStack. The
    // account page owns the whole area below the header.
    <div className="[--header-height:calc(--spacing(12))] flex h-dvh w-full flex-col overflow-hidden bg-background">
      {/* Render header WITHOUT the mobile sidebar trigger — the
          account page has no `SidebarProvider` in its tree, so the
          default trigger would throw `useSidebar must be used within
          a SidebarProvider`. */}
      <PortalHeader showMobileSidebarTrigger={false} />

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Page-level sub-header. Title block on the left, "Back to
            Portal" action pinned to the right. Kept separate from
            `PortalHeader` so tenant chrome (brand/search/user) stays
            constant while this action bar changes per page. */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-b bg-background px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Account
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Account settings
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Manage your profile, security, and notification preferences.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="shrink-0"
          >
            <a href={backHref} onClick={handleBack}>
              <IconArrowLeft className="size-4" />
              Back to Portal
            </a>
          </Button>
        </div>

        {/* Section nav + content pane. The section nav is a local
            left rail — it looks and feels like the old settings modal
            sidebar, just sized for a full page. */}
        <div className="flex min-h-0 flex-1">
          <nav
            aria-label="Account sections"
            className="hidden w-64 shrink-0 border-r bg-muted/20 p-4 md:block"
          >
            <ul className="flex flex-col gap-1">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = s.key === section;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => setSection(s.key)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-primary/5 ring-1 ring-inset ring-primary/20"
                          : "hover:bg-muted/60",
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block text-sm font-medium",
                            isActive
                              ? "text-foreground"
                              : "text-foreground/80",
                          )}
                        >
                          {s.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {s.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile section picker. The left rail collapses below
              `md`; on narrow viewports we fall back to an inline row
              of chip buttons so the sub-nav stays reachable. */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex gap-2 overflow-x-auto border-b bg-muted/20 px-4 py-2 md:hidden">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const isActive = s.key === section;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSection(s.key)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted/60",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="size-3.5" />
                    {s.label}
                  </button>
                );
              })}
            </div>

            <main className="min-w-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <header className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    {active.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {active.description}
                  </p>
                </header>
                <Separator />

                {section === "profile" ? (
                  <ProfileSection />
                ) : section === "security" ? (
                  <PlaceholderSection message="Coming soon. Password, multi-factor auth, and active sessions will live here." />
                ) : (
                  <PlaceholderSection message="Coming soon. Choose which workspace events reach your inbox." />
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------- Profile section */

function ProfileSection() {
  const { company, userId } = useCompany();
  const companyId = company?.companyId ?? "";
  const organizationId = company?.organizationId ?? "";
  const { data: companyUser } = useTenantUser(companyId, userId ?? "");
  const queryClient = useQueryClient();

  const profile = companyUser?.app_user_profiles;
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [profilePictureUrl, setProfilePictureUrl] = React.useState("");
  const [cropOpen, setCropOpen] = React.useState(false);

  // Hydrate the form whenever the tenant-user query resolves (first
  // mount) or refetches (mutation invalidation).
  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setProfilePictureUrl(profile.profile_picture_url ?? "");
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () => {
      const currentOrgUserId = companyUser?.org_user_id;
      if (!currentOrgUserId) throw new Error("User data not loaded");
      return updateUserProfileFn({
        data: {
          orgUserId: currentOrgUserId,
          patch: {
            first_name: firstName || null,
            last_name: lastName || null,
          },
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tenantUserKeys.byId(companyId, userId ?? ""),
      });
    },
  });

  const handleCropConfirm = async (imageSrc: string, croppedArea: Area) => {
    const currentOrgUserId = companyUser?.org_user_id;
    if (!currentOrgUserId || !organizationId) {
      throw new Error("User data not loaded yet");
    }
    const newUrl = await uploadProfilePicture(
      imageSrc,
      croppedArea,
      organizationId,
      currentOrgUserId,
    );
    setProfilePictureUrl(newUrl);
    queryClient.invalidateQueries({
      queryKey: tenantUserKeys.byId(companyId, userId ?? ""),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || "Profile";

  const dirty =
    (profile?.first_name ?? "") !== firstName ||
    (profile?.last_name ?? "") !== lastName;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => setCropOpen(true)}
          className="group relative shrink-0"
        >
          <Avatar className="size-20">
            <AvatarImage
              src={profilePictureUrl || undefined}
              alt={displayName}
            />
            <AvatarFallback className="text-xl">
              {displayName.slice(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <IconCamera className="size-5 text-white" />
          </div>
        </button>
        <div>
          <p className="text-base font-medium text-foreground">
            {displayName}
          </p>
          <button
            type="button"
            onClick={() => setCropOpen(true)}
            className="mt-0.5 text-xs font-medium text-primary hover:underline"
          >
            Change photo
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="as-first-name">First name</Label>
            <Input
              id="as-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              disabled={mutation.isPending}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="as-last-name">Last name</Label>
            <Input
              id="as-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              disabled={mutation.isPending}
            />
          </div>
        </div>

        {mutation.isError ? (
          <p className="text-sm text-destructive">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Save failed"}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button
            size="sm"
            type="submit"
            disabled={!dirty || mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <ProfilePictureCrop
        open={cropOpen}
        onOpenChange={setCropOpen}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}

function PlaceholderSection({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
