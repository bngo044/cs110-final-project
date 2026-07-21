const express = require("express");
const { ObjectId } = require("mongodb");

/**
 * Creates routes for borrowing requests and request status updates.
 *
 * @param {import("mongodb").Collection} requests - MongoDB borrowing requests collection.
 * @param {import("mongodb").Collection} items - MongoDB listings collection.
 * @param {import("express").RequestHandler} requireAuth - Middleware that verifies login tokens.
 * @returns {import("express").Router} The request router.
 */
function createRequestRouter(requests, items, requireAuth) {
  const router = express.Router();
  const statuses = ["Pending", "Accepted", "Rejected", "Returned"];

  /**
   * Sends a new borrowing request for another user's listing.
   * @route POST /api/requests
   * @access Private
   */
  router.post("/", requireAuth, async (req, res) => {
    try {
      const itemId = new ObjectId(req.body.itemId);
      const item = await items.findOne({ _id: itemId });

      if (!item) return res.status(404).json({ message: "Listing not found." });
      if (item.ownerId.equals(req.userId)) return res.status(400).json({ message: "You cannot request your own item." });

      const request = {
        itemId,
        borrowerId: req.userId,
        ownerId: item.ownerId,
        message: (req.body.message || "").trim(),
        status: "Pending",
        createdAt: new Date()
      };

      const result = await requests.insertOne(request);
      res.status(201).json({ message: "Request sent.", request: { ...request, _id: result.insertedId } });
    } catch (error) {
      res.status(400).json({ message: "Enter a valid listing ID." });
    }
  });

  /**
   * Returns requests sent by the logged-in borrower.
   * @route GET /api/requests/my
   * @access Private
   */
  router.get("/my", requireAuth, async (req, res) => {
    res.json(await requests.find({ borrowerId: req.userId }).sort({ createdAt: -1 }).toArray());
  });

  /**
   * Returns requests received by the logged-in item owner.
   * @route GET /api/requests/received
   * @access Private
   */
  router.get("/received", requireAuth, async (req, res) => {
    res.json(await requests.find({ ownerId: req.userId }).sort({ createdAt: -1 }).toArray());
  });

  /**
   * Lets the item owner change a request's status.
   * @route PUT /api/requests/:id/status
   * @access Private
   */
  router.put("/:id/status", requireAuth, async (req, res) => {
    try {
      const status = req.body.status;
      if (!statuses.includes(status)) return res.status(400).json({ message: "Invalid request status." });

      const result = await requests.updateOne(
        { _id: new ObjectId(req.params.id), ownerId: req.userId },
        { $set: { status, updatedAt: new Date() } }
      );

      if (!result.matchedCount) return res.status(404).json({ message: "Request not found or not yours." });
      res.json({ message: `Request marked ${status}.` });
    } catch (error) {
      res.status(400).json({ message: "Invalid request ID." });
    }
  });

  return router;
}

module.exports = createRequestRouter;
