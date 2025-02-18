// frontend/src/components/FocusMode.jsx
import React, { useState, useEffect } from "react";
import api from "../api";

function FocusMode({ chunk, stopFocusMode, onChunkComplete }) {
  // Initial time in seconds (20 minutes)
  const initialTime = 1200;
  const [timer, setTimer] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Local array of tasks with additional fields
  const [focusTasks, setFocusTasks] = useState([]);

  useEffect(() => {
    const initial = chunk.tasks.map((t) => ({
      ...t,
      isCompleted: t.status === "completed",
      completedAt: null,
    }));
    setFocusTasks(initial);
  }, [chunk]);

  useEffect(() => {
    let interval = null;
    if (isRunning && !isPaused && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    if (timer === 0) {
      handleStop();
      handleFinishChunk();
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused, timer]);

  // Display the remaining time
  const displayMinutes = Math.floor(timer / 60);
  const displaySeconds = String(timer % 60).padStart(2, "0");

  function togglePause() {
    setIsPaused((prev) => !prev);
  }

  function handleStop() {
    setIsRunning(false);
    stopFocusMode();
  }

  // Toggle a task's completion and capture the elapsed time (in seconds)
  async function toggleTaskCompletion(taskId) {
    setFocusTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const newStatus = !t.isCompleted;
          const elapsed = initialTime - timer;
          // Update the backend with the new status and elapsed time
          api.put(`/tasks/${taskId}`, {
            status: newStatus ? "completed" : "pending",
            completedAt: newStatus ? elapsed : null,
          });
          return {
            ...t,
            isCompleted: newStatus,
            completedAt: newStatus ? elapsed : null,
          };
        }
        return t;
      })
    );
  }

  // Helper: format seconds into mm:ss
  function formatCompletionTime(elapsed) {
    if (!elapsed) return "";
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // Unchunk a task (remove it from this chunk)
  async function unchunkTask(taskId) {
    try {
      await api.put(`/tasks/${taskId}`, { chunk_id: null });
      setFocusTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Failed to unchunk task:", err);
    }
  }

  // Finish the chunk: complete any open tasks, send total elapsed time, then exit Focus Mode.
  async function handleFinishChunk() {
    for (let t of focusTasks) {
      if (!t.isCompleted) {
        const elapsed = initialTime - timer;
        await api.put(`/tasks/${t.id}`, { status: "completed", completedAt: elapsed });
      }
    }
    const totalElapsed = initialTime - timer;
    if (onChunkComplete) onChunkComplete(chunk.id, totalElapsed);
    stopFocusMode();
  }

  return (
    <div style={focusStyles.page}>
      <div style={focusStyles.container}>
        <h2>Focus Mode: {chunk.name}</h2>
        <div style={focusStyles.timerRow}>
          <div style={focusStyles.clock}>
            {displayMinutes}:{displaySeconds}
          </div>
          <div>
            <button style={focusStyles.button} onClick={togglePause}>
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button style={focusStyles.button} onClick={handleStop}>
              Stop
            </button>
          </div>
        </div>
        <h4>Tasks in this chunk:</h4>
        <ul style={focusStyles.taskList}>
          {focusTasks.map((task) => (
            <li
              key={task.id}
              style={{
                ...focusStyles.taskItem,
                ...(task.isCompleted ? focusStyles.completedTask : {}),
              }}
            >
              <span onClick={() => toggleTaskCompletion(task.id)} style={{ flex: 1 }}>
                {task.title}
              </span>
              <span>
                {task.isCompleted && formatCompletionTime(task.completedAt)}
              </span>
              <button style={focusStyles.taskButton} onClick={() => unchunkTask(task.id)}>
                Unchunk
              </button>
            </li>
          ))}
        </ul>
        <button style={focusStyles.finishButton} onClick={handleFinishChunk}>
          Finish Chunk <span role="img" aria-label="flag">🏁</span>
        </button>
      </div>
    </div>
  );
}

export default FocusMode;

const focusStyles = {
  page: {
    backgroundColor: "#343541",
    color: "#ECECF1",
    minHeight: "100vh",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    maxWidth: "600px",
    width: "100%",
    textAlign: "center",
  },
  timerRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "2rem",
  },
  clock: {
    fontSize: "4rem",
    fontWeight: "bold",
    margin: "1rem 0",
    background: "linear-gradient(45deg, #5f57ff, #10A37F)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  button: {
    backgroundColor: "#5f57ff",
    border: "none",
    color: "#fff",
    borderRadius: "4px",
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    cursor: "pointer",
    margin: "0.5rem",
  },
  finishButton: {
    backgroundColor: "#10A37F",
    border: "none",
    color: "#fff",
    borderRadius: "4px",
    padding: "0.75rem 1.25rem",
    fontSize: "1.1rem",
    cursor: "pointer",
    marginTop: "1rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  taskList: {
    listStyle: "none",
    padding: 0,
    marginTop: "1rem",
    textAlign: "left",
  },
  taskItem: {
    backgroundColor: "#444654",
    padding: "0.5rem 1rem",
    marginBottom: "0.5rem",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  completedTask: {
    backgroundColor: "#2A2B2E",
    textDecoration: "line-through",
    opacity: 0.7,
  },
  taskButton: {
    backgroundColor: "#5f57ff",
    border: "none",
    color: "#fff",
    borderRadius: "4px",
    padding: "0.3rem 0.6rem",
    fontSize: "0.9rem",
    cursor: "pointer",
    marginLeft: "0.5rem",
  },
};