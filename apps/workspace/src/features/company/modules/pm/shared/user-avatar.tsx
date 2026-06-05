// @ts-nocheck
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type UserAvatarFields = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profilePictureUrl: string | null;
};

/**
 * Display helper used by every PM surface that shows a user (project
 * members, campaign teams, task assignees). Keeps fallback-text logic
 * (initials → first letter of email → `?`) in one place so avatars
 * look identical across cards and pickers.
 */
export function PmUserAvatar({
  user,
  size = "sm",
  className,
}: {
  user: UserAvatarFields;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      {user.profilePictureUrl ? (
        <AvatarImage src={user.profilePictureUrl} alt={displayName(user)} />
      ) : null}
      <AvatarFallback>{initials(user)}</AvatarFallback>
    </Avatar>
  );
}

export function displayName(user: UserAvatarFields): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email || "Unknown user";
}

function initials(user: UserAvatarFields): string {
  const first = user.firstName?.[0];
  const last = user.lastName?.[0];
  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  if (user.email) return user.email[0]?.toUpperCase() ?? "?";
  return "?";
}

/** Small avatar pile used by list rows; tail indicator if overflow. */
export function PmAvatarStack({
  users,
  max = 3,
  size = "sm",
}: {
  users: UserAvatarFields[];
  max?: number;
  size?: "sm" | "default";
}) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;
  return (
    <div
      className={cn(
        "flex -space-x-1.5",
        "*:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
      )}
    >
      {visible.map((u, idx) => (
        <PmUserAvatar user={u} size={size} key={idx} />
      ))}
      {overflow > 0 ? (
        <div
          data-slot="avatar"
          className={cn(
            "relative flex items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background",
            size === "sm" ? "size-6" : "size-8",
          )}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
