import * as React from "react";

import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AetherMeetScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
}

interface HeaderActionButtonProps {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  accessibilityLabel: string;
  onPress?: () => void;
}

interface FilterChipProps {
  label: string;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  active?: boolean;
  onPress?: () => void;
}

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

interface MetricPillProps {
  label: string;
  value: string;
  tone?: "indigo" | "mint" | "amber" | "slate";
}

interface PersonAvatarProps {
  name: string;
  status?: "online" | "busy" | "away" | "offline";
  size?: number;
}

interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}

export function AetherMeetScreen({
  title,
  subtitle,
  children,
  actions,
  footer,
  scrollable = true,
}: AetherMeetScreenProps) {
  const content = (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        {actions ? <View style={styles.headerActions}>{actions}</View> : null}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <LinearGradient colors={["#F6F6FB", "#F1F4FF", "#EEF2FF"]} style={styles.background}>
        {scrollable ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </LinearGradient>
    </SafeAreaView>
  );
}

export function HeaderActionButton({ icon, accessibilityLabel, onPress }: HeaderActionButtonProps) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.headerActionButton}>
      <MaterialIcons color="#1F2937" name={icon} size={22} />
    </Pressable>
  );
}

export function SearchField({ value, onChangeText, placeholder }: SearchFieldProps) {
  return (
    <View style={styles.searchField}>
      <MaterialIcons color="#64748B" name="search" size={18} />
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        style={styles.searchInput}
        value={value}
      />
    </View>
  );
}

export function FilterChip({ label, icon, active, onPress }: FilterChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active ? styles.filterChipActive : null]}>
      {icon ? (
        <MaterialIcons color={active ? "#4F46E5" : "#475569"} name={icon} size={18} />
      ) : null}
      <Text style={[styles.filterChipLabel, active ? styles.filterChipLabelActive : null]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRail({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.chipRail}
      showsHorizontalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <View style={styles.sectionCard}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

export function MetricPill({ label, value, tone = "slate" }: MetricPillProps) {
  return (
    <View style={[styles.metricPill, metricPillToneStyles[tone]]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function PersonAvatar({ name, status = "offline", size = 44 }: PersonAvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.avatar, { height: size, width: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarLabel, { fontSize: Math.max(13, size * 0.3) }]}>{initials}</Text>
      <View style={[styles.avatarStatus, avatarStatusStyles[status]]} />
    </View>
  );
}

export function LoadingBlock() {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color="#4F46E5" />
      <Text style={styles.loadingText}>Chargement de votre espace mobile…</Text>
    </View>
  );
}

export function EmptyState({ title, description, ctaLabel, onPressCta }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyArtShell}>
        <View style={styles.emptyArtLarge} />
        <View style={styles.emptyArtSmall}>
          <View style={[styles.emptyDot, { backgroundColor: "#F59E0B" }]} />
          <View style={[styles.emptyDot, { backgroundColor: "#38BDF8" }]} />
          <View style={[styles.emptyDot, { backgroundColor: "#84CC16" }]} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {ctaLabel ? (
        <Pressable onPress={onPressCta} style={styles.primaryButton}>
          <MaterialIcons color="#FFFFFF" name="edit-square" size={18} />
          <Text style={styles.primaryButtonLabel}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ListRow({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  onPress,
}: {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  const Container = onPress ? Pressable : View;

  return (
    <Container onPress={onPress} style={styles.listRow}>
      {leading ? <View style={styles.listLeading}>{leading}</View> : null}
      <View style={styles.listBody}>
        <Text numberOfLines={1} style={styles.listTitle}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} style={styles.listSubtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.listMetaWrap}>
        {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
        {trailing}
      </View>
    </Container>
  );
}

const metricPillToneStyles = StyleSheet.create({
  indigo: { backgroundColor: "#EEF2FF" },
  mint: { backgroundColor: "#ECFDF5" },
  amber: { backgroundColor: "#FFFBEB" },
  slate: { backgroundColor: "#F8FAFC" },
});

const avatarStatusStyles = StyleSheet.create({
  online: { backgroundColor: "#10B981" },
  busy: { backgroundColor: "#EF4444" },
  away: { backgroundColor: "#F59E0B" },
  offline: { backgroundColor: "#CBD5E1" },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F6FB",
  },
  background: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  content: {
    gap: 18,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
    paddingRight: 12,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1.1,
  },
  headerSubtitle: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 20,
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  headerActionButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderColor: "rgba(148,163,184,0.18)",
    borderRadius: 18,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  footer: {
    bottom: 22,
    left: 18,
    position: "absolute",
    right: 18,
  },
  searchField: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderColor: "rgba(148,163,184,0.22)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    color: "#0F172A",
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  chipRail: {
    gap: 10,
    paddingVertical: 2,
  },
  filterChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderColor: "rgba(203,213,225,0.72)",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
  },
  filterChipActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#C7D2FE",
  },
  filterChipLabel: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
  },
  filterChipLabelActive: {
    color: "#4338CA",
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderColor: "rgba(203,213,225,0.5)",
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    marginTop: -8,
  },
  metricPill: {
    borderRadius: 22,
    gap: 4,
    minWidth: 98,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricValue: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#1E293B",
    justifyContent: "center",
    position: "relative",
  },
  avatarLabel: {
    color: "#F8FAFC",
    fontWeight: "700",
  },
  avatarStatus: {
    borderColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 2,
    bottom: 0,
    height: 13,
    position: "absolute",
    right: 0,
    width: 13,
  },
  loadingBlock: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 64,
  },
  loadingText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  emptyArtShell: {
    alignItems: "center",
    height: 220,
    justifyContent: "center",
    width: 220,
  },
  emptyArtLarge: {
    backgroundColor: "#E5E7EB",
    borderRadius: 80,
    height: 140,
    left: 28,
    opacity: 0.9,
    position: "absolute",
    top: 26,
    width: 140,
  },
  emptyArtSmall: {
    alignItems: "center",
    backgroundColor: "#F8EEDF",
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 52,
    borderWidth: 2,
    flexDirection: "row",
    gap: 10,
    height: 104,
    justifyContent: "center",
    left: 86,
    position: "absolute",
    top: 72,
    transform: [{ rotate: "-10deg" }],
    width: 104,
  },
  emptyDot: {
    borderRadius: 999,
    height: 18,
    width: 18,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#6B7280",
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 300,
    textAlign: "center",
  },
  primaryButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#6366F1",
    borderRadius: 999,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 58,
    paddingHorizontal: 20,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  listRow: {
    alignItems: "center",
    borderBottomColor: "rgba(226,232,240,0.85)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
  },
  listLeading: {
    flexShrink: 0,
  },
  listBody: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  listSubtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
  },
  listMetaWrap: {
    alignItems: "flex-end",
    gap: 8,
  },
  listMeta: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
});
