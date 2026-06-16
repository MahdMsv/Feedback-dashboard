const form = document.getElementById("feedbackForm");
const titleEl = document.getElementById("title");
const msgEl = document.getElementById("message");
const btnText = document.getElementById("btnText");
const submitBtn = document.getElementById("submitBtn");
const toast = document.getElementById("toast");

// Character counters
titleEl.addEventListener("input", () => {
  document.getElementById("titleCount").textContent = titleEl.value.length;
});
msgEl.addEventListener("input", () => {
  document.getElementById("msgCount").textContent = msgEl.value.length;
});

function showToast(message, type = "success") {
  const icon = type === "success" ? "✓" : "✕";
  toast.textContent = `${icon}  ${message}`;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.className = "toast";
  }, 3500);
}

function setLoading(on) {
  submitBtn.disabled = on;
  btnText.textContent = on ? "Sending…" : "Send feedback";
  if (on) {
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.id = "spinner";
    submitBtn.appendChild(spinner);
  } else {
    document.getElementById("spinner")?.remove();
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleEl.value.trim();
  const message = msgEl.value.trim();

  if (!title) {
    showToast("Please add a title.", "error");
    return;
  }
  if (!message) {
    showToast("Please write a message.", "error");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("http://localhost:3000/feedbacks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message }),
    });

    if (!res.ok) throw new Error(`Server responded ${res.status}`);

    showToast("Feedback sent — thank you!", "success");
    form.reset();
    document.getElementById("titleCount").textContent = "0";
    document.getElementById("msgCount").textContent = "0";
  } catch (err) {
    console.error(err);
    showToast("Could not send. Is the server running?", "error");
  } finally {
    setLoading(false);
  }
});
// connect
async function sendFeedback() {
  const title = document.getElementById("title").value;
  const message = document.getElementById("message").value;

  if (!message) {
    alert("Message is required");
    return;
  }

  const res = await fetch("http://localhost:3000/feedbacks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      message,
    }),
  });

  const data = await res.json();
  console.log(data);

  alert("Feedback sent successfully 🚀");
}
