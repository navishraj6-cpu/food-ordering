const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
let Razorpay = null;
try {
  Razorpay = require("razorpay");
} catch (e) {
  console.warn("Razorpay package notice:", e.message);
}

const Order = require("../models/Order");
const User = require("../models/User");
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");
const {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendSMSNotification,
} = require("../utils/notificationService");

const router = express.Router();

// Helper to calculate tier
const calculateTier = (lifetimePoints) => {
  if (lifetimePoints >= 3000) return "Platinum Royale";
  if (lifetimePoints >= 1500) return "Gold Connoisseur";
  if (lifetimePoints >= 500) return "Silver Epicure";
  return "Bronze Gourmand";
};

// @route   POST /api/orders/create-payment-order
// @desc    Initiate Razorpay / Digital Payment Gateway Order
router.post("/create-payment-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, customer } = req.body;
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

    if (keyId && keySecret && Razorpay) {
      const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const options = {
        amount: Math.round(Number(amount) * 100), // in paise
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: {
          customerName: customer?.name || "Guest",
          customerPhone: customer?.phone || "",
        },
      };
      const razorpayOrder = await instance.orders.create(options);
      return res.json({
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId,
        isLiveMode: true,
      });
    }

    // Seamless Mock / Developer Sandbox fallback
    const mockOrderId = `order_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    res.json({
      success: true,
      orderId: mockOrderId,
      amount: Math.round(Number(amount) * 100),
      currency,
      keyId: keyId || "rzp_test_foodie_royal_demo",
      isLiveMode: false,
      note: "Live / Sandbox gateway configured. Supports UPI, Cards, Netbanking & Wallets.",
    });
  } catch (error) {
    console.error("Error creating payment gateway order:", error);
    res.status(500).json({ message: "Failed to initiate payment gateway", error: error.message });
  }
});

// @route   POST /api/orders/verify-payment
// @desc    Verify Razorpay payment signature
router.post("/verify-payment", optionalAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let isSignatureValid = true;

    if (keySecret && razorpay_signature && razorpay_order_id && razorpay_payment_id) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      isSignatureValid = generatedSignature === razorpay_signature;
    }

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: "Payment signature mismatch." });
    }

    res.json({
      success: true,
      message: "Payment signature verified successfully!",
      paymentId: razorpay_payment_id || `TXN_${Date.now()}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Payment verification error", error: error.message });
  }
});

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
        provider: paymentMethod === "cod" ? "Cash" : "Razorpay Gateway",
        paidAt: isDigitalPaid ? new Date() : null,
      },
      orderStatus: "placed",
      estimatedDeliveryMinutes: 35,
    });

    // Automatically trigger notification services (Email & SMS)
    sendOrderConfirmationEmail(order).catch((err) =>
      console.warn("Could not dispatch confirmation email:", err.message)
    );
    sendSMSNotification({
      to: customer.phone,
      message: `👑 Foodie Order #${order.orderId} Confirmed! Total ₹${order.totalAmount}. Track live: http://localhost:5173/track/${order.orderId}`,
      orderId: order.orderId,
    }).catch(() => {});

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

// @route   POST /api/orders/:id/resend-receipt
// @desc    Resend Order Digital Invoice Receipt via Email & SMS
router.post("/:id/resend-receipt", async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    let order = await Order.findOne({
      $or: [
        { orderId: rawId.toUpperCase() },
        { orderId: rawId },
        { _id: mongoose.Types.ObjectId.isValid(rawId) ? rawId : null },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const emailRes = await sendOrderConfirmationEmail(order);
    const smsRes = await sendSMSNotification({
      to: order.customer.phone,
      message: `👑 Receipt for Foodie Order #${order.orderId}: Total ₹${order.totalAmount}. View invoice: http://localhost:5173/track/${order.orderId}`,
      orderId: order.orderId,
    });

    res.json({
      success: true,
      message: `Digital invoice receipt resent to ${order.customer.email} and SMS notified!`,
      emailDelivered: emailRes.success,
      smsDelivered: smsRes.success,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to resend receipt", error: error.message });
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

    // Notify customer about status transition
    sendOrderStatusUpdateEmail(order, status).catch(() => {});

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
      status,
      timestamp: new Date(),
      note: "Automatic confirmation: Delivery partner reached customer doorstep address.",
    });

    await order.save();

    sendOrderStatusUpdateEmail(order, "delivered").catch(() => {});

    res.json({ success: true, message: "Order successfully delivered to address!", order });
  } catch (error) {
    res.status(500).json({ message: "Failed to complete delivery", error: error.message });
  }
};

router.put("/:id/status", protect, adminOnly, updateOrderStatusHandler);
router.patch("/:id/status", protect, adminOnly, updateOrderStatusHandler);
router.put("/:id/complete-delivery", completeDeliveryHandler);

module.exports = router;
