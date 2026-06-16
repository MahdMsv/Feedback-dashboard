const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

app.use(cors());
app.use(express.json());

// ===================== PORT (IMPORTANT FOR RENDER) =====================
const PORT = process.env.PORT || 3000;

// ===================== DB =====================
const db = new sqlite3.Database("./feedback.db", (err) => {
  if (err) {
    console.error("DB Error:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// ===================== TABLE =====================
db.run(`
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    message TEXT,
    status TEXT DEFAULT 'registered'
  )
`);

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

// 🔐 LOGIN
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN.username && password === ADMIN.password) {
    return res.json({ token: ADMIN.token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
});

// 🔐 MIDDLEWARE
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
app.get("/feedbacks", (req, res) => {
  db.all("SELECT * FROM feedback", [], (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

// ===================== POST FEEDBACK =====================
app.post("/feedbacks", (req, res) => {
  const { title, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  db.run(
    "INSERT INTO feedback (title, message, status) VALUES (?, ?, ?)",
    [title || "", message, "registered"],
    function (err) {
      if (err) return res.status(500).json(err);

      res.json({
        id: this.lastID,
        title: title || "",
        message,
        status: "registered",
      });
    },
  );
});

// ===================== UPDATE STATUS (PROTECTED) =====================
app.put("/feedbacks/:id", auth, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  db.run(
    "UPDATE feedback SET status = ? WHERE id = ?",
    [status, id],
    function (err) {
      if (err) return res.status(500).json(err);

      res.json({ success: true });
    },
  );
});

// ===================== START SERVER =====================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
