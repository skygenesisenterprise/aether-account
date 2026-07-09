import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { Resource } from "@/lib/api/types";

export interface ResourceInput extends Record<string, unknown> {}

export async function listResources(workspaceId: string): Promise<Resource[]> {
  const response = await apiListRequest<Resource>(`/workspaces/${workspaceId}/resources`);
  return response.data;
}

export function createResource(workspaceId: string, input: ResourceInput): Promise<Resource> {
  return apiRequest<Resource, ResourceInput>(`/workspaces/${workspaceId}/resources`, {
    method: "POST",
    body: input,
  });
}

export function getResource(resourceId: string): Promise<Resource> {
  return apiRequest<Resource>(`/resources/${resourceId}`);
}

export function updateResource(resourceId: string, input: ResourceInput): Promise<Resource> {
  return apiRequest<Resource, ResourceInput>(`/resources/${resourceId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteResource(resourceId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/resources/${resourceId}`, {
    method: "DELETE",
  });
}
