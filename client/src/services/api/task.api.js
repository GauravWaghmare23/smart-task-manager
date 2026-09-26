import api from "./api";

export const createTask = async (taskData) => {
  const response = await api.post("/tasks", taskData);
  return response.data;
};

export const getMyTasks = async (filters = {}) => {
  const response = await api.get("/tasks/mine", { params: filters });
  return response.data;
};

export const getAllTasks = async (filters = {}) => {
  const response = await api.get("/tasks", { params: filters });
  return response.data;
};

export const getTaskById = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};
