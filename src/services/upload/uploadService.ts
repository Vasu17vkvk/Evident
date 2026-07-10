import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ||
    "https://evident-0e7j.onrender.com";

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

