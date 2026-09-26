const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Helper to calculate tier
const calculateTier = (lifetimePoints) => {
  if (lifetimePoints >= 3000) return "Platinum Royale";
  if (lifetimePoints >= 1500) return "Gold Connoisseur";
  if (lifetimePoints >= 500) return "Silver Epicure";
  return "Bronze Gourmand";
};

// @route   POST /api/orders
// @desc    Create a new order
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      customer,
      items,
      deliveryAddress,
      subtotal,
      tax,
      deliveryFee,
      discount,
      couponApplied,
      totalAmount,
      paymentMethod,
      paymentStatus,
      transactionId,
      paymentDetails,
      redeemedPoints,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty. Cannot create order." });
    }

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({ message: "Customer contact info is required." });
    }

    if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city) {
      return res.status(400).json({ message: "Delivery address is required." });
    }

    const isDigitalPaid =
      paymentMethod !== "cod" &&
      (paymentStatus === "completed" || Boolean(transactionId));

    const order = await Order.create({
      user: req.user ? req.user._id : null,
      customer,
      items,
      deliveryAddress,
      subtotal: Number(subtotal) || 0,
      tax: Number(tax) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      discount: Number(discount) || 0,
      couponApplied: couponApplied || "",
      totalAmount: Number(totalAmount) || 0,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: isDigitalPaid ? "completed" : "pending",
      transactionId: transactionId || (isDigitalPaid ? "TXN_" + Date.now() : ""),
      paymentDetails: paymentDetails || {
        method: paymentMethod || "cod",
        provider: paymentMethod === "cod" ? "Cash" : "Payment Gateway",
        paidAt: isDigitalPaid ? new Date() : null,
      },
      orderStatus: "placed",
      estimatedDeliveryMinutes: 35,
    });

    // Loyalty Rewards processing if user is authenticated
    let pointsEarned = 0;
    let awardedScratchCard = null;

    if (req.user) {
      try {
        const user = await User.findById(req.user._id);
        if (user) {
          // 1. Process points redemption if any
          if (redeemedPoints && Number(redeemedPoints) > 0) {
            const ptsToDeduct = Math.min(Number(redeemedPoints), user.loyaltyPoints || 0);
            user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - ptsToDeduct);
            user.pointsHistory.unshift({
              id: `ph_red_${Date.now()}`,
              type: "redeemed_order",
              points: -ptsToDeduct,
              description: `Redeemed ${ptsToDeduct} pts on Order #${order.orderId}`,
              createdAt: new Date(),
            });
          }

          // 2. Calculate points earned on the order
          let multiplier = 1.0;
          if (user.tier === "Silver Epicure") multiplier = 1.25;
          if (user.tier === "Gold Connoisseur") multiplier = 1.5;
          if (user.tier === "Platinum Royale") multiplier = 2.0;

          const basePoints = Math.max(10, Math.floor((Number(totalAmount) || 0) / 10));
          pointsEarned = Math.round(basePoints * multiplier);

          user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsEarned;
          user.lifetimePointsEarned = (user.lifetimePointsEarned || 0) + pointsEarned;
          user.tier = calculateTier(user.lifetimePointsEarned);

          user.pointsHistory.unshift({
            id: `ph_ord_${Date.now()}`,
            type: "earned_order",
            points: pointsEarned,
            description: `Earned from Order #${order.orderId} (${user.tier} ${multiplier}x)`,
            createdAt: new Date(),
          });

          // 3. Grant bonus Scratch Card for orders over ₹250
          if (Number(totalAmount) >= 250) {
            awardedScratchCard = {
              id: `sc_ord_${Date.now()}`,
              title: "🎉 Order Celebration Scratch Card",
              prizeType: "points",
              prizeValue: Math.floor(Math.random() * 50) + 50, // 50 to 100 points
              prizeName: "Bonus Foodie Gold Coins",
              promoCode: "",
              isClaimed: false,
              createdAt: new Date(),
            };
            user.scratchCards.unshift(awardedScratchCard);
          }

          await user.save();
        }
      } catch (loyaltyErr) {
        console.warn("Could not process loyalty rewards for order:", loyaltyErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
      pointsEarned,
      awardedScratchCard,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
});

// @route   GET /api/orders/my-orders
// @desc    Get all orders for logged-in user (matches user ID, email, and phone)
router.get("/my-orders", protect, async (req, res) => {
  try {
    const user = req.user;
    const orConditions = [{ user: user._id }];
    
    if (user.email && user.email.trim()) {
      orConditions.push({ "customer.email": user.email.trim() });
    }
    if (user.phone && user.phone.trim()) {
      orConditions.push({ "customer.phone": user.phone.trim() });
    }

    const orders = await Order.find({ $or: orConditions }).sort({ createdAt: -1 });

    // Auto-link any guest orders matched by email or phone to this user account
    const unlinkedOrderIds = orders.filter((o) => !o.user).map((o) => o._id);
    if (unlinkedOrderIds.length > 0) {
      await Order.updateMany({ _id: { $in: unlinkedOrderIds } }, { $set: { user: user._id } });
    }

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your orders", error: error.message });
  }
});

// @route   POST /api/orders/lookup-batch
// @desc    Lookup orders by array of order IDs, phone, or email (Public / Guest accessible)
router.post("/lookup-batch", async (req, res) => {
  try {
    const { orderIds = [], phone = "", email = "" } = req.body;
    const orConditions = [];

    if (Array.isArray(orderIds) && orderIds.length > 0) {
      const cleanIds = orderIds.map((id) => String(id).trim()).filter(Boolean);
      const regexPatterns = cleanIds.map((id) => new RegExp(`^${id}$`, "i"));
      orConditions.push({ orderId: { $in: regexPatterns } });

      const validObjectIds = cleanIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validObjectIds.length > 0) {
        orConditions.push({ _id: { $in: validObjectIds } });
      }
    }

    if (phone && phone.trim()) {
      orConditions.push({ "customer.phone": phone.trim() });
      orConditions.push({ "customer.phone": { $regex: phone.trim(), $options: "i" } });
    }

    if (email && email.trim()) {
      orConditions.push({ "customer.email": email.trim().toLowerCase() });
    }

    if (orConditions.length === 0) {
      return res.json({ success: true, count: 0, orders: [] });
    }

    const orders = await Order.find({ $or: orConditions }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to lookup orders", error: error.message });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get stats for admin overview
router.get("/stats/summary", protect, adminOnly, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const activeOrders = await Order.countDocuments({
      orderStatus: { $in: ["placed", "confirmed", "preparing", "out_for_delivery"] },
    });
    const deliveredOrders = await Order.countDocuments({ orderStatus: "delivered" });

    const totalRevenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0] ? totalRevenueAgg[0].total : 0;

    res.json({
      success: true,
      stats: {
        totalOrders,
        activeOrders,
        deliveredOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
});

// @route   GET /api/orders/all
// @desc    Admin: get all orders with optional filter
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = {};
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order details by orderId or _id (Case-insensitive, ObjectId & prefix resilient)
router.get("/:id", async (req, res) => {
  try {
    const rawId = req.params.id ? req.params.id.trim() : "";
    if (!rawId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    let order = null;

    // 1. Direct or case-insensitive orderId match (e.g. ORD-123456 or ord-123456)
    order = await Order.findOne({
      $or: [
        { orderId: rawId.toUpperCase() },
        { orderId: rawId },
        { orderId: { $regex: new RegExp(`^${rawId}$`, "i") } },
      ],
    });

    // 2. If not found and is 6 numeric digits (e.g. 217836), check ORD-217836
    if (!order && /^\d{4,8}$/.test(rawId)) {
      order = await Order.findOne({
        orderId: { $regex: new RegExp(`ORD-${rawId}$`, "i") },
      });
    }

    // 3. If not found and is valid Mongo ObjectId, query by _id
    if (!order && mongoose.Types.ObjectId.isValid(rawId)) {
      order = await Order.findById(rawId).catch(() => null);
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
});

// @route   PUT/PATCH /api/orders/:id/status
// @desc    Admin: Update order status
const updateOrderStatusHandler = async (req, res) => {
  try {
    const { status, note } = req.body;
    const { id } = req.params;
    const validStatuses = [
      "placed",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    let order;
    if (id.startsWith("ORD-")) {
      order = await Order.findOne({ orderId: id });
    } else {
      order = await Order.findById(id).catch(() => null);
      if (!order) {
        order = await Order.findOne({ orderId: id });
      }
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order updated to ${status.replace(/_/g, " ")}.`,
    });

    if (status === "delivered") {
      order.paymentStatus = "completed";
    }

    await order.save();
    res.json({ success: true, message: "Order status updated!", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to update order status", error: error.message });
  }
};

// @route   PUT /api/orders/:id/complete-delivery
// @desc    Autonomous / Dispatcher: Mark order delivered when bike reaches destination address
const completeDeliveryHandler = async (req, res) => {
  try {
    const { id } = req.params;
    let order;
    if (id.startsWith("ORD-")) {
      order = await Order.findOne({ orderId: id });
    } else {
      order = await Order.findById(id).catch(() => null);
      if (!order) {
        order = await Order.findOne({ orderId: id });
      }
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = "delivered";
    order.paymentStatus = "completed";
    order.statusHistory.push({
      status: "delivered",
      timestamp: new Date(),
      note: "Automatic confirmation: Delivery partner reached customer doorstep address.",
    });

    await order.save();
    res.json({ success: true, message: "Order successfully delivered to address!", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to complete delivery", error: error.message });
  }
};

router.put("/:id/status", protect, adminOnly, updateOrderStatusHandler);
router.patch("/:id/status", protect, adminOnly, updateOrderStatusHandler);
router.put("/:id/complete-delivery", completeDeliveryHandler);

module.exports = router;
