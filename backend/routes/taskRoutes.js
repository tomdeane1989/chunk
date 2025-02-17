import express from "express";
import { v4 as uuidv4 } from "uuid";
import pool from "../config/db.js";
const router = express.Router();
import db from "../config/db.js";

// In-memory storage for tasks and chunks
let tasks = [];
let chunks = [];

// Create a new task


router.post("/tasks", async (req, res) => {
    const { title, description, schedule } = req.body;
    if (!title || (schedule !== "today" && schedule !== "tomorrow")) {
        return res.status(400).json({ message: "Invalid task data" });
    }
    
    try {
        const result = await pool.query(
            "INSERT INTO tasks (title, description, schedule) VALUES ($1, $2, $3) RETURNING *",
            [title, description || "", schedule]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
});

// Retrieve tasks for today and tomorrow
router.get("/tasks", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM tasks WHERE status = 'pending'"
        );
        const tasks = result.rows;

        res.json({
            today: tasks.filter((task) => task.schedule === "today"),
            tomorrow: tasks.filter((task) => task.schedule === "tomorrow"),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
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
router.post("/chunks", async (req, res) => {
    const { name, taskIds } = req.body;
    if (!name || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ message: "Invalid chunk data" });
    }

    try {
        const [newChunk] = await db("chunks").insert({ name }).returning("*");

        // Update tasks to be part of this chunk
        await db("tasks").whereIn("id", taskIds).update({ chunk_id: newChunk.id });

        res.status(201).json(newChunk);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
});

// Retrieve all chunks
router.get("/chunks", async (req, res) => {
    try {
        const chunks = await db("chunks").select("*");
        res.json(chunks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
});

// Start a chunk (simulate task focus mode)
router.post("/chunks/:id/start", async (req, res) => {
    const { id } = req.params;
    try {
        const chunk = await db("chunks").where("id", id).first();
        if (!chunk) {
            return res.status(404).json({ message: "Chunk not found" });
        }
        res.json({ message: "Chunk started", chunk });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error" });
    }
});

export default router;