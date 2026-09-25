import express from "express";

import {
  createTaskController,
  deleteTaskController,
  getAllTasksController,
  getTaskByIdController,
  getTasksController,
  updateTaskStatusController,
} from "../controller/task.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const taskRouter = express.Router();

taskRouter.post("/", authMiddleware, requireAdmin, createTaskController);
taskRouter.get("/mine", authMiddleware, getTasksController);
taskRouter.get("/", authMiddleware, requireAdmin, getAllTasksController);
taskRouter.get("/:id", authMiddleware, getTaskByIdController);
taskRouter.patch("/:id/status", authMiddleware, updateTaskStatusController);
taskRouter.delete("/:id", authMiddleware, requireAdmin, deleteTaskController);

export default taskRouter;
