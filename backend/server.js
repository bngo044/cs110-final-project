const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
const createAuthRouter = require("./auth");
const createItemRouter = require("./item-creation-form");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = 3000;
const client = new MongoClient(process.env.MONGO_URI);

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

async function startServer() {
  try {
    await client.connect();
    const database = client.db("cs110_final_project");
    const users = database.collection("users");
    const items = database.collection("items");
    await users.createIndex({ username: 1 }, { unique: true });

    app.use("/api", createAuthRouter(users));
    app.use("/api/items", createItemRouter(items));

    app.listen(PORT, () => {
      console.log(`App running at http://localhost:${PORT}`);
      console.log("Connected to MongoDB");
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
  }
}

startServer();
