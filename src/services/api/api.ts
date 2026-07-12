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
  }>;
  totalCount: number;
  page: number;
  limit: number;
}

export const fetchDocuments = async (
  search?: string,
  page = 1,
  limit = 20
): Promise<DocumentLibraryResponse> => {
  let url = `/documents?page=${page}&limit=${limit}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }
  const response = await api.get(url);
  return response.data;
};