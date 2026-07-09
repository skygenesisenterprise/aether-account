import { apiListRequest, apiRequest } from "@/lib/api/client";
import type { Document } from "@/lib/api/types";

export interface DocumentInput extends Record<string, unknown> {}

export async function listDocuments(workspaceId: string): Promise<Document[]> {
  const response = await apiListRequest<Document>(`/workspaces/${workspaceId}/documents`);
  return response.data;
}

export function createDocument(workspaceId: string, input: DocumentInput): Promise<Document> {
  return apiRequest<Document, DocumentInput>(`/workspaces/${workspaceId}/documents`, {
    method: "POST",
    body: input,
  });
}

export function getDocument(documentId: string): Promise<Document> {
  return apiRequest<Document>(`/documents/${documentId}`);
}

export function updateDocument(documentId: string, input: DocumentInput): Promise<Document> {
  return apiRequest<Document, DocumentInput>(`/documents/${documentId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteDocument(documentId: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/documents/${documentId}`, {
    method: "DELETE",
  });
}
