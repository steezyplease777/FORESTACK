// @ts-nocheck

import { IconLogout, IconUserCircle } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { companyContextQueryKey } from "@/lib/auth/tenant-context";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutFn } from "@/lib/data/auth/server";

/**
 * Horizontal user menu for the site header.
 *
 * Pairs with `CompanyNavUser` (vertical, sidebar-footer variant). Trigger
 * is a small circular avatar button; menu contents mirror the sidebar
 * version so the two stay behaviorally identical.
 */
export function HeaderUserMenu({
  user,
  companySlug,
}: {
  user: { name: string; email: string; avatar: string };
  companySlug: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await signOutFn();
    queryClient.removeQueries({ queryKey: companyContextQueryKey(companySlug) });
    navigate({ to: "/$companySlug/login", params: { companySlug } });
  };

  // Capture the current path+search as `from` so the account page's
  // "Back to Portal" button can take the user back to exactly where
  // they were. Hard-coding a fallback destination (like the portal
  // home) would silently lose context from any deep page (campaign
  // detail, PO editor, etc.).
  const openAccountSettings = () => {
    const from =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : undefined;
    navigate({
      to: "/$companySlug/account",
      params: { companySlug },
      search: from ? { from } : undefined,
    });
  };

  const initials = user.name.slice(0, 2).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full p-0"
          aria-label="Open user menu"
        >
          <Avatar className="size-7">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-1.5 text-left">
            <Avatar className="size-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg text-[11px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={openAccountSettings}>
          <IconUserCircle />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <IconLogout />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
