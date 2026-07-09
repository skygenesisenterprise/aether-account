import * as React from "react";

import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMobileAuth } from "@/components/mobile/mobile-auth-provider";
import { getMobileProfileInitials, getMobileProfileName, getMobileProfileSubtitle } from "@/components/mobile/profile-identity";
import { MobileEmptyState, MobilePlatformScreen } from "@/components/mobile/mobile-platform-shell";
import { mobileTheme } from "@/components/mobile/theme";
import { loadChatHub, useMobileResource, type ConversationPreviewItem } from "@/lib/mobile/meet-data";

const filters = [
  { icon: "chat-bubble-outline", label: "Toutes" },
  { icon: "mark-chat-unread", label: "Non lues" },
  { icon: "alternate-email", label: "Mentions" },
  { icon: "groups-2", label: "Groupes" },
  { icon: "schedule", label: "Récent" },
] as const;

const presenceColors: Record<ConversationPreviewItem["presence"], string> = {
  away: mobileTheme.color.warning,
  busy: mobileTheme.color.destructive,
  offline: mobileTheme.color.mutedForeground,
  online: mobileTheme.color.success,
};

function getInitials(value: string): string {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function ChatScreen() {
  const { session } = useMobileAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { data, error, loading } = useMobileResource(
    () => loadChatHub(session?.user),
    [session?.user.email, refreshKey],
  );

  const unreadCount = data?.items.reduce((total, item) => total + item.unreadCount, 0) ?? 0;

  return (
    <MobilePlatformScreen
      appearance="chatDark"
      actions={[{ icon: "more-horiz", label: "Options" }]}
      empty={<MobileEmptyState appearance="chatDark" icon="chat-bubble-outline" label="Aucune conversation disponible." />}
      error={error}
      filters={[...filters]}
      loading={loading}
      onRefresh={() => setRefreshKey((value) => value + 1)}
      primaryAction={{ icon: "edit-square", label: "Nouveau message" }}
      refreshing={loading}
      route="chat"
      showEmpty={!loading && (data?.items.length ?? 0) === 0}
      subtitle={`${unreadCount} message${unreadCount > 1 ? "s" : ""} non lu${unreadCount > 1 ? "s" : ""}`}
      title="Conversations"
      userInitials={getMobileProfileInitials(session?.user)}
      profileName={getMobileProfileName(session?.user)}
      profileSubtitle={getMobileProfileSubtitle(session?.user)}
    >
      <View style={styles.list}>
        {data?.items.map((item, index) => (
          <ConversationRow isLast={index === (data.items.length - 1)} item={item} key={item.id} />
        ))}
      </View>
    </MobilePlatformScreen>
  );
}

function ConversationRow({ item, isLast }: { item: ConversationPreviewItem; isLast: boolean }) {
  return (
    <Pressable
      onPress={() => {
        router.push({
          pathname: "/chat-viewer" as never,
          params: {
            conversationId: item.id,
            title: item.title,
          },
        });
      }}
      style={[styles.row, isLast ? styles.rowLast : null]}
    >
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.title)}</Text>
        </View>
        <View style={[styles.presence, { backgroundColor: presenceColors[item.presence] }]} />
      </View>

      <View style={styles.copy}>
        <View style={styles.titleLine}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          <Text numberOfLines={1} style={styles.time}>
            {item.timestampLabel}
          </Text>
        </View>

        <View style={styles.previewLine}>
          <Text numberOfLines={2} style={styles.preview}>
            {item.excerpt}
          </Text>
          {item.unreadCount ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.chatSurface,
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  avatarText: {
    color: mobileTheme.color.popover,
    fontSize: 12,
    fontWeight: "900",
  },
  avatarWrap: {
    height: 40,
    width: 40,
  },
  badge: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.primary,
    borderRadius: 999,
    height: 16,
    justifyContent: "center",
    marginTop: 1,
    minWidth: 16,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: mobileTheme.color.primaryForeground,
    fontSize: 9,
    fontWeight: "900",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  list: {
    backgroundColor: mobileTheme.color.chatBackground,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: mobileTheme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...mobileTheme.shadow.subtle,
  },
  presence: {
    borderColor: mobileTheme.color.chatBackground,
    borderRadius: 999,
    borderWidth: 2,
    bottom: -1,
    height: 12,
    position: "absolute",
    right: -1,
    width: 12,
  },
  preview: {
    color: "#A7ACB7",
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
  previewLine: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  row: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.chatBackground,
    borderBottomColor: "rgba(255,255,255,0.06)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  time: {
    color: "#7B8190",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 10,
  },
  title: {
    color: mobileTheme.color.popover,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  titleLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    minWidth: 0,
  },
});
