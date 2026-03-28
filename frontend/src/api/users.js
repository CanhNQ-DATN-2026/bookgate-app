import api from "./axios";

export const getMyProfile = () => api.get("/api/v1/users/me");
export const updateMyProfile = (data) => api.put("/api/v1/users/me", data);
export const getMyRequests = () => api.get("/api/v1/users/me/requests");
export const getMyDownloadHistory = () => api.get("/api/v1/users/me/download-history");

// Book upload requests
export const createUploadRequest = (data) => api.post("/api/v1/upload-requests", data);
export const getMyUploadRequests = () => api.get("/api/v1/upload-requests");
