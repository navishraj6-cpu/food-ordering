const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.Mixed },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  image: { type: String },
  category: { type: String },
  description: { type: String, default: "" },
  specialInstructions: { type: String, default: "" },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      "placed",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      default: () => "ORD-" + Math.floor(100000 + Math.random() * 900000),
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    items: [orderItemSchema],
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      instructions: { type: String, default: "" },
    },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponApplied: { type: String, default: "" },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["cod", "upi", "card", "netbanking"],
      default: "cod",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    transactionId: {
      type: String,
      default: "",
    },
    paymentDetails: {
      method: { type: String, default: "" },
      provider: { type: String, default: "" },
      upiId: { type: String, default: "" },
      cardLast4: { type: String, default: "" },
      cardHolder: { type: String, default: "" },
      cardBrand: { type: String, default: "" },
      bankName: { type: String, default: "" },
      paidAt: { type: Date, default: null },
    },
    orderStatus: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },
    estimatedDeliveryMinutes: {
      type: Number,
      default: 35,
    },
    statusHistory: [statusHistorySchema],
  },
  { timestamps: true }
);

// Push initial status to history on create
orderSchema.pre("save", function () {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      note: "Order placed successfully by customer.",
    });
  }
});

module.exports = mongoose.model("Order", orderSchema);
