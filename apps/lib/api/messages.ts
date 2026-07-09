import { apiListRequest, apiRequest } from "@/lib/api/client";
import { createIdempotencyKey } from "@/lib/api/idempotency";
import { toCursorSearchParams, type CursorPaginationParams } from "@/lib/api/pagination";
import type { Message, MessageReaction, PaginatedResponse } from "@/lib/api/types";

export interface CreateMessageInput {
  type: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateMessageInput {
  content: string;
}

export async function listMessages(
  conversationId: string,
  pagination?: CursorPaginationParams
): Promise<PaginatedResponse<Message>> {
  const params = toCursorSearchParams(pagination);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return apiListRequest<Message>(`/conversations/${conversationId}/messages${suffix}`);
}

export function createMessage(
  conversationId: string,
  input: CreateMessageInput,
  idempotencyKey = createIdempotencyKey("message")
): Promise<Message> {
  const payload: CreateMessageInput = {
    ...input,
    metadata: {
      ...(input.metadata ?? {}),
      idempotencyKey,
    },
  };

  return apiRequest<Message, CreateMessageInput>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: payload,
    idempotencyKey,
  });
}

export function markConversationRead(conversationId: string, messageId: string): Promise<{ updated: boolean }> {
  return apiRequest<{ updated: boolean }, { messageId: string }>(`/conversations/${conversationId}/read`, {
    method: "POST",
    body: { messageId },
  });
}

export function getMessage(messageId: string): Promise<Message> {
  return apiRequest<Message>(`/messages/${messageId}`);
}

export function updateMessage(messageId: string, input: UpdateMessageInput): Promise<Message> {
  return apiRequest<Message, UpdateMessageInput>(`/messages/${messageId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteMessage(messageId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/messages/${messageId}`, {
    method: "DELETE",
  });
}

export function addReaction(messageId: string, emoji: string): Promise<MessageReaction> {
  return apiRequest<MessageReaction, { emoji: string }>(`/messages/${messageId}/reactions`, {
    method: "POST",
    body: { emoji },
  });
}

export function removeReaction(messageId: string, emoji: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`, {
    method: "DELETE",
  });
}
