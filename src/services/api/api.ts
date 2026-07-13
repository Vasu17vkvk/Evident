import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  "https://evident-0e7j.onrender.com";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log("Authorization Header:", config.headers.Authorization);
  return config;
});

export interface UploadUrlRequest {
  filename: string;
  contentType: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
  fileUrl: string;
  contentType?: string;
}

export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

export const requestUploadUrl = async (
  payload: UploadUrlRequest
): Promise<UploadUrlResponse> => {
  const response = await api.post("/upload-url", payload);
  return response.data;
};

export interface DocumentCreateRequest {
  filename: string;
  objectKey: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  pages?: number;
  wordCount?: number;
  status?: string;
}

export interface DocumentCreateResponse {
  documentId: string;
}

export const persistDocument = async (
  payload: DocumentCreateRequest
): Promise<DocumentCreateResponse> => {
  const response = await api.post("/documents", payload);
  return response.data;
};

export interface DocumentUpdateRequest {
  status?: string;
  pages?: number;
  wordCount?: number;
  pagesContent?: string[];
}

export const updatePersistedDocument = async (
  documentId: string,
  payload: DocumentUpdateRequest
): Promise<void> => {
  await api.put(`/documents/${documentId}`, payload);
};

export interface InsightsResponse {
  documentId: string;
  executiveSummary: string;
  documentPurpose: string;
  facts: Array<{
    label: string;
    value: string;
    change: string;
    icon: string;
  }>;
  entities: {
    people: Array<{ name: string; role?: string; mentions: number }>;
    organizations: Array<{ name: string; role?: string; mentions: number }>;
    locations: Array<{ name: string; mentions: number }>;
  };
  timeline: Array<{
    date: string;
    title: string;
    description: string;
    page: number;
  }>;
  generationTimestamp: string;
  modelUsed: string;
}

export const fetchInsights = async (
  documentId: string,
  model?: string
): Promise<InsightsResponse> => {
  const url = model ? `/insights/${documentId}?model=${model}` : `/insights/${documentId}`;
  const response = await api.get(url);
  return response.data;
};

export interface DocumentLibraryResponse {
  documents: Array<{
    documentId: string;
    filename: string;
    uploadDate: string;
    fileSize: number;
    pageCount: number;
    thumbnail?: string;
    userId?: string;
    favorite?: boolean;
    lastOpenedAt?: string;
  }>;
  totalCount: number;
  page: number;
  limit: number;
}

export const fetchDocuments = async (
  search?: string,
  page = 1,
  limit = 20,
  sortBy?: string,
  order?: string,
  favorite?: boolean
): Promise<DocumentLibraryResponse> => {
  let url = `/documents?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  if (sortBy) {
    url += `&sortBy=${encodeURIComponent(sortBy)}`;
  }
  if (order) {
    url += `&order=${encodeURIComponent(order)}`;
  }
  if (favorite !== undefined) {
    url += `&favorite=${favorite}`;
  }
  const response = await api.get(url);
  return response.data;
};

export interface NoteResponse {
  noteId: string;
  title: string;
  content: string;
  documentId?: string;
  documentName?: string;
  pageNumber?: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface NoteCreateRequest {
  title: string;
  content: string;
  documentId?: string;
  pageNumber?: number;
}

export interface NoteUpdateRequest {
  title?: string;
  content?: string;
  documentId?: string;
  pageNumber?: number;
}

export const fetchNotes = async (): Promise<NoteResponse[]> => {
  const response = await api.get("/notes");
  return response.data;
};

export const createPersistedNote = async (payload: NoteCreateRequest): Promise<{ noteId: string }> => {
  const response = await api.post("/notes", payload);
  return response.data;
};

export const updatePersistedNote = async (noteId: string, payload: NoteUpdateRequest): Promise<void> => {
  await api.put(`/notes/${noteId}`, payload);
};

export const deletePersistedNote = async (noteId: string): Promise<void> => {
  await api.delete(`/notes/${noteId}`);
};

export const deletePersistedDocument = async (documentId: string): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};

export const fetchDocumentDownloadUrl = async (documentId: string): Promise<{ downloadUrl: string }> => {
  const response = await api.get(`/documents/${documentId}/download`);
  return response.data;
};

export interface DashboardStats {
  documentsUploaded: number;
  totalQueries: number;
  citationsGenerated: number;
  avgResponseTime: number;
}

export interface DashboardRecentDocument {
  documentId: string;
  filename: string;
  uploadDate: string;
  fileSize: number;
  pageCount: number;
  favorite: boolean;
  lastOpenedAt?: string;
  queryCount: number;
  citationCount: number;
}

export interface DashboardActivity {
  activityId: string;
  type: string;
  action: string;
  documentName?: string;
  documentId?: string;
  createdAt: string;
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

export const fetchDashboardRecentDocuments = async (): Promise<DashboardRecentDocument[]> => {
  const response = await api.get("/dashboard/recent-documents");
  return response.data;
};

export const fetchDashboardRecentActivity = async (): Promise<DashboardActivity[]> => {
  const response = await api.get("/dashboard/recent-activity");
  return response.data;
};

export const trackCitationCopy = async (documentId: string): Promise<void> => {
  await api.post(`/documents/${documentId}/citation`);
};