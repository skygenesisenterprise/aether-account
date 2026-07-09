import { Platform } from "react-native";

export const mobileTheme = {
  color: {
    background: "#F8F8F7",
    foreground: "#232834",
    card: "#F4F5F4",
    cardForeground: "#232834",
    popover: "#FCFCFB",
    popoverForeground: "#232834",
    primary: "#495195",
    primaryForeground: "#F8F8F7",
    secondary: "#ECEEF2",
    secondaryForeground: "#2A3040",
    muted: "#EFF0EF",
    mutedForeground: "#6F7686",
    accent: "#E7EAF5",
    accentForeground: "#2A3040",
    border: "#DCE0E7",
    input: "#E6E9EF",
    ring: "#495195",
    success: "#3A9668",
    warning: "#C79A37",
    destructive: "#C95547",
    warningSurface: "#FFF6DB",
    destructiveSurface: "#FCEBEC",
    successSurface: "#ECF8F0",
    shell: "#E9EDF1",
    shellChrome: "#171C27",
    shellIsland: "#0D1117",
    chatBackground: "#232426",
    chatSurface: "#2B2D31",
    white: "#FFFFFF",
  },
  radius: {
    sm: 10,
    md: 12,
    lg: 14,
    xl: 18,
    pill: 999,
  },
  shadow: {
    subtle:
      Platform.select({
        web: {
          boxShadow: "0 4px 12px rgba(24, 33, 53, 0.07)",
        },
        default: {
          shadowColor: "#182135",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
          elevation: 3,
        },
      }) ?? {},
    medium:
      Platform.select({
        web: {
          boxShadow: "0 12px 28px rgba(24, 33, 53, 0.08)",
        },
        default: {
          shadowColor: "#182135",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.08,
          shadowRadius: 28,
          elevation: 8,
        },
      }) ?? {},
  },
} as const;

