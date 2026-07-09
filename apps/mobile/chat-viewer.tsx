import * as React from "react";

import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useMobileAuth } from "@/components/mobile/mobile-auth-provider";
import { ScreenTransition } from "@/components/mobile/screen-transition";
import { mobileTheme } from "@/components/mobile/theme";
import { usePhoneSafeAreaInsets } from "@/components/mobile/use-phone-safe-area";
import { type PresenceStatus } from "@/lib/presence";
import { loadChatConversation, useMobileResource, type ConversationMessageItem } from "@/lib/mobile/meet-data";

interface ContentSegment {
  type: "text" | "image" | "file";
  value: string;
}

interface DatedConversationItem {
  type: "separator" | "message";
  key: string;
  label?: string;
  message?: ConversationMessageItem;
}

const presenceColors: Record<PresenceStatus, string> = {
  online: mobileTheme.color.success,
  busy: mobileTheme.color.destructive,
  away: mobileTheme.color.warning,
  offline: "#8E96A6",
};

function getPresenceLabel(status: PresenceStatus) {
  if (status === "online") return "Connecté";
  if (status === "busy") return "Occupé";
  if (status === "away") return "Absent";
  return "Hors ligne";
}

function parseContent(content: string): ContentSegment[] {
  const pattern = /\[(Image|Fichier):\s*(.*?)\]/g;
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    segments.push({
      type: match[1] === "Image" ? "image" : "file",
      value: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments;
}

function getMessageDateKey(message: ConversationMessageItem): string | null {
  if (!message.createdAt) {
    return null;
  }

  const date = new Date(message.createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function formatMessageDayLabel(dateKey: string | null): string {
  if (!dateKey) {
    return "Messages récents";
  }

  const date = new Date(`${dateKey}T00:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const formatKey = (value: Date) => value.toISOString().slice(0, 10);

  if (dateKey === formatKey(today)) {
    return "Aujourd'hui";
  }

  if (dateKey === formatKey(yesterday)) {
    return "Hier";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatMessageTime(message: ConversationMessageItem): string {
  if (!message.createdAt) {
    return message.timestampLabel;
  }

  const date = new Date(message.createdAt);
  if (Number.isNaN(date.getTime())) {
    return message.timestampLabel;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildDatedItems(messages: ConversationMessageItem[]): DatedConversationItem[] {
  const items: DatedConversationItem[] = [];
  let previousDateKey: string | null = null;

  messages.forEach((message) => {
    const dateKey = getMessageDateKey(message);

    if (dateKey !== previousDateKey) {
      items.push({
        type: "separator",
        key: `separator-${dateKey ?? "unknown"}-${message.id}`,
        label: formatMessageDayLabel(dateKey),
      });
      previousDateKey = dateKey;
    }

    items.push({
      type: "message",
      key: message.id,
      message,
    });
  });

  return items;
}

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

export default function ChatViewerScreen() {
  const insets = usePhoneSafeAreaInsets();
  const params = useLocalSearchParams<{ conversationId?: string; title?: string }>();
  const { session } = useMobileAuth();
  const conversationId = typeof params.conversationId === "string" ? params.conversationId : "";
  const { data, error, loading } = useMobileResource(
    () => loadChatConversation(conversationId, session?.user),
    [conversationId, session?.user.email]
  );
  const scrollRef = React.useRef<ScrollView | null>(null);

  const datedItems = React.useMemo(() => buildDatedItems(data?.messages ?? []), [data?.messages]);

  React.useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      });
    }
  }, [datedItems.length, loading]);

  const title = data?.conversation.title ?? params.title ?? "Conversation";
  const conversationPresence = data?.conversation.presence ?? "offline";
  const subtitle = data?.conversation.kind === "direct"
    ? getPresenceLabel(conversationPresence)
    : data?.conversation.subtitle ?? "Messages";

  return (
    <ScreenTransition direction="up">
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons color={mobileTheme.color.popover} name="arrow-back" size={22} />
          </Pressable>

          <View style={styles.identity}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(title)}</Text>
              </View>
              <View style={[styles.avatarPresence, { backgroundColor: presenceColors[conversationPresence] }]} />
            </View>

            <View style={styles.titleBlock}>
              <Text numberOfLines={1} style={styles.title}>
                {title}
              </Text>
              <View style={styles.subtitleRow}>
                <View style={[styles.subtitleDot, { backgroundColor: presenceColors[conversationPresence] }]} />
                <Text numberOfLines={1} style={styles.subtitle}>
                  {subtitle}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.iconButton}>
              <MaterialIcons color={mobileTheme.color.popover} name="call" size={20} />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <MaterialIcons color={mobileTheme.color.popover} name="videocam" size={21} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={mobileTheme.color.primary} />
            <Text style={styles.loadingText}>Chargement des messages</Text>
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <MaterialIcons color={mobileTheme.color.warning} name="error-outline" size={28} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.messages, { paddingBottom: insets.bottom + 104 }]}
            showsVerticalScrollIndicator={false}
          >
            {datedItems.length ? (
              datedItems.map((item, index) => {
                if (item.type === "separator") {
                  return (
                    <View key={item.key} style={styles.separatorRow}>
                      <View style={styles.separatorLine} />
                      <Text style={styles.separatorText}>{item.label}</Text>
                      <View style={styles.separatorLine} />
                    </View>
                  );
                }

                const message = item.message!;
                const previousMessage = index > 0 && datedItems[index - 1]?.type === "message" ? datedItems[index - 1]?.message : undefined;
                const nextMessage = index < datedItems.length - 1 && datedItems[index + 1]?.type === "message" ? datedItems[index + 1]?.message : undefined;
                const startsGroup = !previousMessage || previousMessage.authorId !== message.authorId;
                const endsGroup = !nextMessage || nextMessage.authorId !== message.authorId;

                return (
                  <MessageBubble
                    endsGroup={endsGroup}
                    key={item.key}
                    message={message}
                    startsGroup={startsGroup}
                  />
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons color={mobileTheme.color.primary} name="forum" size={40} />
                <Text style={styles.emptyTitle}>Aucun message</Text>
                <Text style={styles.emptyText}>Cette conversation est prête à démarrer.</Text>
              </View>
            )}
          </ScrollView>
        )}

        <View style={[styles.composerWrap, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.composer}>
            <Pressable style={styles.attachButton}>
              <MaterialIcons color="#98A0AF" name="attach-file" size={20} />
            </Pressable>
            <TextInput
              editable={false}
              placeholder="Répondre"
              placeholderTextColor="#8F97A5"
              style={styles.input}
            />
            <Pressable style={styles.sendButton}>
              <MaterialIcons color={mobileTheme.color.primaryForeground} name="send" size={18} />
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenTransition>
  );
}

function MessageBubble({
  message,
  startsGroup,
  endsGroup,
}: {
  message: ConversationMessageItem;
  startsGroup: boolean;
  endsGroup: boolean;
}) {
  const segments = parseContent(message.body);
  const timeLabel = formatMessageTime(message);

  return (
    <View style={[styles.messageRow, message.mine ? styles.messageRowMine : null, !startsGroup ? styles.messageRowCompact : null]}>
      {!message.mine ? (
        startsGroup ? (
          <View style={styles.messageAvatar}>
            <Text style={styles.messageAvatarText}>{message.authorInitials}</Text>
          </View>
        ) : (
          <View style={styles.messageAvatarSpacer} />
        )
      ) : null}

      <View style={[styles.messageColumn, message.mine ? styles.messageColumnMine : null]}>
        {startsGroup ? (
          <View style={[styles.messageMeta, message.mine ? styles.messageMetaMine : null]}>
            {!message.mine ? (
              <Text numberOfLines={1} style={styles.author}>
                {message.authorName}
              </Text>
            ) : null}
            <Text style={styles.messageTime}>{timeLabel}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.bubble,
            message.mine ? styles.bubbleMine : styles.bubbleOther,
            !startsGroup && (message.mine ? styles.bubbleMineGrouped : styles.bubbleOtherGrouped),
            !endsGroup && (message.mine ? styles.bubbleMineContinuation : styles.bubbleOtherContinuation),
          ]}
        >
          {segments.map((segment, index) => {
            if (segment.type === "text") {
              return (
                <Text key={`${message.id}-text-${index}`} style={[styles.body, message.mine ? styles.bodyMine : null]}>
                  {segment.value}
                </Text>
              );
            }

            return (
              <View key={`${message.id}-${segment.type}-${index}`} style={[styles.attachmentCard, message.mine ? styles.attachmentCardMine : null]}>
                <View style={[styles.attachmentIcon, message.mine ? styles.attachmentIconMine : null]}>
                  <MaterialIcons
                    color={message.mine ? mobileTheme.color.primaryForeground : mobileTheme.color.popover}
                    name={segment.type === "image" ? "image" : "description"}
                    size={18}
                  />
                </View>
                <View style={styles.attachmentCopy}>
                  <Text numberOfLines={1} style={[styles.attachmentTitle, message.mine ? styles.attachmentTitleMine : null]}>
                    {segment.value}
                  </Text>
                  <Text style={[styles.attachmentSubtitle, message.mine ? styles.attachmentSubtitleMine : null]}>
                    {segment.type === "image" ? "Image" : "Fichier"}
                  </Text>
                </View>
                <MaterialIcons
                  color={message.mine ? "rgba(248,248,247,0.84)" : "#A5ADBB"}
                  name="attach-file"
                  size={18}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  attachButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 34,
  },
  attachmentCard: {
    alignItems: "center",
    backgroundColor: "#20242D",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  attachmentCardMine: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.16)",
  },
  attachmentCopy: {
    flex: 1,
    minWidth: 0,
  },
  attachmentIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  attachmentIconMine: {
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  attachmentSubtitle: {
    color: "#9CA4B3",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  attachmentSubtitleMine: {
    color: "rgba(255,255,255,0.72)",
  },
  attachmentTitle: {
    color: mobileTheme.color.popover,
    fontSize: 13,
    fontWeight: "800",
  },
  attachmentTitleMine: {
    color: mobileTheme.color.primaryForeground,
  },
  author: {
    color: "#CDD3DE",
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  avatar: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.chatSurface,
    borderRadius: 999,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  avatarPresence: {
    borderColor: mobileTheme.color.chatBackground,
    borderRadius: 999,
    borderWidth: 2,
    bottom: -1,
    height: 12,
    position: "absolute",
    right: -1,
    width: 12,
  },
  avatarText: {
    color: mobileTheme.color.popover,
    fontSize: 13,
    fontWeight: "900",
  },
  avatarWrap: {
    height: 42,
    position: "relative",
    width: 42,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  body: {
    color: mobileTheme.color.popover,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
  },
  bodyMine: {
    color: mobileTheme.color.primaryForeground,
  },
  bubble: {
    borderRadius: 18,
    maxWidth: "100%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...mobileTheme.shadow.subtle,
  },
  bubbleMine: {
    backgroundColor: mobileTheme.color.primary,
    borderBottomRightRadius: 6,
  },
  bubbleMineContinuation: {
    borderBottomRightRadius: 14,
  },
  bubbleMineGrouped: {
    borderTopRightRadius: 14,
  },
  bubbleOther: {
    backgroundColor: mobileTheme.color.chatSurface,
    borderBottomLeftRadius: 6,
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
  },
  bubbleOtherContinuation: {
    borderBottomLeftRadius: 14,
  },
  bubbleOtherGrouped: {
    borderTopLeftRadius: 14,
  },
  composer: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.chatSurface,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 50,
    paddingHorizontal: 8,
  },
  composerWrap: {
    backgroundColor: "rgba(35,36,38,0.96)",
    borderTopColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: 14,
    paddingTop: 10,
    position: "absolute",
    right: 0,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingTop: 80,
  },
  emptyText: {
    color: "#98A0AF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyTitle: {
    color: mobileTheme.color.popover,
    fontSize: 18,
    fontWeight: "900",
  },
  errorState: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    color: mobileTheme.color.popover,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.chatBackground,
    borderBottomColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  identity: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 10,
    minWidth: 0,
  },
  input: {
    color: mobileTheme.color.popover,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
  },
  loading: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
  },
  loadingText: {
    color: "#98A0AF",
    fontSize: 14,
    fontWeight: "700",
  },
  messageAvatar: {
    alignItems: "center",
    backgroundColor: "#D9DDE5",
    borderRadius: 999,
    height: 32,
    justifyContent: "center",
    marginTop: 18,
    width: 32,
  },
  messageAvatarSpacer: {
    width: 32,
  },
  messageAvatarText: {
    color: mobileTheme.color.secondaryForeground,
    fontSize: 11,
    fontWeight: "900",
  },
  messageColumn: {
    flex: 1,
    gap: 4,
    maxWidth: "88%",
  },
  messageColumnMine: {
    alignItems: "flex-end",
  },
  messageMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  messageMetaMine: {
    justifyContent: "flex-end",
  },
  messageRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  messageRowCompact: {
    marginTop: 6,
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  messageTime: {
    color: "#9BA4B4",
    fontSize: 11,
    fontWeight: "700",
  },
  messages: {
    backgroundColor: mobileTheme.color.chatBackground,
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  screen: {
    backgroundColor: mobileTheme.color.chatBackground,
    flex: 1,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: mobileTheme.color.primary,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  separatorLine: {
    backgroundColor: "rgba(255,255,255,0.10)",
    flex: 1,
    height: 1,
  },
  separatorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
    paddingVertical: 8,
  },
  separatorText: {
    color: "#7B8190",
    fontSize: 12,
    fontWeight: "700",
  },
  subtitle: {
    color: "#A6AEBE",
    fontSize: 12,
    fontWeight: "700",
  },
  subtitleDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  subtitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  title: {
    color: mobileTheme.color.popover,
    fontSize: 15,
    fontWeight: "900",
  },
  titleBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
});
