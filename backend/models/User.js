const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema({
  label: { type: String, default: "Home" },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: "" },
  pincode: { type: String, default: "" },
  phone: { type: String, default: "" },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    phone: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    addresses: [addressSchema],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Food" }],
    loyaltyPoints: {
      type: Number,
      default: 150,
    },
    lifetimePointsEarned: {
      type: Number,
      default: 150,
    },
    tier: {
      type: String,
      enum: ["Bronze Gourmand", "Silver Epicure", "Gold Connoisseur", "Platinum Royale"],
      default: "Bronze Gourmand",
    },
    dailyStreak: {
      count: { type: Number, default: 1 },
      lastClaimDate: { type: Date, default: null },
    },
    scratchCards: [
      {
        id: { type: String, required: true },
        title: { type: String, default: "Artisan Gold Reward" },
        prizeType: { type: String, enum: ["points", "coupon", "dessert"], default: "points" },
        prizeValue: { type: Number, default: 50 },
        prizeName: { type: String, default: "50 Bonus Foodie Gold Coins" },
        promoCode: { type: String, default: "" },
        isClaimed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    pointsHistory: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          enum: ["earned_order", "redeemed_order", "scratch_card", "daily_streak", "welcome_bonus"],
          default: "welcome_bonus",
        },
        points: { type: Number, required: true },
        description: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Encrypt password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
