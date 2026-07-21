const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const { ObjectId } = require("mongodb");
const createAuth = require("../backend/auth");

function createFakeCollection() {
  const documents = [];

  return {
    async findOne(filter) {
      return documents.find((document) => {
        return Object.entries(filter).every(([key, value]) => {
          return document[key] === value;
        });
      }) || null;
    },

    async insertOne(document) {
      const savedDocument = { _id: new ObjectId(), ...document };
      documents.push(savedDocument);
      return { insertedId: savedDocument._id };
    }
  };
}

function createTestApp() {
  const users = createFakeCollection();
  const sessions = createFakeCollection();
  const { router } = createAuth(users, sessions);
  const app = express();

  app.use(express.json());
  app.use("/api", router);

  return app;
}

test("registers a new user", async () => {
  const response = await request(createTestApp())
    .post("/api/register")
    .send({ username: "student1", password: "password123" });

  assert.equal(response.status, 201);
  assert.equal(response.body.message, "Account created. You can now log in.");
});

test("rejects registration without a username", async () => {
  const response = await request(createTestApp())
    .post("/api/register")
    .send({ password: "password123" });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Enter a username and password.");
});

test("rejects a duplicate username", async () => {
  const app = createTestApp();
  const user = { username: "student1", password: "password123" };

  await request(app).post("/api/register").send(user);
  const response = await request(app).post("/api/register").send(user);

  assert.equal(response.status, 409);
  assert.equal(response.body.message, "Username already exists.");
});

test("logs in a registered user and returns a token", async () => {
  const app = createTestApp();
  const user = { username: "student1", password: "password123" };

  await request(app).post("/api/register").send(user);
  const response = await request(app).post("/api/login").send(user);

  assert.equal(response.status, 200);
  assert.ok(response.body.token);
});

test("rejects an incorrect password", async () => {
  const app = createTestApp();

  await request(app)
    .post("/api/register")
    .send({ username: "student1", password: "password123" });

  const response = await request(app)
    .post("/api/login")
    .send({ username: "student1", password: "wrong-password" });

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Invalid username or password.");
});
