import { useState, useEffect } from "react";
import axios from "axios";

function App() {
    const [tasks, setTasks] = useState({ today: [], tomorrow: [] });
    const [newTask, setNewTask] = useState("");

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        const res = await axios.get("http://localhost:5002/api/tasks");
        setTasks(res.data);
    };

    const addTask = async (schedule) => {
        if (!newTask.trim()) return;
        await axios.post("http://localhost:5002/api/tasks", { title: newTask, schedule });
        setNewTask("");
        fetchTasks();
    };

    return (
        <div style={{ maxWidth: "400px", margin: "auto", textAlign: "center" }}>
            <h2>Task Manager</h2>
            <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Enter task..."
            />
            <button onClick={() => addTask("today")}>Add to Today</button>
            <button onClick={() => addTask("tomorrow")}>Add to Tomorrow</button>

            <h3>Today</h3>
            <ul>
                {tasks.today.map((task) => (
                    <li key={task.id}>{task.title}</li>
                ))}
            </ul>

            <h3>Tomorrow</h3>
            <ul>
                {tasks.tomorrow.map((task) => (
                    <li key={task.id}>{task.title}</li>
                ))}
            </ul>
        </div>
    );
}

export default App;