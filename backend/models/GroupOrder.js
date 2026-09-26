const mongoose = require("mongoose");

const GroupMemberSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: "👑" },
  isHost: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
});

const GroupItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  foodId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  image: { type: String, default: "" },
  category: { type: String, default: "" },
  addedBy: {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  addedAt: { type: Date, default: Date.now },
});

const GroupOrderSchema = new mongoose.Schema(
  {
    groupCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      default: "Royal Party Feast",
    },
    host: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    deliveryAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },
    members: [GroupMemberSchema],
    items: [GroupItemSchema],
    spendingLimit: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["open", "locked", "ordered"],
      default: "open",
    },
    finalOrderId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroupOrder", GroupOrderSchema);
