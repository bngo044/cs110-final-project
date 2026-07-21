const express = require("express");

function createItemRouter(items) {
  const router = express.Router();

  router.post("/", async (req, res) => {
    try {
      const body = req.body || {};
      const name = (body.name || "").trim();
      const quantity = Number(body.quantity);
      const location = (body.location || "").trim();
      const requestType = body.requestType;
      const dueDate = new Date(body.dueDate);
      const allowedRequestTypes = ["Request", "Borrow", "Sell"];

      if (!name || !location || !requestType || !body.dueDate) {
        return res.status(400).json({
          message: "Complete all item fields."
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          message: "Quantity must be a whole number greater than zero."
        });
      }

      if (!allowedRequestTypes.includes(requestType)) {
        return res.status(400).json({
          message: "Type must be Request, Borrow, or Sell."
        });
      }

      if (Number.isNaN(dueDate.getTime())) {
        return res.status(400).json({
          message: "Enter a valid due date."
        });
      }

      const item = {
        name,
        quantity,
        location,
        requestType,
        dueDate,
        createdAt: new Date()
      };

      const result = await items.insertOne(item);

      res.status(201).json({
        message: "Item created successfully.",
        item: {
          id: result.insertedId,
          ...item
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Could not create item." });
    }
  });

  return router;
}

module.exports = createItemRouter;
