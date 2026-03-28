import api from "./axios";

// Users
export const adminGetUsers = () => api.get("/api/v1/admin/users");
export const adminGetUser = (id) => api.get(`/api/v1/admin/users/${id}`);

// Books
export const adminCreateBook = (formData) =>
  api.post("/api/v1/admin/books", formData, { headers: { "Content-Type": "multipart/form-data" } });

export const adminUpdateBook = (id, formData) =>
  api.put(`/api/v1/admin/books/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });

export const adminDeleteBook = (id) => api.delete(`/api/v1/admin/books/${id}`);

// Download requests
export const adminGetRequests = (status) =>
  api.get("/api/v1/admin/download-requests", { params: status ? { status } : {} });

export const adminApproveRequest = (id, review_note) =>
  api.patch(`/api/v1/admin/download-requests/${id}/approve`, { review_note });

export const adminDeclineRequest = (id, review_note) =>
  api.patch(`/api/v1/admin/download-requests/${id}/decline`, { review_note });

// Download history
export const adminGetDownloadHistory = () => api.get("/api/v1/admin/download-history");

// Book upload requests
export const adminGetUploadRequests = (status) =>
  api.get("/api/v1/admin/upload-requests", { params: status ? { status } : {} });

export const adminApproveUploadRequest = (id, admin_note) =>
  api.patch(`/api/v1/admin/upload-requests/${id}/approve`, { admin_note });

export const adminDeclineUploadRequest = (id, admin_note) =>
  api.patch(`/api/v1/admin/upload-requests/${id}/decline`, { admin_note });
