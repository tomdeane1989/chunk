// ----------------------------------------
// File: src/components/chunks/ChunkForm.jsx
// ----------------------------------------
import React from "react";

function ChunkForm({ chunkName, setChunkName, selectedTasks, createChunk }) {
  return (
    <div style={styles.container}>
      <h3>Create a Chunk</h3>
      <input
        type="text"
        value={chunkName}
        onChange={(e) => setChunkName(e.target.value)}
        placeholder="Chunk Name..."
        style={styles.input}
      />
      <button onClick={createChunk} style={styles.button}>
        Create Chunk
      </button>
      {selectedTasks.length === 0 && (
        <p style={{ fontSize: "0.9rem", color: "#555" }}>
          (No tasks selected)
        </p>
      )}
    </div>
  );
}

export default ChunkForm;

const styles = {
  container: {
    marginTop: "1.5rem",
    textAlign: "center",
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
    marginRight: "0.5rem",
  },
  button: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
  },
};