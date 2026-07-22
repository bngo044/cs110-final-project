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
  const REQUEST_STATUS = Object.freeze({
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
    RETURNED: "Returned"
  });
  const validStatuses = new Set(Object.values(REQUEST_STATUS));

  // MongoDB IDs may arrive as ObjectId instances or serialized strings.
  // Comparing their string forms keeps authorization checks consistent.
  function sameId(firstId, secondId) {
    return String(firstId) === String(secondId);
  }

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
      if (sameId(item.ownerId, req.userId)) {
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
        status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.ACCEPTED] }
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
        status: REQUEST_STATUS.PENDING,
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
      if (!validStatuses.has(status)) return res.status(400).json({ message: "Invalid request status." });

      const requestId = new ObjectId(req.params.id);
      const request = await requests.findOne({ _id: requestId });

      if (!request) return res.status(404).json({ message: "Request not found." });

      const isOwner = sameId(request.ownerId, req.userId);
      const isBorrower = sameId(request.borrowerId, req.userId);

      // Returning is the only transition controlled by the borrower. The
      // request must already be accepted, and returning reopens the listing.
      if (status === REQUEST_STATUS.RETURNED) {
        if (!isBorrower) {
          return res.status(403).json({ message: "Only the borrower can return this item." });
        }
        if (request.status !== REQUEST_STATUS.ACCEPTED) {
          return res.status(400).json({ message: "Only an accepted request can be returned." });
        }

        await requests.updateOne(
          { _id: requestId, borrowerId: req.userId, status: REQUEST_STATUS.ACCEPTED },
          { $set: { status: REQUEST_STATUS.RETURNED, updatedAt: new Date() } }
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
      if (![REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.REJECTED].includes(status) || request.status !== REQUEST_STATUS.PENDING) {
        return res.status(400).json({ message: "A pending request can only be accepted or rejected." });
      }

      // Reserve the item with a conditional update. Only one concurrent
      // acceptance can change availability from available to unavailable.
      if (status === REQUEST_STATUS.ACCEPTED) {
        const itemResult = await items.updateOne(
          { _id: request.itemId, availability: { $ne: false } },
          { $set: { availability: false, updatedAt: new Date() } }
        );

        if (!itemResult.modifiedCount) {
          return res.status(409).json({ message: "This item is already being borrowed." });
        }

        const acceptedResult = await requests.updateOne(
          { _id: requestId, ownerId: req.userId, status: REQUEST_STATUS.PENDING },
          { $set: { status: REQUEST_STATUS.ACCEPTED, updatedAt: new Date() } }
        );

        if (!acceptedResult.matchedCount) {
          return res.status(409).json({ message: "This request is no longer pending." });
        }

        // Once one borrower is selected, every competing pending request for
        // the same item must be rejected so no second borrower can be accepted.
        await requests.updateMany(
          {
            _id: { $ne: requestId },
            itemId: request.itemId,
            status: REQUEST_STATUS.PENDING
          },
          { $set: { status: REQUEST_STATUS.REJECTED, updatedAt: new Date() } }
        );

        return res.json({ message: "Request accepted. Other pending requests were rejected." });
      }

      // Rejection does not change item availability, so it only updates the
      // selected request after the owner and transition checks above pass.
      const result = await requests.updateOne(
        { _id: requestId, ownerId: req.userId, status: REQUEST_STATUS.PENDING },
        { $set: { status: REQUEST_STATUS.REJECTED, updatedAt: new Date() } }
      );

      if (!result.matchedCount) return res.status(404).json({ message: "Request not found or not yours." });

      res.json({ message: "Request marked Rejected." });
    } catch (error) {
      res.status(400).json({ message: "Invalid request ID." });
    }
  });

  return router;
}

module.exports = createRequestRouter;
