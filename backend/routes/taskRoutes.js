import express from "express";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// In-memory storage for tasks and chunks
let tasks = [];
let chunks = [];

// Create a new task
router.post("/tasks", (req, res) => {
    const { title, description, schedule } = req.body;
    if (!title || (schedule !== "today" && schedule !== "tomorrow")) {
        return res.status(400).json({ message: "Invalid task data" });
    }
    const newTask = {
        id: uuidv4(),
        title,
        description: description || "",
        schedule,
        status: "pending",
        chunkId: null,
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Retrieve tasks for today and tomorrow
router.get("/tasks", (req, res) => {
    res.json({
        today: tasks.filter((task) => task.schedule === "today" && task.status === "pending"),
        tomorrow: tasks.filter((task) => task.schedule === "tomorrow" && task.status === "pending"),
    });
});

// Update a task (e.g., mark as completed, change schedule)
router.put("/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { status, schedule } = req.body;
    const task = tasks.find((task) => task.id === id);
    if (!task) {
        return res.status(404).json({ message: "Task not found" });
    }
    if (status) task.status = status;
    if (schedule && (schedule === "today" || schedule === "tomorrow")) {
        task.schedule = schedule;
    }
    res.json(task);
});

// Delete a task
router.delete("/tasks/:id", (req, res) => {
    const { id } = req.params;
    tasks = tasks.filter((task) => task.id !== id);
    res.json({ message: "Task deleted successfully" });
});

// Create a new chunk
router.post("/chunks", (req, res) => {
    const { name, taskIds } = req.body;
    if (!name || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Invalid chunk data" });
    }
    const newChunk = {
        id: uuidv4(),
        name,
        tasks: taskIds,
    };
    chunks.push(newChunk);
    taskIds.forEach((taskId) => {
        const task = tasks.find((task) => task.id === taskId);
        if (task) task.chunkId = newChunk.id;
    });
    res.status(201).json(newChunk);
});

// Retrieve all chunks
router.get("/chunks", (req, res) => {
    res.json(chunks);
});

// Start a chunk (simulate task focus mode)
router.post("/chunks/:id/start", (req, res) => {
    const { id } = req.params;
    const chunk = chunks.find((chunk) => chunk.id === id);
    if (!chunk) {
        return res.status(404).json({ message: "Chunk not found" });
    }
    res.json({ message: "Chunk started", chunk });
});

export default router;