// backend/scheduler/dailyReset.js
import cron from "node-cron";
import fs from "fs/promises";
import path from "path";
import db from "../config/db.js";

// Path for our persistent file that stores the last reset date.
const LAST_RESET_FILE = path.join(process.cwd(), "lastReset.json");

// Helper: Get the last reset date (formatted as YYYY-MM-DD)
async function getLastResetDate() {
  try {
    const data = await fs.readFile(LAST_RESET_FILE, "utf-8");
    const obj = JSON.parse(data);
    return obj.date; // Expecting a string like "2025-02-17"
  } catch (err) {
    return null; // File doesn't exist or error reading it.
  }
}

// Helper: Set the last reset date
async function setLastResetDate(dateStr) {
  const obj = { date: dateStr };
  await fs.writeFile(LAST_RESET_FILE, JSON.stringify(obj));
}

// The daily reset logic: Reset pending tasks and remove open chunks.
async function dailyReset() {
  try {
    // 1. Reset tasks: set chunk_id to null for any tasks that are still pending.
    await db("tasks")
      .where("status", "pending")
      .update({ chunk_id: null });
    
    // 2. Remove open chunks: delete chunks that are still pending.
    await db("chunks")
      .where("status", "pending")
      .del();

    console.log("Daily reset completed at", new Date().toISOString());
  } catch (err) {
    console.error("Error during daily reset:", err);
  }
}

// This function checks if today's reset has run; if not, it runs the reset.
export async function checkAndRunReset() {
  const lastResetDate = await getLastResetDate();
  // Format today as YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  if (lastResetDate !== today) {
    console.log("No reset recorded for today. Running daily reset...");
    await dailyReset();
    await setLastResetDate(today);
  } else {
    console.log("Daily reset already run today. Last reset date:", lastResetDate);
  }
}

// Schedule a cron job to run at midnight (server local time)
// The cron expression "0 0 * * *" means "At 00:00 (midnight) every day".
cron.schedule("0 0 * * *", async () => {
  console.log("Cron job triggered at", new Date().toISOString());
  await dailyReset();
  // Update the last reset date
  const today = new Date().toISOString().split("T")[0];
  await setLastResetDate(today);
});