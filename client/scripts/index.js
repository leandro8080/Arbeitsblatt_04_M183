document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const bruteForceButton = document.getElementById("bruteForce");
  const resultText = document.getElementById("result");
  const postsDiv = document.getElementById("posts");

  const login = async (username, password) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.text();
    if (response.status === 200) {
      localStorage.setItem("token", result);
      resultText.innerHTML = "Login successful";
      getPosts();
    } else {
      resultText.innerHTML = result;
    }
  };

  const getPosts = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/posts", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();
    postsDiv.innerHTML = "";
    for (i = 0; i < result.length; i++) {
      postsDiv.innerHTML += `
      <div>
        <b>${result[i].title}</b>
        <p>${result[i].content}</p>
      </div>`;
      console.log("SIUM");
    }

    console.log(result[0]);
  };

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    await login(username, password);
  });

  bruteForceButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    while (true) {
      await login(username, password);
    }
  });
  getPosts();
});
