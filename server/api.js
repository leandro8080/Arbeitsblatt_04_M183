const { body, validationResult } = require("express-validator");
const { initializeDB, insertDB, queryDB } = require("./database");
const AesEncryption = require("aes-encryption");
const NodeRSA = require("node-rsa");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
let db;
const secretKey = process.env.PORT;
const aes = new AesEncryption();
aes.setSecretKey(process.env.AESSECRETKEY);

const initializeAPI = async (app) => {
    db = initializeDB("./minitwiter.db");
    app.post("/api/login", body("username").escape(), body("password"), login);
    app.get("/api/posts", posts);
    app.post("/api/posts", body("title").notEmpty().withMessage("Title is empty").escape(), body("content").notEmpty().withMessage("Content is empty").escape(), createPost);
    app.get("/api/generate-keys", generateKeys);
};

const login = async (req, res) => {
    const result = validationResult(req);
    if (result.errors.length > 0) {
        return res.status(400).send(`${result.errors[0].msg}<br>`);
    }
    const { username, password } = req.body;
    const query = `SELECT password, role FROM users WHERE username = "${username}";`;

    const user = await queryDB(db, query);

    if (user.length === 1) {
        const hashedPassword = user[0].password;
        const role = user[0].role;
        const match = await bcrypt.compare(password, hashedPassword);
        if (match) {
            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 60 * 60,
                    data: { username, role },
                },
                secretKey
            );
            return res.status(200).send(token);
        }
    }
    res.status(401).send("Username or password wrong<br>");
};

const createPost = async (req, res) => {
    const result = validationResult(req);
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);
    if (result.errors.length > 0) {
        return res.status(400).send(`${result.errors[0].msg}<br>`);
    }
    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
            return res.sendStatus(403);
        }

        const { role } = decoded.data;

        if (role !== "viewer") {
            return res.status(401);
        }
        const { title, content } = req.body;
        const encryptedTitle = aes.encrypt(title);
        const encryptedContent = aes.encrypt(content);
        const query = `INSERT INTO posts (title, content) VALUES ("${encryptedTitle}", "${encryptedContent}");`;

        insertDB(db, query);

        res.status(200).send("Post created successfully ");
    });
    res.status(500);
};

const posts = async (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
            return res.sendStatus(403);
        }

        const { role } = decoded.data;

        if (role !== "viewer") {
            return res.sendStatus(401);
        }

        const userPosts = await queryDB(db, "SELECT title, content FROM posts;");
        for (i = 0; i < userPosts.length; i++) {
            userPosts[i].title = aes.decrypt(userPosts[i].title);
            userPosts[i].content = aes.decrypt(userPosts[i].content);
        }
        res.status(200).json(userPosts);
    });
};

const generateKeys = (req, res) => {
    const key = new NodeRSA({ b: 1024 });
    const publicKey = key.exportKey("public");
    const privateKey = key.exportKey("private");

    res.status(200).json({ publicKey, privateKey });
};

module.exports = { initializeAPI };
