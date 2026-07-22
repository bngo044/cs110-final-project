const express = require("express");
const crypto = require("crypto");
const { ObjectId } = require("mongodb");

/**
 * Creates a secure hash from a password and salt.
 *
 * @param {string} password - The user's plain-text password.
 * @param {string} salt - Random text used to make the hash unique.
 * @returns {string} The password hash in hexadecimal format.
 */
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

/**
 * Creates the registration and login routes and their authentication middleware.
 *
 * @param {import("mongodb").Collection} users - MongoDB users collection.
 * @param {import("mongodb").Collection} sessions - MongoDB login sessions collection.
 * @returns {{router: import("express").Router, requireAuth: import("express").RequestHandler}}
 * The authentication router and middleware for protecting routes.
 */
function createAuth(users, sessions) {
  const router = express.Router();

  /**
   * Checks the request's Bearer token and adds the logged-in user's ID to req.userId.
   *
   * @param {import("express").Request} req - Express request.
   * @param {import("express").Response} res - Express response.
   * @param {import("express").NextFunction} next - Continues to the protected route.
   * @returns {Promise<void>}
   */
  async function requireAuth(req, res, next) {
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      const session = token && await sessions.findOne({ token });

      if (!session) {
        return res.status(401).json({ message: "Log in first." });
      }

      req.userId = new ObjectId(session.userId);
      req.authToken = token;
      next();
    } catch (error) {
      res.status(401).json({ message: "Invalid login token." });
    }
  }

  /**
   * Registers a new user with a unique username and hashed password.
   *
   * @route POST /api/register
   * @access Public
   */
  router.post("/register", async (req, res) => {
    try {
      const body = req.body || {};
      const username = (body.username || "").trim();
      const password = body.password || "";

      if (!username || !password) {
        return res.status(400).json({ message: "Enter a username and password." });
      }

      if (await users.findOne({ username })) {
        return res.status(409).json({ message: "Username already exists." });
      }

      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(password, salt);

      await users.insertOne({
        name: (body.name || "").trim(),
        username,
        email: (body.email || "").trim().toLowerCase(),
        passwordHash,
        salt,
        profilePicture: "",
        campusLocation: "",
        bio: "",
        averageRating: null,
        createdAt: new Date()
      });

      res.status(201).json({ message: "Account created. You can now log in." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not create account." });
    }
  });

  /**
   * Verifies a username and password, then returns a new login token.
   *
   * @route POST /api/login
   * @access Public
   */
  router.post("/login", async (req, res) => {
    try {
      const body = req.body || {};
      const username = (body.username || "").trim();
      const password = body.password || "";
      const user = await users.findOne({ username });

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password." });
      }

      const passwordHash = hashPassword(password, user.salt);
      const matches = passwordHash === user.passwordHash;

      if (!matches) {
        return res.status(401).json({ message: "Invalid username or password." });
      }

      const token = crypto.randomBytes(32).toString("hex");
      await sessions.insertOne({ token, userId: user._id, createdAt: new Date() });

      res.json({ message: `Welcome, ${user.name || username}!`, token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not log in." });
    }
  });

  /**
   * Deletes the current login session so its token cannot be reused.
   *
   * @route POST /api/logout
   * @access Private
   */
  router.post("/logout", requireAuth, async (req, res) => {
    try {
      await sessions.deleteOne({ token: req.authToken });
      res.json({ message: "Logged out successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not log out." });
    }
  });

  return { router, requireAuth };
}

module.exports = createAuth;
