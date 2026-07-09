import { createMeeting, createMeetingJoinToken, startMeeting } from "./meetings";
import { createIdempotencyKey } from "./idempotency";
import type { Meeting, MeetingJoinCredentials } from "./types";

/**
 * Create or get a meeting for a conversation and generate join credentials
 */
export async function createOrGetMeetingJoinCredentials(
  workspaceId: string,
  conversationId: string,
  userId: string,
  userName: string,
  mode: "audio" | "video" = "video"
): Promise<MeetingJoinCredentials & { meetingId: string }> {
  // First, try to create a meeting for this conversation
  const meetingTitle = `Appel ${mode === "video" ? "vidéo" : "audio"} - Conversation ${conversationId}`;
  
  try {
    // Create a new meeting
    const meeting = await createMeeting(workspaceId, {
      title: meetingTitle,
      conversationId,
    }, createIdempotencyKey(`meeting-${conversationId}-${Date.now()}`));

    // Start the meeting to create a session
    const startPayload = await startMeeting(meeting.id);
    
    // Get join token for the current user
    const credentials = await createMeetingJoinToken(meeting.id);

    return {
      ...credentials,
      meetingId: meeting.id,
    };
  } catch (error) {
    console.error("Failed to create meeting:", error);
    throw error;
  }
}

/**
 * Generate a room name from a conversation ID
 */
export function generateRoomName(conversationId: string): string {
  // Use a consistent room name based on conversation ID
  return `conv-${conversationId}`;
}

/**
 * Generate a participant identity from a user ID
 */
export function generateParticipantIdentity(userId: string): string {
  return `user-${userId}`;
}

/**
 * Generate a participant name from a user object
 */
export function generateParticipantName(user: { id: string; name?: string; displayName?: string }): string {
  return user.name || user.displayName || `User ${user.id}`;
}

/**
 * Check if a meeting exists and is active for a conversation
 */
export async function getActiveMeetingForConversation(
  workspaceId: string,
  conversationId: string
): Promise<Meeting | null> {
  // This would be implemented by querying the API
  // For now, we'll return null and let the caller create a new meeting
  return null;
}
