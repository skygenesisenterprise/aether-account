import * as React from "react";

import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useMobileAuth } from "@/components/mobile/mobile-auth-provider";
import { getMobileProfileInitials, getMobileProfileName, getMobileProfileSubtitle } from "@/components/mobile/profile-identity";
import {
  MobileEmptyState,
  MobileListRow,
  MobileListSection,
  MobilePlatformScreen,
} from "@/components/mobile/mobile-platform-shell";
import {
  loadActivityFeed,
  useMobileResource,
  type ActivityFeedItem,
} from "@/lib/mobile/meet-data";

const filters = [
  { icon: "mark-unread-chat-alt", label: "S'informer" },
  { icon: "sort", label: "Récent" },
  { icon: "notifications-none", label: "Non lues" },
  { icon: "alternate-email", label: "Mentions" },
  { icon: "more-horiz", label: "Autres" },
] as const;

function getNotificationIcon(category: ActivityFeedItem["category"]) {
  if (category === "Réunion") return "event";
  if (category === "Équipe") return "groups-2";
  if (category === "Mention") return "alternate-email";
  return "notifications-none";
}

export default function ActivityScreen() {
  const { session } = useMobileAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { data, error, loading } = useMobileResource(
    () => loadActivityFeed(session?.user),
    [session?.user.email, refreshKey],
  );

  const unreadCount = data?.items.filter((item) => item.unread).length ?? 0;

  return (
    <MobilePlatformScreen
      actions={[{ icon: "more-horiz", label: "Options" }]}
      empty={
        <MobileEmptyState
          icon="notifications-none"
          label="Aucune activité pour le moment."
        />
      }
      error={error}
      filters={[...filters]}
      loading={loading}
      onRefresh={() => setRefreshKey((value) => value + 1)}
      refreshing={loading}
      route="activity"
      showEmpty={!loading && (data?.items.length ?? 0) === 0}
      subtitle={`${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`}
      title="Activités"
      userInitials={getMobileProfileInitials(session?.user)}
      profileName={getMobileProfileName(session?.user)}
      profileSubtitle={getMobileProfileSubtitle(session?.user)}
    >
      <MobileListSection title="Aujourd'hui">
        {data?.items.map((item) => (
          <MobileListRow
            accent={item.unread ? "#5B5FC7" : "#64748B"}
            badge={item.unread ? "N" : undefined}
            icon={getNotificationIcon(item.category)}
            key={item.id}
            meta={item.timestampLabel}
            subtitle={item.body}
            title={item.title}
          >
            <View style={styles.categoryLine}>
              <MaterialIcons color="#6B7280" name="label-outline" size={14} />
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </MobileListRow>
        ))}
      </MobileListSection>
    </MobilePlatformScreen>
  );
}

const styles = StyleSheet.create({
  categoryLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 2,
  },
  categoryText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
  },
});
