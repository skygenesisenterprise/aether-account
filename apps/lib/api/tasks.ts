import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { PaginatedResponse, Task, TaskComment } from "@/lib/api/types";

export interface TaskFilters {
  [key: string]: string | number | boolean | undefined;
}

export interface TaskInput extends Record<string, unknown> {}
export interface TaskCommentInput extends Record<string, unknown> {}

function buildSearchParams(values?: TaskFilters): string {
  const params = new URLSearchParams();
  Object.entries(values ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });
  return params.size > 0 ? `?${params.toString()}` : "";
}

export function listTasks(workspaceId: string, filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
  return apiListRequest<Task>(`/workspaces/${workspaceId}/tasks${buildSearchParams(filters)}`);
}

export function createTask(workspaceId: string, input: TaskInput): Promise<Task> {
  return apiRequest<Task, TaskInput>(`/workspaces/${workspaceId}/tasks`, {
    method: "POST",
    body: input,
  });
}

export function getTask(taskId: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${taskId}`);
}

export function updateTask(taskId: string, input: TaskInput): Promise<Task> {
  return apiRequest<Task, TaskInput>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteTask(taskId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function listTaskComments(taskId: string): Promise<TaskComment[]> {
  const response = await apiListRequest<TaskComment>(`/tasks/${taskId}/comments`);
  return response.data;
}

export function createTaskComment(taskId: string, input: TaskCommentInput): Promise<TaskComment> {
  return apiRequest<TaskComment, TaskCommentInput>(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: input,
  });
}

export function updateTaskOrder(taskId: string, input: TaskInput): Promise<Task> {
  return apiRequest<Task, TaskInput>(`/tasks/${taskId}/order`, {
    method: "PATCH",
    body: input,
  });
}
