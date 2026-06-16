async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  try {
    const res = await fetch(
      "https://feedback-dashboard-backend-9qya.onrender.com/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      },
    );

    if (!res.ok) {
      msg.innerText = "Login failed ❌";
      return;
    }

    const data = await res.json();

    // save the token
    localStorage.setItem("token", data.token);

    msg.innerText = "Login successful ✅";

    // transport to admin dashboard
    window.location.href = "admin.html";
  } catch (err) {
    console.log(err);
  }
}
