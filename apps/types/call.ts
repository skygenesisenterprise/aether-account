import type { MeetingJoinCredentials } from "@/lib/api/types";

/**
 * Call invitation sent to a participant
 */
export interface CallInvitation {
  id: string;
  meetingId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  conversationId: string;
  mode: "audio" | "video";
  credentials: MeetingJoinCredentials;
  createdAt: Date;
  status: "pending" | "accepted" | "rejected" | "cancelled";
}

/**
 * Call notification for UI display
 */
export interface IncomingCallNotification {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  conversationId: string;
  conversationName: string;
  mode: "audio" | "video";
  meetingId: string;
  token: string;
  signalingUrl: string;
  createdAt: Date;
}

/**
 * Call state for a conversation
 */
export interface ConversationCallState {
  conversationId: string;
  hasIncomingCall: boolean;
  hasOutgoingCall: boolean;
  isInCall: boolean;
  callMode?: "audio" | "video";
}
