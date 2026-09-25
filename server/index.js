import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./src/db/db.js";

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

await initDb()
  .then(() => console.log("DB initialized"))
  .catch((error) => {
    console.error(`DB error: ${error}`);
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
