import * as React from "react";

import { StyleSheet, Text, View } from "react-native";

import { useMobileAuth } from "@/components/mobile/mobile-auth-provider";
import { getMobileProfileInitials, getMobileProfileName, getMobileProfileSubtitle } from "@/components/mobile/profile-identity";
import {
  MobileEmptyState,
  MobileListRow,
  MobileListSection,
  MobilePlatformScreen,
  MobileStatPill,
} from "@/components/mobile/mobile-platform-shell";
import {
  loadCallsHub,
  useMobileResource,
  type CallFeedItem,
} from "@/lib/mobile/meet-data";

const filters = [
  { icon: "history", label: "Récents" },
  { icon: "phone-missed", label: "Manqués" },
  { icon: "videocam", label: "Vidéo" },
  { icon: "person-outline", label: "Contacts" },
  { icon: "dialpad", label: "Clavier" },
] as const;

function getCallIcon(item: CallFeedItem) {
  if (item.direction === "Manqué") return "phone-missed";
  if (item.mode === "video") return "videocam";
  return "call";
}

function getCallAccent(item: CallFeedItem) {
  if (item.direction === "Manqué") return "#DC2626";
  if (item.direction === "Sortant") return "#0EA5E9";
  return "#16A34A";
}

export default function CallsScreen() {
  const { session } = useMobileAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { data, error, loading } = useMobileResource(
    () => loadCallsHub(session?.user),
    [session?.user.email, refreshKey],
  );

  return (
    <MobilePlatformScreen
      actions={[{ icon: "dialpad", label: "Clavier" }]}
      empty={<MobileEmptyState icon="call" label="Aucun appel dans l'historique." />}
      error={error}
      filters={[...filters]}
      loading={loading}
      onRefresh={() => setRefreshKey((value) => value + 1)}
      primaryAction={{ icon: "add-call", label: "Nouvel appel" }}
      refreshing={loading}
      route="calls"
      showEmpty={!loading && (data?.items.length ?? 0) === 0}
      subtitle="Audio, vidéo et appels manqués"
      title="Appels"
      userInitials={getMobileProfileInitials(session?.user)}
      profileName={getMobileProfileName(session?.user)}
      profileSubtitle={getMobileProfileSubtitle(session?.user)}
    >
      {data?.summary.length ? (
        <View style={styles.summaryRow}>
          {data.summary.map((item) => (
            <MobileStatPill key={item.title} label={item.title} value={item.value} />
          ))}
        </View>
      ) : null}

      <MobileListSection title="Historique">
        {data?.items.map((item) => (
          <MobileListRow
            accent={getCallAccent(item)}
            icon={getCallIcon(item)}
            key={item.id}
            meta={item.timestampLabel}
            subtitle={item.subtitle}
            title={item.title}
          >
            <View style={styles.callLine}>
              <Text style={[styles.directionText, { color: getCallAccent(item) }]}>
                {item.direction}
              </Text>
              <Text style={styles.callSeparator}>•</Text>
              <Text style={styles.durationText}>{item.durationLabel}</Text>
            </View>
          </MobileListRow>
        ))}
      </MobileListSection>
    </MobilePlatformScreen>
  );
}

const styles = StyleSheet.create({
  callLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 2,
  },
  callSeparator: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "900",
  },
  directionText: {
    fontSize: 12,
    fontWeight: "900",
  },
  durationText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
  },
});
