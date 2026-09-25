import "dotenv/config";
import express from "express";
import cors from "cors";

import { initDb } from "./src/db/db.js";

import authRouter from "./src/routes/auth.route.js";
import taskRouter from "./src/routes/task.route.js";

const app = express();

const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: true,
    message: "Task manager api is running",
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tasks", taskRouter);

try {
  await initDb();
  console.log("DB initialized");
} catch (error) {
  console.error("DB initialization failed:", error);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
