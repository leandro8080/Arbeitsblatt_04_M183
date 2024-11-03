const { body, validationResult } = require("express-validator");
const { initializeDB, queryDB, getPosts } = require("./database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();
let db;
const secretKey = process.env.PORT;

const initializeAPI = async (app) => {
    db = initializeDB("./minitwiter.db");
    app.post("/api/login", body("username").escape(), body("password"), login);
    app.get("/api/posts", posts);
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
            return res.status(401);
        }

        const userPosts = getPosts();
        res.status(200).json(userPosts);
    });
};

module.exports = { initializeAPI };
