const express = require("express");
const { ObjectId } = require("mongodb");

/**
 * Creates routes for viewing and updating the logged-in user's profile.
 *
 * @param {import("mongodb").Collection} users - MongoDB users collection.
 * @param {import("mongodb").Collection} items - MongoDB listings collection.
 * @param {import("express").RequestHandler} requireAuth - Middleware that verifies login tokens.
 * @returns {import("express").Router} The profile router.
 */
function createProfileRouter(users, items, requireAuth) {
  const router = express.Router();

  /**
   * Returns the user's safe profile data and owned listings.
   * @route GET /api/profile/me
   * @access Private
   */
  router.get("/me", requireAuth, async (req, res) => {
    const user = await users.findOne(
      { _id: req.userId },
      { projection: { passwordHash: 0, salt: 0 } }
    );
    const listings = await items.find({ ownerId: req.userId }).toArray();
    res.json({ ...user, listings });
  });

  /**
   * Updates editable profile fields for the logged-in user.
   * @route PUT /api/profile/me
   * @access Private
   */
  router.put("/me", requireAuth, async (req, res) => {
    const body = req.body || {};
    const profile = {
      name: (body.name || "").trim(),
      profilePicture: (body.profilePicture || "").trim(),
      campusLocation: (body.campusLocation || "").trim(),
      bio: (body.bio || "").trim()
    };

    await users.updateOne({ _id: req.userId }, { $set: profile });
    res.json({ message: "Profile updated.", profile });
  });

  /**
   * Fetches a specific user's profile by their ID.
   * @route GET /api/profiles/:userId
   * @access Public
   */
  router.get("/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "User ID is required." });
      }

      const profileId = new ObjectId(userId);

      const user = await users.findOne(
        { _id: profileId },
        { projection: { passwordHash: 0, salt: 0, email: 0 } }
      );
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const listings = await items.find({ ownerId: profileId }).toArray();
      res.json({ ...user, listings });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not fetch user profile." });
    }
  });

  return router;
}

module.exports = createProfileRouter;
