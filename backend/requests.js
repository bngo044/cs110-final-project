const express = require("express");
const { ObjectId } = require("mongodb");

/**
 * Creates routes for borrowing requests and request status updates.
 *
 * @param {import("mongodb").Collection} requests - MongoDB borrowing requests collection.
 * @param {import("mongodb").Collection} items - MongoDB listings collection.
 * @param {import("express").RequestHandler} requireAuth - Middleware that verifies login tokens.
 * @param {import("mongodb").Collection} users - MongoDB users collection.
 * @param {import("mongodb").Collection} reviews - MongoDB reviews collection.
 * @returns {import("express").Router} The request router.
 */
function createRequestRouter(requests, items, requireAuth, users, reviews) {
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
      if (String(item.ownerId) === String(req.userId)) {
        return res.status(400).json({ message: "You cannot request your own item." });
      }
      if (item.availability === false) {
        return res.status(400).json({ message: "This item is not currently available." });
      }

      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Enter valid borrowing dates." });
      }
      if (endDate <= startDate) {
        return res.status(400).json({ message: "Return date must be after the start date." });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        return res.status(400).json({ message: "Start date cannot be in the past." });
      }

      const existingRequest = await requests.findOne({
        itemId,
        borrowerId: req.userId,
        status: { $in: ["Pending", "Accepted"] }
      });
      if (existingRequest) {
        return res.status(409).json({ message: "You already have an active request for this item." });
      }

      const request = {
        itemId,
        borrowerId: req.userId,
        ownerId: item.ownerId,
        message: (req.body.message || "").trim(),
        startDate,
        endDate,
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
    try {
      const sentRequests = await requests
        .find({ borrowerId: req.userId })
        .sort({ createdAt: -1 })
        .toArray();

      const requestsWithDetails = await Promise.all(
        sentRequests.map(async (request) => {
          const item = await items.findOne({ _id: request.itemId });
          const owner = users
            ? await users.findOne(
                { _id: request.ownerId },
                { projection: { name: 1, username: 1 } }
              )
            : null;
          const existingReview = reviews
            ? await reviews.findOne({ requestId: request._id })
            : null;

          return {
            ...request,
            itemTitle: item?.title || "Borrowed Item",
            ownerName: owner?.name || owner?.username || "Campus Lender",
            isReviewed: Boolean(existingReview)
          };
        })
      );

      res.json(requestsWithDetails);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not load your requests." });
    }
  });

  /**
   * Returns requests received by the logged-in item owner.
   * @route GET /api/requests/received
   * @access Private
   */
  router.get("/received", requireAuth, async (req, res) => {
    try {
      const receivedRequests = await requests
        .find({ ownerId: req.userId })
        .sort({ createdAt: -1 })
        .toArray();

      const requestsWithNames = await Promise.all(
        receivedRequests.map(async (request) => {
          const borrower = users
            ? await users.findOne(
                { _id: request.borrowerId },
                { projection: { name: 1, username: 1 } }
              )
            : null;
          const item = await items.findOne({ _id: request.itemId });

          return {
            ...request,
            borrowerName: borrower?.name || borrower?.username || "CampusShare user",
            itemTitle: item?.title || "Requested Item"
          };
        })
      );

      res.json(requestsWithNames);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not load received requests." });
    }
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

      const requestId = new ObjectId(req.params.id);
      const request = await requests.findOne({ _id: requestId });

      if (!request) return res.status(404).json({ message: "Request not found." });

      const isOwner = String(request.ownerId) === String(req.userId);
      const isBorrower = String(request.borrowerId) === String(req.userId);

      if (status === "Returned") {
        if (!isBorrower) {
          return res.status(403).json({ message: "Only the borrower can return this item." });
        }
        if (request.status !== "Accepted") {
          return res.status(400).json({ message: "Only an accepted request can be returned." });
        }

        await requests.updateOne(
          { _id: requestId, borrowerId: req.userId, status: "Accepted" },
          { $set: { status: "Returned", updatedAt: new Date() } }
        );
        await items.updateOne(
          { _id: request.itemId },
          { $set: { availability: true, updatedAt: new Date() } }
        );

        return res.json({ message: "Item marked Returned." });
      }

      if (!isOwner) {
        return res.status(403).json({ message: "Only the item owner can update this request." });
      }
      if (!['Accepted', 'Rejected'].includes(status) || request.status !== "Pending") {
        return res.status(400).json({ message: "A pending request can only be accepted or rejected." });
      }

      const result = await requests.updateOne(
        { _id: requestId, ownerId: req.userId, status: "Pending" },
        { $set: { status, updatedAt: new Date() } }
      );

      if (!result.matchedCount) return res.status(404).json({ message: "Request not found or not yours." });

      if (status === "Accepted") {
        await items.updateOne(
          { _id: request.itemId },
          { $set: { availability: false, updatedAt: new Date() } }
        );
      }

      res.json({ message: `Request marked ${status}.` });
    } catch (error) {
      res.status(400).json({ message: "Invalid request ID." });
    }
  });

  return router;
}

module.exports = createRequestRouter;
