import * as React from "react";

import { StyleSheet, Text, View } from "react-native";

import { useMobileAuth } from "@/components/mobile/mobile-auth-provider";
import { getMobileProfileInitials, getMobileProfileName, getMobileProfileSubtitle } from "@/components/mobile/profile-identity";
import {
  MobileEmptyState,
  MobileListRow,
  MobileListSection,
  MobilePlatformScreen,
} from "@/components/mobile/mobile-platform-shell";
import { loadTeamsHub, useMobileResource } from "@/lib/mobile/meet-data";

const filters = [
  { icon: "groups-2", label: "Toutes" },
  { icon: "tag", label: "Canaux" },
  { icon: "star-outline", label: "Suivies" },
  { icon: "notifications-none", label: "Alertes" },
  { icon: "add", label: "Créer" },
] as const;

export default function TeamsScreen() {
  const { session } = useMobileAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { data, error, loading } = useMobileResource(
    () => loadTeamsHub(session?.user),
    [session?.user.email, refreshKey],
  );

  return (
    <MobilePlatformScreen
      actions={[{ icon: "add", label: "Ajouter" }]}
      empty={<MobileEmptyState icon="groups-2" label="Aucune équipe disponible." />}
      error={error}
      filters={[...filters]}
      loading={loading}
      onRefresh={() => setRefreshKey((value) => value + 1)}
      refreshing={loading}
      route="teams"
      showEmpty={!loading && (data?.items.length ?? 0) === 0}
      subtitle={`${data?.items.length ?? 0} espace${(data?.items.length ?? 0) > 1 ? "s" : ""} actif${(data?.items.length ?? 0) > 1 ? "s" : ""}`}
      title="Équipes"
      userInitials={getMobileProfileInitials(session?.user)}
      profileName={getMobileProfileName(session?.user)}
      profileSubtitle={getMobileProfileSubtitle(session?.user)}
    >
      <MobileListSection title="Vos équipes">
        {data?.items.map((item) => (
          <MobileListRow
            accent={item.accent}
            icon="groups-2"
            key={item.id}
            meta={`${item.membersCount}`}
            subtitle={item.description}
            title={item.name}
          >
            <View style={styles.statsLine}>
              <Text style={styles.statText}>{item.channelsCount} canaux</Text>
              <Text style={styles.statSeparator}>•</Text>
              <Text style={styles.statText}>{item.latestActivity}</Text>
            </View>
          </MobileListRow>
        ))}
      </MobileListSection>
    </MobilePlatformScreen>
  );
}

const styles = StyleSheet.create({
  statSeparator: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "900",
  },
  statText: {
    color: "#6B7280",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  statsLine: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
});
