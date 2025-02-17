import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Use the task and chunk routes
app.use("/api", taskRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));