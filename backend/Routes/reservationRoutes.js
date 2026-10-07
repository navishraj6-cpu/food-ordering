const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");
const { sendReservationConfirmationEmail } = require("../utils/notificationService");

// Standard Table definitions in the restaurant
const RESTAURANT_TABLES = [
  {
    tableNumber: "T-1",
    tableName: "Patio Garden View Table",
    seatingArea: "Rooftop Terrace Patio",
    capacity: 2,
    ambiance: "Open-air starry sky & lush botanical greenery",
  },
  {
    tableNumber: "T-2",
    tableName: "Rooftop Skyline Terrace Table",
    seatingArea: "Rooftop Terrace Patio",
    capacity: 4,
    ambiance: "Panoramic skyline views & gentle evening breeze",
  },
  {
    tableNumber: "T-3",
    tableName: "Grand Hall Center Table",
    seatingArea: "Main Dining Grand Hall",
    capacity: 4,
    ambiance: "Artisan chandelier ambiance & live acoustic music",
  },
  {
    tableNumber: "T-4",
    tableName: "Grand Hall Window Booth",
    seatingArea: "Main Dining Grand Hall",
    capacity: 4,
    ambiance: "Cozy velvet banquet seating overlooking the avenue",
  },
  {
    tableNumber: "T-5",
    tableName: "Chef's Exhibition Table",
    seatingArea: "Main Dining Grand Hall",
    capacity: 6,
    ambiance: "Direct view of open flame artisan cooking kitchen",
  },
  {
    tableNumber: "T-6",
    tableName: "Family Banquet Table",
    seatingArea: "Main Dining Grand Hall",
    capacity: 8,
    ambiance: "Spacious round mahogany dining table for large gatherings",
  },
  {
    tableNumber: "T-7",
    tableName: "Romance Candlelight Corner",
    seatingArea: "Candlelight Romance Corner",
    capacity: 2,
    ambiance: "Secluded candlelight setting with rose petal decor",
  },
  {
    tableNumber: "T-8",
    tableName: "Lovers Intimate Alcove",
    seatingArea: "Candlelight Romance Corner",
    capacity: 2,
    ambiance: "Dim ambient lighting & private velvet curtain separation",
  },
  {
    tableNumber: "T-9",
    tableName: "Executive Boardroom Table",
    seatingArea: "Private VIP Executive Lounge",
    capacity: 6,
    ambiance: "Sound-isolated private dining with presentation screen",
  },
  {
    tableNumber: "T-10",
    tableName: "Royale Velvet Suite Booth",
    seatingArea: "Private VIP Executive Lounge",
    capacity: 4,
    ambiance: "Plush leather seating with personal butler service",
  },
  {
    tableNumber: "T-11",
    tableName: "Presidential VIP Chamber",
    seatingArea: "Private VIP Executive Lounge",
    capacity: 8,
    ambiance: "Ultra-luxury salon with customized tasting menu option",
  },
  {
    tableNumber: "T-12",
    tableName: "Sommelier Wine Vault Table",
    seatingArea: "Private VIP Executive Lounge",
    capacity: 6,
    ambiance: "Surrounded by vintage oak barrels & curated cellar wines",
  },
];

// @desc    Get all table structures & check availability
// @route   GET /api/reservations/availability
// @access  Public
router.get("/availability", async (req, res) => {
  try {
    const { date, timeSlot } = req.query;
    if (!date || !timeSlot) {
      return res.json({
        success: true,
        allTables: RESTAURANT_TABLES,
        bookedTableNumbers: [],
      });
    }

    const existingBookings = await Reservation.find({
      date,
      timeSlot,
      status: { $ne: "cancelled" },
    }).select("tableNumber tableNumbers guestName status");

    const bookedTableNumbers = [];
    existingBookings.forEach((b) => {
      if (Array.isArray(b.tableNumbers) && b.tableNumbers.length > 0) {
        b.tableNumbers.forEach((t) => {
          if (t && !bookedTableNumbers.includes(t)) bookedTableNumbers.push(t);
        });
      } else if (b.tableNumber) {
        b.tableNumber.split(",").map((s) => s.trim()).forEach((t) => {
          if (t && !bookedTableNumbers.includes(t)) bookedTableNumbers.push(t);
        });
      }
    });

    res.json({
      success: true,
      allTables: RESTAURANT_TABLES,
      bookedTableNumbers,
      activeBookingsCount: bookedTableNumbers.length,
      availableCount: RESTAURANT_TABLES.length - bookedTableNumbers.length,
    });
  } catch (error) {
    console.error("Error checking table availability:", error);
    res.status(500).json({ message: "Server error checking table availability" });
  }
});

// @desc    Create a new table reservation (single or multiple tables)
// @route   POST /api/reservations
// @access  Public / Optional Auth
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      guestName,
      email,
      phone,
      date,
      timeSlot,
      guestCount,
      tableNumber,
      tableNumbers,
      selectedTables,
      tableName,
      seatingArea,
      occasion,
      specialRequests,
      preOrderItems,
    } = req.body;

    // Parse requested tables
    let requestedTableList = [];
    if (Array.isArray(selectedTables) && selectedTables.length > 0) {
      requestedTableList = selectedTables;
    } else if (Array.isArray(tableNumbers) && tableNumbers.length > 0) {
      requestedTableList = tableNumbers.map((num) => {
        const found = RESTAURANT_TABLES.find((t) => t.tableNumber === num);
        return found || { tableNumber: num, tableName: `Table ${num}`, seatingArea: "Main Dining Grand Hall", capacity: 2 };
      });
    } else if (tableNumber) {
      const nums = tableNumber.split(",").map((s) => s.trim()).filter(Boolean);
      requestedTableList = nums.map((num) => {
        const found = RESTAURANT_TABLES.find((t) => t.tableNumber === num);
        return found || { tableNumber: num, tableName: `Table ${num}`, seatingArea: "Main Dining Grand Hall", capacity: 2 };
      });
    }

    if (!guestName || !phone || !date || !timeSlot || requestedTableList.length === 0) {
      return res.status(400).json({ message: "All required reservation fields and at least one table must be selected." });
    }

    const requestedNumbers = requestedTableList.map((t) => t.tableNumber);

    // Check collision: Are ANY of the requested tables already booked for date & timeSlot?
    const existingBookings = await Reservation.find({
      date,
      timeSlot,
      status: { $ne: "cancelled" },
    });

    const conflictingTables = [];
    existingBookings.forEach((b) => {
      const bNums = Array.isArray(b.tableNumbers) && b.tableNumbers.length > 0
        ? b.tableNumbers
        : (b.tableNumber ? b.tableNumber.split(",").map((s) => s.trim()) : []);
      requestedNumbers.forEach((reqNum) => {
        if (bNums.includes(reqNum) && !conflictingTables.includes(reqNum)) {
          conflictingTables.push(reqNum);
        }
      });
    });

    if (conflictingTables.length > 0) {
      return res.status(409).json({
        message: `Table(s) ${conflictingTables.join(", ")} are already reserved for ${timeSlot} on ${date}. Please choose other available tables.`,
      });
    }

    // Generate unique Reservation ID
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const reservationId = `RES-${randomNum}`;

    const totalCapacity = requestedTableList.reduce((acc, t) => acc + (t.capacity || 2), 0);
    const seatingAreas = [...new Set(requestedTableList.map((t) => t.seatingArea))].join(" & ");
    const tableNamesCombined = requestedTableList.map((t) => t.tableName || `Table ${t.tableNumber}`).join(", ");

    const reservation = await Reservation.create({
      reservationId,
      user: req.user ? req.user._id : null,
      guestName: guestName.trim(),
      email: (email || "").trim(),
      phone: phone.trim(),
      date,
      timeSlot,
      guestCount: Number(guestCount) || 2,
      tableNumber: requestedNumbers.join(", "),
      tableNumbers: requestedNumbers,
      tables: requestedTableList,
      tableCount: requestedNumbers.length,
      totalCapacity,
      tableName: tableNamesCombined,
      seatingArea: seatingAreas || seatingArea || "Main Dining Grand Hall",
      occasion: occasion || "Casual Fine Dining",
      specialRequests: (specialRequests || "").trim(),
      status: "confirmed",
      preOrderItems: preOrderItems || [],
    });

    // Automatically send VIP table reservation confirmation email
    if (reservation.email) {
      sendReservationConfirmationEmail(reservation).catch((e) =>
        console.warn("Could not dispatch reservation confirmation email:", e.message)
      );
    }

    res.status(201).json({
      success: true,
      message: `${requestedNumbers.length} table(s) reserved successfully! Your digital VIP pass is ready.`,
      reservation,
    });
  } catch (error) {
    console.error("Error creating reservation:", error);
    res.status(500).json({ message: "Server error creating reservation", error: error.message });
  }
});

// @desc    Get all reservations for logged in user
// @route   GET /api/reservations/my-reservations
// @access  Private
router.get("/my-reservations", protect, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: reservations.length, reservations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user reservations" });
  }
});

// @desc    Get reservation by reservationId or mongo _id
// @route   GET /api/reservations/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let reservation;
    if (id.startsWith("RES-")) {
      reservation = await Reservation.findOne({ reservationId: id });
    } else {
      reservation = await Reservation.findById(id).catch(() => null);
      if (!reservation) {
        reservation = await Reservation.findOne({ reservationId: id });
      }
    }

    if (!reservation) {
      return res.status(404).json({ message: "Reservation booking not found." });
    }

    res.json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reservation details" });
  }
});

// @desc    Admin: Get all restaurant reservations
// @route   GET /api/reservations/all
// @access  Private / Admin Only
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const { date, status } = req.query;
    const filter = {};
    if (date) filter.date = date;
    if (status && status !== "all") filter.status = status;

    const reservations = await Reservation.find(filter).sort({ date: -1, timeSlot: 1 });
    res.json({ success: true, count: reservations.length, reservations });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin reservations" });
  }
});

// @desc    Admin: Update reservation status (seated, completed, cancelled)
// @route   PUT /api/reservations/:id/status
// @access  Private / Admin Only
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["confirmed", "seated", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid reservation status" });
    }

    let reservation;
    if (id.startsWith("RES-")) {
      reservation = await Reservation.findOne({ reservationId: id });
    } else {
      reservation = await Reservation.findById(id).catch(() => null);
      if (!reservation) {
        reservation = await Reservation.findOne({ reservationId: id });
      }
    }

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    reservation.status = status;
    await reservation.save();

    res.json({ success: true, message: `Reservation status updated to ${status}!`, reservation });
  } catch (error) {
    res.status(500).json({ message: "Failed to update reservation status" });
  }
});

module.exports = router;
