import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { Conversation } from "@/lib/api/types";

export interface ConversationInput {
  type: string;
  name?: string;
  memberIds?: string[];
}

export async function listConversations(workspaceId: string): Promise<Conversation[]> {
  const response = await apiListRequest<Conversation>(`/workspaces/${workspaceId}/conversations`);
  return response.data;
}

export function createConversation(workspaceId: string, input: ConversationInput): Promise<Conversation> {
  return apiRequest<Conversation, ConversationInput>(`/workspaces/${workspaceId}/conversations`, {
    method: "POST",
    body: input,
  });
}

export function getConversation(conversationId: string): Promise<Conversation> {
  return apiRequest<Conversation>(`/conversations/${conversationId}`);
}

export function updateConversation(conversationId: string, input: Pick<ConversationInput, "name">): Promise<Conversation> {
  return apiRequest<Conversation, Pick<ConversationInput, "name">>(`/conversations/${conversationId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteConversation(conversationId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/conversations/${conversationId}`, {
    method: "DELETE",
  });
}

export async function listConversationMembers(conversationId: string): Promise<any[]> {
  const response = await apiRequest<any>(`/conversations/${conversationId}/members`);
  return response.data || [];
}
