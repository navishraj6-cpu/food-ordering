import React, { useState } from "react";

const KDS_COLUMNS = [
  { id: "placed", title: "📝 New Incoming", icon: "🔔", badgeClass: "col-placed", nextStatus: "confirmed", nextLabel: "👨‍🍳 Accept & Confirm ➔" },
  { id: "confirmed", title: "👨‍🍳 Queued Prep", icon: "📋", badgeClass: "col-confirmed", prevStatus: "placed", nextStatus: "preparing", nextLabel: "🍳 Start Cooking in Kitchen ➔" },
  { id: "preparing", title: "🍳 Cooking Station", icon: "🔥", badgeClass: "col-preparing", prevStatus: "confirmed", nextStatus: "out_for_delivery", nextLabel: "🛵 Start Bike & Dispatch ➔" },
  { id: "out_for_delivery", title: "🛵 Out for Delivery", icon: "📦", badgeClass: "col-delivery", prevStatus: "preparing", nextStatus: "delivered", nextLabel: "✅ Confirm Delivered 🎉 ➔" },
  { id: "delivered", title: "🎉 Completed", icon: "✅", badgeClass: "col-delivered", prevStatus: "out_for_delivery" },
];

const STATIONS = [
  { id: "all", name: "All Stations", icon: "🍳" },
  { id: "burger", name: "Burger Bar", icon: "🍔" },
  { id: "pizza", name: "Pizza Hearth", icon: "🍕" },
  { id: "fryer", name: "Fryer & Crispy", icon: "🍟" },
  { id: "barista", name: "Barista & Desserts", icon: "🥤" },
];

export const KDSKanbanBoard = ({
  orders = [],
  onStatusChange,
  onOpenKot,
  onOpenReceipt,
  checkedItems = {},
  onToggleItemCheck,
  getElapsedInfo,
}) => {
  const [selectedStation, setSelectedStation] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter orders by station and search query
  const filterOrderByStation = (order) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (order.customer?.name || "").toLowerCase().includes(q);
      const matchId = (order._id || "").toLowerCase().includes(q);
      const matchItems = (order.items || []).some((i) => (i.name || "").toLowerCase().includes(q));
      if (!matchName && !matchId && !matchItems) return false;
    }

    if (selectedStation === "all") return true;

    return (order.items || []).some((item) => {
      const cat = (item.category || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      if (selectedStation === "burger") return cat.includes("burger") || cat.includes("sandwich") || name.includes("burger");
      if (selectedStation === "pizza") return cat.includes("pizza") || name.includes("pizza");
      if (selectedStation === "fryer") return cat.includes("frie") || cat.includes("chicken") || name.includes("fries") || name.includes("wings");
      if (selectedStation === "barista") return cat.includes("drink") || cat.includes("shake") || cat.includes("dessert") || name.includes("shake") || name.includes("mojito");
      return true;
    });
  };

  const filteredOrders = orders.filter(filterOrderByStation);

  return (
    <div className="kds-kanban-wrapper">
      {/* Station Filter & Search Control Bar */}
      <div className="kds-toolbar">
        <div className="kds-station-chips">
          <span className="kds-toolbar-label">👨‍🍳 Kitchen Station:</span>
          {STATIONS.map((st) => (
            <button
              key={st.id}
              className={`kds-station-pill ${selectedStation === st.id ? "active" : ""}`}
              onClick={() => setSelectedStation(st.id)}
            >
              <span>{st.icon}</span>
              <span>{st.name}</span>
            </button>
          ))}
        </div>

        <div className="kds-search-box">
          <input
            type="text"
            placeholder="Filter ticket / customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="kds-clear-search" onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 5-Column Kanban Board Grid */}
      <div className="kds-board-grid">
        {KDS_COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter(
            (o) => o.orderStatus === col.id || (col.id === "placed" && !o.orderStatus)
          );

          return (
            <div key={col.id} className={`kds-column ${col.badgeClass}`}>
              {/* Column Header */}
              <div className="kds-column-header">
                <div className="kds-col-title-wrap">
                  <span className="kds-col-icon">{col.icon}</span>
                  <h4 className="kds-col-title">{col.title}</h4>
                </div>
                <span className="kds-col-count-badge">{colOrders.length}</span>
              </div>

              {/* Tickets Column List */}
              <div className="kds-tickets-container">
                {colOrders.length === 0 ? (
                  <div className="kds-empty-column">
                    <span>☕</span>
                    <p>No tickets in queue</p>
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const elapsed = getElapsedInfo ? getElapsedInfo(order.createdAt) : { label: "Just now", badgeClass: "fresh" };
                    const orderShortId = (order._id || "").substring(order._id?.length - 6).toUpperCase();

                    return (
                      <div
                        key={order._id}
                        className={`kds-ticket-card ${elapsed.badgeClass === "urgent" ? "ticket-urgent" : ""}`}
                      >
                        {/* Ticket Header */}
                        <div className="kds-ticket-header">
                          <div className="kds-ticket-id-block">
                            <span className="kds-ticket-id">#{orderShortId}</span>
                            <span className={`kds-elapsed-pill ${elapsed.badgeClass}`}>
                              ⏱️ {elapsed.label}
                            </span>
                          </div>
                          <div className="kds-ticket-tools">
                            <button
                              className="kds-mini-btn"
                              title="Print Kitchen Order Ticket (KOT)"
                              onClick={() => onOpenKot && onOpenKot(order)}
                            >
                              🖨️ KOT
                            </button>
                            <button
                              className="kds-mini-btn"
                              title="View Customer Bill Receipt"
                              onClick={() => onOpenReceipt && onOpenReceipt(order)}
                            >
                              🧾 Bill
                            </button>
                            <a
                              href={`/track/${order.orderId || order._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="kds-mini-btn kds-tracker-btn"
                              title="Open Customer Live GPS Tracker"
                            >
                              🌐 Map ➔
                            </a>
                          </div>
                        </div>

                        {/* Customer & Address Summary */}
                        <div className="kds-customer-row">
                          <strong>{order.customer?.name || "Guest Customer"}</strong>
                          <span className="kds-cust-phone">{order.customer?.phone || ""}</span>
                        </div>

                        {order.deliveryAddress?.street && (
                          <p className="kds-delivery-note">
                            📍 {order.deliveryAddress.street}, {order.deliveryAddress.city}
                          </p>
                        )}

                        {order.deliveryAddress?.instructions && (
                          <div className="kds-special-alert">
                            ⚠️ <strong>Note:</strong> {order.deliveryAddress.instructions}
                          </div>
                        )}

                        {/* Items Checklist for Line Cook */}
                        <div className="kds-items-checklist">
                          <div className="kds-items-heading">
                            <span>Item Preparation Checklist:</span>
                          </div>
                          {order.items?.map((item, idx) => {
                            const isChecked = checkedItems[`${order._id}_${idx}`];
                            return (
                              <label
                                key={idx}
                                className={`kds-item-check-row ${isChecked ? "prepared" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!isChecked}
                                  onChange={() => onToggleItemCheck && onToggleItemCheck(order._id, idx)}
                                />
                                <span className="kds-item-qty">{item.quantity}x</span>
                                <span className="kds-item-name">{item.name}</span>
                                {item.customizations && (
                                  <span className="kds-custom-flag">🎨 Custom</span>
                                )}
                              </label>
                            );
                          })}
                        </div>

                        {/* Ticket Footer / Stage Progression */}
                        <div className="kds-ticket-footer">
                          <div className="kds-total-row">
                            <span className="kds-payment-mode">
                              {order.paymentDetails?.method === "cod" ? "💵 COD" : "📱 Digital Paid"}
                            </span>
                            <span className="kds-price-tag">₹{order.totalAmount || order.grandTotal}</span>
                          </div>

                          <div className="kds-actions-row">
                            {col.prevStatus && (
                              <button
                                className="kds-revert-btn"
                                title="Revert to previous stage"
                                onClick={() => onStatusChange && onStatusChange(order._id, col.prevStatus)}
                              >
                                ⟵
                              </button>
                            )}

                            {col.nextStatus && (
                              <button
                                className="kds-progress-btn"
                                onClick={() => onStatusChange && onStatusChange(order._id, col.nextStatus)}
                              >
                                {col.nextLabel}
                              </button>
                            )}

                            {(col.id === "placed" || col.id === "confirmed") && (
                              <button
                                className="kds-cancel-btn"
                                title="Cancel Order"
                                onClick={() => onStatusChange && onStatusChange(order._id, "cancelled")}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KDSKanbanBoard;
