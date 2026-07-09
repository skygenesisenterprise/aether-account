import * as React from "react";

import { authApi } from "@/lib/api/auth";
import { getMe } from "@/lib/api/me";
import { listNotifications } from "@/lib/api/notifications";
import { listConversations } from "@/lib/api/conversations";
import { listMessages } from "@/lib/api/messages";
import { listWorkspaceMembers } from "@/lib/api/members";
import { listTeams } from "@/lib/api/teams";
import { listChannels } from "@/lib/api/channels";
import { listMeetings } from "@/lib/api/meetings";
import { listCallHistory } from "@/lib/api/calls";
import { listContacts } from "@/lib/api/contacts";
import { getMockModeEnabled } from "@/lib/api/config";
import { ApiError, getUserFacingError } from "@/lib/api/errors";
import { resolveWorkspaceMemberPresenceStatus, type PresenceStatus } from "@/lib/presence";
import { listWorkspaces } from "@/lib/api/workspaces";
import type {
  CallHistoryItem,
  Channel,
  Contact,
  Conversation,
  Meeting,
  Message,
  Notification,
  Team,
  User,
  Workspace,
  WorkspaceMember,
} from "@/lib/api/types";

export interface MobileSessionUserSeed {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface MobileWorkspaceContext {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
}

export interface ActivityFeedItem {
  id: string;
  title: string;
  body: string;
  category: string;
  unread: boolean;
  timestampLabel: string;
}

export interface ConversationPreviewItem {
  id: string;
  title: string;
  excerpt: string;
  timestampLabel: string;
  unreadCount: number;
  kind: "direct" | "team" | "group";
  presence: "online" | "busy" | "away" | "offline";
  participantsLabel: string;
  memberIds: string[];
  subtitle: string;
}

export interface ConversationMessageItem {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  body: string;
  mine: boolean;
  createdAt?: string;
  timestampLabel: string;
}

export interface ConversationViewerData {
  context: MobileWorkspaceContext;
  conversation: ConversationPreviewItem;
  members: Array<{
    id: string;
    name: string;
    initials: string;
    role: string;
    presence: "online" | "busy" | "away" | "offline";
  }>;
  messages: ConversationMessageItem[];
}

export interface TeamWorkspaceItem {
  id: string;
  name: string;
  description: string;
  channelsCount: number;
  membersCount: number;
  accent: string;
  latestActivity: string;
}

export interface CalendarMeetingItem {
  id: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  status: "live" | "upcoming" | "done";
  location: string;
  startsAt: string;
  endsAt?: string;
  dayOfMonth: number;
}

export interface CallFeedItem {
  id: string;
  title: string;
  subtitle: string;
  direction: "Entrant" | "Sortant" | "Manqué";
  mode: "audio" | "video";
  timestampLabel: string;
  durationLabel: string;
}

export interface MobileCallSummary {
  title: string;
  value: string;
}

const DEFAULT_WORKSPACE_ID = "workspace-aether-mobile";
const DEFAULT_WORKSPACE_NAME = "Aether Meet";
const DEFAULT_WORKSPACE_SLUG = "aether-meet";

const teamAccents = ["#4F46E5", "#0EA5E9", "#14B8A6", "#F59E0B", "#EC4899"];

let workspaceContextPromise: Promise<MobileWorkspaceContext> | null = null;
let workspaceContextCacheKey: string | null = null;

function shouldUseFallbackData(): boolean {
  return getMockModeEnabled();
}

function getWorkspaceContextCacheKey(sessionUser?: MobileSessionUserSeed): string {
  return sessionUser?.email ?? "anonymous";
}

function formatMobileApiError(error: unknown): Error {
  if (error instanceof ApiError) {
    if (error.kind === "unauthenticated") {
      authApi.clearTokens();
    }

    const suffix = [error.code, error.requestId ? `req ${error.requestId}` : null].filter(Boolean).join(" · ");
    return new Error(`${getUserFacingError(error)}${suffix ? ` (${suffix})` : ""}`);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Impossible de charger les données depuis l'API mobile.");
}

function assertFallbackMode(error: unknown): asserts error is never {
  if (!shouldUseFallbackData()) {
    throw formatMobileApiError(error);
  }
}

function resolveSessionName(sessionUser?: MobileSessionUserSeed): string {
  const fullName = [sessionUser?.firstName, sessionUser?.lastName].filter(Boolean).join(" ").trim();
  if (fullName) {
    return fullName;
  }

  const emailBase = sessionUser?.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (emailBase) {
    return emailBase.replace(/\b\w/g, (part) => part.toUpperCase());
  }

  return "Membre Aether";
}

function formatRelativeLabel(value?: string): string {
  if (!value) {
    return "Maintenant";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Maintenant";
  }

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes <= 1) return "A l'instant";
  if (diffMinutes < 60) return `${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} h`;
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(date);
}

function getWorkspaceMemberPresence(member?: WorkspaceMember): PresenceStatus {
  return resolveWorkspaceMemberPresenceStatus({
    presenceStatus: member?.presenceStatus,
    status: member?.status,
    lastSeenAt: member?.lastSeenAt,
  }) ?? "offline";
}

function mapNotificationCategory(notification: Notification): string {
  if (notification.type.includes("meeting")) return "Réunion";
  if (notification.type.includes("team")) return "Équipe";
  if (notification.type.includes("message")) return "Mention";
  return "Système";
}

function buildConversationParticipantEntries(
  conversation: Conversation,
  membersById: Map<string, WorkspaceMember>
): Array<{ userId?: string; displayName?: string; email?: string }> {
  if (conversation.participants?.length) {
    return conversation.participants.map((participant) => ({
      userId: participant.userId,
      displayName: participant.displayName,
      email: participant.email,
    }));
  }

  return (
    conversation.memberIds?.map((memberId) => {
      const member = membersById.get(memberId);
      return {
        userId: memberId,
        displayName: member?.displayName,
        email: member?.email,
      };
    }) ?? []
  );
}

function buildConversationTitle(
  conversation: Conversation,
  currentUserId: string,
  currentUserEmail: string,
  membersById: Map<string, WorkspaceMember>
): string {
  if (conversation.name?.trim()) {
    return conversation.name.trim();
  }

  const participantNames = buildConversationParticipantEntries(conversation, membersById)
    .filter((participant) => participant.userId !== currentUserId)
    .filter((participant) => participant.email?.toLowerCase() !== currentUserEmail.toLowerCase())
    .map((participant) => participant.displayName?.trim() || participant.email?.trim() || participant.userId || "")
    .filter(Boolean);

  const filtered = [...new Set(participantNames)];
  return filtered.slice(0, 3).join(", ") || "Conversation";
}

function buildConversationKind(conversation: Conversation): "direct" | "team" | "group" {
  if (conversation.type === "dm") return "direct";
  if (conversation.channelId) return "team";
  return "group";
}

function buildConversationPresence(
  conversation: Conversation,
  currentUserId: string,
  membersById: Map<string, WorkspaceMember>
) {
  if (conversation.type !== "dm") {
    return "online" as const;
  }

  const otherParticipantId = conversation.memberIds?.find((memberId) => memberId !== currentUserId);
  return getWorkspaceMemberPresence(membersById.get(otherParticipantId ?? ""));
}

function getMemberDisplayName(member?: WorkspaceMember): string | undefined {
  return member?.displayName?.trim() || member?.email?.split("@")[0];
}

function getInitials(value: string): string {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "??"
  );
}

function buildConversationSubtitle(
  conversation: Conversation,
  currentUserId: string,
  membersById: Map<string, WorkspaceMember>
): string {
  if (conversation.type === "dm") {
    const memberId = conversation.memberIds?.find((id) => id !== currentUserId) ?? conversation.memberIds?.find((id) => membersById.has(id));
    const member = membersById.get(memberId ?? "");
    return member?.role ?? "Conversation directe";
  }

  const memberCount = Math.max(conversation.memberIds?.length ?? conversation.participants?.length ?? 0, 2);
  const onlineCount =
    conversation.memberIds?.filter((memberId) => getWorkspaceMemberPresence(membersById.get(memberId)) === "online").length ?? 0;
  return `${memberCount} membres${onlineCount > 0 ? ` · ${onlineCount} en ligne` : ""}`;
}

function mapConversationPreview(
  conversation: Conversation,
  membersById: Map<string, WorkspaceMember>,
  currentUserId: string,
  currentUserEmail: string,
  latestMessage: Message | null,
  index: number
): ConversationPreviewItem {
  const kind = buildConversationKind(conversation);
  const memberIds = conversation.memberIds ?? conversation.participants?.map((participant) => participant.userId) ?? [];
  const subtitle = buildConversationSubtitle(conversation, currentUserId, membersById);

  return {
    id: conversation.id,
    title: buildConversationTitle(conversation, currentUserId, currentUserEmail, membersById),
    excerpt: latestMessage?.content?.trim() || "Aucun message recent dans cette conversation.",
    timestampLabel: formatRelativeLabel(latestMessage?.createdAt ?? conversation.updatedAt),
    unreadCount: index === 0 ? 3 : index === 1 ? 1 : 0,
    kind,
    presence: buildConversationPresence(conversation, currentUserId, membersById),
    participantsLabel: kind === "direct" ? "Direct" : `${Math.max(memberIds.length, 2)} membres`,
    memberIds,
    subtitle,
  };
}

function mapMeetingStatus(status: string): "live" | "upcoming" | "done" {
  if (status === "started" || status === "active") return "live";
  if (status === "scheduled" || status === "pending") return "upcoming";
  return "done";
}

function formatMeetingTime(meeting: Meeting): string {
  const start = meeting.startedAt ?? meeting.createdAt;
  const end = meeting.endedAt;
  const startLabel = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(start));

  if (!end) return startLabel;

  const endLabel = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(end));
  return `${startLabel} - ${endLabel}`;
}

function formatMeetingDate(meeting: Meeting): string {
  const start = meeting.startedAt ?? meeting.createdAt;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(start));
}

function formatCallDuration(durationSeconds?: number): string {
  if (!durationSeconds || durationSeconds <= 0) {
    return "Aucune duree";
  }

  const minutes = Math.floor(durationSeconds / 60);
  if (minutes <= 0) return "< 1 min";
  return `${minutes} min`;
}

function getStringField(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getNumberField(source: Record<string, unknown>, key: string): number | undefined {
  const value = source[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getBooleanField(source: Record<string, unknown>, key: string): boolean {
  return source[key] === true;
}

function formatDirection(item: CallHistoryItem): "Entrant" | "Sortant" | "Manqué" {
  if (getBooleanField(item, "missed")) return "Manqué";
  const direction = getStringField(item, "direction");
  if (direction === "outbound" || direction === "outgoing") return "Sortant";
  return "Entrant";
}

function buildCallTitle(item: CallHistoryItem, contacts: Contact[]): string {
  const candidates = [
    getStringField(item, "contactName"),
    getStringField(item, "participantName"),
    getStringField(item, "calleeName"),
    getStringField(item, "callerName"),
    getStringField(item, "name"),
    getStringField(item, "title"),
    getStringField(item, "phoneNumber"),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      const match = contacts.find((contact) => contact.name === candidate || contact.email === candidate);
      return match?.name ?? candidate;
    }
  }

  return "Contact";
}

function buildFallbackContext(sessionUser?: MobileSessionUserSeed): MobileWorkspaceContext {
  const currentUserName = resolveSessionName(sessionUser);
  return {
    workspaceId: DEFAULT_WORKSPACE_ID,
    workspaceName: DEFAULT_WORKSPACE_NAME,
    workspaceSlug: DEFAULT_WORKSPACE_SLUG,
    currentUserId: sessionUser?.email ?? "mobile@aether.app",
    currentUserName,
    currentUserEmail: sessionUser?.email ?? "mobile@aether.app",
  };
}

function buildFallbackNotifications(): ActivityFeedItem[] {
  return [
    {
      id: "notif-1",
      title: "Réunion produit déplacée",
      body: "Le point roadmap passe à 14:30 avec l'équipe mobile et la plateforme.",
      category: "Réunion",
      unread: true,
      timestampLabel: "12 min",
    },
    {
      id: "notif-2",
      title: "@mention dans Lancement mobile",
      body: "Sarah attend votre validation sur la navigation des cinq onglets principaux.",
      category: "Mention",
      unread: true,
      timestampLabel: "28 min",
    },
    {
      id: "notif-3",
      title: "Canal Incident Infra",
      body: "Les checks LiveKit sont revenus au vert après redémarrage du worker.",
      category: "Équipe",
      unread: false,
      timestampLabel: "09:15",
    },
    {
      id: "notif-4",
      title: "Brief comité hebdo",
      body: "Le document de préparation a été partagé dans le canal Direction.",
      category: "Système",
      unread: false,
      timestampLabel: "Hier",
    },
  ];
}

function buildFallbackConversations(): ConversationPreviewItem[] {
  return [
    {
      id: "conv-1",
      title: "Design mobile",
      excerpt: "On verrouille le fond clair, les cards blanches et l'accent indigo pour la V1.",
      timestampLabel: "08:45",
      unreadCount: 4,
      kind: "team",
      presence: "online",
      participantsLabel: "8 membres",
      memberIds: [],
      subtitle: "8 membres · canal",
    },
    {
      id: "conv-2",
      title: "Sarah Martin",
      excerpt: "Je t'ai laissé les retours de navigation pour l'écran Conversations.",
      timestampLabel: "08:12",
      unreadCount: 1,
      kind: "direct",
      presence: "busy",
      participantsLabel: "Direct",
      memberIds: [],
      subtitle: "Conversation directe",
    },
    {
      id: "conv-3",
      title: "Incident LiveKit",
      excerpt: "Le transport WebRTC a repris, on peut rouvrir les appels entrants.",
      timestampLabel: "Hier",
      unreadCount: 0,
      kind: "group",
      presence: "away",
      participantsLabel: "14 membres",
      memberIds: [],
      subtitle: "14 membres · groupe",
    },
  ];
}

function buildFallbackTeams(): TeamWorkspaceItem[] {
  return [
    {
      id: "team-1",
      name: "Produit",
      description: "Roadmap, design system, adoption et retours utilisateurs.",
      channelsCount: 6,
      membersCount: 18,
      accent: teamAccents[0],
      latestActivity: "3 canaux actifs ce matin",
    },
    {
      id: "team-2",
      name: "Engineering",
      description: "Backend, mobile, web app et infrastructure temps reel.",
      channelsCount: 9,
      membersCount: 26,
      accent: teamAccents[1],
      latestActivity: "2 revues de code urgentes",
    },
    {
      id: "team-3",
      name: "Direction",
      description: "Pilotage hebdo, partenaires, budget et risques operationnels.",
      channelsCount: 4,
      membersCount: 9,
      accent: teamAccents[4],
      latestActivity: "Prochaine revue a 17:00",
    },
  ];
}

function buildFallbackMeetings(): CalendarMeetingItem[] {
  return [
    {
      id: "meeting-1",
      title: "Daily mobile Aether Meet",
      dateLabel: "Aujourd'hui",
      timeLabel: "09:30 - 09:45",
      status: "live",
      location: "Canal Mobile / LiveKit",
      startsAt: new Date(new Date().setHours(9, 30, 0, 0)).toISOString(),
      endsAt: new Date(new Date().setHours(9, 45, 0, 0)).toISOString(),
      dayOfMonth: new Date().getDate(),
    },
    {
      id: "meeting-2",
      title: "Sync produit + design",
      dateLabel: "Aujourd'hui",
      timeLabel: "14:30 - 15:15",
      status: "upcoming",
      location: "Salle Polaris",
      startsAt: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
      endsAt: new Date(new Date().setHours(15, 15, 0, 0)).toISOString(),
      dayOfMonth: new Date().getDate(),
    },
    {
      id: "meeting-3",
      title: "Revue securite workspace",
      dateLabel: "Demain",
      timeLabel: "11:00 - 12:00",
      status: "upcoming",
      location: "Visio confiance",
      startsAt: new Date(new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(11, 0, 0, 0)).toISOString(),
      endsAt: new Date(new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(12, 0, 0, 0)).toISOString(),
      dayOfMonth: new Date(Date.now() + 24 * 60 * 60 * 1000).getDate(),
    },
  ];
}

function buildFallbackCalls(): { items: CallFeedItem[]; summary: MobileCallSummary[] } {
  return {
    items: [
      {
        id: "call-1",
        title: "Sarah Martin",
        subtitle: "Validation maquette mobile",
        direction: "Entrant",
        mode: "video",
        timestampLabel: "Aujourd'hui, 08:58",
        durationLabel: "18 min",
      },
      {
        id: "call-2",
        title: "War room infra",
        subtitle: "Ticket LiveKit #241",
        direction: "Manqué",
        mode: "audio",
        timestampLabel: "Aujourd'hui, 07:41",
        durationLabel: "Aucune duree",
      },
      {
        id: "call-3",
        title: "Direction",
        subtitle: "Brief hebdomadaire",
        direction: "Sortant",
        mode: "video",
        timestampLabel: "Hier, 17:10",
        durationLabel: "42 min",
      },
    ],
    summary: [
      { title: "Aujourd'hui", value: "12 appels" },
      { title: "Manqués", value: "2" },
      { title: "Visio", value: "7" },
    ],
  };
}

async function fetchWorkspaceContext(sessionUser?: MobileSessionUserSeed): Promise<MobileWorkspaceContext> {
  const fallback = buildFallbackContext(sessionUser);

  try {
    const [workspaces, me] = await Promise.all([listWorkspaces(), getMe()]);
    const workspace = workspaces.find((item) => item.id === me.workspaceId) ?? workspaces[0];

    if (!workspace) {
      throw new Error("No workspace returned by API.");
    }

    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      currentUserId: me.id,
      currentUserName: me.displayName ?? resolveSessionName(sessionUser),
      currentUserEmail: me.email ?? fallback.currentUserEmail,
    };
  } catch (error) {
    assertFallbackMode(error);
    return fallback;
  }
}

export async function getMobileWorkspaceContext(
  sessionUser?: MobileSessionUserSeed
): Promise<MobileWorkspaceContext> {
  const cacheKey = getWorkspaceContextCacheKey(sessionUser);
  if (workspaceContextCacheKey !== cacheKey) {
    workspaceContextPromise = null;
    workspaceContextCacheKey = cacheKey;
  }

  if (!workspaceContextPromise) {
    workspaceContextPromise = fetchWorkspaceContext(sessionUser);
  }

  try {
    return await workspaceContextPromise;
  } catch (error) {
    workspaceContextPromise = null;
    assertFallbackMode(error);
    return buildFallbackContext(sessionUser);
  }
}

export async function loadActivityFeed(sessionUser?: MobileSessionUserSeed): Promise<{
  context: MobileWorkspaceContext;
  items: ActivityFeedItem[];
}> {
  const context = await getMobileWorkspaceContext(sessionUser);

  const response = await listNotifications({ limit: 24 });
  const items = response.data.map((notification) => ({
    id: notification.id,
    title: notification.title,
    body: notification.body,
    category: mapNotificationCategory(notification),
    unread: !notification.readAt,
    timestampLabel: formatRelativeLabel(notification.createdAt),
  }));

  if (items.length === 0 && shouldUseFallbackData()) {
    return { context, items: buildFallbackNotifications() };
  }

  return { context, items };
}

export async function loadChatHub(sessionUser?: MobileSessionUserSeed): Promise<{
  context: MobileWorkspaceContext;
  items: ConversationPreviewItem[];
}> {
  const context = await getMobileWorkspaceContext(sessionUser);

  const [members, conversations] = await Promise.all([
    listWorkspaceMembers(context.workspaceId),
    listConversations(context.workspaceId),
  ]);
  const membersById = new Map(members.map((member) => [member.userId, member]));
  const messagesByConversation = await Promise.all(
    conversations.map(async (conversation) => {
      try {
        const response = await listMessages(conversation.id, { limit: 1 });
        return [conversation.id, response.data[0] ?? null] as const;
      } catch {
        return [conversation.id, null] as const;
      }
    })
  );
  const messageMap = new Map(messagesByConversation);
  const items = [...conversations]
    .sort((left, right) => {
      const leftTimestamp = messageMap.get(left.id)?.createdAt ?? left.updatedAt ?? left.createdAt;
      const rightTimestamp = messageMap.get(right.id)?.createdAt ?? right.updatedAt ?? right.createdAt;
      return new Date(rightTimestamp).getTime() - new Date(leftTimestamp).getTime();
    })
    .slice(0, 8)
    .map((conversation, index) =>
      mapConversationPreview(
        conversation,
        membersById,
        context.currentUserId,
        context.currentUserEmail,
        messageMap.get(conversation.id) ?? null,
        index
      )
    );

  if (items.length === 0 && shouldUseFallbackData()) {
    return { context, items: buildFallbackConversations() };
  }

  return { context, items };
}

export async function loadChatConversation(
  conversationId: string,
  sessionUser?: MobileSessionUserSeed
): Promise<ConversationViewerData> {
  const context = await getMobileWorkspaceContext(sessionUser);
  const [members, conversations, messagesResponse] = await Promise.all([
    listWorkspaceMembers(context.workspaceId),
    listConversations(context.workspaceId),
    listMessages(conversationId, { limit: 50 }),
  ]);
  const membersById = new Map(members.map((member) => [member.userId, member]));
  const conversation = conversations.find((item) => item.id === conversationId);

  if (!conversation) {
    throw new Error("Conversation introuvable.");
  }

  const messages = [...messagesResponse.data].sort((left, right) => {
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
  const latestMessage: Message | null = messages[messages.length - 1] ?? null;
  const preview = mapConversationPreview(
    conversation,
    membersById,
    context.currentUserId,
    context.currentUserEmail,
    latestMessage,
    0
  );

  return {
    context,
    conversation: preview,
    members: preview.memberIds.map((memberId) => {
      const member = membersById.get(memberId);
      const name = getMemberDisplayName(member) ?? memberId;
      return {
        id: memberId,
        name,
        initials: getInitials(name),
        role: member?.role ?? "Membre",
        presence: getWorkspaceMemberPresence(member),
      };
    }),
    messages: messages.map((message) => {
      const member = membersById.get(message.authorId);
      const authorName = getMemberDisplayName(member) ?? (message.authorId === context.currentUserId ? context.currentUserName : message.authorId);
      return {
        id: message.id,
        authorId: message.authorId,
        authorName,
        authorInitials: getInitials(authorName),
        body: message.content,
        mine: message.authorId === context.currentUserId,
        createdAt: message.createdAt,
        timestampLabel: formatRelativeLabel(message.createdAt),
      };
    }),
  };
}

export async function loadTeamsHub(sessionUser?: MobileSessionUserSeed): Promise<{
  context: MobileWorkspaceContext;
  items: TeamWorkspaceItem[];
}> {
  const context = await getMobileWorkspaceContext(sessionUser);

  const [teams, channels, members] = await Promise.all([
    listTeams(context.workspaceId),
    listChannels(context.workspaceId),
    listWorkspaceMembers(context.workspaceId),
  ]);
  const items = teams.map((team, index) => {
    const teamChannels = channels.filter((channel) => channel.teamId === team.id);
    return {
      id: team.id,
      name: team.name,
      description: team.description || "Espace de coordination d'equipe.",
      channelsCount: teamChannels.length,
      membersCount: members.length,
      accent: teamAccents[index % teamAccents.length],
      latestActivity:
        teamChannels[0]?.name
          ? `Dernier canal actif: ${teamChannels[0].name}`
          : "Aucun canal configure pour le moment",
    };
  });

  if (items.length === 0 && shouldUseFallbackData()) {
    return { context, items: buildFallbackTeams() };
  }

  return { context, items };
}

export async function loadCalendarHub(sessionUser?: MobileSessionUserSeed): Promise<{
  context: MobileWorkspaceContext;
  items: CalendarMeetingItem[];
}> {
  const context = await getMobileWorkspaceContext(sessionUser);

  const meetings = await listMeetings(context.workspaceId);
  const items = meetings.slice(0, 10).map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    dateLabel: formatMeetingDate(meeting),
    timeLabel: formatMeetingTime(meeting),
    status: mapMeetingStatus(meeting.status),
    location: meeting.conversationId ? `Conversation ${meeting.conversationId}` : "Salle Aether",
    startsAt: meeting.startedAt ?? meeting.createdAt,
    endsAt: meeting.endedAt,
    dayOfMonth: new Date(meeting.startedAt ?? meeting.createdAt).getDate(),
  }));

  if (items.length === 0 && shouldUseFallbackData()) {
    return { context, items: buildFallbackMeetings() };
  }

  return { context, items };
}

export async function loadCallsHub(sessionUser?: MobileSessionUserSeed): Promise<{
  context: MobileWorkspaceContext;
  items: CallFeedItem[];
  summary: MobileCallSummary[];
}> {
  const context = await getMobileWorkspaceContext(sessionUser);

  const [callHistory, contacts] = await Promise.all([
    listCallHistory(context.workspaceId),
    listContacts(context.workspaceId).catch(() => []),
  ]);

  const items = callHistory.slice(0, 12).map((item) => ({
    id: item.id,
    title: buildCallTitle(item, contacts),
    subtitle: getStringField(item, "title") || getStringField(item, "participantName") || "Historique des appels",
    direction: formatDirection(item),
    mode: getBooleanField(item, "video") ? ("video" as const) : ("audio" as const),
    timestampLabel: formatRelativeLabel(getStringField(item, "startedAt") ?? getStringField(item, "createdAt")),
    durationLabel: formatCallDuration(getNumberField(item, "durationSeconds")),
  }));

  if (items.length === 0 && shouldUseFallbackData()) {
    const fallback = buildFallbackCalls();
    return { context, items: fallback.items, summary: fallback.summary };
  }

  return {
    context,
    items,
    summary: [
      { title: "Historique", value: String(items.length) },
      { title: "Manqués", value: String(items.filter((item) => item.direction === "Manqué").length) },
      { title: "Vidéo", value: String(items.filter((item) => item.mode === "video").length) },
    ],
  };
}

export function useMobileResource<T>(
  loader: () => Promise<T>,
  dependencies: React.DependencyList
): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const result = await loader();
        if (!cancelled) {
          setData(result);
        }
      } catch (caughtError) {
        if (!cancelled) {
          const message = caughtError instanceof Error ? caughtError.message : "Impossible de charger le contenu mobile.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, loading, error };
}
