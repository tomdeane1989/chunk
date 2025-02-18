// ----------------------------------------
// File: src/components/tasks/TaskForm.jsx
// ----------------------------------------
import React from "react";

function TaskForm({ newTask, setNewTask, addTask }) {
  return (
    <div style={styles.container}>
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Enter task..."
        style={styles.input}
      />
      <button onClick={() => addTask("today")} style={styles.button}>
        Add to Today
      </button>
      <button onClick={() => addTask("tomorrow")} style={styles.button}>
        Add to Tomorrow
      </button>
    </div>
  );
}

export default TaskForm;

const styles = {
  container: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
  },
  button: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
  },
};