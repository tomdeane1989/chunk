import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes.js";
import "./scheduler/dailyReset.js"; // This starts the cron job.
import { checkAndRunReset } from "./scheduler/dailyReset.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Use the task and chunk routes
app.use("/api", taskRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // At server start, check if today's reset has run; if not, run it.
    await checkAndRunReset();
  });