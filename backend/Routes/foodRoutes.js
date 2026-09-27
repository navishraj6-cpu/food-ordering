const express = require("express");
const Food = require("../models/food");

const router = express.Router();

const fallbackFoods = require("../data/fallbackFoods.json");

router.get("/", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.warn("Database not ready yet, serving fallback food items");
      return res.json(fallbackFoods);
    }
    const foods = await Food.find();
    if (!foods || foods.length === 0) {
      return res.json(fallbackFoods);
    }
    res.json(foods);
  } catch (error) {
    console.warn("Failed to get foods from DB, serving fallback:", error.message);
    res.json(fallbackFoods);
  }
});

router.post("/", async (req, res) => {
  try {
    const food = await Food.create(req.body);
    res.status(201).json(food);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid food data",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create food item",
      error: error.message,
    });
  }
});

router.put("/update-by-name", async (req, res) => {
  try {
    const { name, image, description, price, category, type } = req.body;
    const updateData = {};
    if (image !== undefined) updateData.image = image;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;
    if (type !== undefined) updateData.type = type;

    const updated = await Food.findOneAndUpdate({ name }, updateData, { new: true });
    res.json({ success: true, updated });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update food item",
      error: error.message,
    });
  }
});

router.post("/sync-all", async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Expected array of food items" });
    }
    const results = [];
    for (const item of items) {
      if (!item.name) continue;
      const updated = await Food.findOneAndUpdate(
        { name: item.name },
        {
          name: item.name,
          category: item.category,
          type: item.type,
          price: item.price,
          image: item.image,
          description: item.description,
        },
        { upsert: true, new: true }
      );
      results.push(updated);
    }
    res.json({ success: true, count: results.length, results });
  } catch (error) {
    res.status(500).json({
      message: "Failed to sync food items",
      error: error.message,
    });
  }
});

module.exports = router;