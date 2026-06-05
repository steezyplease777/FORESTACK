// @ts-nocheck
"use client";

import * as React from "react";

/**
 * Controls the portal-wide "My Stack" side panel — a right-side
 * dockable surface for notifications, alerts, quick actions, and the
 * assistant chatbot. Independent from the main left sidebar: separate
 * state, separate cookie, separate keyboard shortcut.
 *
 * Kept as its own tiny provider (not a nested `SidebarProvider`)
 * because shadcn's provider hard-codes its cookie + shortcut names;
 * nesting it would clobber the main sidebar's state.
 */

const COOKIE_NAME = "my_stack_state";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const KEYBOARD_SHORTCUT = "j";

type MyStackTab = "inbox" | "alerts" | "actions" | "assistant";

type MyStackContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  activeTab: MyStackTab;
  setActiveTab: (tab: MyStackTab) => void;
  /** Aggregate unread across all tabs — drives the header bell badge. */
  unreadTotal: number;
  unreadByTab: Record<MyStackTab, number>;
};

const MyStackContext = React.createContext<MyStackContextValue | null>(null);

function readCookieBool(name: string): boolean | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  const value = match.split("=")[1];
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function writeCookieBool(name: string, value: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}`;
}

export function MyStackProvider({ children }: { children: React.ReactNode }) {
  // Default closed on first load so we don't surprise users; the
  // cookie takes over on subsequent renders.
  const [open, _setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<MyStackTab>("inbox");

  // Restore persisted state on mount. Doing this in an effect avoids
  // SSR/hydration mismatches — the server can't read the cookie.
  React.useEffect(() => {
    const persisted = readCookieBool(COOKIE_NAME);
    if (persisted !== null) _setOpen(persisted);
  }, []);

  const setOpen = React.useCallback((value: boolean) => {
    _setOpen(value);
    writeCookieBool(COOKIE_NAME, value);
  }, []);

  const toggle = React.useCallback(() => {
    _setOpen((v) => {
      const next = !v;
      writeCookieBool(COOKIE_NAME, next);
      return next;
    });
  }, []);

  // ⌘J / Ctrl+J — intentionally distinct from the main sidebar's ⌘B.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  // TODO: wire these to real data sources as each surface comes online
  // (notifications service, alert stream, assistant message queue).
  // Returning zeros keeps the UI honest — nothing fakes unread counts.
  const unreadByTab: Record<MyStackTab, number> = React.useMemo(
    () => ({ inbox: 0, alerts: 0, actions: 0, assistant: 0 }),
    []
  );
  const unreadTotal = React.useMemo(
    () => Object.values(unreadByTab).reduce((a, b) => a + b, 0),
    [unreadByTab]
  );

  const value = React.useMemo<MyStackContextValue>(
    () => ({
      open,
      setOpen,
      toggle,
      activeTab,
      setActiveTab,
      unreadTotal,
      unreadByTab,
    }),
    [open, setOpen, toggle, activeTab, unreadTotal, unreadByTab]
  );

  return (
    <MyStackContext.Provider value={value}>{children}</MyStackContext.Provider>
  );
}

export function useMyStack() {
  const ctx = React.useContext(MyStackContext);
  if (!ctx) {
    throw new Error("useMyStack must be used within <MyStackProvider>");
  }
  return ctx;
}

export type { MyStackTab };
