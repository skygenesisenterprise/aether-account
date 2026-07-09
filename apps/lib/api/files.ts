import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { FileRecord } from "@/lib/api/types";

export interface InitializeFileUploadInput extends Record<string, unknown> {}
export interface CompleteFileUploadInput extends Record<string, unknown> {}

export async function listFiles(workspaceId: string): Promise<FileRecord[]> {
  const response = await apiListRequest<FileRecord>(`/workspaces/${workspaceId}/files`);
  return response.data;
}

export function initializeFileUpload(workspaceId: string, input: InitializeFileUploadInput): Promise<FileRecord> {
  return apiRequest<FileRecord, InitializeFileUploadInput>(`/workspaces/${workspaceId}/files/uploads`, {
    method: "POST",
    body: input,
  });
}

export function getFile(fileId: string): Promise<FileRecord> {
  return apiRequest<FileRecord>(`/files/${fileId}`);
}

export function completeFileUpload(fileId: string, input: CompleteFileUploadInput): Promise<FileRecord> {
  return apiRequest<FileRecord, CompleteFileUploadInput>(`/files/${fileId}/complete`, {
    method: "POST",
    body: input,
  });
}

export function getFileDownloadURL(fileId: string): Promise<{ url: string }> {
  return apiRequest<{ url: string }>(`/files/${fileId}/download-url`);
}

export function deleteFile(fileId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/files/${fileId}`, {
    method: "DELETE",
  });
}
