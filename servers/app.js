import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Pool } = pkg;
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "task_board",
  password: "admin",
  port: 5555,
});

pool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL database successfully!");
  })
  .catch((err) => {
    console.error("Failed to connect to the database", err);
  });

app.use(express.static(path.join(__dirname, "../public")));

// Parse JSON request bodies
app.use(express.json());

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Create a new task
app.post("/api/tasks", async (req, res) => {
  const { taskName, description, emoji, status } = req.body;
  console.log(
    `Received task: ${taskName}, ${description}, ${emoji}, ${status}`
  );

  try {
    const { rows } = await pool.query(
      "INSERT INTO tasks (name, description, emoji, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [taskName, description, emoji, status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Failed to create task:", err);
    res
      .status(500)
      .json({ error: "Failed to create task", details: err.message });
  }
});

app.get("/api/tasks/:id", async (req, res) => {
  const id = req.params.id;

  const response = pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  const todo = (await response).rows[0];

  res.json(todo);
});

app.put("/api/tasks/:id", async (req, res) => {
  const taskID = req.params.id;
  const { taskName, description, emoji, status } = req.body;
  try {
    const response = await pool.query(
      "UPDATE tasks SET name = $1, description = $2, emoji = $3, status = $4 WHERE id = $5 RETURNING *",
      [taskName, description, emoji, status, taskID]
    );

    res.json({ message: "Task updated successfully", task: response.rows[0] });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  const taskID = req.params.id;

  try {
    const response = await pool.query(
      "DELETE FROM tasks where id = $1 RETURNING *",
      [taskID]
    );
    if (response.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully", task: response.rows[0] });
  } catch (error) {
    console.error("Error deleting task", error);
    res
      .status(500)
      .json({ error: "Something went wrong while deleting the task" });
  }
});
const PORT = 7000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
