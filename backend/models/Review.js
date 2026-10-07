const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    foodId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    foodName: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    userName: {
      type: String,
      required: true,
      default: "Gourmet Connoisseur",
      trim: true,
    },
    userEmail: {
      type: String,
      default: "",
      trim: true,
    },
    userAvatar: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 5,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    recommended: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    orderId: {
      type: String,
      default: "",
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
