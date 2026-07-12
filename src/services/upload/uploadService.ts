import { api } from "../api/api";

export const requestUploadUrl = async (
    filename: string,
    contentType: string
) => {
    const response = await api.post("/upload-url", {
        filename,
        contentType,
    });

    return response.data;
};

