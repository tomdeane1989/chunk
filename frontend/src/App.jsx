import { useState } from "react";

function App() {
    const [tasks, setTasks] = useState([]);

    return (
        <div style={{ maxWidth: "400px", margin: "auto", textAlign: "center" }}>
            <h2>Task Manager</h2>
            <ul>
                {tasks.map((task, index) => (
                    <li key={index}>{task.title}</li>
                ))}
            </ul>
        </div>
    );
}

export default App;