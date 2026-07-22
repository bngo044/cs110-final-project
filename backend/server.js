const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
const createAuth = require("./auth");
const createItemRouter = require("./items");
const createProfileRouter = require("./profiles");
const createRequestRouter = require("./requests");
const createReviewRouter = require("./reviews");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = 3000;
const client = new MongoClient(process.env.MONGO_URI);

// Profile pictures are stored as small base64 data URLs in MongoDB.
app.use(express.json({ limit: "3mb" }));

// Serve the React login page and the API from the same localhost:3000 origin.
app.use(express.static(path.join(__dirname, "../frontend-react/dist")));

// Keep the existing HTML pages available while they are gradually moved to React.
app.use("/legacy", express.static(path.join(__dirname, "../frontend")));

/**
 * Connects to MongoDB, creates indexes and API routes, then starts Express.
 *
 * @returns {Promise<void>}
 */
async function startServer() {
  try {
    await client.connect();
    const database = client.db("cs110_final_project");
    const users = database.collection("users");
    const items = database.collection("items");
    const sessions = database.collection("sessions");
    const searches = database.collection("searches");
    const requests = database.collection("requests");
    const reviews = database.collection("reviews");

    await users.createIndex({ username: 1 }, { unique: true });
    await sessions.createIndex({ token: 1 }, { unique: true });
    await reviews.createIndex({ requestId: 1 }, { unique: true });

    const { router: authRouter, requireAuth } = createAuth(users, sessions);

    app.use("/api", authRouter);
    app.use("/api/profile", createProfileRouter(users, items, requireAuth));
    app.use("/api/items", createItemRouter(items, searches, requireAuth, users));
    app.use("/api/requests", createRequestRouter(requests, items, requireAuth, users, reviews));
    app.use("/api/reviews", createReviewRouter(reviews, requests, users, requireAuth));

    app.listen(PORT, () => {
      console.log(`App running at http://localhost:${PORT}`);
      console.log("Connected to MongoDB");
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
  }
}

startServer();
