import api from "./axios";

export const getBooks = (params) => api.get("/api/v1/books", { params });

export const getBook = (id) => api.get(`/api/v1/books/${id}`);

export const requestDownload = (bookId, payload = {}) =>
  api.post(`/api/v1/books/${bookId}/request-download`, payload);

export const downloadBook = (bookId) =>
  api.get(`/api/v1/books/${bookId}/download`);
