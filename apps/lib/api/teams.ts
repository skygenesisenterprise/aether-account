import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { Team } from "@/lib/api/types";

export interface TeamInput {
  name: string;
  description?: string;
}

export async function listTeams(workspaceId: string): Promise<Team[]> {
  const response = await apiListRequest<Team>(`/workspaces/${workspaceId}/teams`);
  return response.data;
}

export function createTeam(workspaceId: string, input: TeamInput): Promise<Team> {
  return apiRequest<Team, TeamInput>(`/workspaces/${workspaceId}/teams`, {
    method: "POST",
    body: input,
  });
}

export function getTeam(teamId: string): Promise<Team> {
  return apiRequest<Team>(`/teams/${teamId}`);
}

export function updateTeam(teamId: string, input: TeamInput): Promise<Team> {
  return apiRequest<Team, TeamInput>(`/teams/${teamId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteTeam(teamId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/teams/${teamId}`, {
    method: "DELETE",
  });
}
