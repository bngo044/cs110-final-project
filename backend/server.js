const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { promisify } = require("util");
const { MongoClient } = require("mongodb");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = 3000;
const client = new MongoClient(process.env.MONGO_URI);
const scrypt = promisify(crypto.scrypt);

let users;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/api/register", async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (!username || !password) {
      return res.status(400).json({ message: "Enter a username and password." });
    }

    const existingUser = await users.findOne({ username });

    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(password, salt, 64)).toString("hex");

    await users.insertOne({
      username,
      passwordHash,
      salt,
      createdAt: new Date()
    });

    res.status(201).json({ message: "Account created. You can now log in." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not create account." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const password = req.body.password || "";

    if (!username || !password) {
      return res.status(400).json({ message: "Enter a username and password." });
    }

    const user = await users.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const passwordHash = await scrypt(password, user.salt, 64);
    const savedHash = Buffer.from(user.passwordHash, "hex");
    const passwordMatches = crypto.timingSafeEqual(passwordHash, savedHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    res.json({ message: `Welcome, ${username}!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not log in." });
  }
});

async function startServer() {
  try {
    await client.connect();
    const database = client.db("cs110_final_project");
    users = database.collection("users");
    await users.createIndex({ username: 1 }, { unique: true });

    app.listen(PORT, () => {
      console.log(`App running at http://localhost:${PORT}`);
      console.log("Connected to MongoDB");
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
  }
}

startServer();
