import type { ThemeColors } from "./types";

export const defaultLightTheme: Required<ThemeColors> = {
  background: "#FFFFFF",
  foreground: "#1A1A1A",
  card: "#FFFFFF",
  cardForeground: "#1A1A1A",
  popover: "#FFFFFF",
  popoverForeground: "#1A1A1A",
  primary: "#335749",
  primaryForeground: "#FFFFFF",
  secondary: "#F0F0F1",
  secondaryForeground: "#1A1A1A",
  muted: "#F0F0F1",
  mutedForeground: "#71717A",
  accent: "#F0F0F1",
  accentForeground: "#1A1A1A",
  destructive: "#DC2626",
  border: "#E1E1E4",
  input: "#E1E1E4",
  ring: "#335749",
  chart1: "#335749",
  chart2: "#3E3F65",
  chart3: "#5A8F7B",
  chart4: "#6E6FA0",
  chart5: "#8BBAA8",
  sidebar: "#F9F9F9",
  sidebarForeground: "#303030",
  sidebarPrimary: "#335749",
  sidebarPrimaryForeground: "#FFFFFF",
  sidebarAccent: "#F0F0F0",
  sidebarAccentForeground: "#1A1A1A",
  sidebarBorder: "#E1E1E4",
  sidebarRing: "#335749",
  radius: "0.625rem",
};

export const defaultDarkTheme: Required<ThemeColors> = {
  background: "#111113",
  foreground: "#EDEDEF",
  card: "#1A1A1D",
  cardForeground: "#EDEDEF",
  popover: "#1A1A1D",
  popoverForeground: "#EDEDEF",
  primary: "#5A8F7B",
  primaryForeground: "#FFFFFF",
  secondary: "#232326",
  secondaryForeground: "#EDEDEF",
  muted: "#232326",
  mutedForeground: "#8E8E96",
  accent: "#232326",
  accentForeground: "#EDEDEF",
  destructive: "#EF4444",
  border: "#2C2C30",
  input: "#2C2C30",
  ring: "#5A8F7B",
  chart1: "#5A8F7B",
  chart2: "#6E6FA0",
  chart3: "#8BBAA8",
  chart4: "#9394C8",
  chart5: "#B8D9CA",
  sidebar: "#111113",
  sidebarForeground: "#8E8E96",
  sidebarPrimary: "#EDEDEF",
  sidebarPrimaryForeground: "#111113",
  sidebarAccent: "#1E1E21",
  sidebarAccentForeground: "#EDEDEF",
  sidebarBorder: "#2C2C30",
  sidebarRing: "#5A8F7B",
  radius: "0.625rem",
};

const THEME_KEY_TO_CSS_VAR: Record<keyof ThemeColors, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
  radius: "--radius",
};

export function themeToCssVars(theme: ThemeColors): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (value && key in THEME_KEY_TO_CSS_VAR) {
      vars[THEME_KEY_TO_CSS_VAR[key as keyof ThemeColors]] = value;
    }
  }
  return vars;
}

export function resolveTheme(
  customThemeEnabled: boolean,
  portalTheme: import("./types").PortalTheme | null,
): { light: Required<ThemeColors>; dark: Required<ThemeColors> } {
  if (!customThemeEnabled || !portalTheme) {
    return { light: defaultLightTheme, dark: defaultDarkTheme };
  }

  return {
    light: { ...defaultLightTheme, ...portalTheme.light },
    dark: { ...defaultDarkTheme, ...portalTheme.dark },
  };
}
