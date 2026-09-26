const express = require("express");
const GroupOrder = require("../models/GroupOrder");
const Order = require("../models/Order");

const router = express.Router();

// Generate unique group code like GRP-83921
const generateGroupCode = () => {
  return "GRP-" + Math.floor(10000 + Math.random() * 90000);
};

// @route   POST /api/group-orders/create
// @desc    Create a new group ordering session
router.post("/create", async (req, res) => {
  try {
    const { hostName, hostPhone, hostEmail, title, street, city, pincode, spendingLimit } = req.body;

    if (!hostName || !hostName.trim()) {
      return res.status(400).json({ message: "Host name is required" });
    }

    const hostId = "user_" + Date.now();
    const groupCode = generateGroupCode();

    const newGroup = await GroupOrder.create({
      groupCode,
      title: title?.trim() || "Royal Party Feast",
      host: {
        id: hostId,
        name: hostName.trim(),
        phone: hostPhone?.trim() || "",
        email: hostEmail?.trim() || "",
      },
      deliveryAddress: {
        street: street?.trim() || "Royal Banquet Hall",
        city: city?.trim() || "Central City",
        pincode: pincode?.trim() || "560001",
      },
      members: [
        {
          id: hostId,
          name: hostName.trim(),
          avatar: "👑",
          isHost: true,
        },
      ],
      items: [],
      spendingLimit: Number(spendingLimit) || 0,
      status: "open",
    });

    res.status(201).json({
      success: true,
      message: "Group order created successfully!",
      groupOrder: newGroup,
      hostId,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create group order", error: error.message });
  }
});

// @route   GET /api/group-orders/:code
// @desc    Get group order details by code
router.get("/:code", async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const group = await GroupOrder.findOne({ groupCode: code });

    if (!group) {
      return res.status(404).json({ message: "Group order not found" });
    }

    res.json({ success: true, groupOrder: group });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch group order", error: error.message });
  }
});

// @route   POST /api/group-orders/:code/join
// @desc    Join an existing group order
router.post("/:code/join", async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const { name, avatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required to join" });
    }

    const group = await GroupOrder.findOne({ groupCode: code });
    if (!group) {
      return res.status(404).json({ message: "Group order not found" });
    }

    if (group.status !== "open") {
      return res.status(400).json({ message: "Group order is locked or already placed." });
    }

    const memberId = "mbr_" + Date.now();
    const newMember = {
      id: memberId,
      name: name.trim(),
      avatar: avatar || "🍔",
      isHost: false,
    };

    group.members.push(newMember);
    await group.save();

    res.json({
      success: true,
      message: "Joined group order successfully!",
      groupOrder: group,
      memberId,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to join group", error: error.message });
  }
});

// @route   POST /api/group-orders/:code/add-item
// @desc    Add an item to group cart
router.post("/:code/add-item", async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const { foodId, name, price, image, category, memberId, memberName, quantity = 1 } = req.body;

    if (!name || !price || !memberId) {
      return res.status(400).json({ message: "Incomplete item or member info" });
    }

    const group = await GroupOrder.findOne({ groupCode: code });
    if (!group) return res.status(404).json({ message: "Group order not found" });

    if (group.status !== "open") {
      return res.status(400).json({ message: "Group order is locked" });
    }

    // Check if member already has this item in group cart, if so increment quantity
    const existingIdx = group.items.findIndex(
      (item) => item.name === name && item.addedBy?.id === memberId
    );

    if (existingIdx >= 0) {
      group.items[existingIdx].quantity += Number(quantity);
    } else {
      group.items.push({
        id: "item_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        foodId: foodId || "",
        name,
        price: Number(price),
        quantity: Number(quantity),
        image: image || "",
        category: category || "",
        addedBy: {
          id: memberId,
          name: memberName || "Party Member",
        },
      });
    }

    await group.save();
    res.json({ success: true, message: "Item added to group feast!", groupOrder: group });
  } catch (error) {
    res.status(500).json({ message: "Failed to add item", error: error.message });
  }
});

// @route   POST /api/group-orders/:code/remove-item
// @desc    Remove an item from group cart
router.post("/:code/remove-item", async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const { itemId } = req.body;

    const group = await GroupOrder.findOne({ groupCode: code });
    if (!group) return res.status(404).json({ message: "Group order not found" });

    group.items = group.items.filter((item) => item.id !== itemId && item._id?.toString() !== itemId);
    await group.save();

    res.json({ success: true, message: "Item removed", groupOrder: group });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove item", error: error.message });
  }
});

// @route   POST /api/group-orders/:code/toggle-lock
// @desc    Host: Toggle lock group order
router.post("/:code/toggle-lock", async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const group = await GroupOrder.findOne({ groupCode: code });
    if (!group) return res.status(404).json({ message: "Group order not found" });

    group.status = group.status === "open" ? "locked" : "open";
    await group.save();

    res.json({ success: true, message: `Group is now ${group.status}`, groupOrder: group });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle lock", error: error.message });
  }
});

// @route   POST /api/group-orders/:code/checkout
// @desc    Host: Convert group order into final order
router.post("/:code/checkout", async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const { paymentMethod = "cod" } = req.body;

    const group = await GroupOrder.findOne({ groupCode: code });
    if (!group) return res.status(404).json({ message: "Group order not found" });

    if (group.items.length === 0) {
      return res.status(400).json({ message: "Cannot place order: Group cart is empty" });
    }

    const subtotal = group.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.05);
    const deliveryFee = 40;
    const totalAmount = subtotal + tax + deliveryFee;

    const newOrder = await Order.create({
      customer: {
        name: `${group.host.name} (Party Host - ${group.members.length} Guests)`,
        email: group.host.email || `${group.groupCode.toLowerCase()}@foodie.party`,
        phone: group.host.phone || "9876543210",
      },
      items: group.items.map((i) => ({
        foodId: i.foodId,
        name: `${i.name} (for ${i.addedBy?.name})`,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        category: i.category,
      })),
      deliveryAddress: {
        street: group.deliveryAddress?.street || "Royal Banquet Hall",
        city: group.deliveryAddress?.city || "Central City",
        pincode: group.deliveryAddress?.pincode || "560001",
        instructions: `🎉 GROUP ORDER #${group.groupCode} (${group.members.length} People)`,
      },
      subtotal,
      tax,
      deliveryFee,
      discount: 0,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "completed",
      orderStatus: "placed",
      estimatedDeliveryMinutes: 40,
    });

    group.status = "ordered";
    group.finalOrderId = newOrder.orderId;
    await group.save();

    res.json({
      success: true,
      message: "Group order placed successfully!",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to checkout group order", error: error.message });
  }
});

module.exports = router;
