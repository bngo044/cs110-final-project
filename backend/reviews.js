const express = require("express");
const { ObjectId } = require("mongodb");

/**
 * Creates the route for reviewing a completed borrowing request.
 *
 * @param {import("mongodb").Collection} reviews - MongoDB reviews collection.
 * @param {import("mongodb").Collection} requests - MongoDB borrowing requests collection.
 * @param {import("mongodb").Collection} users - MongoDB users collection.
 * @param {import("express").RequestHandler} requireAuth - Middleware that verifies login tokens.
 * @returns {import("express").Router} The review router.
 */
function createReviewRouter(reviews, requests, users, requireAuth) {
  const router = express.Router();

  /**
   * Returns all reviews connected to borrowing requests for one item.
   * @route GET /api/reviews/item/:itemId
   * @access Public
   */
  router.get("/item/:itemId", async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.itemId)) {
        return res.status(400).json({ message: "Invalid item ID." });
      }

      const itemRequests = await requests
        .find({ itemId: new ObjectId(req.params.itemId) })
        .toArray();
      const requestIds = itemRequests.map((request) => request._id);

      if (!requestIds.length) return res.json([]);

      const itemReviews = await reviews
        .find({ requestId: { $in: requestIds } })
        .sort({ createdAt: -1 })
        .toArray();

      const reviewsWithNames = await Promise.all(
        itemReviews.map(async (review) => {
          const reviewer = await users.findOne(
            { _id: review.reviewerId },
            { projection: { name: 1, username: 1 } }
          );

          return {
            ...review,
            reviewerName: reviewer?.name || reviewer?.username || "CampusShare user"
          };
        })
      );

      res.json(reviewsWithNames);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not load item reviews." });
    }
  });

  /**
   * Adds one rating and comment after a request is marked Returned.
   * @route POST /api/reviews
   * @access Private
   */
  router.post("/", requireAuth, async (req, res) => {
    try {
      const requestId = new ObjectId(req.body.requestId);
      const rating = Number(req.body.rating);
      const request = await requests.findOne({
        _id: requestId,
        borrowerId: req.userId,
        status: "Returned"
      });

      if (!request) return res.status(400).json({ message: "Complete the request before reviewing." });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be from 1 to 5." });
      }
      if (await reviews.findOne({ requestId })) {
        return res.status(409).json({ message: "This request was already reviewed." });
      }

      await reviews.insertOne({
        requestId,
        reviewerId: req.userId,
        userId: request.ownerId,
        rating,
        comment: (req.body.comment || "").trim(),
        createdAt: new Date()
      });

      const allRatings = await reviews.find({ userId: request.ownerId }).toArray();
      const averageRating = allRatings.reduce((sum, review) => sum + review.rating, 0) / allRatings.length;
      await users.updateOne({ _id: request.ownerId }, { $set: { averageRating } });

      res.status(201).json({ message: "Review added." });
    } catch (error) {
      res.status(400).json({ message: "Invalid review data." });
    }
  });

  return router;
}

module.exports = createReviewRouter;
