import api from "./api";

export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post("/auth/users", userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get("/auth/users");
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/auth/users/${userId}`);
  return response.data;
};
