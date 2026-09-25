import express from "express";

import {
  createUser,
  getCurrentUser,
  getUsers,
  loginUser,
  removeUser,
} from "../controller/auth.controller.js";

import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";

const authRouter = express.Router();

authRouter.post("/login", loginUser);
authRouter.post("/users", authMiddleware, requireAdmin, createUser);
authRouter.get("/me", authMiddleware, getCurrentUser);
authRouter.get("/users", authMiddleware, requireAdmin, getUsers);
authRouter.delete("/users/:id", authMiddleware, requireAdmin, removeUser);

export default authRouter;
