// ----------------------------------------
// File: src/components/tasks/TaskList.jsx
// ----------------------------------------
import React from "react";

function TaskList({ title, tasks, selectedTasks, toggleTaskSelection }) {
  return (
    <div style={styles.container}>
      <h3>{title}</h3>
      <ul style={styles.list}>
        {tasks.map((task) => (
          <li key={task.id} style={styles.listItem}>
            <label>
              <input
                type="checkbox"
                checked={selectedTasks.includes(task.id)}
                onChange={() => toggleTaskSelection(task.id)}
              />
              {task.title}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TaskList;

const styles = {
  container: {
    textAlign: "left",
    margin: "0 1rem",
    flex: 1,
  },
  list: {
    listStyle: "none",
    paddingLeft: 0,
  },
  listItem: {
    margin: "0.5rem 0",
  },
};