import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { API_URL } from "../config/api";
const API_BASE = `${API_URL}/api`;

const TIME_SLOTS = [
  { time: "12:30 PM", type: "Lunch" },
  { time: "01:15 PM", type: "Lunch" },
  { time: "02:00 PM", type: "Lunch" },
  { time: "07:00 PM", type: "Dinner" },
  { time: "07:30 PM", type: "Dinner", popular: true },
  { time: "08:15 PM", type: "Dinner", popular: true },
  { time: "09:00 PM", type: "Dinner" },
  { time: "09:45 PM", type: "Dinner" },
];

const OCCASIONS = [
  { value: "Casual Fine Dining", label: "🍽️ Casual Fine Dining" },
  { value: "Romantic Date / Candlelight", label: "🕯️ Romantic Date / Candlelight" },
  { value: "Birthday Celebration", label: "🎂 Birthday Celebration" },
  { value: "Anniversary Dinner", label: "💍 Anniversary Dinner" },
  { value: "Business Meeting / Corporate", label: "💼 Business Dinner / Corporate" },
  { value: "Family Feast", label: "👨‍👩‍👧‍👦 Family Celebration" },
];

export const ReservationPage = () => {
  const { user, token } = useAuth();

  // Step state: 1 = Slot & Map, 2 = Guest Info, 3 = Confirmed Digital Pass
  const [step, setStep] = useState(1);

  // Selected booking parameters
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState("07:30 PM");
  const [guestCount, setGuestCount] = useState(2);

  // Table availability & Multi-Table selection state
  // Table availability & Multi-Table selection state
  const [allTables, setAllTables] = useState([]);
  const [bookedTables, setBookedTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]); // Array of selected table objects
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Stored reservations for the current user (session + local storage + backend)
  const [myReservations, setMyReservations] = useState(() => {
    try {
      const saved = localStorage.getItem("foodie_user_reserved_tables");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCornerCardMinimized, setIsCornerCardMinimized] = useState(false);
  const [isCornerCardDismissed, setIsCornerCardDismissed] = useState(false);

  // Guest details form
  const [guestForm, setGuestForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    occasion: "Romantic Date / Candlelight",
    specialRequests: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmedReservation, setConfirmedReservation] = useState(null);

  // Total Capacity of all selected tables
  const totalSelectedCapacity = selectedTables.reduce(
    (acc, t) => acc + (t.capacity || 2),
    0
  );

  // Sync user's reservations from backend if logged in
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/reservations/my-reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.reservations)) {
            setMyReservations((prev) => {
              const combined = [...data.reservations];
              prev.forEach((p) => {
                if (!combined.some((c) => c.reservationId === p.reservationId)) {
                  combined.push(p);
                }
              });
              localStorage.setItem("foodie_user_reserved_tables", JSON.stringify(combined));
              return combined;
            });
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // Fetch table availability whenever date or slot changes
  const fetchAvailability = async () => {
    try {
      setLoadingAvailability(true);
      const res = await fetch(
        `${API_BASE}/reservations/availability?date=${selectedDate}&timeSlot=${encodeURIComponent(
          selectedSlot
        )}`
      );
      const data = await res.json();
      if (data.success) {
        setAllTables(data.allTables || []);
        setBookedTables(data.bookedTableNumbers || []);

        // Filter out any currently selected tables that became booked in this slot
        setSelectedTables((prev) =>
          prev.filter((t) => !(data.bookedTableNumbers || []).includes(t.tableNumber))
        );
      }
    } catch (err) {
      console.error("Failed to fetch availability:", err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [selectedDate, selectedSlot]);

  // Active reservations for currently selected date and time slot
  const myActiveReservationsForSlot = myReservations.filter(
    (r) => r.date === selectedDate && r.timeSlot === selectedSlot && r.status !== "cancelled"
  );

  // Table numbers booked by THIS user for this date & slot
  const myBookedTableNumbers = [];
  myActiveReservationsForSlot.forEach((r) => {
    if (Array.isArray(r.tableNumbers) && r.tableNumbers.length > 0) {
      r.tableNumbers.forEach((num) => {
        if (num && !myBookedTableNumbers.includes(num)) myBookedTableNumbers.push(num);
      });
    } else if (r.tableNumber) {
      r.tableNumber.split(",").map((s) => s.trim()).forEach((num) => {
        if (num && !myBookedTableNumbers.includes(num)) myBookedTableNumbers.push(num);
      });
    }
  });

  // Most relevant reservation to display in the corner card
  const cornerReservation =
    myActiveReservationsForSlot[0] ||
    confirmedReservation ||
    myReservations[0] ||
    null;

  // Handle Multi-Table Selection Toggle
  const handleTableToggle = (table) => {
    // If user clicks a table they already booked, open their VIP ticket pass
    if (myBookedTableNumbers.includes(table.tableNumber)) {
      const matchingRes = myActiveReservationsForSlot.find((r) => {
        const nums = Array.isArray(r.tableNumbers)
          ? r.tableNumbers
          : (r.tableNumber || "").split(",").map((s) => s.trim());
        return nums.includes(table.tableNumber);
      }) || cornerReservation;

      if (matchingRes) {
        setConfirmedReservation(matchingRes);
        setStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    if (bookedTables.includes(table.tableNumber)) return;
    setErrorMessage("");
    setSelectedTables((prev) => {
      const exists = prev.some((t) => t.tableNumber === table.tableNumber);
      if (exists) {
        return prev.filter((t) => t.tableNumber !== table.tableNumber);
      } else {
        return [...prev, table];
      }
    });
  };

  const handleRemoveSelectedTable = (tableNumber) => {
    setSelectedTables((prev) => prev.filter((t) => t.tableNumber !== tableNumber));
  };

  // Instant Offline HTML / Printable Ticket Download handler
  const handleDownloadTicket = () => {
    if (!confirmedReservation) return;

    const ticketHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>VIP_Pass_${confirmedReservation.reservationId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fdfbf7;
      color: #1a1a1a;
      padding: 32px 16px;
      display: flex;
      justify-content: center;
    }
    .pass-wrapper {
      width: 100%;
      max-width: 640px;
      background: #ffffff;
      border: 2px solid #064e3b;
      border-radius: 16px;
      padding: 36px 32px;
      box-shadow: 0 12px 36px rgba(0,0,0,0.1);
    }
    .header { text-align: center; border-bottom: 2px dashed #d4af37; padding-bottom: 22px; margin-bottom: 24px; }
    .brand-crest { font-size: 34px; color: #b8860b; line-height: 1; margin-bottom: 6px; }
    .brand-name { font-family: 'Cinzel', serif; font-size: 26px; font-weight: 800; color: #064e3b; letter-spacing: 2px; }
    .brand-sub { font-size: 11px; text-transform: uppercase; color: #856404; letter-spacing: 1.5px; font-weight: 700; margin-top: 3px; }
    .status-badge { display: inline-block; background: #064e3b; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 16px; border-radius: 20px; margin-top: 12px; }
    
    .code-box {
      background: #faf6ee;
      border: 1.5px solid #ebdcc5;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .code-sub { font-size: 11px; text-transform: uppercase; color: #856404; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 4px; }
    .code-id { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 800; color: #064e3b; letter-spacing: 3px; }
    
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; font-size: 13px; }
    .detail-card { background: #faf8f5; border: 1px solid #ebdcc5; border-radius: 8px; padding: 12px 14px; }
    .card-label { font-size: 11px; text-transform: uppercase; color: #856404; font-weight: 700; margin-bottom: 4px; display: block; }
    .card-value { font-size: 13.5px; font-weight: 700; color: #1a1a1a; }
    
    .notes-box { background: #faf6ee; border-left: 4px solid #064e3b; border-radius: 4px; padding: 12px 14px; margin-bottom: 24px; font-size: 13px; color: #333; }
    .notes-box strong { color: #064e3b; }
    
    .footer { border-top: 2px dashed #e2d9cc; padding-top: 20px; text-align: center; font-size: 12px; color: #718096; line-height: 1.5; }
    .footer-crest { color: #064e3b; font-weight: 700; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="pass-wrapper">
    <div class="header">
      <div class="brand-crest">👑</div>
      <div class="brand-name">FOODIE ROYAL</div>
      <div class="brand-sub">Haute Cuisine & Fine Dining Sanctuary</div>
      <div class="status-badge">✓ CONFIRMED VIP TABLE PASS</div>
    </div>

    <div class="code-box">
      <div class="code-sub">Official Reservation Reference</div>
      <div class="code-id">${confirmedReservation.reservationId}</div>
    </div>

    <div class="details-grid">
      <div class="detail-card">
        <span class="card-label">Guest Name</span>
        <div class="card-value">${confirmedReservation.guestName}</div>
      </div>
      <div class="detail-card">
        <span class="card-label">Date & Time</span>
        <div class="card-value">${confirmedReservation.date} • ${confirmedReservation.timeSlot}</div>
      </div>
      <div class="detail-card">
        <span class="card-label">Reserved Table(s)</span>
        <div class="card-value">${confirmedReservation.tableNumber || confirmedReservation.tableNumbers?.join(", ")}</div>
      </div>
      <div class="detail-card">
        <span class="card-label">Party & Capacity</span>
        <div class="card-value">${confirmedReservation.guestCount} Guests • ${confirmedReservation.totalCapacity || 2} Seats</div>
      </div>
      <div class="detail-card">
        <span class="card-label">Dining Ambiance</span>
        <div class="card-value">${confirmedReservation.seatingArea || confirmedReservation.tableName || "Main Dining Grand Hall"}</div>
      </div>
      <div class="detail-card">
        <span class="card-label">Dining Occasion</span>
        <div class="card-value">${confirmedReservation.occasion}</div>
      </div>
    </div>

    ${
      confirmedReservation.specialRequests
        ? `<div class="notes-box"><strong>Chef / Kitchen Notes:</strong> "${confirmedReservation.specialRequests}"</div>`
        : ""
    }

    <div class="footer">
      <p class="footer-crest">👑 The Royal Pavilion, Marine Drive, Mumbai • Tel: +91 (022) 2890-FOOD</p>
      <p>Please present this digital pass or printed voucher upon arrival to your personal Maître d'.</p>
      <p style="font-size: 10px; margin-top: 6px; color: #a0aec0;">Generated on ${new Date().toLocaleDateString("en-IN")}. Valid exclusively for the reservation time noted above.</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([ticketHtml], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `VIP_Pass_${confirmedReservation.reservationId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  // Submit Multi-Table Reservation
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (selectedTables.length === 0) {
      setErrorMessage("Please select at least 1 table on the floor plan.");
      return;
    }
    if (!guestForm.name.trim() || !guestForm.phone.trim()) {
      setErrorMessage("Please provide your name and contact phone number.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload = {
        guestName: guestForm.name.trim(),
        email: guestForm.email.trim(),
        phone: guestForm.phone.trim(),
        date: selectedDate,
        timeSlot: selectedSlot,
        guestCount: Number(guestCount),
        selectedTables: selectedTables,
        tableNumbers: selectedTables.map((t) => t.tableNumber),
        tableNumber: selectedTables.map((t) => t.tableNumber).join(", "),
        tableName: selectedTables.map((t) => t.tableName).join(", "),
        seatingArea: [...new Set(selectedTables.map((t) => t.seatingArea))].join(" & "),
        occasion: guestForm.occasion,
        specialRequests: guestForm.specialRequests.trim(),
      };

      const res = await fetch(`${API_BASE}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to book table reservation.");
      }

      const newRes = data.reservation;
      setConfirmedReservation(newRes);
      setMyReservations((prev) => {
        const updated = [newRes, ...prev.filter((r) => r.reservationId !== newRes.reservationId)];
        localStorage.setItem("foodie_user_reserved_tables", JSON.stringify(updated));
        return updated;
      });
      setIsCornerCardDismissed(false);
      setIsCornerCardMinimized(false);
      setStep(3); // Go to pass
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMessage(err.message || "Could not complete reservation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reusable 2D Floor Plan Table Button
  const renderTableButton = (t) => {
    const isUserBooked = myBookedTableNumbers.includes(t.tableNumber);
    const isBooked = bookedTables.includes(t.tableNumber);
    const isBookedByOther = isBooked && !isUserBooked;
    const isSelected = selectedTables.some((st) => st.tableNumber === t.tableNumber);

    if (isUserBooked) {
      return (
        <button
          key={t.tableNumber}
          type="button"
          className="table-seat-button booked-by-you"
          onClick={() => handleTableToggle(t)}
          title={`👑 You booked Table ${t.tableNumber} (${t.tableName}) for ${selectedSlot}. Click to view or print your VIP Pass ticket.`}
        >
          <span className="tbl-id user-booked">👑 {t.tableNumber}</span>
          <span className="tbl-name">{t.tableName}</span>
          <span className="tbl-cap">{t.capacity} Seats</span>
          <span className="tbl-status user-booked">★ You Booked</span>
        </button>
      );
    }

    if (isBookedByOther) {
      return (
        <button
          key={t.tableNumber}
          type="button"
          disabled={true}
          className="table-seat-button booked unavailable"
          title={`Table ${t.tableNumber} (${t.tableName}) - Unavailable / Booked for ${selectedSlot}`}
        >
          <span className="tbl-id">{t.tableNumber}</span>
          <span className="tbl-name">{t.tableName}</span>
          <span className="tbl-cap">{t.capacity} Seats</span>
          <span className="tbl-status unavailable">Unavailable</span>
        </button>
      );
    }

    return (
      <button
        key={t.tableNumber}
        type="button"
        className={`table-seat-button ${isSelected ? "selected" : "available"}`}
        onClick={() => handleTableToggle(t)}
        title={`${t.tableName} (${t.capacity} Seats) - Click to ${isSelected ? "Deselect" : "Select"}`}
      >
        <span className="tbl-id">{t.tableNumber}</span>
        <span className="tbl-name">{t.tableName}</span>
        <span className="tbl-cap">{t.capacity} Seats</span>
        <span className="tbl-status">
          {isSelected ? "✓ Added" : "Select"}
        </span>
      </button>
    );
  };

  // Group tables by seating ambiance
  const patioTables = allTables.filter((t) => t.seatingArea === "Rooftop Terrace Patio");
  const grandHallTables = allTables.filter((t) => t.seatingArea === "Main Dining Grand Hall");
  const romanceTables = allTables.filter((t) => t.seatingArea === "Candlelight Romance Corner");
  const vipTables = allTables.filter((t) => t.seatingArea === "Private VIP Executive Lounge");

  return (
    <div className="reservation-page-container">
      {/* Header Banner */}
      <div className="res-hero-banner">
        <div className="res-hero-content">
          <span className="res-gold-badge">👑 Fine Dining Privilege</span>
          <h1 className="res-hero-title">Reserve Your Table</h1>
          <p className="res-hero-subtitle">
            Book 1, 2, 3, or multiple tables for private dates, family dinners, or grand parties.
            Select your exact seating positions on our interactive 2D floor plan.
          </p>
        </div>
      </div>

      {/* Booking Stepper */}
      <div className="res-stepper-progress">
        <div className={`res-step-item ${step >= 1 ? "active" : ""}`}>
          <span className="res-step-number">1</span>
          <span className="res-step-title">Date, Time & Tables</span>
        </div>
        <div className="res-step-line"></div>
        <div className={`res-step-item ${step >= 2 ? "active" : ""}`}>
          <span className="res-step-number">2</span>
          <span className="res-step-title">Guest & Occasion</span>
        </div>
        <div className="res-step-line"></div>
        <div className={`res-step-item ${step === 3 ? "active" : ""}`}>
          <span className="res-step-number">3</span>
          <span className="res-step-title">Digital VIP Pass</span>
        </div>
      </div>

      {errorMessage && <div className="res-error-banner">{errorMessage}</div>}

      {/* STEP 1: DATE, TIME & 2D FLOOR PLAN */}
      {step === 1 && (
        <div className="res-step-content-grid">
          {/* Left Column: Date, Slot, Party & Multi-Table Summary */}
          <div className="res-picker-column">
            {/* Date Selector */}
            <div className="res-card-box">
              <h3 className="res-box-heading">📅 1. Select Dining Date</h3>
              <div className="date-input-row">
                <input
                  type="date"
                  className="res-date-input"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="res-card-box">
              <h3 className="res-box-heading">⏰ 2. Choose Time Slot</h3>
              <div className="slots-chips-grid">
                {TIME_SLOTS.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    className={`slot-chip-btn ${
                      selectedSlot === s.time ? "selected" : ""
                    } ${s.popular ? "popular-slot" : ""}`}
                    onClick={() => setSelectedSlot(s.time)}
                  >
                    <span className="slot-time-text">{s.time}</span>
                    <small className="slot-type-text">{s.type}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Count */}
            <div className="res-card-box">
              <h3 className="res-box-heading">👥 3. Total Guest Count</h3>
              <div className="party-stepper-row">
                {[2, 4, 6, 8, 10, 12, 16, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`party-pill-btn ${guestCount === num ? "selected" : ""}`}
                    onClick={() => setGuestCount(num)}
                  >
                    {num} Guests
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Table Selection Live Summary Card */}
            <div className="multi-table-summary-card">
              <div className="multi-table-header">
                <div>
                  <span className="multi-badge">
                    🪑 {selectedTables.length} {selectedTables.length === 1 ? "Table" : "Tables"} Selected
                  </span>
                  <h4 className="multi-summary-title">
                    {selectedTables.length === 0
                      ? "No Tables Selected"
                      : selectedTables.map((t) => t.tableNumber).join(" + ")}
                  </h4>
                </div>
                {selectedTables.length > 0 && (
                  <button
                    type="button"
                    className="clear-tables-btn"
                    onClick={() => setSelectedTables([])}
                    title="Clear selected tables"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {selectedTables.length > 0 ? (
                <>
                  <div className="selected-tables-chips-list">
                    {selectedTables.map((t) => (
                      <div key={t.tableNumber} className="selected-table-chip">
                        <span className="chip-table-code">{t.tableNumber}</span>
                        <div className="chip-info">
                          <strong>{t.tableName}</strong>
                          <small>📍 {t.seatingArea} ({t.capacity} Seats)</small>
                        </div>
                        <button
                          type="button"
                          className="remove-chip-btn"
                          onClick={() => handleRemoveSelectedTable(t.tableNumber)}
                          title="Remove table"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="multi-cap-stats-row">
                    <div className="cap-stat-box">
                      <span>Total Table Capacity:</span>
                      <strong>{totalSelectedCapacity} Seats</strong>
                    </div>
                    <div className="cap-stat-box">
                      <span>Your Party:</span>
                      <strong className={guestCount > totalSelectedCapacity ? "text-amber" : "text-green"}>
                        {guestCount} Guests
                      </strong>
                    </div>
                  </div>

                  {guestCount > totalSelectedCapacity && (
                    <div className="capacity-warning-alert">
                      ⚠️ Party has {guestCount} guests, but selected table(s) hold {totalSelectedCapacity} seats.
                      Click another table on the floor plan to add more seating!
                    </div>
                  )}

                  <button
                    type="button"
                    className="proceed-guest-info-btn"
                    onClick={() => setStep(2)}
                  >
                    Proceed with {selectedTables.length} {selectedTables.length === 1 ? "Table" : "Tables"} ➔
                  </button>
                </>
              ) : (
                <div className="no-table-selected-hint">
                  <p className="hint-main">💡 <strong>Multiple Table Booking:</strong></p>
                  <p className="hint-sub">
                    Click any available tables on the floor plan to book 1, 2, 3, or more tables together.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 2D Interactive Floor Plan */}
          <div className="res-floorplan-column">
            <div className="floorplan-container-card">
              <div className="floorplan-header">
                <div>
                  <h3 className="floorplan-title">🏛️ Interactive Restaurant Floor Plan</h3>
                  <p className="floorplan-sub">
                    Click tables to select or deselect. You can book multiple tables at once!
                  </p>
                </div>

                <div className="floorplan-legend-row">
                  <div className="legend-item">
                    <span className="legend-dot available"></span>
                    <span>Available</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot selected"></span>
                    <span>Selected ({selectedTables.length})</span>
                  </div>
                  {myBookedTableNumbers.length > 0 && (
                    <div className="legend-item">
                      <span className="legend-dot user-booked"></span>
                      <span>You Booked ({myBookedTableNumbers.length})</span>
                    </div>
                  )}
                  <div className="legend-item">
                    <span className="legend-dot occupied"></span>
                    <span>Unavailable</span>
                  </div>
                </div>
              </div>

              {loadingAvailability && (
                <div className="map-loading-overlay">
                  <div className="track-spinner"></div>
                </div>
              )}

              {/* 2D Floor Layout Schematic */}
              <div className="restaurant-floor-schematic">
                {/* Zone 1: Rooftop Terrace Patio */}
                <div className="floor-zone-box rooftop-zone">
                  <div className="zone-header-row">
                    <span className="zone-label">🌿 Rooftop Terrace Patio</span>
                    <span className="zone-sub-badge">Open Air & Skyline View</span>
                  </div>
                  <div className="zone-tables-grid zone-grid-patio">
                    {patioTables.map((t) => renderTableButton(t))}
                  </div>
                </div>

                {/* Zone 2: Main Dining Grand Hall */}
                <div className="floor-zone-box grand-hall-zone">
                  <div className="zone-header-row">
                    <span className="zone-label">🍷 Main Dining Grand Hall</span>
                    <span className="zone-sub-badge">Chandelier & Live Acoustic</span>
                  </div>
                  <div className="zone-tables-grid zone-grid-grand">
                    {grandHallTables.map((t) => renderTableButton(t))}
                  </div>
                </div>

                {/* Lower Row: Candlelight Corner & VIP Lounge */}
                <div className="floor-lower-grid">
                  {/* Zone 3: Romance Candlelight Corner */}
                  <div className="floor-zone-box romance-zone">
                    <div className="zone-header-row">
                      <span className="zone-label">🕯️ Romance Corner</span>
                      <span className="zone-sub-badge">Intimate Couples</span>
                    </div>
                    <div className="zone-tables-grid zone-grid-romance">
                      {romanceTables.map((t) => renderTableButton(t))}
                    </div>
                  </div>

                  {/* Zone 4: VIP Executive Lounge */}
                  <div className="floor-zone-box vip-zone">
                    <div className="zone-header-row">
                      <span className="zone-label">👑 VIP Private Lounge</span>
                      <span className="zone-sub-badge">Butler & Wine Cellar</span>
                    </div>
                    <div className="zone-tables-grid zone-grid-vip">
                      {vipTables.map((t) => renderTableButton(t))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FLOATING CORNER CARD: YOU BOOKED THIS TABLE */}
          {cornerReservation && !isCornerCardDismissed && (
            <div className={`user-booked-corner-card ${isCornerCardMinimized ? "minimized" : ""}`}>
              <div className="corner-card-header">
                <div className="corner-card-title-group">
                  <span className="corner-card-badge">👑 You Booked This Table</span>
                  <h4 className="corner-card-tables">
                    {cornerReservation.tableNumber || cornerReservation.tableNumbers?.join(", ") || "Reserved Table"}
                  </h4>
                </div>
                <div className="corner-card-controls">
                  <button
                    type="button"
                    className="corner-card-btn-icon"
                    onClick={() => setIsCornerCardMinimized(!isCornerCardMinimized)}
                    title={isCornerCardMinimized ? "Expand Details" : "Minimize"}
                  >
                    {isCornerCardMinimized ? "▲" : "▼"}
                  </button>
                  <button
                    type="button"
                    className="corner-card-btn-icon"
                    onClick={() => setIsCornerCardDismissed(true)}
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {!isCornerCardMinimized && (
                <div className="corner-card-body">
                  <div className="corner-detail-row">
                    <span>📅 Date & Slot:</span>
                    <strong>{cornerReservation.date} • {cornerReservation.timeSlot}</strong>
                  </div>
                  <div className="corner-detail-row">
                    <span>👤 Guest Name:</span>
                    <strong>{cornerReservation.guestName} ({cornerReservation.guestCount} Guests)</strong>
                  </div>
                  <div className="corner-detail-row">
                    <span>🏛️ Seating:</span>
                    <strong>{cornerReservation.seatingArea || cornerReservation.tableName || "Grand Hall"}</strong>
                  </div>
                  <div className="corner-detail-row">
                    <span>🎟️ Pass Ref:</span>
                    <strong className="text-gold">{cornerReservation.reservationId}</strong>
                  </div>
                  {cornerReservation.specialRequests && (
                    <div className="corner-notes">
                      "{cornerReservation.specialRequests}"
                    </div>
                  )}

                  <button
                    type="button"
                    className="corner-view-ticket-btn"
                    onClick={() => {
                      setConfirmedReservation(cornerReservation);
                      setStep(3);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    🎟️ View Your VIP Pass
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: GUEST INFO & OCCASION */}
      {step === 2 && (
        <div className="res-guest-form-container">
          <button className="back-to-step1-btn" onClick={() => setStep(1)}>
            ← Change Tables / Date / Time
          </button>

          <div className="guest-booking-layout">
            <form onSubmit={handleBookingSubmit} className="guest-info-card">
              <h2 className="guest-card-title">Guest Details & Occasion</h2>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singhania"
                    value={guestForm.name}
                    onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Contact Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address (For Digital VIP Pass & Directions)</label>
                <input
                  type="email"
                  placeholder="e.g. vikram@luxury.com"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Dining Occasion</label>
                <select
                  value={guestForm.occasion}
                  onChange={(e) => setGuestForm({ ...guestForm, occasion: e.target.value })}
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ.value} value={occ.value}>
                      {occ.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Special Requests / Chef Notes</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Combine tables for banquet setup, fresh candlelight rose petals, quiet corner seating, birthday cake..."
                  value={guestForm.specialRequests}
                  onChange={(e) =>
                    setGuestForm({ ...guestForm, specialRequests: e.target.value })
                  }
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="confirm-reservation-submit-btn"
              >
                {isSubmitting
                  ? "Securing Tables..."
                  : `👑 Confirm Reservation (${selectedTables.length} ${
                      selectedTables.length === 1 ? "Table" : "Tables"
                    }) ➔`}
              </button>
            </form>

            {/* Booking Summary Box */}
            <div className="res-summary-sidebar">
              <div className="sidebar-summary-card">
                <h3>Reservation Summary</h3>

                <div className="res-summary-line">
                  <span>📅 Date:</span>
                  <strong>{new Date(selectedDate).toDateString()}</strong>
                </div>

                <div className="res-summary-line">
                  <span>⏰ Time Slot:</span>
                  <strong>{selectedSlot}</strong>
                </div>

                <div className="res-summary-line">
                  <span>👥 Party Size:</span>
                  <strong>{guestCount} Guests</strong>
                </div>

                <div className="res-summary-line">
                  <span>🪑 Tables Booked ({selectedTables.length}):</span>
                  <strong>{selectedTables.map((t) => t.tableNumber).join(", ")}</strong>
                </div>

                <div className="sidebar-tables-breakdown">
                  {selectedTables.map((t) => (
                    <div key={t.tableNumber} className="sidebar-table-item">
                      <span>• <strong>{t.tableNumber}</strong>: {t.tableName}</span>
                      <small>📍 {t.seatingArea} ({t.capacity} Seats)</small>
                    </div>
                  ))}
                </div>

                <div className="res-summary-line">
                  <span>🏛️ Total Seating Capacity:</span>
                  <strong>{totalSelectedCapacity} Seats</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DIGITAL VIP RESERVATION PASS */}
      {step === 3 && confirmedReservation && (
        <div className="res-confirmation-pass-container">
          <div className="digital-vip-pass-card">
            <div className="vip-pass-top">
              <span className="pass-brand">FOODIE FINE DINING</span>
              <span className="pass-status-pill">✓ CONFIRMED VIP PASS</span>
            </div>

            <div className="pass-code-banner">
              <small>RESERVATION REFERENCE</small>
              <h2>{confirmedReservation.reservationId}</h2>
            </div>

            <div className="pass-details-grid">
              <div className="pass-detail-cell">
                <span className="cell-label">Guest Name</span>
                <strong>{confirmedReservation.guestName}</strong>
              </div>

              <div className="pass-detail-cell">
                <span className="cell-label">Date & Time</span>
                <strong>
                  {confirmedReservation.date} • {confirmedReservation.timeSlot}
                </strong>
              </div>

              <div className="pass-detail-cell">
                <span className="cell-label">Reserved Tables ({confirmedReservation.tableCount || confirmedReservation.tableNumbers?.length || 1})</span>
                <strong>
                  {confirmedReservation.tableNumber || confirmedReservation.tableNumbers?.join(", ")}
                </strong>
              </div>

              <div className="pass-detail-cell">
                <span className="cell-label">Party & Seating</span>
                <strong>
                  {confirmedReservation.guestCount} Guests • {confirmedReservation.totalCapacity || 2} Seats
                </strong>
              </div>

              <div className="pass-detail-cell">
                <span className="cell-label">Occasion</span>
                <strong>{confirmedReservation.occasion}</strong>
              </div>

              <div className="pass-detail-cell">
                <span className="cell-label">Contact</span>
                <strong>{confirmedReservation.phone}</strong>
              </div>
            </div>

            {confirmedReservation.specialRequests && (
              <div className="pass-notes-box">
                <span>Special Request:</span>
                <p>"{confirmedReservation.specialRequests}"</p>
              </div>
            )}

            <div className="pass-footer-actions no-print">
              <button
                type="button"
                className="download-ticket-btn"
                onClick={handleDownloadTicket}
              >
                📥 Download VIP Ticket (HTML)
              </button>

              <button
                type="button"
                className="back-floorplan-btn"
                onClick={() => {
                  setStep(1);
                  window.scrollTo({ top: 400, behavior: "smooth" });
                }}
              >
                🪑 View Tables on Floor Plan
              </button>

              <button
                type="button"
                className="back-floorplan-btn book-another-btn"
                onClick={() => {
                  setSelectedTables([]);
                  setConfirmedReservation(null);
                  setStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                ✨ Book Another Table
              </button>

              <Link to="/" className="back-menu-btn">
                🍔 Return to Menu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationPage;
