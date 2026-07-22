const express = require("express");
const { ObjectId } = require("mongodb");

/**
 * Creates routes for item listings.
 *
 * @param {import("mongodb").Collection} items - MongoDB listings collection.
 * @param {import("express").RequestHandler} requireAuth - Middleware that verifies login tokens.
 * @param {import("mongodb").Collection} users - MongoDB users collection.
 * @returns {import("express").Router} The item router.
 */
function createItemRouter(items, requireAuth, users) {
  const router = express.Router();

  async function addOwnerName(item) {
    if (!users || !item?.ownerId) return item;

    const owner = await users.findOne(
      { _id: item.ownerId },
      { projection: { name: 1, username: 1 } }
    );

    return {
      ...item,
      ownerName: owner?.name || owner?.username || "CampusShare user"
    };
  }

  /**
   * Creates a listing owned by the logged-in user.
   * @route POST /api/items
   * @access Private
   */
  router.post("/", requireAuth, async (req, res) => {
    try {
      const body = req.body || {};
      const title = (body.title || body.name || "").trim();
      const quantity = Number(body.quantity ?? 1);

      if (!title || !body.category || !body.pickupLocation) {
        return res.status(400).json({
          message: "Title, category, and pickup location are required."
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1." });
      }

      const item = {
        ownerId: req.userId,
        title,
        quantity,
        category: body.category.trim(),
        condition: (body.condition || "").trim(),
        description: (body.description || "").trim(),
        availability: body.availability !== false,
        pickupLocation: body.pickupLocation.trim(),
        listingType: body.listingType || "Borrow",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        createdAt: new Date()
      };

      const result = await items.insertOne(item);
      res.status(201).json({ message: "Listing created.", item: { ...item, _id: result.insertedId } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not create listing." });
    }
  });

  /**
   * Returns listings owned by the logged-in user.
   * This named route must come before /:id so "my" is not treated as an ID.
   * @route GET /api/items/my
   * @access Private
   */
  router.get("/my", requireAuth, async (req, res) => {
    try {
      const myItems = await items
        .find({ ownerId: req.userId })
        .sort({ createdAt: -1 })
        .toArray();

      res.json(myItems);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not load your listings." });
    }
  });

  /**
   * Fetches a specific listing by its ID.
   * @route GET /api/items/:id
   * @access Public
  */
  router.get("/:id", async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: "Item ID is required." });
      }

      const item = await items.findOne({ _id: new ObjectId(id) });
      if (!item) {
        return res.status(404).json({ message: "Item not found." });
      }

      res.json(await addOwnerName(item));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not fetch item." });
    }
  });

  /**
   * Returns listings that match optional keyword, category, and availability filters.
   * @route GET /api/items
   * @access Public
   */
  router.get("/", async (req, res) => {
    try {
      const filter = {};
      const keyword = (req.query.q || "").trim();

      if (keyword) {
        filter.$or = [
          { title: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
          { category: { $regex: keyword, $options: "i" } }
        ];
      }
      if (req.query.category) filter.category = req.query.category;
      if (req.query.available === "true") filter.availability = true;

      const foundItems = await items.find(filter).sort({ createdAt: -1 }).limit(50).toArray();
      res.json(await Promise.all(foundItems.map(addOwnerName)));
    } catch (error) {
      res.status(500).json({ message: "Could not search listings." });
    }
  });

  /**
   * Updates a listing only when it belongs to the logged-in user.
   * @route PUT /api/items/:id
   * @access Private
   */
  router.put("/:id", requireAuth, async (req, res) => {
    try {
      const update = { ...req.body, updatedAt: new Date() };
      delete update._id;
      delete update.ownerId;

      const result = await items.updateOne(
        { _id: new ObjectId(req.params.id), ownerId: req.userId },
        { $set: update }
      );

      if (!result.matchedCount) return res.status(404).json({ message: "Listing not found or not yours." });
      res.json({ message: "Listing updated." });
    } catch (error) {
      res.status(400).json({ message: "Invalid listing ID or data." });
    }
  });

  /**
   * Deletes a listing only when it belongs to the logged-in user.
   * @route DELETE /api/items/:id
   * @access Private
   */
  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      const result = await items.deleteOne({ _id: new ObjectId(req.params.id), ownerId: req.userId });
      if (!result.deletedCount) return res.status(404).json({ message: "Listing not found or not yours." });
      res.json({ message: "Listing deleted." });
    } catch (error) {
      res.status(400).json({ message: "Invalid listing ID." });
    }
  });

  return router;
}

module.exports = createItemRouter;
