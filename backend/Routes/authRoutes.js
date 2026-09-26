const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email, and password." });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone || "",
      role: role === "admin" ? "admin" : "user",
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        favorites: user.favorites,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter both email and password." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        favorites: user.favorites,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("favorites");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        favorites: user.favorites,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
});

// @route   POST /api/auth/address
// @desc    Add delivery address
router.post("/address", protect, async (req, res) => {
  try {
    const { label, street, city, state, pincode, phone, isDefault } = req.body;
    const user = await User.findById(req.user._id);

    if (isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    user.addresses.push({
      label: label || "Home",
      street,
      city,
      state: state || "",
      pincode: pincode || "",
      phone: phone || user.phone,
      isDefault: isDefault || user.addresses.length === 0,
    });

    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ message: "Failed to add address", error: error.message });
  }
});

// @route   POST /api/auth/favorites/:foodId
// @desc    Toggle favorite food item
router.post("/favorites/:foodId", protect, async (req, res) => {
  try {
    const { foodId } = req.params;
    const user = await User.findById(req.user._id);

    const index = user.favorites.indexOf(foodId);
    if (index > -1) {
      user.favorites.splice(index, 1);
    } else {
      user.favorites.push(foodId);
    }

    await user.save();
    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ message: "Failed to update favorites", error: error.message });
  }
});

module.exports = router;
