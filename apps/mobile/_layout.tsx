import * as React from "react";

import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, Tabs, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import "@/styles/globals.css";

import { MobileAuthProvider, useMobileAuth } from "@/components/mobile/mobile-auth-provider";
import { PortalProvider, usePortal } from "@/components/mobile/portal-provider";
import { mobileTheme } from "@/components/mobile/theme";
import { emitTabScrollToTop } from "@/components/mobile/tab-scroll-to-top";

const ignoredWebWarnings = [
  "props.pointerEvents is deprecated. Use style.pointerEvents",
];

if (process.env.NODE_ENV !== "production" && Platform.OS === "web") {
  LogBox.ignoreLogs(ignoredWebWarnings);

  const consoleWithAetherFilter = console as Console & {
    __aetherMobileWebWarningFilter?: boolean;
  };

  if (!consoleWithAetherFilter.__aetherMobileWebWarningFilter) {
    const originalWarn = console.warn.bind(console);

    consoleWithAetherFilter.warn = (...args: unknown[]) => {
      const message = typeof args[0] === "string" ? args[0] : "";
      if (ignoredWebWarnings.some((warning) => message.includes(warning))) {
        return;
      }
      originalWarn(...args);
    };
    consoleWithAetherFilter.__aetherMobileWebWarningFilter = true;
  }
}

interface TabIconProps {
  color: React.ComponentProps<typeof MaterialIcons>["color"];
  focused: boolean;
  name: React.ComponentProps<typeof MaterialIcons>["name"];
}

function WebPhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  return (
    <View style={styles.browserStage}>
      <View style={styles.phoneShell}>
        <View style={styles.dynamicIsland} />
        <View style={styles.phoneScreen}>{children}</View>
      </View>
    </View>
  );
}

function TabIcon({ color, focused, name }: TabIconProps) {
  const isDarkIcon = typeof color === "string" && color !== mobileTheme.color.primary;

  return (
    <View
      style={[
        styles.tabIconWrap,
        focused ? (isDarkIcon ? styles.tabIconWrapActiveDark : styles.tabIconWrapActive) : null,
      ]}
    >
      <MaterialIcons color={color} name={name} size={24} />
    </View>
  );
}

interface AppLauncherItem {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
}

const appLauncherItems: AppLauncherItem[] = [
  { icon: "add", label: "Add app" },
  { icon: "call", label: "Appels" },
  { icon: "description", label: "Fichiers" },
  { icon: "approval", label: "Approvals" },
  { icon: "photo-camera", label: "Caméra" },
  { icon: "cast", label: "Cast" },
  { icon: "auto-awesome", label: "Clipchamp" },
  { icon: "school", label: "Éducation" },
];

function MoreAppsSheet({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <View pointerEvents="box-none" style={styles.overlayRoot}>
      <Pressable onPress={onClose} style={styles.overlayBackdrop} />
      <View style={styles.overlaySheet}>
        <View style={styles.overlayHandle} />
        <View style={styles.overlayHeader}>
          <View />
          <Pressable hitSlop={10} onPress={onClose}>
            <Text style={styles.overlayAction}>Réorganiser</Text>
          </Pressable>
        </View>
        <View style={styles.appGrid}>
          {appLauncherItems.map((item) => (
            <Pressable key={item.label} style={styles.appTile}>
              <View style={styles.appTileIcon}>
                <MaterialIcons color={mobileTheme.color.primaryForeground} name={item.icon} size={22} />
              </View>
              <Text numberOfLines={2} style={styles.appTileLabel}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.appDots}>
          <View style={[styles.appDot, styles.appDotActive]} />
          <View style={styles.appDot} />
        </View>
      </View>
    </View>
  );
}

function MobileLayoutTabs() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { hasPortalContent, setPortalContent } = usePortal();
  const { isAuthenticated, isHydrating, isLocked } = useMobileAuth();
  const isUnauthenticatedRoute = pathname === "/" || pathname === "/login" || pathname === "/register";
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

  React.useEffect(() => {
    setPortalContent(isMoreOpen ? <MoreAppsSheet onClose={() => setIsMoreOpen(false)} /> : null);

    return () => {
      setPortalContent(null);
    };
  }, [isMoreOpen, setPortalContent]);

  if (isHydrating) {
    return null;
  }

  if (!isAuthenticated && pathname === "/unlock") {
    return <Redirect href="/login" />;
  }

  if (!isAuthenticated && !isUnauthenticatedRoute) {
    return <Redirect href="/login" />;
  }

  if (isAuthenticated && isLocked && pathname !== "/unlock") {
    return <Redirect href="/unlock" />;
  }

  if (isAuthenticated && !isLocked && pathname === "/unlock") {
    return <Redirect href={"/chat" as never} />;
  }

  if (isAuthenticated && (pathname === "/" || pathname === "/login" || pathname === "/register")) {
    return <Redirect href={"/chat" as never} />;
  }

  return (
    <Tabs
      initialRouteName="chat"
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: mobileTheme.color.background,
        },
        tabBarActiveTintColor: mobileTheme.color.primary,
        tabBarInactiveTintColor: "#C8CDD8",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          lineHeight: 13,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: "rgba(35,36,38,0.98)",
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: 1,
          bottom: 0,
          display: hasPortalContent ? "none" : "flex",
          height: 72 + insets.bottom,
          left: 0,
          paddingBottom: insets.bottom + 7,
          paddingTop: 6,
          position: "absolute",
          right: 0,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="register" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="unlock" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="chat-viewer" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen
        listeners={{
          tabPress: () => {
            if (pathname === "/activity") emitTabScrollToTop("activity");
          },
        }}
        name="activity"
        options={{
          title: "Activités",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="notifications-none" />,
          tabBarLabel: "Activités",
        }}
      />
      <Tabs.Screen
        listeners={{
          tabPress: () => {
            if (pathname === "/chat") emitTabScrollToTop("chat");
          },
        }}
        name="chat"
        options={{
          title: "Conversation",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="chat-bubble-outline" />,
          tabBarLabel: "Conversation",
        }}
      />
      <Tabs.Screen
        listeners={{
          tabPress: () => {
            if (pathname === "/teams") emitTabScrollToTop("teams");
          },
        }}
        name="teams"
        options={{
          title: "Équipes",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="groups-2" />,
          tabBarLabel: "Équipes",
        }}
      />
      <Tabs.Screen
        listeners={{
          tabPress: () => {
            if (pathname === "/calendar") emitTabScrollToTop("calendar");
          },
        }}
        name="calendar"
        options={{
          title: "Calendrier",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="calendar-today" />,
          tabBarLabel: "Calendrier",
        }}
      />
      <Tabs.Screen
        listeners={{
          tabPress: () => {
            if (pathname === "/calls") emitTabScrollToTop("calls");
          },
        }}
        name="calls"
        options={{
          title: "Appels",
          tabBarIcon: ({ color, focused }) => <TabIcon color={color} focused={focused} name="call" />,
          tabBarLabel: "Appels",
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Plus",
          tabBarButton: ({ accessibilityState }) => {
            const focused = Boolean(accessibilityState?.selected) || isMoreOpen;
            const activeColor = mobileTheme.color.primary;
            const inactiveColor = "#C8CDD8";
            const color = focused ? activeColor : inactiveColor;

            return (
              <Pressable
                accessibilityLabel="Plus"
                hitSlop={8}
                onPress={() => setIsMoreOpen(true)}
                style={styles.moreTabButton}
              >
                <TabIcon color={color} focused={focused} name="more-horiz" />
                <Text style={[styles.moreTabLabel, { color }]}>Plus</Text>
              </Pressable>
            );
          },
        }}
      />
    </Tabs>
  );
}

export default function MobileRootLayout() {
  return (
    <SafeAreaProvider>
      <MobileAuthProvider>
        <StatusBar style="dark" />
        <WebPhoneFrame>
          <PortalProvider>
            <MobileLayoutTabs />
          </PortalProvider>
        </WebPhoneFrame>
      </MobileAuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  browserStage: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.shell,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  phoneShell: {
    backgroundColor: mobileTheme.color.shellChrome,
    borderRadius: 48,
    height: "100%",
    maxHeight: 900,
    maxWidth: 430,
    overflow: "hidden",
    padding: 10,
    width: "100%",
  },
  dynamicIsland: {
    alignSelf: "center",
    backgroundColor: mobileTheme.color.shellIsland,
    borderRadius: 999,
    height: 24,
    marginTop: 8,
    position: "absolute",
    width: 92,
    zIndex: 5,
  },
  phoneScreen: {
    backgroundColor: mobileTheme.color.background,
    borderRadius: 38,
    flex: 1,
    overflow: "hidden",
  },
  tabIconWrap: {
    alignItems: "center",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    width: 42,
  },
  tabIconWrapActive: {
    backgroundColor: mobileTheme.color.accent,
  },
  tabIconWrapActiveDark: {
    backgroundColor: "rgba(73,81,149,0.22)",
  },
  moreTabButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  moreTabLabel: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 13,
    marginBottom: 4,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 30,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.34)",
  },
  overlaySheet: {
    backgroundColor: mobileTheme.color.chatBackground,
    borderTopColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 20,
  },
  overlayHandle: {
    alignSelf: "center",
    backgroundColor: "#7A7A7A",
    borderRadius: 999,
    height: 5,
    marginBottom: 8,
    width: 36,
  },
  overlayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    minHeight: 26,
  },
  overlayAction: {
    color: mobileTheme.color.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  appGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 18,
  },
  appTile: {
    alignItems: "center",
    width: "23%",
  },
  appTileIcon: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.primary,
    borderRadius: 10,
    height: 52,
    justifyContent: "center",
    marginBottom: 8,
    width: 52,
  },
  appTileLabel: {
    color: mobileTheme.color.popover,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
    textAlign: "center",
  },
  appDots: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 18,
  },
  appDot: {
    backgroundColor: "#687082",
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  appDotActive: {
    backgroundColor: mobileTheme.color.primary,
  },
});
