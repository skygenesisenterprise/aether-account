import * as React from "react";

import { MaterialIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenTransition } from "@/components/mobile/screen-transition";
import { mobileTheme } from "@/components/mobile/theme";
import {
  type MainTabRoute,
  useTabScrollToTop,
} from "@/components/mobile/tab-scroll-to-top";
import { usePhoneSafeAreaInsets } from "@/components/mobile/use-phone-safe-area";

export interface MobileAction {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  onPress?: () => void;
}

export interface MobileFilter {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
}

interface MobilePlatformScreenProps {
  appearance?: "default" | "chatDark";
  actions?: MobileAction[];
  children: React.ReactNode;
  empty?: React.ReactNode;
  error?: string | null;
  filters?: MobileFilter[];
  loading?: boolean;
  onRefresh?: () => void;
  primaryAction?: MobileAction;
  refreshing?: boolean;
  route: MainTabRoute;
  showEmpty?: boolean;
  subtitle?: string;
  title: string;
  userInitials?: string;
  profileName?: string;
  profileSubtitle?: string;
}

interface MobileListRowProps {
  accent?: string;
  badge?: string | number;
  children?: React.ReactNode;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  meta?: string;
  onPress?: () => void;
  subtitle: string;
  title: string;
}

interface MobileStatPillProps {
  label: string;
  value: string;
}

interface MobileProfileAction {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  subtitle?: string;
}

const mobileProfileActions: MobileProfileAction[] = [
  { icon: "check-circle", label: "Disponible" },
  { icon: "add-circle-outline", label: "Définir un lieu de travail" },
  { icon: "edit", label: "Définir un message de statut" },
  { icon: "notifications-none", label: "Notifications", subtitle: "Activé" },
  { icon: "settings", label: "Paramètres" },
];

export function MobilePlatformScreen({
  appearance = "default",
  actions = [],
  children,
  empty,
  error,
  filters = [],
  loading,
  onRefresh,
  primaryAction,
  refreshing = false,
  route,
  showEmpty = false,
  subtitle,
  title,
  userInitials,
  profileName,
  profileSubtitle,
}: MobilePlatformScreenProps) {
  const insets = usePhoneSafeAreaInsets();
  const scrollRef = React.useRef<ScrollView | null>(null);
  const searchAction: MobileAction = { icon: "search", label: "Rechercher" };
  const headerActions: MobileAction[] = [...actions, searchAction].slice(0, 3);
  const isChatDark = appearance === "chatDark";
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const displayName = profileName ?? "Compte Aether";
  const resolvedProfileSubtitle = profileSubtitle ?? "Compte";
  const resolvedUserInitials = userInitials ?? "A";

  useTabScrollToTop(route, scrollRef);

  return (
    <ScreenTransition direction="up">
      <View style={[styles.screen, isChatDark ? styles.screenChatDark : null]}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 104 },
          ]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={mobileTheme.color.primary}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={() => setIsProfileOpen(true)} style={styles.identityRow}>
              <View style={[styles.avatar, isChatDark ? styles.avatarChatDark : null]}>
                <Text style={[styles.avatarText, isChatDark ? styles.avatarTextChatDark : null]}>{resolvedUserInitials}</Text>
              </View>
              <View style={styles.titleBlock}>
                <Text numberOfLines={1} style={[styles.title, isChatDark ? styles.titleChatDark : null]}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text numberOfLines={1} style={[styles.subtitle, isChatDark ? styles.subtitleChatDark : null]}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </Pressable>

            <View style={styles.headerActions}>
              {headerActions.map((action) => (
                <Pressable
                  accessibilityLabel={action.label}
                  hitSlop={10}
                  key={action.label}
                  onPress={action.onPress}
                  style={styles.iconButton}
                >
                  <MaterialIcons
                    color={isChatDark ? mobileTheme.color.popover : mobileTheme.color.foreground}
                    name={action.icon}
                    size={24}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {filters.length ? (
            <ScrollView
              contentContainerStyle={styles.filters}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {filters.map((filter, index) => (
                <Pressable
                  key={filter.label}
                  style={[
                    styles.filterChip,
                    isChatDark ? styles.filterChipChatDark : null,
                    index === 0 ? styles.filterChipActive : null,
                    index === 0 && isChatDark ? styles.filterChipActiveChatDark : null,
                  ]}
                >
                  <MaterialIcons
                    color={
                      index === 0
                        ? mobileTheme.color.primary
                        : isChatDark
                          ? "#A7ACB7"
                          : mobileTheme.color.mutedForeground
                    }
                    name={filter.icon}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.filterLabel,
                      isChatDark ? styles.filterLabelChatDark : null,
                      index === 0 ? styles.filterLabelActive : null,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {error ? (
            <View style={[styles.notice, isChatDark ? styles.noticeChatDark : null]}>
              <MaterialIcons color={mobileTheme.color.warning} name="error-outline" size={19} />
              <Text style={[styles.noticeText, isChatDark ? styles.noticeTextChatDark : null]}>{error}</Text>
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={mobileTheme.color.primary} />
              <Text style={[styles.loadingText, isChatDark ? styles.loadingTextChatDark : null]}>Chargement</Text>
            </View>
          ) : showEmpty && empty ? (
            empty
          ) : (
            children
          )}
        </ScrollView>

        {primaryAction ? (
          <Pressable
            onPress={primaryAction.onPress}
            style={[styles.floatingButton, isChatDark ? styles.floatingButtonChatDark : null]}
          >
            <MaterialIcons color={mobileTheme.color.primaryForeground} name={primaryAction.icon} size={22} />
            <Text style={styles.floatingButtonText}>{primaryAction.label}</Text>
          </Pressable>
        ) : null}

        {isProfileOpen ? (
          <View pointerEvents="box-none" style={styles.profileOverlayRoot}>
            <Pressable onPress={() => setIsProfileOpen(false)} style={styles.profileOverlayBackdrop} />
            <View style={[styles.profileSheet, { paddingTop: insets.top + 12 }]}>
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{resolvedUserInitials}</Text>
                </View>
                <View style={styles.profileHeaderCopy}>
                  <View style={styles.profileHeaderLine}>
                    <Text numberOfLines={1} style={styles.profileName}>
                      {displayName}
                    </Text>
                    <MaterialIcons color="#8E96A6" name="chevron-right" size={18} />
                  </View>
                  <Text numberOfLines={1} style={styles.profileRole}>
                    {resolvedProfileSubtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.profileActions}>
                {mobileProfileActions.map((action) => (
                  <Pressable key={action.label} style={styles.profileActionRow}>
                    <View style={styles.profileActionIcon}>
                      <MaterialIcons
                        color={action.label === "Disponible" ? mobileTheme.color.success : mobileTheme.color.popover}
                        name={action.icon}
                        size={22}
                      />
                    </View>
                    <View style={styles.profileActionCopy}>
                      <Text style={styles.profileActionLabel}>{action.label}</Text>
                      {action.subtitle ? <Text style={styles.profileActionSubtitle}>{action.subtitle}</Text> : null}
                    </View>
                  </Pressable>
                ))}
              </View>

              <View style={styles.profileFooter}>
                <Pressable style={styles.profileActionRow}>
                  <View style={styles.profileActionIcon}>
                    <MaterialIcons color={mobileTheme.color.popover} name="add" size={24} />
                  </View>
                  <View style={styles.profileActionCopy}>
                    <Text style={styles.profileActionLabel}>Ajouter un compte</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </ScreenTransition>
  );
}

export function MobileListSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.list}>{children}</View>
    </View>
  );
}

export function MobileListRow({
  accent = mobileTheme.color.primary,
  badge,
  children,
  icon = "chat-bubble-outline",
  meta,
  onPress,
  subtitle,
  title,
}: MobileListRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: `${accent}18` }]}>
        <MaterialIcons color={accent} name={icon} size={22} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTitleLine}>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {title}
          </Text>
          {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
        </View>
        <Text numberOfLines={2} style={styles.rowSubtitle}>
          {subtitle}
        </Text>
        {children}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function MobileStatPill({ label, value }: MobileStatPillProps) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function MobileEmptyState({
  appearance = "default",
  icon,
  label,
}: {
  appearance?: "default" | "chatDark";
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
}) {
  const isChatDark = appearance === "chatDark";
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyArtwork, isChatDark ? styles.emptyArtworkChatDark : null]}>
        <MaterialIcons color={mobileTheme.color.primary} name={icon} size={54} />
      </View>
      <Text style={[styles.emptyText, isChatDark ? styles.emptyTextChatDark : null]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.accent,
    borderColor: mobileTheme.color.popover,
    borderRadius: 999,
    borderWidth: 2,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  avatarText: {
    color: mobileTheme.color.primary,
    fontSize: 14,
    fontWeight: "900",
  },
  avatarChatDark: {
    backgroundColor: mobileTheme.color.chatSurface,
    borderColor: mobileTheme.color.chatBackground,
  },
  avatarTextChatDark: {
    color: mobileTheme.color.popover,
  },
  badge: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: mobileTheme.color.primary,
    borderRadius: 999,
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: {
    color: mobileTheme.color.primaryForeground,
    fontSize: 12,
    fontWeight: "900",
  },
  content: {
    gap: 16,
    paddingHorizontal: 16,
  },
  emptyArtwork: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.accent,
    borderRadius: 999,
    height: 118,
    justifyContent: "center",
    width: 118,
  },
  emptyState: {
    alignItems: "center",
    gap: 18,
    minHeight: 360,
    justifyContent: "center",
  },
  emptyText: {
    color: mobileTheme.color.mutedForeground,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    maxWidth: 270,
    textAlign: "center",
  },
  emptyArtworkChatDark: {
    backgroundColor: mobileTheme.color.chatSurface,
  },
  emptyTextChatDark: {
    color: "#A7ACB7",
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.popover,
    borderColor: mobileTheme.color.border,
    borderRadius: mobileTheme.radius.md,
    borderWidth: 1,
    gap: 6,
    height: 58,
    justifyContent: "center",
    minWidth: 66,
    paddingHorizontal: 10,
  },
  filterChipActive: {
    backgroundColor: mobileTheme.color.accent,
    borderColor: mobileTheme.color.border,
  },
  filterChipChatDark: {
    backgroundColor: mobileTheme.color.chatSurface,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActiveChatDark: {
    backgroundColor: "rgba(73,81,149,0.22)",
    borderColor: "rgba(73,81,149,0.34)",
  },
  filterLabel: {
    color: mobileTheme.color.mutedForeground,
    fontSize: 11,
    fontWeight: "800",
  },
  filterLabelActive: {
    color: mobileTheme.color.primary,
  },
  filterLabelChatDark: {
    color: "#A7ACB7",
  },
  filters: {
    gap: 6,
    paddingRight: 10,
  },
  floatingButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: mobileTheme.color.primary,
    borderRadius: 999,
    bottom: 94,
    flexDirection: "row",
    gap: 9,
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 22,
    position: "absolute",
    right: 16,
    ...mobileTheme.shadow.medium,
  },
  floatingButtonText: {
    color: mobileTheme.color.primaryForeground,
    fontSize: 15,
    fontWeight: "900",
  },
  floatingButtonChatDark: {
    bottom: 90,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  iconButton: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  identityRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  list: {
    backgroundColor: mobileTheme.color.popover,
    borderColor: mobileTheme.color.border,
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    ...mobileTheme.shadow.subtle,
  },
  loading: {
    alignItems: "center",
    gap: 12,
    minHeight: 340,
    justifyContent: "center",
  },
  loadingText: {
    color: mobileTheme.color.mutedForeground,
    fontSize: 14,
    fontWeight: "800",
  },
  loadingTextChatDark: {
    color: "#A7ACB7",
  },
  notice: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.warningSurface,
    borderColor: mobileTheme.color.warning,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  noticeText: {
    color: mobileTheme.color.foreground,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  noticeChatDark: {
    backgroundColor: "rgba(199,154,55,0.16)",
    borderColor: "rgba(199,154,55,0.34)",
  },
  noticeTextChatDark: {
    color: mobileTheme.color.popover,
  },
  profileActionCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileActionIcon: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  profileActionLabel: {
    color: mobileTheme.color.popover,
    fontSize: 14,
    fontWeight: "500",
  },
  profileActions: {
    gap: 2,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  profileActionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    minHeight: 44,
    paddingVertical: 8,
  },
  profileActionSubtitle: {
    color: "#97A0B1",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  profileAvatar: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.chatSurface,
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  profileAvatarText: {
    color: mobileTheme.color.popover,
    fontSize: 14,
    fontWeight: "900",
  },
  profileFooter: {
    borderTopColor: mobileTheme.color.border,
    borderTopWidth: 1,
    marginTop: 12,
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
  },
  profileHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileHeaderLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  profileName: {
    color: mobileTheme.color.popover,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  profileOverlayBackdrop: {
    backgroundColor: "rgba(0,0,0,0.34)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  profileOverlayRoot: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  profileRole: {
    color: "#97A0B1",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  profileSheet: {
    backgroundColor: mobileTheme.color.chatBackground,
    borderRightColor: "rgba(255,255,255,0.08)",
    borderRightWidth: 1,
    bottom: 0,
    left: 0,
    maxWidth: 368,
    paddingBottom: 18,
    position: "absolute",
    top: 0,
    width: "88%",
  },
  row: {
    alignItems: "flex-start",
    borderBottomColor: mobileTheme.color.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowContent: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  rowIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  rowMeta: {
    color: mobileTheme.color.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
  },
  rowSubtitle: {
    color: mobileTheme.color.mutedForeground,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  rowTitle: {
    color: mobileTheme.color.foreground,
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  rowTitleLine: {
    alignItems: "center",
    flexDirection: "row",
    minWidth: 0,
  },
  screen: {
    backgroundColor: mobileTheme.color.background,
    flex: 1,
  },
  screenChatDark: {
    backgroundColor: mobileTheme.color.chatBackground,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: mobileTheme.color.secondaryForeground,
    fontSize: 13,
    fontWeight: "900",
    paddingHorizontal: 2,
    textTransform: "uppercase",
  },
  statLabel: {
    color: mobileTheme.color.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
  },
  statPill: {
    backgroundColor: mobileTheme.color.popover,
    borderColor: mobileTheme.color.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  statValue: {
    color: mobileTheme.color.foreground,
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    color: mobileTheme.color.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
  },
  subtitleChatDark: {
    color: "#A7ACB7",
  },
  title: {
    color: mobileTheme.color.foreground,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 0,
  },
  titleChatDark: {
    color: mobileTheme.color.popover,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
});
