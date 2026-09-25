import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/role.middleware.js";
import { createUser, getCurrentUser, getUsers, loginUser, removeUser } from "../controller/auth.controller.js";

const authRouter = express.Router();

authRouter.post("/create-users",authMiddleware,requireAdmin,createUser);
authRouter.post("/login",loginUser);
authRouter.get("/me",authMiddleware,getCurrentUser);
authRouter.get("/users", authMiddleware, requireAdmin, getUsers);
authRouter.delete("/users/:id",authMiddleware,requireAdmin,removeUser);

export default authRouter;