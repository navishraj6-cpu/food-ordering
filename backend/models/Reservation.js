const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestName: {
      type: String,
      required: [true, "Guest name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    date: {
      type: String, // format: "YYYY-MM-DD"
      required: [true, "Reservation date is required"],
    },
    timeSlot: {
      type: String, // e.g. "07:30 PM"
      required: [true, "Time slot is required"],
    },
    guestCount: {
      type: Number,
      required: [true, "Guest count is required"],
      min: 1,
      max: 20,
      default: 2,
    },
    tableNumber: {
      type: String, // e.g. "T-1" or "T-1, T-2, T-3"
      required: true,
    },
    tableNumbers: {
      type: [String], // array of individual table numbers e.g. ["T-1", "T-2"]
      default: [],
    },
    tables: [
      {
        tableNumber: String,
        tableName: String,
        seatingArea: String,
        capacity: Number,
      },
    ],
    tableCount: {
      type: Number,
      default: 1,
    },
    totalCapacity: {
      type: Number,
      default: 2,
    },
    tableName: {
      type: String,
      default: "Grand Dining Table",
    },
    seatingArea: {
      type: String,
      default: "Main Dining Grand Hall",
    },
    occasion: {
      type: String,
      enum: [
        "Casual Fine Dining",
        "Romantic Date / Candlelight",
        "Birthday Celebration",
        "Anniversary Dinner",
        "Business Meeting / Corporate",
        "Family Feast",
      ],
      default: "Casual Fine Dining",
    },
    specialRequests: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["confirmed", "seated", "completed", "cancelled"],
      default: "confirmed",
    },
    preOrderItems: [
      {
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
