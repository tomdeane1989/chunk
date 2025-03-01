// ----------------------------------------
// File: backend/routes/taskRoutes.js
// ----------------------------------------
import express from "express";
import db from "../config/db.js"; // <-- Your Knex instance
const router = express.Router();

// Create a new task
router.post("/tasks", async (req, res) => {
  const { title, description, schedule } = req.body;
  if (!title || (schedule !== "today" && schedule !== "tomorrow")) {
    return res.status(400).json({ message: "Invalid task data" });
  }

  try {
    const [newTask] = await db("tasks")
      .insert({
        title,
        description: description || "",
        schedule,
      })
      .returning("*");
    return res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Retrieve tasks for today and tomorrow
router.get("/tasks", async (req, res) => {
  try {
    const allTasks = await db("tasks").where("status", "pending");
    // Separate into "today" and "tomorrow"
    const today = allTasks.filter((t) => t.schedule === "today");
    const tomorrow = allTasks.filter((t) => t.schedule === "tomorrow");

    return res.json({ today, tomorrow });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Update a task
router.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { chunk_id, status, schedule } = req.body;

  try {
    const task = await db("tasks").where("id", id).first();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Build updateData object
    const updateData = {};

    // Only set chunk_id if it’s explicitly provided (could be null)
    if (typeof chunk_id !== "undefined") {
      updateData.chunk_id = chunk_id;
    }

    if (status) {
      updateData.status = status;
    }

    if (schedule && (schedule === "today" || schedule === "tomorrow")) {
      updateData.schedule = schedule;
    }

    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ message: "No valid fields provided for update" });
    }

    const [updatedTask] = await db("tasks")
      .where("id", id)
      .update(updateData)
      .returning("*");

    return res.json(updatedTask);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Delete a task
router.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const existingTask = await db("tasks").where("id", id).first();
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    await db("tasks").where("id", id).del();
    return res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Create a new chunk
router.post("/chunks", async (req, res) => {
  const { name, taskIds } = req.body;
  if (!name || !Array.isArray(taskIds)) {
    return res.status(400).json({ message: "Invalid chunk data" });
  }

  try {
    const [newChunk] = await db("chunks").insert({ name }).returning("*");
    // Assign tasks to this chunk if taskIds is non-empty
    if (taskIds.length > 0) {
      await db("tasks").whereIn("id", taskIds).update({ chunk_id: newChunk.id });
    }
    return res.status(201).json(newChunk);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Retrieve all chunks
router.get("/chunks", async (req, res) => {
  try {
    const chunks = await db("chunks").select("*");
    // For each chunk, fetch tasks
    const enrichedChunks = await Promise.all(
      chunks.map(async (chunk) => {
        const tasks = await db("tasks").where("chunk_id", chunk.id);
        return { ...chunk, tasks };
      })
    );
    return res.json(enrichedChunks);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Start a chunk
router.post("/chunks/:id/start", async (req, res) => {
  const { id } = req.params;
  try {
    const chunk = await db("chunks").where("id", id).first();
    if (!chunk) {
      return res.status(404).json({ message: "Chunk not found" });
    }
    // For now, just respond
    return res.json({ message: "Chunk started", chunk });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Edit a chunk
router.put("/chunks/:id", async (req, res) => {
    const { id } = req.params;
    const { name, status, completed_at } = req.body;
  
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (status) updateData.status = status;
    if (completed_at) updateData.completed_at = completed_at;
  
    const [updated] = await db("chunks").where("id", id).update(updateData).returning("*");
    return res.json(updated);
  });


// Delete a chunk
router.delete("/chunks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const existingChunk = await db("chunks").where("id", id).first();
    if (!existingChunk) {
      return res.status(404).json({ message: "Chunk not found" });
    }
    // Set tasks in this chunk to chunk_id = null
    await db("tasks").where("chunk_id", id).update({ chunk_id: null });
    // Delete chunk
    await db("chunks").where("id", id).del();
    return res.json({ message: "Chunk deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Database error" });
  }
});

export default router;