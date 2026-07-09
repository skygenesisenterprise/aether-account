import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { PaginatedResponse, Project, ProjectMember } from "@/lib/api/types";

export interface ProjectInput extends Record<string, unknown> {}

export function listProjects(workspaceId: string): Promise<PaginatedResponse<Project>> {
  return apiListRequest<Project>(`/workspaces/${workspaceId}/projects`);
}

export function createProject(workspaceId: string, input: ProjectInput): Promise<Project> {
  return apiRequest<Project, ProjectInput>(`/workspaces/${workspaceId}/projects`, {
    method: "POST",
    body: input,
  });
}

export function getProject(projectId: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${projectId}`);
}

export function updateProject(projectId: string, input: ProjectInput): Promise<Project> {
  return apiRequest<Project, ProjectInput>(`/projects/${projectId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteProject(projectId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await apiListRequest<ProjectMember>(`/projects/${projectId}/members`);
  return response.data;
}

export function replaceProjectMembers(projectId: string, input: ProjectInput): Promise<ProjectMember[]> {
  return apiRequest<ProjectMember[], ProjectInput>(`/projects/${projectId}/members`, {
    method: "PUT",
    body: input,
  });
}
