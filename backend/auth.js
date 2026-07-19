const express = require("express");
const crypto = require("crypto");
const { promisify } = require("util");

const router = express.Router();
const scrypt = promisify(crypto.scrypt);

function createAuthRouter(users) {
  router.post("/register", async (req, res) => {
    try {
      const username = (req.body.username || "").trim();
      const password = req.body.password || "";

      if (!username || !password) {
        return res.status(400).json({
          message: "Enter a username and password."
        });
      }

      const existingUser = await users.findOne({ username });

      if (existingUser) {
        return res.status(409).json({
          message: "Username already exists."
        });
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = (await scrypt(password, salt, 64)).toString("hex");

      await users.insertOne({
        username,
        passwordHash,
        salt,
        createdAt: new Date()
      });

      res.status(201).json({
        message: "Account created. You can now log in."
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not create account." });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const username = (req.body.username || "").trim();
      const password = req.body.password || "";

      if (!username || !password) {
        return res.status(400).json({
          message: "Enter a username and password."
        });
      }

      const user = await users.findOne({ username });

      if (!user) {
        return res.status(401).json({
          message: "Invalid username or password."
        });
      }

      const passwordHash = await scrypt(password, user.salt, 64);
      const savedHash = Buffer.from(user.passwordHash, "hex");

      if (passwordHash.length !== savedHash.length) {
        return res.status(401).json({
          message: "Invalid username or password."
        });
      }

      const passwordMatches = crypto.timingSafeEqual(passwordHash, savedHash);

      if (!passwordMatches) {
        return res.status(401).json({
          message: "Invalid username or password."
        });
      }

      res.json({ message: `Welcome, ${username}!` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not log in." });
    }
  });

  return router;
}

module.exports = createAuthRouter;
