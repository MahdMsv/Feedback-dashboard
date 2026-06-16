const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// ===================== PORT =====================
const PORT = process.env.PORT || 3000;

// ===================== POSTGRESQL CONNECTION =====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// ===================== INIT DB =====================
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        title TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'registered'
      )
    `);

    console.log("PostgreSQL Table Ready 🚀");
  } catch (err) {
    console.error("DB Init Error:", err);
  }
};

initDB();

// ===================== HOME ROUTE =====================
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// ===================== AUTH =====================
const ADMIN = {
  username: "admin",
  password: "1234",
  token: "admin-token-123",
};

// LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN.username && password === ADMIN.password) {
    return res.json({ token: ADMIN.token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

// AUTH MIDDLEWARE
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(403).json({ message: "No token" });
  }

  const token = header.split(" ")[1];

  if (token !== ADMIN.token) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  next();
}

// ===================== GET FEEDBACKS =====================
app.get("/feedbacks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM feedback ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== CREATE FEEDBACK =====================
app.post("/feedbacks", async (req, res) => {
  const { title, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO feedback (title, message, status) VALUES ($1, $2, $3) RETURNING *",
      [title || "", message, "registered"],
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== UPDATE STATUS =====================
app.put("/feedbacks/:id", auth, async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    await pool.query("UPDATE feedback SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// ===================== START SERVER =====================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
