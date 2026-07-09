import * as React from "react";

import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useMobileAuth } from "@/components/mobile/mobile-auth-provider";
import { getMobileProfileInitials, getMobileProfileName, getMobileProfileSubtitle } from "@/components/mobile/profile-identity";
import { MobileEmptyState, MobilePlatformScreen } from "@/components/mobile/mobile-platform-shell";
import { mobileTheme } from "@/components/mobile/theme";
import { loadCalendarHub, useMobileResource, type CalendarMeetingItem } from "@/lib/mobile/meet-data";

const monthNames = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

const weekDayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;
const viewOptions = ["Jour", "Semaine", "Mois"] as const;
const filterOptions = ["Tous", "En direct", "À venir"] as const;

type CalendarView = (typeof viewOptions)[number];
type CalendarFilter = (typeof filterOptions)[number];

interface MonthCell {
  key: string;
  day: number;
  month: "previous" | "current" | "next";
  current: boolean;
  events: CalendarMeetingItem[];
}

function getToday() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStatusLabel(status: CalendarMeetingItem["status"]) {
  if (status === "live") return "En direct";
  if (status === "upcoming") return "À venir";
  return "Terminé";
}

function getStatusTone(status: CalendarMeetingItem["status"]) {
  if (status === "live") {
    return {
      badgeBackground: "rgba(58, 150, 104, 0.16)",
      badgeText: "#BCE7CC",
      cardBorder: "rgba(58, 150, 104, 0.28)",
      cardBackground: "rgba(58, 150, 104, 0.1)",
      dot: mobileTheme.color.success,
    };
  }

  if (status === "upcoming") {
    return {
      badgeBackground: "rgba(73, 81, 149, 0.2)",
      badgeText: "#D7DBFF",
      cardBorder: "rgba(132, 144, 230, 0.28)",
      cardBackground: "rgba(73, 81, 149, 0.14)",
      dot: "#7E89E8",
    };
  }

  return {
    badgeBackground: "rgba(130, 138, 152, 0.16)",
    badgeText: "#C7CDD8",
    cardBorder: "rgba(130, 138, 152, 0.24)",
    cardBackground: "rgba(130, 138, 152, 0.1)",
    dot: "#8A92A1",
  };
}

function formatMonthLabel(year: number, month: number) {
  return `${monthNames[month]} ${year}`;
}

function formatSelectedDateLabel(year: number, month: number, day: number) {
  return `${day} ${monthNames[month]} ${year}`;
}

function parseMeetingDate(item: CalendarMeetingItem) {
  const date = new Date(item.startsAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function buildMonthDays(
  year: number,
  month: number,
  selectedDate: number,
  events: CalendarMeetingItem[]
): MonthCell[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const cells: MonthCell[] = [];
  const totalCells = startOffset + daysInMonth > 35 ? 42 : 35;

  for (let index = 0; index < totalCells; index += 1) {
    const rawDay = index - startOffset + 1;

    if (rawDay < 1) {
      cells.push({
        key: `prev-${index}`,
        day: previousMonthDays + rawDay,
        month: "previous",
        current: false,
        events: [],
      });
      continue;
    }

    if (rawDay > daysInMonth) {
      cells.push({
        key: `next-${index}`,
        day: rawDay - daysInMonth,
        month: "next",
        current: false,
        events: [],
      });
      continue;
    }

    cells.push({
      key: `${year}-${month + 1}-${rawDay}`,
      day: rawDay,
      month: "current",
      current: rawDay === selectedDate,
      events: events.filter((event) => {
        const date = parseMeetingDate(event);
        return date?.getFullYear() === year && date.getMonth() === month && date.getDate() === rawDay;
      }),
    });
  }

  return cells;
}

function inSelectedRange(
  item: CalendarMeetingItem,
  view: CalendarView,
  year: number,
  month: number,
  selectedDate: number
) {
  const date = parseMeetingDate(item);
  if (!date) {
    return false;
  }

  const selected = new Date(year, month, selectedDate);
  const normalizedCurrent = normalizeDate(date);
  const normalizedSelected = normalizeDate(selected);

  if (view === "Jour") {
    return normalizedCurrent.getTime() === normalizedSelected.getTime();
  }

  if (view === "Semaine") {
    const end = new Date(normalizedSelected);
    end.setDate(end.getDate() + 6);
    return normalizedCurrent >= normalizedSelected && normalizedCurrent <= end;
  }

  return date.getFullYear() === year && date.getMonth() === month;
}

function sortMeetings(items: CalendarMeetingItem[]) {
  return [...items].sort((left, right) => {
    return new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();
  });
}

export default function CalendarScreen() {
  const { session } = useMobileAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);
  const { data, error, loading } = useMobileResource(() => loadCalendarHub(session?.user), [session?.user.email, refreshKey]);
  const today = React.useMemo(() => getToday(), []);
  const [displayedMonth, setDisplayedMonth] = React.useState(today.month);
  const [displayedYear, setDisplayedYear] = React.useState(today.year);
  const [selectedDate, setSelectedDate] = React.useState(today.day);
  const [view, setView] = React.useState<CalendarView>("Mois");
  const [filter, setFilter] = React.useState<CalendarFilter>("Tous");

  const allItems = React.useMemo(() => sortMeetings(data?.items ?? []), [data?.items]);

  const filteredItems = React.useMemo(() => {
    if (filter === "En direct") {
      return allItems.filter((item) => item.status === "live");
    }
    if (filter === "À venir") {
      return allItems.filter((item) => item.status === "upcoming");
    }
    return allItems;
  }, [allItems, filter]);

  const monthDays = React.useMemo(
    () => buildMonthDays(displayedYear, displayedMonth, selectedDate, filteredItems),
    [displayedYear, displayedMonth, selectedDate, filteredItems]
  );

  const agendaItems = React.useMemo(
    () => filteredItems.filter((item) => inSelectedRange(item, view, displayedYear, displayedMonth, selectedDate)),
    [filteredItems, view, displayedYear, displayedMonth, selectedDate]
  );

  const selectedItems = React.useMemo(
    () =>
      filteredItems.filter((item) => {
        const date = parseMeetingDate(item);
        return date?.getFullYear() === displayedYear && date.getMonth() === displayedMonth && date.getDate() === selectedDate;
      }),
    [filteredItems, displayedYear, displayedMonth, selectedDate]
  );

  function handlePreviousMonth() {
    if (displayedMonth === 0) {
      setDisplayedYear((value) => value - 1);
      setDisplayedMonth(11);
      setSelectedDate(1);
      return;
    }

    setDisplayedMonth((value) => value - 1);
    setSelectedDate(1);
  }

  function handleNextMonth() {
    if (displayedMonth === 11) {
      setDisplayedYear((value) => value + 1);
      setDisplayedMonth(0);
      setSelectedDate(1);
      return;
    }

    setDisplayedMonth((value) => value + 1);
    setSelectedDate(1);
  }

  function handleGoToToday() {
    setDisplayedYear(today.year);
    setDisplayedMonth(today.month);
    setSelectedDate(today.day);
  }

  return (
    <MobilePlatformScreen
      appearance="chatDark"
      actions={[{ icon: "more-horiz", label: "Options calendrier" }]}
      empty={<MobileEmptyState appearance="chatDark" icon="event-busy" label="Aucun événement planifié." />}
      error={error}
      loading={loading}
      onRefresh={() => setRefreshKey((value) => value + 1)}
      refreshing={loading}
      route="calendar"
      showEmpty={!loading && allItems.length === 0}
      subtitle="Agenda partagé Aether Meet"
      title="Calendrier"
      userInitials={getMobileProfileInitials(session?.user)}
      profileName={getMobileProfileName(session?.user)}
      profileSubtitle={getMobileProfileSubtitle(session?.user)}
    >
      <View style={styles.stack}>
        <View style={styles.toolbarCard}>
          <View style={styles.toolbarRow}>
            <Pressable onPress={handleGoToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Aujourd'hui</Text>
            </Pressable>

            <View style={styles.monthControls}>
              <IconButton icon="keyboard-arrow-left" label="Mois précédent" onPress={handlePreviousMonth} />
              <Text numberOfLines={1} style={styles.monthLabel}>
                {formatMonthLabel(displayedYear, displayedMonth)}
              </Text>
              <IconButton icon="keyboard-arrow-right" label="Mois suivant" onPress={handleNextMonth} />
            </View>
          </View>

          <SegmentedControl
            options={viewOptions}
            selected={view}
            onChange={(value) => setView(value)}
          />

          <SegmentedControl
            options={filterOptions}
            selected={filter}
            onChange={(value) => setFilter(value)}
          />
        </View>

        {view === "Mois" ? (
          <View style={styles.calendarCard}>
            <View style={styles.weekHeader}>
              {weekDayLabels.map((label) => (
                <Text key={label} style={styles.weekHeaderText}>
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.monthGrid}>
              {monthDays.map((cell) => (
                <Pressable
                  disabled={cell.month !== "current"}
                  key={cell.key}
                  onPress={() => {
                    if (cell.month !== "current") return;
                    setSelectedDate(cell.day);
                  }}
                  style={[
                    styles.dayCell,
                    cell.current ? styles.dayCellCurrent : null,
                    cell.month !== "current" ? styles.dayCellMuted : null,
                  ]}
                >
                  <View style={styles.dayHeader}>
                    <Text
                      style={[
                        styles.dayNumber,
                        cell.month !== "current" ? styles.dayNumberMuted : null,
                        cell.current ? styles.dayNumberCurrent : null,
                      ]}
                    >
                      {cell.day}
                    </Text>
                    {cell.events.length ? <View style={styles.dayCount}><Text style={styles.dayCountText}>{cell.events.length}</Text></View> : null}
                  </View>

                  <View style={styles.dayPreviewList}>
                    {cell.events.slice(0, 2).map((item) => {
                      const tone = getStatusTone(item.status);
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.dayPreviewPill,
                            {
                              backgroundColor: tone.cardBackground,
                              borderColor: tone.cardBorder,
                            },
                          ]}
                        >
                          <Text numberOfLines={1} style={styles.dayPreviewText}>
                            {item.timeLabel.split(" - ")[0]} {item.title}
                          </Text>
                        </View>
                      );
                    })}
                    {cell.events.length > 2 ? (
                      <Text style={styles.moreEventsText}>+{cell.events.length - 2}</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.calendarCard}>
            <View style={styles.agendaHeader}>
              <Text style={styles.sectionEyebrow}>{view}</Text>
              <Text style={styles.sectionTitle}>
                {view === "Jour" ? "Agenda du jour" : "Agenda sur 7 jours"}
              </Text>
            </View>
            <View style={styles.agendaList}>
              {agendaItems.length ? (
                agendaItems.map((item) => <MeetingCard item={item} key={item.id} />)
              ) : (
                <View style={styles.freeDayCard}>
                  <Text style={styles.freeDayTitle}>Aucun événement</Text>
                  <Text style={styles.freeDayText}>
                    La période sélectionnée ne contient aucune réunion visible avec ce filtre.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.selectionCard}>
          <View style={styles.selectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>Sélection</Text>
              <Text style={styles.selectionTitle}>
                {formatSelectedDateLabel(displayedYear, displayedMonth, selectedDate)}
              </Text>
            </View>
            <View style={styles.selectionCount}>
              <Text style={styles.selectionCountText}>{selectedItems.length}</Text>
            </View>
          </View>

          <Text style={styles.selectionSummary}>
            {selectedItems.length
              ? `${selectedItems.length} événement${selectedItems.length > 1 ? "s" : ""} sur cette journée`
              : "Aucun événement sur cette journée"}
          </Text>

          <View style={styles.selectionList}>
            {selectedItems.length ? (
              selectedItems.map((item) => <MeetingCard compact item={item} key={item.id} />)
            ) : (
              <View style={styles.freeDayCard}>
                <Text style={styles.freeDayTitle}>Journée libre</Text>
                <Text style={styles.freeDayText}>
                  Cette date reste disponible pour une réunion instantanée ou un nouveau créneau.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </MobilePlatformScreen>
  );
}

function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: readonly T[];
  selected: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segmentedButton, active ? styles.segmentedButtonActive : null]}
          >
            <Text style={[styles.segmentedButtonText, active ? styles.segmentedButtonTextActive : null]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={styles.iconButton}>
      <MaterialIcons color={mobileTheme.color.popover} name={icon} size={18} />
    </Pressable>
  );
}

function MeetingCard({ item, compact = false }: { item: CalendarMeetingItem; compact?: boolean }) {
  const tone = getStatusTone(item.status);

  return (
    <View
      style={[
        styles.meetingCard,
        compact ? styles.meetingCardCompact : null,
        {
          borderColor: tone.cardBorder,
          backgroundColor: tone.cardBackground,
        },
      ]}
    >
      <View style={styles.meetingHeader}>
        <View style={styles.meetingHeaderCopy}>
          <Text numberOfLines={2} style={styles.meetingTitle}>
            {item.title}
          </Text>
          <Text style={styles.meetingTime}>{item.timeLabel}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: tone.badgeBackground }]}>
          <Text style={[styles.statusBadgeText, { color: tone.badgeText }]}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.meetingMeta}>
        <View style={styles.metaLine}>
          <MaterialIcons color="#8E96A6" name="place" size={15} />
          <Text numberOfLines={1} style={styles.metaText}>
            {item.location}
          </Text>
        </View>
        <View style={styles.metaLine}>
          <View style={[styles.metaDot, { backgroundColor: tone.dot }]} />
          <Text numberOfLines={1} style={styles.metaText}>
            {item.dateLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  agendaHeader: {
    borderBottomColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 1,
    marginBottom: 14,
    paddingBottom: 12,
  },
  agendaList: {
    gap: 10,
  },
  calendarCard: {
    backgroundColor: mobileTheme.color.chatBackground,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    padding: 14,
    ...mobileTheme.shadow.medium,
  },
  dayCell: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
    minHeight: 78,
    padding: 8,
    width: "14.2857%",
  },
  dayCellCurrent: {
    backgroundColor: "rgba(73,81,149,0.18)",
    borderColor: "rgba(135,146,224,0.5)",
  },
  dayCellMuted: {
    opacity: 0.36,
  },
  dayCount: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 999,
    height: 16,
    justifyContent: "center",
    minWidth: 16,
    paddingHorizontal: 4,
  },
  dayCountText: {
    color: "#E7EAF0",
    fontSize: 9,
    fontWeight: "800",
  },
  dayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayNumber: {
    color: "#DDE2EA",
    fontSize: 11,
    fontWeight: "700",
  },
  dayNumberCurrent: {
    color: mobileTheme.color.white,
    fontWeight: "900",
  },
  dayNumberMuted: {
    color: "#7C8390",
  },
  dayPreviewList: {
    gap: 4,
    marginTop: 7,
  },
  dayPreviewPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 4,
  },
  dayPreviewText: {
    color: "#EEF1F5",
    fontSize: 9,
    fontWeight: "600",
    lineHeight: 11,
  },
  freeDayCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: mobileTheme.radius.lg,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: 14,
  },
  freeDayText: {
    color: "#98A0AF",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  freeDayTitle: {
    color: mobileTheme.color.popover,
    fontSize: 14,
    fontWeight: "800",
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  meetingCard: {
    borderRadius: mobileTheme.radius.lg,
    borderWidth: 1,
    padding: 14,
  },
  meetingCardCompact: {
    padding: 12,
  },
  meetingHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  meetingHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  meetingMeta: {
    gap: 7,
    marginTop: 12,
  },
  meetingTime: {
    color: "#A2AABB",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  meetingTitle: {
    color: mobileTheme.color.popover,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  metaDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  metaLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
  },
  metaText: {
    color: "#B5BCC9",
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },
  monthControls: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -3,
  },
  monthLabel: {
    color: mobileTheme.color.popover,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 8,
    textAlign: "center",
  },
  moreEventsText: {
    color: "#8F97A5",
    fontSize: 9,
    fontWeight: "700",
    paddingLeft: 4,
  },
  sectionEyebrow: {
    color: "#838B99",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: mobileTheme.color.popover,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },
  segmented: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segmentedButton: {
    alignItems: "center",
    borderRadius: 9,
    flex: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 8,
  },
  segmentedButtonActive: {
    backgroundColor: "rgba(73,81,149,0.28)",
  },
  segmentedButtonText: {
    color: "#9EA6B5",
    fontSize: 12,
    fontWeight: "700",
  },
  segmentedButtonTextActive: {
    color: mobileTheme.color.white,
  },
  selectionCard: {
    backgroundColor: mobileTheme.color.chatBackground,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    padding: 14,
    ...mobileTheme.shadow.medium,
  },
  selectionCount: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    height: 28,
    justifyContent: "center",
    minWidth: 28,
    paddingHorizontal: 8,
  },
  selectionCountText: {
    color: mobileTheme.color.popover,
    fontSize: 12,
    fontWeight: "800",
  },
  selectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectionList: {
    gap: 10,
    marginTop: 14,
  },
  selectionSummary: {
    color: "#9AA2B1",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  selectionTitle: {
    color: mobileTheme.color.popover,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  stack: {
    gap: 14,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  todayButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  todayButtonText: {
    color: mobileTheme.color.popover,
    fontSize: 12,
    fontWeight: "700",
  },
  toolbarCard: {
    backgroundColor: mobileTheme.color.chatBackground,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    ...mobileTheme.shadow.medium,
  },
  toolbarRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekHeaderText: {
    color: "#808796",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    width: "14.2857%",
  },
});
