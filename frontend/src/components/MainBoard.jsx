// frontend/src/components/MainBoard.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FocusMode from "./FocusMode.jsx";

export default function MainBoard() {
  const [chunks, setChunks] = useState([]);
  const [columns, setColumns] = useState({ unChunked: [] });
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeChunk, setActiveChunk] = useState(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [createMode, setCreateMode] = useState(null);
  const [tempName, setTempName] = useState("");
  const [editingChunkId, setEditingChunkId] = useState(null);
  const [editedChunkName, setEditedChunkName] = useState("");
  const [expandedChunks, setExpandedChunks] = useState([]);
  const [bulkTasks, setBulkTasks] = useState("");
  const [showCompletedChunks, setShowCompletedChunks] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const tasksRes = await api.get("/tasks");
      const allTasks = [...tasksRes.data.today, ...tasksRes.data.tomorrow];
      const chunksRes = await api.get("/chunks");
      setChunks(chunksRes.data);
      buildColumns(allTasks, chunksRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  }

  function buildColumns(allTasks, chunkList) {
    const unchunked = allTasks.filter((t) => !t.chunk_id);
    const newCols = { unChunked: unchunked };
    chunkList.forEach((ch) => {
      newCols[ch.id] = ch.tasks || [];
    });
    setColumns(newCols);
  }

  function toggleCreateMenu() {
    setShowCreateMenu((prev) => !prev);
    setCreateMode(null);
    setTempName("");
  }

  function selectCreateMode(mode) {
    setCreateMode(mode);
  }

  async function handleCreateTask() {
    if (!tempName.trim()) return;
    await api.post("/tasks", {
      title: tempName,
      schedule: "today",
    });
    setTempName("");
    setCreateMode(null);
    setShowCreateMenu(false);
    fetchData();
  }

  async function handleCreateChunk() {
    const today = new Date().toISOString().split("T")[0];
    const todaysChunks = chunks.filter((chunk) => {
      if (!chunk.created_at) return false;
      const chunkDate = chunk.created_at.split("T")[0];
      return chunkDate === today;
    });
    const autoName = `Chunk ${todaysChunks.length + 1}`;
    await api.post("/chunks", {
      name: autoName,
      taskIds: [],
    });
    setShowCreateMenu(false);
    fetchData();
  }

  async function handleBulkAdd() {
    const lines = bulkTasks.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    for (let line of lines) {
      await api.post("/tasks", {
        title: line,
        schedule: "today",
      });
    }
    setBulkTasks("");
    fetchData();
  }

  async function deleteTask(taskId) {
    await api.delete(`/tasks/${taskId}`);
    fetchData();
  }

  async function deleteChunk(chunkId) {
    await api.delete(`/chunks/${chunkId}`);
    fetchData();
  }

  async function startFocusMode(chunkId) {
    await api.post(`/chunks/${chunkId}/start`);
    const found = chunks.find((c) => c.id === chunkId);
    setActiveChunk(found);
    setIsFocusMode(true);
  }

  function stopFocusMode() {
    setActiveChunk(null);
    setIsFocusMode(false);
  }

  async function onChunkComplete(chunkId, totalElapsed) {
    await api.put(`/chunks/${chunkId}`, {
      status: "completed",
      completed_at: new Date().toISOString(),
      total_elapsed: totalElapsed,
    });
    fetchData();
  }

  async function onDragEnd(result) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const draggedTask = columns[sourceCol].find((t) => t.id === draggableId);
    if (!draggedTask) return;
    const newChunkId = destCol === "unChunked" ? null : destCol;
    try {
      await api.put(`/tasks/${draggedTask.id}`, { chunk_id: newChunkId });
      if (newChunkId !== null) {
        toast.success("Task has been chunked!", { autoClose: 1500 });
      }
    } catch (err) {
      console.error("Failed updating chunk_id", err);
      return;
    }
    const newSourceTasks = Array.from(columns[sourceCol]);
    newSourceTasks.splice(source.index, 1);
    const newDestTasks = Array.from(columns[destCol] || []);
    newDestTasks.splice(destination.index, 0, {
      ...draggedTask,
      chunk_id: newChunkId,
    });
    setColumns((prev) => ({
      ...prev,
      [sourceCol]: newSourceTasks,
      [destCol]: newDestTasks,
    }));
    setChunks((prevChunks) =>
      prevChunks.map((chunk) => {
        if (chunk.id === sourceCol && sourceCol !== "unChunked") {
          return {
            ...chunk,
            tasks: chunk.tasks.filter((t) => t.id !== draggedTask.id),
          };
        }
        if (chunk.id === destCol && destCol !== "unChunked") {
          return {
            ...chunk,
            tasks: [...(chunk.tasks || []), { ...draggedTask, chunk_id: newChunkId }],
          };
        }
        return chunk;
      })
    );
    if (activeChunk && (activeChunk.id === sourceCol || activeChunk.id === destCol)) {
      setActiveChunk((prev) => {
        if (prev.id === sourceCol) {
          return {
            ...prev,
            tasks: prev.tasks.filter((t) => t.id !== draggedTask.id),
          };
        }
        if (prev.id === destCol) {
          return {
            ...prev,
            tasks: [...prev.tasks, { ...draggedTask, chunk_id: newChunkId }],
          };
        }
        return prev;
      });
    }
  }

  function startEditingName(chunkId, currentName) {
    setEditingChunkId(chunkId);
    setEditedChunkName(currentName);
  }

  async function finishEditingName(chunkId) {
    await api.put(`/chunks/${chunkId}`, {
      name: editedChunkName,
    });
    setEditingChunkId(null);
    setEditedChunkName("");
    fetchData();
  }

  function toggleChunkExpand(chunkId) {
    setExpandedChunks((prev) =>
      prev.includes(chunkId)
        ? prev.filter((id) => id !== chunkId)
        : [...prev, chunkId]
    );
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  if (isFocusMode && activeChunk) {
    return (
      <FocusMode
        chunk={activeChunk}
        stopFocusMode={stopFocusMode}
        onChunkComplete={onChunkComplete}
      />
    );
  }

  const completedChunks = chunks
    .filter((c) => c.status === "completed")
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

  return (
    <div style={stylesDark.page}>
      <div style={stylesDark.container}>
        <div style={stylesDark.headerRow}>
          <h1 style={stylesDark.title}>Chunked Tasks</h1>
          <div style={stylesDark.controls}>
            {/* Wrap plus icon and menu in a relative container */}
            <div style={{ position: "relative" }}>
              <div style={stylesDark.plusIcon} onClick={toggleCreateMenu}>
                +
              </div>
              {showCreateMenu && (
                <div style={stylesDark.createMenu}>
                  <div
                    style={stylesDark.menuItem}
                    onClick={() => selectCreateMode("task")}
                  >
                    Create Task
                  </div>
                  <div style={stylesDark.menuItem} onClick={handleCreateChunk}>
                    Create Chunk
                  </div>
                </div>
              )}
            </div>
            <div
              style={stylesDark.flagIcon}
              onClick={() => setShowCompletedChunks((prev) => !prev)}
              title="Show/Hide Completed Chunks"
            >
              🏁
            </div>
          </div>
        </div>

        {createMode === "task" && (
          <div style={stylesDark.formBlock}>
            <input
              style={stylesDark.input}
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="New task name..."
            />
            <button style={stylesDark.createBtn} onClick={handleCreateTask}>
              Save
            </button>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <div style={stylesDark.board}>
            <Droppable droppableId="unChunked">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={stylesDark.unChunkedColumn}
                >
                  <h2 style={stylesDark.columnTitle}>unChunked Tasks</h2>
                  {(columns.unChunked || []).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...stylesDark.taskCard,
                            ...provided.draggableProps.style,
                          }}
                        >
                          <span>{task.title}</span>
                          <button
                            style={stylesDark.deleteBtn}
                            onClick={() => deleteTask(task.id)}
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            <div style={stylesDark.chunksWrapper}>
              {chunks
                .filter((c) => c.status !== "completed")
                .map((chunk) => (
                  <Droppable key={chunk.id} droppableId={chunk.id}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={stylesDark.column}
                      >
                        <div style={stylesDark.chunkHeader}>
                          {editingChunkId === chunk.id ? (
                            <input
                              style={stylesDark.chunkEditInput}
                              value={editedChunkName}
                              onChange={(e) => setEditedChunkName(e.target.value)}
                              onBlur={() => finishEditingName(chunk.id)}
                              autoFocus
                            />
                          ) : (
                            <h2
                              style={stylesDark.columnTitle}
                              onClick={() =>
                                startEditingName(chunk.id, chunk.name)
                              }
                            >
                              {chunk.name}
                            </h2>
                          )}
                          <button
                            style={stylesDark.deleteBtn}
                            onClick={() => deleteChunk(chunk.id)}
                          >
                            ✕
                          </button>
                        </div>
                        {(columns[chunk.id] || []).map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...stylesDark.taskCard,
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <span>{task.title}</span>
                                <button
                                  style={stylesDark.deleteBtn}
                                  onClick={() => deleteTask(task.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        <button
                          style={stylesDark.startBtn}
                          onClick={() => startFocusMode(chunk.id)}
                        >
                          Start Chunk
                        </button>
                      </div>
                    )}
                  </Droppable>
                ))}
            </div>
          </div>
        </DragDropContext>

        {showCompletedChunks && (
          <div style={stylesDark.completedSection}>
            <h2>Completed Chunks</h2>
            {completedChunks.map((c) => {
              const isExpanded = expandedChunks.includes(c.id);
              return (
                <div key={c.id} style={stylesDark.completedChit}>
                  <div
                    style={stylesDark.completedHeader}
                    onClick={() => toggleChunkExpand(c.id)}
                  >
                    <span>{c.name}</span>
                    <span>
                      {c.total_elapsed ? formatTime(c.total_elapsed) : ""}
                    </span>
                    <span style={{ marginLeft: "auto" }}>
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </div>
                  {isExpanded && (
                    <div style={stylesDark.completedDetails}>
                      <p>
                        Total Time:{" "}
                        {c.total_elapsed ? formatTime(c.total_elapsed) : "N/A"}
                      </p>
                      <ul style={stylesDark.completedList}>
                        {c.tasks.map((t) => (
                          <li key={t.id}>
                            {t.title}{" "}
                            {t.completedAt ? `- ${formatTime(t.completedAt)}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: "2rem" }}>
          <h3>Bulk Tasks</h3>
          <textarea
            rows={6}
            style={stylesDark.bulkTextarea}
            placeholder="Enter one task per line..."
            value={bulkTasks}
            onChange={(e) => setBulkTasks(e.target.value)}
          />
          <br />
          <button style={stylesDark.createBtn} onClick={handleBulkAdd}>
            Add Tasks
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

const stylesDark = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#343541",
    color: "#ECECF1",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 600,
    marginBottom: "1rem",
  },
  controls: {
    display: "flex",
    gap: "1rem",
  },
  plusIcon: {
    width: "2.5rem",
    height: "2.5rem",
    backgroundColor: "#10A37F",
    borderRadius: "50%",
    color: "#fff",
    fontSize: "1.5rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  flagIcon: {
    width: "2.5rem",
    height: "2.5rem",
    backgroundColor: "#10A37F",
    borderRadius: "50%",
    color: "#fff",
    fontSize: "1.5rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  createMenu: {
    position: "absolute",
    top: "calc(100% + 0.2rem)",
    right: 0,
    backgroundColor: "#444654",
    borderRadius: "4px",
    padding: "0.5rem",
    zIndex: 10,
    minWidth: "120px",
  },
  menuItem: {
    padding: "0.5rem",
    cursor: "pointer",
    color: "#ECECF1",
    borderBottom: "1px solid #3F4042",
  },
  formBlock: {
    display: "flex",
    gap: "0.5rem",
    flexDirection: "column",
    marginTop: "0.5rem",
  },
  input: {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #666",
    backgroundColor: "#3F4042",
    color: "#ECECF1",
  },
  createBtn: {
    backgroundColor: "#5f57ff",
    border: "none",
    color: "#fff",
    borderRadius: "4px",
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  board: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  unChunkedColumn: {
    backgroundColor: "#2B2D31",
    borderRadius: "8px",
    padding: "1rem",
    minHeight: "400px",
    width: "240px",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  column: {
    backgroundColor: "#444654",
    borderRadius: "8px",
    padding: "1rem",
    minHeight: "400px",
    width: "240px",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  columnTitle: {
    fontSize: "1.2rem",
    marginBottom: "0.5rem",
    color: "#ECECF1",
    cursor: "pointer",
  },
  chunksWrapper: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  chunkHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chunkEditInput: {
    fontSize: "1.1rem",
    borderRadius: "4px",
    border: "1px solid #666",
    backgroundColor: "#3F4042",
    color: "#ECECF1",
    outline: "none",
  },
  taskCard: {
    backgroundColor: "#3F4042",
    borderRadius: "4px",
    marginBottom: "0.5rem",
    padding: "0.5rem 0.75rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#ECECF1",
    cursor: "grab",
  },
  deleteBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#ECECF1",
    fontSize: "1.1rem",
    cursor: "pointer",
  },
  startBtn: {
    marginTop: "auto",
    backgroundColor: "#5f57ff",
    border: "none",
    color: "#fff",
    borderRadius: "4px",
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontSize: "1rem",
  },
  completedSection: {
    marginTop: "2rem",
  },
  completedChit: {
    backgroundColor: "#444654",
    borderRadius: "4px",
    padding: "0.5rem 1rem",
    marginBottom: "1rem",
    cursor: "pointer",
  },
  completedHeader: {
    display: "flex",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "1rem",
  },
  completedDetails: {
    backgroundColor: "#3F4042",
    borderRadius: "4px",
    padding: "0.5rem",
    marginTop: "0.5rem",
    fontSize: "0.9rem",
  },
  completedList: {
    listStyle: "none",
    paddingLeft: 0,
    margin: "0.5rem 0",
  },
  bulkTextarea: {
    width: "100%",
    backgroundColor: "#3F4042",
    color: "#ECECF1",
    border: "1px solid #666",
    borderRadius: "4px",
    padding: "0.5rem",
    marginBottom: "0.5rem",
  },
};