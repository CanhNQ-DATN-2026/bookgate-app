import api from "./axios";

export const login = (email, password) =>
  api.post("/api/v1/auth/login", { email, password });

export const register = (full_name, email, password) =>
  api.post("/api/v1/auth/register", { full_name, email, password });

export const getMe = () => api.get("/api/v1/auth/me");
