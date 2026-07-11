const API_BASE_URL = import.meta.env.VITE_API_URL ||
  "https://evident-0e7j.onrender.com";

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
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend unavailable");
  }

  return response.json();
};

export const requestUploadUrl = async (
  payload: UploadUrlRequest
): Promise<UploadUrlResponse> => {
  const response = await fetch(`${API_BASE_URL}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`upload-url ${response.status}: ${detail}`);
  }

  return response.json() as Promise<UploadUrlResponse>;
};