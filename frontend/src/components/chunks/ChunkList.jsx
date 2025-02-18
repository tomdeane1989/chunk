// ----------------------------------------
// File: src/components/chunks/ChunkList.jsx
// ----------------------------------------
import React from "react";

function ChunkList({ chunks, startChunk, toggleTaskStatus }) {
  return (
    <div style={styles.container}>
      <h3>Existing Chunks</h3>
      {chunks.map((chunk) => (
        <div key={chunk.id} style={styles.chunkCard}>
          <h4>{chunk.name}</h4>
          <ul style={styles.taskList}>
            {chunk.tasks.map((task) => (
              <li key={task.id} style={styles.taskItem}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => toggleTaskStatus(task)}
                  />
                  {task.title}
                </label>
              </li>
            ))}
          </ul>
          <button onClick={() => startChunk(chunk.id)} style={styles.button}>
            Start
          </button>
        </div>
      ))}
    </div>
  );
}

export default ChunkList;

const styles = {
  container: {
    marginTop: "1.5rem",
    textAlign: "center",
  },
  chunkCard: {
    border: "1px solid #ccc",
    padding: "1rem",
    margin: "1rem 0",
  },
  taskList: {
    listStyle: "none",
    paddingLeft: 0,
    marginBottom: "0.5rem",
  },
  taskItem: {
    textAlign: "left",
    marginBottom: "0.25rem",
  },
  button: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
  },
};