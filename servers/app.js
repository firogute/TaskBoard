import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
const { Pool } = pkg;
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dzpildyiegjzbuyuysyn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6cGlsZHlpZWdqemJ1eXV5c3luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExOTM5NjUsImV4cCI6MjA1Njc2OTk2NX0.8UhvDniPMmOxeTU5XCs8c6AHzAIvu3F8XKQ4aGNdJXI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());

app.use(express.static(path.join(__dirname, "../public"), { index: false }));

app.use(express.json());

let boardId;

app.get("/", async (req, res) => {
  console.log("Creating a new board...");

  try {
    const { data, error } = await supabase
      .from("boards")
      .insert([{ name: "My Task Board" }])
      .select();

    if (error) {
      console.error("Error inserting new board:", error);
      throw error;
    }

    boardId = data[0].id;
    console.log(`New board created with ID: ${boardId}`);

    return res.redirect(`/${boardId}`);
  } catch (err) {
    console.error("Error creating a new board:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.get("/:id", async (req, res) => {
  console.log(`Entered board route with ID: ${req.params.id}`);

  boardId = req.params.id;

  try {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .single();

    if (error || !data) {
      console.error("Board not found:", error);
      return res.status(404).send("Board not found");
    }

    console.log(`Board ID ${boardId} found, serving index.html`);
    res.sendFile(path.join(__dirname, "../public", "index.html"));
  } catch (err) {
    console.error("Error retrieving board:", err);
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/tasks/:boardId", async (req, res) => {
  const { boardId } = req.params;

  try {
    const { data, error } = await supabase
      .from("boards")
      .select("data")
      .eq("id", boardId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Send the tasks as JSON response
    res.status(200).json(data.data || []);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/board/:id/task", async (req, res) => {
  const boardId = req.params.id;
  const { taskName, description, emoji, status } = req.body;

  if (!taskName || !description || !emoji || !status) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const { data, error } = await supabase
      .from("boards")
      .select("data")
      .eq("id", boardId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Board not found" });
    }

    const existingTasks = data.data || [];

    const newTask = {
      id: existingTasks.length + 1,
      taskName,
      description,
      emoji,
      status,
      created_at: new Date().toISOString(),
    };

    const updatedTasks = [...existingTasks, newTask];

    const { error: updateError } = await supabase
      .from("boards")
      .update({ data: updatedTasks })
      .eq("id", boardId);

    if (updateError) throw updateError;

    res.status(200).json({ message: "Task added successfully", task: newTask });
  } catch (err) {
    console.error("Error adding task:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/tasks/:userId/:taskId", async (req, res) => {
  console.log(boardId);
  const { userId, taskId } = req.params;
  const taskIdNum = parseInt(taskId);

  try {
    const { data, error } = await supabase
      .from("boards")
      .select("data")
      .eq("id", userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Board not found" });

    const allTasks = data.data;

    const onetask = allTasks.find((t) => t.id === taskIdNum);

    if (!onetask) return res.status(404).json({ error: "Task not found" });

    res.json(onetask);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;
  const { taskName, description, emoji, status } = req.body;

  if (!taskName || !description || !emoji || !status) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const { data, error } = await supabase
      .from("boards")
      .select("data")
      .eq("id", boardId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Board not found" });
    }

    let tasks = data.data || [];
    let taskIndex = tasks.findIndex((t) => t.id === parseInt(taskId));

    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      taskName,
      description,
      emoji,
      status,
    };

    const { error: updateError } = await supabase
      .from("boards")
      .update({ data: tasks })
      .eq("id", boardId)
      .single();

    if (updateError) throw updateError;

    res
      .status(200)
      .json({ message: "Task updated successfully", task: tasks[taskIndex] });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tasks/:taskId", async (req, res) => {
  const { taskId } = req.params;

  try {
    const { data, error } = await supabase
      .from("boards")
      .select("data")
      .eq("id", boardId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Board not found" });
    }

    let tasks = data.data || [];
    const updatedTasks = tasks.filter((t) => t.id !== parseInt(taskId));

    if (tasks.length === updatedTasks.length) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { error: updateError } = await supabase
      .from("boards")
      .update({ data: updatedTasks })
      .eq("id", boardId);

    if (updateError) throw updateError;

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Error deleting task:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
