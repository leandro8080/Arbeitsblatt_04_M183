document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginButton = document.getElementById("login");
    const bruteForceButton = document.getElementById("bruteForce");
    const resultText = document.getElementById("result");
    const postsDiv = document.getElementById("posts");
    const titleInput = document.getElementById("title");
    const contentInput = document.getElementById("content");
    const postButton = document.getElementById("post");

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
            await fetchKeys();
            localStorage.setItem("token", result);
            resultText.innerHTML = "Login successful";
            getPosts();
        } else {
            resultText.innerHTML = result;
        }
    };

    const fetchKeys = async () => {
        const response = await fetch("/api/generate-keys", {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error("Failed to fetch keys");
        }
        const { publicKey, privateKey } = await response.json();

        localStorage.setItem("publicKey", publicKey);
        localStorage.setItem("privateKey", privateKey);
    };

    const createPost = async (title, content) => {
        console.log(title, content);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/posts", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ title, content }),
        });
        const result = await response.text();
        if (response.status === 200) {
            resultText.innerHTML = "Post created successfully";
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
        }
    };

    loginButton.addEventListener("click", async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        await login(username, password);
    });

    postButton.addEventListener("click", async () => {
        const title = titleInput.value;
        const content = contentInput.value;
        await createPost(title, content);
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
