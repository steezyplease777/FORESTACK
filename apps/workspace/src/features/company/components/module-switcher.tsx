// @ts-nocheck

import { useNavigate } from "@tanstack/react-router";
import { IconCheck, IconChevronDown, type Icon } from "@tabler/icons-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  listModules,
  getModuleDefinition,
  getHomeDefinition,
  type ModuleTheme,
} from "@/config/modules.registry";
import { useCompany } from "@/features/company/tenant-provider";
import { cn } from "@/lib/utils";

const HOME_SLUG = "home";

/**
 * Small colored tile for a portal's icon. Shared between the sidebar
 * header chip and the switcher dropdown so the visual identity is
 * identical in both places.
 */
function ModuleIconTile({
  icon: Icon,
  theme,
  size = "md",
}: {
  icon: Icon;
  theme: ModuleTheme;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md ring-1 shrink-0",
        size === "md" ? "size-7" : "size-6",
        theme.bg,
        theme.text,
        theme.ring
      )}
    >
      <Icon className={size === "md" ? "size-4" : "size-3.5"} />
    </div>
  );
}

/**
 * Header chip + dropdown that lets the user jump between portals
 * (home + every module in `MODULE_DEFINITIONS`) from any module
 * sidebar.
 *
 * The chip visuals come from `MODULE_DEFINITIONS[slug]`; the dropdown
 * renders every portal with its own themed icon tile so the switcher
 * reads at a glance.
 */
export function ModuleSwitcher({ moduleSlug }: { moduleSlug: string }) {
  const { companySlug } = useCompany();
  const navigate = useNavigate();
  const basePath = `/${companySlug}`;
  // `state` is "expanded" | "collapsed" for any non-`collapsible=none`
  // sidebar. When the parent portal toggles the rail to icon mode
  // (e.g., while My Stack is open) we drop the label + chevron chip and
  // render just the themed icon tile so the chip doesn't squish.
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isHome = moduleSlug === HOME_SLUG;
  const homeDef = getHomeDefinition();
  const moduleDef = getModuleDefinition(moduleSlug);
  const current = isHome ? homeDef : moduleDef;
  if (!current) return null;

  return (
    <SidebarHeader
      className={cn(
        "border-b p-0",
        // Vertically center the icon tile within the collapsed rail so
        // it lines up with the nav icons below (which render inside
        // standard 8×8 menu buttons).
        isCollapsed && "items-center p-2"
      )}
    >
      <DropdownMenu>
        <TooltipProvider delayDuration={300} disableHoverableContent>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger
                aria-label={`Switch portal — currently ${current.shortLabel}`}
                className={cn(
                  "group outline-hidden transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 data-[state=open]:bg-muted/60",
                  isCollapsed
                    ? "flex size-8 items-center justify-center rounded-md"
                    : "flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                )}
              >
                <ModuleIconTile
                  icon={current.icon}
                  theme={current.theme}
                  size={isCollapsed ? "sm" : "md"}
                />
                {!isCollapsed && (
                  <>
                    <div className="flex flex-1 flex-col leading-tight min-w-0">
                      <span className="truncate text-sm font-semibold tracking-tight">
                        {current.shortLabel}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        Switch portal
                      </span>
                    </div>
                    <IconChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </>
                )}
              </DropdownMenuTrigger>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={6}>
                {current.shortLabel} — switch portal
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={8}
          className="min-w-64 p-1.5"
        >
          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Switch portal
          </DropdownMenuLabel>

          <DropdownMenuItem
            disabled={isHome}
            onSelect={() =>
              !isHome && navigate({ to: `${basePath}/dashboard` })
            }
            className={cn(
              "gap-2.5 px-2 py-2 data-disabled:opacity-100 data-disabled:bg-muted/60",
              isHome && "cursor-default"
            )}
          >
            <ModuleIconTile icon={homeDef.icon} theme={homeDef.theme} size="sm" />
            <div className="flex flex-1 flex-col leading-tight">
              <span className="text-sm font-medium">{homeDef.shortLabel}</span>
              <span className="text-xs text-muted-foreground">
                {homeDef.description}
              </span>
            </div>
            {isHome && (
              <IconCheck className="size-4 shrink-0 text-muted-foreground" />
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuLabel className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Modules
          </DropdownMenuLabel>

          {listModules().map((m) => {
            const isCurrent = m.slug === moduleSlug;
            return (
              <DropdownMenuItem
                key={m.slug}
                disabled={isCurrent}
                onSelect={() =>
                  !isCurrent && navigate({ to: `${basePath}/${m.slug}` })
                }
                className={cn(
                  "gap-2.5 px-2 py-2 data-disabled:opacity-100 data-disabled:bg-muted/60",
                  isCurrent && "cursor-default"
                )}
              >
                <ModuleIconTile icon={m.icon} theme={m.theme} size="sm" />
                <div className="flex flex-1 flex-col leading-tight min-w-0">
                  <span className="truncate text-sm font-medium">{m.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {m.description}
                  </span>
                </div>
                {isCurrent && (
                  <IconCheck className="size-4 shrink-0 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarHeader>
  );
}
