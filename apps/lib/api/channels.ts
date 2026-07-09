import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { Channel } from "@/lib/api/types";

export interface ChannelInput {
  teamId?: string;
  name: string;
  slug?: string;
  description?: string;
  type?: string;
  visibility?: string;
}

export async function listChannels(workspaceId: string): Promise<Channel[]> {
  const response = await apiListRequest<Channel>(`/workspaces/${workspaceId}/channels`);
  return response.data;
}

export function createChannel(workspaceId: string, input: ChannelInput): Promise<Channel> {
  return apiRequest<Channel, ChannelInput>(`/workspaces/${workspaceId}/channels`, {
    method: "POST",
    body: input,
  });
}

export function getChannel(channelId: string): Promise<Channel> {
  return apiRequest<Channel>(`/channels/${channelId}`);
}

export function updateChannel(channelId: string, input: ChannelInput): Promise<Channel> {
  return apiRequest<Channel, ChannelInput>(`/channels/${channelId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteChannel(channelId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/channels/${channelId}`, {
    method: "DELETE",
  });
}
