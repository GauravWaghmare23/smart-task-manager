import { db } from "../db/db.js";
import { randomUUID } from "node:crypto";

export const createTask = async ({
  title,
  description,
  priority,
  assignedTo,
  createdBy,
  dependencies = [],
}) => {
  if (!title) {
    throw new Error("Task title is required");
  }

  if (!priority) {
    throw new Error("Task priority is required");
  }

  const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];

  if (!allowedPriorities.includes(priority)) {
    throw new Error("Invalid task priority");
  }

  const assignedUser = db.data.users.find((user) => user.id === assignedTo);

  if (!assignedUser) {
    throw new Error("Assigned user not found");
  }

  const createdByUser = db.data.users.find(
    (user) => user.id === createdBy && user.role === "ADMIN",
  );

  if (!createdByUser) {
    throw new Error("Only admin users can create tasks");
  }

  const checkAllDependenciesExists = dependencies.every((dependencyId) => {
    return db.data.tasks.some((task) => task.id === dependencyId);
  });

  if (!checkAllDependenciesExists) {
    throw new Error("One or more dependency tasks do not exist");
  }

  const task = {
    id: randomUUID(),
    title: title,
    description: description || "",
    priority: priority,
    status: "TODO",
    assignedTo: assignedTo,
    createdBy: createdBy,
    dependencies: dependencies,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.data.tasks.push(task);

  await db.write();

  return task;
};

export const getTasks = async (userId, filters = {}) => {
  if (!userId) {
    throw new Error("User Id is required.");
  }

  const { priority, status } = filters;

  let tasks = db.data.tasks.filter((task) => task.assignedTo === userId);

  if (priority) {
    tasks = tasks.filter((task) => task.priority === priority);
  }

  if (status) {
    tasks = tasks.filter((task) => task.status === status);
  }

  return tasks;
};

export const getAllTasks = async (filters = {}) => {
  const { priority, status } = filters;

  let tasks = db.data.tasks;

  if (priority) {
    tasks = tasks.filter((task) => task.priority === priority);
  }

  if (status) {
    tasks = tasks.filter((task) => task.status === status);
  }

  return tasks;
};

export const getTaskById = async (taskId, user) => {
  if (!taskId) {
    throw new Error("Task ID is required");
  }

  const task = db.data.tasks.find((task) => task.id === taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  if (user.role !== "ADMIN" && user.userId !== task.assignedTo) {
    throw new Error("You are not allowed to view this task");
  }

  return task;
};

export const deleteTask = async (taskId) => {
  if (!taskId) {
    throw new Error("Task ID is required");
  }

  const existingTask = db.data.tasks.find((task) => task.id === taskId);

  if (!existingTask) {
    throw new Error("Task not found");
  }

  const dependentTask = db.data.tasks.find((task) =>
    task.dependencies.includes(taskId),
  );

  if (dependentTask) {
    throw new Error("Cannot delete task because another task depends on it");
  }

  db.data.tasks = db.data.tasks.filter((task) => task.id !== taskId);

  await db.write();

  return existingTask;
};

export const updateStatus = async (taskId, status, user) => {
  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  if (!status) {
    throw new Error("Task status is required.");
  }

  const allowedStatuses = ["TODO", "IN_PROGRESS", "DONE"];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid task status");
  }

  const task = db.data.tasks.find((task) => task.id === taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  if (user.role !== "ADMIN" && task.assignedTo !== user.userId) {
    throw new Error("You are not allowed to update this task");
  }

  if (status === "DONE") {
    const allDependenciesCompleted = task.dependencies.every((dependencyId) => {
      const dependencyTask = db.data.tasks.find(
        (task) => task.id === dependencyId,
      );

      return dependencyTask && dependencyTask.status === "DONE";
    });

    if (!allDependenciesCompleted) {
      throw new Error(
        "Cannot mark task as DONE because one or more dependencies are not completed",
      );
    }
  }

  task.status = status;
  task.updatedAt = new Date().toISOString();

  await db.write();

  return task;
};
