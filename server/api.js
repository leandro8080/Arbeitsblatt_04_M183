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
        req.log.warn(`Login failed, validation error: ${result.errors[0].msg}`);
        return res.status(400).send(`${result.errors[0].msg}<br>`);
    }
    const { username, password } = req.body;
    req.log.info(`Login attempt for username: ${username}`);
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
            req.log.info(`User ${username} logged in successfully`);
            return res.status(200).send(token);
        } else {
            req.log.warn(`Login failed: incorrect password for username: ${username}`);
        }
    }
    res.status(401).send("Username or password wrong<br>");
};

const createPost = async (req, res) => {
    const result = validationResult(req);
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    if (!token) {
        req.log.warn("Unauthorized post creation attempt: no token provided");
        return res.sendStatus(401);
    }
    if (result.errors.length > 0) {
        req.log.warn(`Post creation failed, validation error: ${result.errors[0].msg}`);
        return res.status(400).send(`${result.errors[0].msg}<br>`);
    }
    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
            req.log.error("Token verification failed for post creation");
            return res.sendStatus(403);
        }

        const { role } = decoded.data;

        if (role !== "viewer") {
            req.log.warn(`Unauthorized post creation attempt by user with role: ${role}`);
            return res.status(401);
        }
        const { title, content } = req.body;
        const encryptedTitle = aes.encrypt(title);
        const encryptedContent = aes.encrypt(content);
        const query = `INSERT INTO posts (title, content) VALUES ("${encryptedTitle}", "${encryptedContent}");`;

        try {
            await insertDB(db, query);
            req.log.info(`Post created successfully with title: "${title}"`);
            res.status(200).send("Post created successfully");
        } catch (error) {
            req.log.error(`Failed to insert post: ${error.message}`);
            res.status(500).send("Error creating post");
        }
    });
};

const posts = async (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader.split(" ")[1];
    if (!token) {
        req.log.warn("Unauthorized access attempt to posts");
        return res.sendStatus(401);
    }

    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err) {
            req.log.error("Token verification failed when accessing posts");
            return res.sendStatus(403);
        }

        const { role } = decoded.data;

        if (role !== "viewer") {
            req.log.warn(`Unauthorized posts access attempt by user with role: ${role}`);
            return res.sendStatus(401);
        }

        try {
            const query = "SELECT title, content FROM posts;";
            const userPosts = await queryDB(db, query);
            for (let i = 0; i < userPosts.length; i++) {
                userPosts[i].title = aes.decrypt(userPosts[i].title);
                userPosts[i].content = aes.decrypt(userPosts[i].content);
            }
            req.log.info("Posts retrieved successfully");
            res.status(200).json(userPosts);
        } catch (error) {
            req.log.error(`Error retrieving posts: ${error.message}`);
            res.status(500).send("Error retrieving posts");
        }
    });
};

const generateKeys = (req, res) => {
    const key = new NodeRSA({ b: 1024 });
    const publicKey = key.exportKey("public");
    const privateKey = key.exportKey("private");
    req.log.info("RSA keys generated successfully");

    res.status(200).json({ publicKey, privateKey });
};

module.exports = { initializeAPI };
