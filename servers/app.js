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

// Serve only static assets, excluding index.html
app.use(express.static(path.join(__dirname, "../public"), { index: false }));

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

// Parse JSON request bodies
app.use(express.json());

// **Root route - create a new board and redirect**
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

    // Get the new boardId and redirect to the new board's page
    const boardId = data[0].id;
    console.log(`New board created with ID: ${boardId}`);

    // Redirect to the new board's page
    return res.redirect(`/${boardId}`);
  } catch (err) {
    console.error("Error creating a new board:", err);
    return res.status(500).json({ error: err.message });
  }
});

// **Board Route - serve index.html when a board ID is provided**
app.get("/:id", async (req, res) => {
  console.log(`Entered board route with ID: ${req.params.id}`);

  let boardId = req.params.id;

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

    // Serve the board's page
    console.log(`Board ID ${boardId} found, serving index.html`);
    res.sendFile(path.join(__dirname, "../public", "index.html"));
  } catch (err) {
    console.error("Error retrieving board:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Add a new task to a board
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

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
