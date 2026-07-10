import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export const requestUploadUrl = async (
    filename: string,
    contentType: string
) => {
    const response = await axios.post(`${API_URL}/upload-url`, {
        filename,
        contentType,
    });

    return response.data;
};

