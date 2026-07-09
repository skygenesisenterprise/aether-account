import { apiListRequest as apiClientListRequest, apiRequest } from "./client";
import { createMeeting, startMeeting, createMeetingJoinToken as getMeetingJoinToken } from "./meetings";
import { createIdempotencyKey } from "./idempotency";
import type { CallHistoryItem } from "./types";

/**
 * Call invitation sent to another user
 */
export interface CallInvitationInput {
  toUserId: string;
  fromUserId: string;
  fromUserName: string;
  conversationId: string;
  mode: "audio" | "video";
  meetingId: string;
  token: string;
  signalingUrl: string;
}

/**
 * Call invitation received from the server
 */
export interface CallInvitation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  conversationId: string;
  mode: "audio" | "video";
  meetingId: string;
  token: string;
  signalingUrl: string;
  createdAt: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
}

/**
 * Send a call invitation to another user
 */
export async function sendCallInvitation(
  input: CallInvitationInput
): Promise<CallInvitation> {
  return apiRequest<CallInvitation, CallInvitationInput>(
    "/calls/invite",
    {
      method: "POST",
      body: input,
    }
  );
}

/**
 * Accept an incoming call
 */
export async function acceptCall(callId: string): Promise<CallInvitation> {
  return apiRequest<CallInvitation>(
    `/calls/${callId}/accept`,
    {
      method: "POST",
    }
  );
}

/**
 * Reject an incoming call
 */
export async function rejectCall(callId: string): Promise<CallInvitation> {
  return apiRequest<CallInvitation>(
    `/calls/${callId}/reject`,
    {
      method: "POST",
    }
  );
}

/**
 * Cancel an outgoing call
 */
export async function cancelCall(callId: string): Promise<CallInvitation> {
  return apiRequest<CallInvitation>(
    `/calls/${callId}/cancel`,
    {
      method: "POST",
    }
  );
}

/**
 * Get pending call invitations for a user
 */
export async function getPendingCalls(userId: string): Promise<CallInvitation[]> {
  return apiListRequest<CallInvitation>(`/calls/pending?userId=${userId}`);
}

/**
 * Create a meeting and send a call invitation to another user
 * This combines meeting creation with call invitation
 */
export async function createMeetingAndInvite(
  workspaceId: string,
  conversationId: string,
  callerId: string,
  callerName: string,
  calleeId: string,
  mode: "audio" | "video"
): Promise<{ meetingId: string; token: string; signalingUrl: string; invitation: CallInvitation }> {
  console.log("[createMeetingAndInvite] Starting with workspaceId:", workspaceId, "conversationId:", conversationId);
  
  // 1. Create a meeting
  const meetingIdempotencyKey = createIdempotencyKey(`call-${conversationId}-${Date.now()}`);
  console.log("[createMeetingAndInvite] Creating meeting...");
  const meeting = await createMeeting(
    workspaceId,
    {
      title: `Appel ${mode === "video" ? "vidéo" : "audio"} - ${conversationId}`,
      conversationId,
    },
    meetingIdempotencyKey
  );
  console.log("[createMeetingAndInvite] Meeting created:", meeting.id);

  // 2. Start the meeting
  const startIdempotencyKey = createIdempotencyKey(`start-${meeting.id}-${Date.now()}`);
  console.log("[createMeetingAndInvite] Starting meeting...");
  await startMeeting(meeting.id, startIdempotencyKey);
  console.log("[createMeetingAndInvite] Meeting started");

  // 3. Get join token for the caller
  console.log("[createMeetingAndInvite] Getting caller join token...");
  const callerCredentials = await getMeetingJoinToken(meeting.id);
  console.log("[createMeetingAndInvite] Caller token received");

  // 4. Get join token for the callee
  console.log("[createMeetingAndInvite] Getting callee join token...");
  const calleeCredentials = await getMeetingJoinToken(meeting.id);
  console.log("[createMeetingAndInvite] Callee token received");

  // 5. Send call invitation to the callee
  console.log("[createMeetingAndInvite] Sending call invitation...");
  try {
    const invitation = await sendCallInvitation({
      toUserId: calleeId,
      fromUserId: callerId,
      fromUserName: callerName,
      conversationId,
      mode,
      meetingId: meeting.id,
      token: calleeCredentials.token,
      signalingUrl: calleeCredentials.signalingUrl,
    });
    console.log("[createMeetingAndInvite] Call invitation sent:", invitation.id);
    return {
      meetingId: meeting.id,
      token: callerCredentials.token,
      signalingUrl: callerCredentials.signalingUrl,
      invitation,
    };
  } catch (error) {
    console.warn("[createMeetingAndInvite] Failed to send call invitation via API:", error);
    // Return the meeting credentials anyway, the invitation can be sent via SSE or other means
    return {
      meetingId: meeting.id,
      token: callerCredentials.token,
      signalingUrl: callerCredentials.signalingUrl,
      invitation: {
        id: `local-${Date.now()}`,
        fromUserId: callerId,
        fromUserName: callerName,
        toUserId: calleeId,
        conversationId,
        mode,
        meetingId: meeting.id,
        token: calleeCredentials.token,
        signalingUrl: calleeCredentials.signalingUrl,
        createdAt: new Date().toISOString(),
        status: "pending",
      },
    };
  }
}

/**
 * List call history for a workspace
 */
export async function listCallHistory(workspaceId: string): Promise<CallHistoryItem[]> {
  const response = await apiClientListRequest<CallHistoryItem>(`/workspaces/${workspaceId}/calls/history`);
  return response.data;
}

// Helper function for list requests
async function apiListRequest<T>(url: string): Promise<T[]> {
  const response = await apiRequest<{ data: T[] }>(url);
  return response.data;
}
