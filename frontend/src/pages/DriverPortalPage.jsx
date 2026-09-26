import { API_URL } from "../config/api";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const STATUS_FLOW = ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"];

export const DriverPortalPage = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'completed' | 'all'
  const [driverLocationPercent, setDriverLocationPercent] = useState(65);
  const [simulating, setSimulating] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "customer", text: "Please ring bell and leave near shoe rack.", time: "10 mins ago" },
    { sender: "driver", text: "Understood! Picking up your warm order now.", time: "8 mins ago" },
  ]);
  const [driverInputMsg, setDriverInputMsg] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Fetch orders
  const fetchOrders = () => {
    fetch(`${API_URL}/api/orders/all`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          if (!selectedOrder && data.orders.length > 0) {
            // Find active order or first order
            const active = data.orders.find((o) =>
              ["preparing", "out_for_delivery", "confirmed", "placed"].includes(o.orderStatus)
            );
            setSelectedOrder(active || data.orders[0]);
          } else if (selectedOrder) {
            const updatedSelected = data.orders.find((o) => o._id === selectedOrder._id);
            if (updatedSelected) setSelectedOrder(updatedSelected);
          }
        }
      })
      .catch((err) => console.warn("Driver fetch error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  // Update order status on backend
  const updateOrderStatus = async (orderId, newStatus, note = "") => {
    setStatusUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setSelectedOrder(data.order);
        setOrders((prev) => prev.map((o) => (o._id === data.order._id ? data.order : o)));
      }
    } catch (err) {
      console.warn("Could not update order status:", err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Run automated GPS simulation
  const startGpsSimulation = () => {
    if (simulating) return;
    setSimulating(true);
    setDriverLocationPercent(15);

    if (selectedOrder?.orderStatus !== "out_for_delivery") {
      updateOrderStatus(selectedOrder._id, "out_for_delivery", "Driver Raju Kumar has departed with your order.");
    }

    let curr = 15;
    const simInterval = setInterval(() => {
      curr += 15;
      if (curr >= 100) {
        setDriverLocationPercent(100);
        setSimulating(false);
        clearInterval(simInterval);
        updateOrderStatus(selectedOrder._id, "delivered", "Driver marked order delivered at customer doorstep.");
      } else {
        setDriverLocationPercent(curr);
      }
    }, 2000);
  };

  // Driver Chat Reply
  const sendDriverMessage = (text) => {
    if (!text.trim()) return;
    const newMsg = {
      sender: "driver",
      text: text.trim(),
      time: "Just now",
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setDriverInputMsg("");
  };

  const activeOrders = orders.filter((o) =>
    ["placed", "confirmed", "preparing", "out_for_delivery"].includes(o.orderStatus)
  );
  const completedOrders = orders.filter((o) => o.orderStatus === "delivered");
  const displayOrders = activeTab === "active" ? activeOrders : activeTab === "completed" ? completedOrders : orders;

  return (
    <div className="driver-portal-container">
      {/* Top Driver Header & Shift Status */}
      <div className="driver-top-cockpit">
        <div className="driver-identity-block">
          <div className="driver-avatar-badge">🛵</div>
          <div>
            <div className="driver-name-status-row">
              <h1 className="driver-heading">Driver Raju Kumar</h1>
              <span className="driver-badge-id">#DRV-4091</span>
              <span className="driver-vehicle-tag">EV Cargo Scooter</span>
            </div>
            <p className="driver-sub-metrics">
              ★ 4.9 Rating (1,240 Deliveries) • Shift Earnings: <strong>₹1,680</strong> • Completed: <strong>{completedOrders.length} Trips</strong>
            </p>
          </div>
        </div>

        <div className="driver-shift-controls">
          <button
            className={`shift-toggle-btn ${isOnline ? "online" : "offline"}`}
            onClick={() => setIsOnline(!isOnline)}
          >
            <span className="shift-dot"></span>
            {isOnline ? "ONLINE (Accepting Trips)" : "OFFLINE (Break)"}
          </button>
        </div>
      </div>

      {/* Main Grid: Orders Queue & Active Trip Navigator */}
      <div className="driver-layout-grid">
        {/* Left Column: Trip Dispatch Queue */}
        <div className="driver-queue-column">
          <div className="driver-card driver-queue-card">
            <div className="queue-header-row">
              <h3>Live Dispatch Queue</h3>
              <div className="queue-tabs">
                <button
                  className={`queue-tab-btn ${activeTab === "active" ? "active" : ""}`}
                  onClick={() => setActiveTab("active")}
                >
                  Active ({activeOrders.length})
                </button>
                <button
                  className={`queue-tab-btn ${activeTab === "completed" ? "active" : ""}`}
                  onClick={() => setActiveTab("completed")}
                >
                  History ({completedOrders.length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="driver-loading">
                <div className="track-spinner"></div>
                <p>Loading live trips...</p>
              </div>
            ) : displayOrders.length === 0 ? (
              <div className="driver-empty-queue">
                <span>🛵</span>
                <p>No {activeTab} trips assigned at this moment.</p>
              </div>
            ) : (
              <div className="driver-trips-list">
                {displayOrders.map((ord) => {
                  const isSelected = selectedOrder?._id === ord._id;
                  return (
                    <div
                      key={ord._id}
                      className={`driver-trip-item ${isSelected ? "selected" : ""} ${ord.orderStatus}`}
                      onClick={() => setSelectedOrder(ord)}
                    >
                      <div className="trip-item-top">
                        <strong>Order #{ord.orderId || ord._id.slice(-6)}</strong>
                        <span className={`trip-status-tag ${ord.orderStatus}`}>
                          {ord.orderStatus.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="trip-cust-info">
                        <span>👤 {ord.customer?.name} ({ord.customer?.phone})</span>
                        <span>📍 {ord.deliveryAddress?.street}, {ord.deliveryAddress?.city}</span>
                      </div>

                      <div className="trip-item-bottom">
                        <span className="trip-amt">₹{ord.totalAmount} • {ord.paymentMethod?.toUpperCase()}</span>
                        <span className="trip-items-count">{ord.items?.length || 1} Item(s)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Trip Navigator & GPS Simulator Cockpit */}
        <div className="driver-nav-column">
          {selectedOrder ? (
            <div className="driver-card active-trip-card">
              {/* Trip Header */}
              <div className="active-trip-header">
                <div>
                  <span className="active-trip-badge">LIVE ACTIVE ASSIGNMENT</span>
                  <h2>Order #{selectedOrder.orderId || selectedOrder._id.slice(-6)}</h2>
                  <p className="active-trip-sub">
                    Placed: {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="active-trip-actions-top">
                  <a
                    href={`tel:${selectedOrder.customer?.phone || "9876543210"}`}
                    className="driver-phone-call-btn"
                  >
                    📞 Call Customer
                  </a>
                  <Link
                    to={`/track/${selectedOrder.orderId || selectedOrder._id}`}
                    target="_blank"
                    className="driver-customer-view-btn"
                  >
                    👁️ Open Customer Tracker ➔
                  </Link>
                </div>
              </div>

              {/* Delivery Details Block */}
              <div className="active-trip-info-grid">
                <div className="driver-info-box">
                  <small>Customer Destination</small>
                  <strong>{selectedOrder.customer?.name}</strong>
                  <p>{selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.city} - {selectedOrder.deliveryAddress?.pincode}</p>
                  {selectedOrder.deliveryAddress?.instructions && (
                    <div className="delivery-instruction-alert">
                      <span>⚠️ Note:</span> "{selectedOrder.deliveryAddress.instructions}"
                    </div>
                  )}
                </div>

                <div className="driver-info-box">
                  <small>Payment & Collectible</small>
                  <strong className="driver-amt-big">₹{selectedOrder.totalAmount}</strong>
                  <p className="pay-status-pill">
                    {selectedOrder.paymentStatus === "completed" ? "✅ PAID ONLINE (No Cash Needed)" : "💵 CASH ON DELIVERY"}
                  </p>
                  <p className="dish-summary-line">
                    {selectedOrder.items?.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                  </p>
                </div>
              </div>

              {/* Live GPS Route Progression Controls */}
              <div className="driver-gps-controls-card">
                <div className="gps-ctrl-header">
                  <div>
                    <h3>🛵 GPS Driving Simulation Controls</h3>
                    <p>Simulate turn-by-turn road progression and update customer telemetry live</p>
                  </div>
                  <button
                    className={`auto-sim-btn ${simulating ? "simulating" : ""}`}
                    onClick={startGpsSimulation}
                    disabled={simulating || selectedOrder.orderStatus === "delivered"}
                  >
                    {simulating ? "🚗 Simulating Transit..." : "🚀 Auto-Simulate Live Trip"}
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="driver-gps-bar-wrapper">
                  <div className="driver-gps-bar-track">
                    <div
                      className="driver-gps-bar-fill"
                      style={{ width: `${driverLocationPercent}%` }}
                    ></div>
                    <div
                      className="driver-gps-courier-marker"
                      style={{ left: `${driverLocationPercent}%` }}
                    >
                      🛵 Raju ({driverLocationPercent}%)
                    </div>
                  </div>
                  <div className="driver-gps-milestones">
                    <span>👑 Kitchen Dispatch</span>
                    <span>🌳 Central Avenue</span>
                    <span>📍 Doorstep ({selectedOrder.deliveryAddress?.city || "Destination"})</span>
                  </div>
                </div>

                {/* Manual Status Buttons */}
                <div className="driver-status-stepper-row">
                  <button
                    className={`driver-step-btn ${selectedOrder.orderStatus === "preparing" ? "current" : ""}`}
                    onClick={() => updateOrderStatus(selectedOrder._id, "preparing", "Food being prepared at station")}
                    disabled={statusUpdating}
                  >
                    🍳 1. In Kitchen
                  </button>

                  <button
                    className={`driver-step-btn ${selectedOrder.orderStatus === "out_for_delivery" ? "current" : ""}`}
                    onClick={() => {
                      setDriverLocationPercent(50);
                      updateOrderStatus(selectedOrder._id, "out_for_delivery", "Raju Kumar has picked up food and is en route");
                    }}
                    disabled={statusUpdating}
                  >
                    🛵 2. Out For Delivery
                  </button>

                  <button
                    className={`driver-step-btn ${selectedOrder.orderStatus === "delivered" ? "current" : ""}`}
                    onClick={() => {
                      setDriverLocationPercent(100);
                      updateOrderStatus(selectedOrder._id, "delivered", "Successfully delivered to customer");
                    }}
                    disabled={statusUpdating}
                  >
                    🎉 3. Mark Delivered
                  </button>
                </div>
              </div>

              {/* Two-Way Chat Box */}
              <div className="driver-chat-box">
                <div className="driver-chat-title">
                  <span>💬 Direct Customer Quick-Chat</span>
                  <small>Messages sync in real-time with customer tracking view</small>
                </div>

                <div className="driver-chat-bubbles-wrap">
                  {chatMessages.map((m, idx) => (
                    <div key={idx} className={`driver-chat-msg ${m.sender}`}>
                      <span className="msg-sender-label">{m.sender === "driver" ? "You (Raju)" : "Customer"}</span>
                      <p>{m.text}</p>
                      <small>{m.time}</small>
                    </div>
                  ))}
                </div>

                <div className="driver-quick-replies-row">
                  <button onClick={() => sendDriverMessage("I am at the building gate now!")}>
                    📍 At Gate
                  </button>
                  <button onClick={() => sendDriverMessage("Leaving package safely with security.")}>
                    🛡️ Left at Security
                  </button>
                  <button onClick={() => sendDriverMessage("Traffic is light, arriving in 4 minutes!")}>
                    ⏱️ Arriving 4 Mins
                  </button>
                </div>

                <form
                  className="driver-chat-send-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendDriverMessage(driverInputMsg);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type message to customer..."
                    value={driverInputMsg}
                    onChange={(e) => setDriverInputMsg(e.target.value)}
                  />
                  <button type="submit">Send</button>
                </form>
              </div>
            </div>
          ) : (
            <div className="driver-card select-prompt-card">
              <span>👈</span>
              <h3>Select a trip from the queue to start navigation</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
