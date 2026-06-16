const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

const API = "http://localhost:3000/feedbacks";

let allFeedbacks = [];
let activeFilter = "all";

/* ── Elements ── */
const mainEl = document.getElementById("main");
const toastEl = document.getElementById("toast");
const totalEl = document.getElementById("totalCount");

/* ── Toast ── */
function showToast(msg, type = "success") {
  const icon = type === "success" ? "✓" : "✕";

  toastEl.textContent = `${icon} ${msg}`;
  toastEl.className = `toast ${type} show`;

  setTimeout(() => {
    toastEl.className = "toast";
  }, 3000);
}

/* ── Helpers ── */
function statusLabel(s) {
  if (!s) return "registered";
  return s.toLowerCase();
}

function pillClass(s) {
  const sl = statusLabel(s);
  if (sl === "in-progress") return "in-progress";
  if (sl === "resolved") return "resolved";
  return "registered";
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Render ── */
function renderCards(feedbacks) {
  mainEl.innerHTML = "";

  if (!feedbacks.length) {
    mainEl.innerHTML = `
      <div class="state-box">
        <div class="icon">📭</div>
        <p>${
          activeFilter === "all"
            ? "No feedbacks yet."
            : `No "${activeFilter}" feedbacks found.`
        }</p>
      </div>`;
    return;
  }

  const grid = document.createElement("div");
  grid.className = "card-grid";

  feedbacks.forEach((fb) => {
    const current = statusLabel(fb.status);

    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = fb.id;

    card.innerHTML = `
      <div class="card-body">
        <div class="card-top">
          <span class="card-title">${escHtml(fb.title)}</span>
          <span class="status-pill ${pillClass(current)}">${current}</span>
        </div>
        <p class="card-message">${escHtml(fb.message)}</p>
      </div>

      <div class="card-actions">
        ${["registered", "in-progress", "resolved"]
          .map(
            (s) => `
          <button
            class="status-btn ${s} ${current === s ? "active-status" : ""}"
            data-status="${s}"
            ${current === s ? "disabled" : ""}
          >
            ${
              s === "in-progress"
                ? "In Progress"
                : s.charAt(0).toUpperCase() + s.slice(1)
            }
          </button>
        `,
          )
          .join("")}
      </div>
    `;

    card.querySelectorAll(".status-btn:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", () => {
        updateStatus(fb.id, btn.dataset.status);
      });
    });

    grid.appendChild(card);
  });

  mainEl.appendChild(grid);
}

/* ── Filter ── */
function applyFilter() {
  const filtered =
    activeFilter === "all"
      ? allFeedbacks
      : allFeedbacks.filter((fb) => statusLabel(fb.status) === activeFilter);

  renderCards(filtered);
}

/* ── Load Data ── */
async function loadFeedbacks(showLoader = true) {
  if (showLoader) {
    mainEl.innerHTML = `
      <div class="spinner-wrap">
        <div class="big-spinner"></div>
        <p>Loading feedbacks...</p>
      </div>`;
  }

  try {
    const res = await fetch(API);

    if (!res.ok) throw new Error("Server error");

    allFeedbacks = await res.json();
    totalEl.textContent = allFeedbacks.length;

    applyFilter();
  } catch (err) {
    console.error(err);

    mainEl.innerHTML = `
      <div class="state-box">
        <div class="icon">⚠️</div>
        <p>Server not reachable</p>
      </div>`;

    showToast("Failed to load data", "error");
  }
}

/* ── Update Status (FIXED) ── */
async function updateStatus(id, status) {
  const card = document.querySelector(`.card[data-id="${id}"]`);

  if (card) {
    card.querySelectorAll(".status-btn").forEach((b) => (b.disabled = true));
  }

  try {
    const res = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) throw new Error("Update failed");

    showToast(`Updated to "${status}"`);

    await loadFeedbacks(false);
  } catch (err) {
    console.error(err);

    showToast("Update failed", "error");

    if (card) {
      card.querySelectorAll(".status-btn").forEach((b) => (b.disabled = false));
    }
  }
}

/* ── Filter Buttons ── */
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));

    btn.classList.add("active");

    activeFilter = btn.dataset.filter;

    applyFilter();
  });
});

/* ── Refresh ── */
document.getElementById("refreshBtn")?.addEventListener("click", () => {
  loadFeedbacks(true);
});

/* ── Init ── */
loadFeedbacks();

console.log("Admin JS Loaded ✅");

const darkToggle = document.getElementById("darkToggle");

// load saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// toggle theme
darkToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
    darkToggle.textContent = "☀️ Light";
  } else {
    localStorage.setItem("theme", "light");
    darkToggle.textContent = "🌙 Dark";
  }
});
