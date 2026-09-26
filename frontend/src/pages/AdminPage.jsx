import { API_URL } from "../config/api";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ReceiptModal } from "../components/ReceiptModal";
import { KOTModal } from "../components/KOTModal";
import { KDSKanbanBoard } from "../components/KDSKanbanBoard";

const ORDER_STATUSES = [
  { value: "placed", label: "📝 Order Placed" },
  { value: "confirmed", label: "👨‍🍳 Confirmed & Queued" },
  { value: "preparing", label: "🍳 In Kitchen (Cooking)" },
  { value: "out_for_delivery", label: "🛵 Out for Delivery" },
  { value: "delivered", label: "🎉 Delivered" },
  { value: "cancelled", label: "🚫 Cancelled" },
];

export const AdminPage = () => {
  const { user, token, isAdmin, login } = useAuth();
  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'menu' | 'reservations'
  const [ordersViewMode, setOrdersViewMode] = useState("kanban"); // 'kanban' | 'grid'

  // Admin Login Gate State
  const [adminEmail, setAdminEmail] = useState("admin@foodie.com");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState("");

  const handleAdminQuickLogin = async (e) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError("");
    const result = await login(adminEmail, adminPassword);
    if (!result.success) {
      setAdminLoginError(result.message || "Invalid Admin credentials.");
    } else if (result.user?.role !== "admin") {
      setAdminLoginError("This account does not have Admin / Kitchen Owner privileges.");
    }
    setAdminLoginLoading(false);
  };

  // Orders State
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("all");
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [selectedKotOrder, setSelectedKotOrder] = useState(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Chef Item Checklist (Checked/Prepared state per order item)
  const [checkedItems, setCheckedItems] = useState({});

  const toggleItemChecked = (orderId, itemIndex) => {
    const key = `${orderId}_${itemIndex}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Sound Engine State
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundTone, setSoundTone] = useState("bell"); // 'bell' | 'station' | 'horn'
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [isChiming, setIsChiming] = useState(false);
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  // Reservations State
  const [reservations, setReservations] = useState([]);
  const [resFilter, setResFilter] = useState("all");
  const [resSearch, setResSearch] = useState("");
  const [resLoading, setResLoading] = useState(true);

  // Menu State
  const [foods, setFoods] = useState([]);
  const [menuSearch, setMenuSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFood, setNewFood] = useState({
    name: "",
    category: "Burgers",
    type: "Non-Veg",
    price: "",
    image: "",
    description: "",
  });

  // Stats State
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  });

  // Synthesized Web Audio API Kitchen Alert Engine
  const playKitchenChime = (tone = soundTone) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      setIsChiming(true);
      setTimeout(() => setIsChiming(false), 1200);

      const playTone = (freq, start, duration, type = "sine") => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(soundVolume * 0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      if (tone === "bell") {
        // Royal Dinner Bell (D5 -> A5 -> D6)
        playTone(587.33, 0, 0.4, "sine");
        playTone(880.0, 0.15, 0.5, "triangle");
        playTone(1174.66, 0.32, 0.8, "sine");
      } else if (tone === "station") {
        // High-clarity kitchen alert ding (E5 -> B5)
        playTone(659.25, 0, 0.25, "sine");
        playTone(987.77, 0.12, 0.5, "sine");
      } else if (tone === "horn") {
        // Warm brass fanfare (A4 -> C#5 -> E5)
        playTone(440.0, 0, 0.2, "sawtooth");
        playTone(554.37, 0.1, 0.2, "sawtooth");
        playTone(659.25, 0.22, 0.6, "sawtooth");
      }
    } catch (e) {
      console.warn("Audio Context blocked or not ready:", e);
    }
  };

  const fetchOrders = () => {
    if (!token || !isAdmin) return;
    fetch(`${API_URL}/api/orders/all?status=${orderFilter}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          if (prevOrderCount > 0 && data.orders.length > prevOrderCount) {
            playKitchenChime();
            setStatusMsg("🔔 NEW INCOMING ORDER RECEIVED IN KITCHEN QUEUE!");
            setTimeout(() => setStatusMsg(""), 5000);
          }
          setPrevOrderCount(data.orders.length);
          setOrders(data.orders);
        }
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  };

  const fetchReservations = () => {
    if (!isAdmin) return;
    fetch(`${API_URL}/api/reservations/admin/all`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reservations)) {
          setReservations(data.reservations);
        }
      })
      .catch(() => {})
      .finally(() => setResLoading(false));
  };

  const fetchFoods = () => {
    fetch(`${API_URL}/api/foods`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFoods(data);
        }
      })
      .catch(() => {});
  };

  const fetchStats = () => {
    if (!token || !isAdmin) return;
    fetch(`${API_URL}/api/orders/stats/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!isAdmin) return;
    fetchOrders();
    fetchReservations();
    fetchFoods();
    fetchStats();

    const interval = setInterval(() => {
      fetchOrders();
      fetchReservations();
      fetchStats();
    }, 4000);
    return () => clearInterval(interval);
  }, [token, orderFilter, isAdmin]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Order updated to: ${newStatus.replace(/_/g, " ").toUpperCase()}!`);
        playKitchenChime("station");
        setTimeout(() => setStatusMsg(""), 3500);
        fetchOrders();
        fetchStats();
      }
    } catch {
      setStatusMsg("Failed to update status.");
    }
  };

  const handleReservationStatusChange = async (resId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/reservations/${resId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`Reservation #${resId.substring(0, 8)} updated to ${newStatus.toUpperCase()}!`);
        setTimeout(() => setStatusMsg(""), 3000);
        fetchReservations();
      }
    } catch {
      setStatusMsg("Failed to update reservation status.");
    }
  };

  const handleAddFoodSubmit = async (e) => {
    e.preventDefault();
    if (!newFood.name || !newFood.price) return;

    try {
      const res = await fetch(`${API_URL}/api/foods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newFood,
          price: Number(newFood.price),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddModal(false);
        setNewFood({
          name: "",
          category: "Burgers",
          type: "Non-Veg",
          price: "",
          image: "",
          description: "",
        });
        fetchFoods();
        setStatusMsg("New dish added to menu successfully!");
        setTimeout(() => setStatusMsg(""), 3000);
      }
    } catch {
      setStatusMsg("Failed to add dish.");
    }
  };

  // Helper for live elapsed kitchen time
  const getElapsedInfo = (createdAt) => {
    if (!createdAt) return { label: "Just now", badgeClass: "fresh" };
    const diffMins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    if (diffMins < 5) return { label: `${diffMins || 1}m ago (Fresh)`, badgeClass: "fresh" };
    if (diffMins < 15) return { label: `${diffMins}m ago (Cooking)`, badgeClass: "medium" };
    return { label: `⚠️ ${diffMins}m ago (Expedite!)`, badgeClass: "urgent" };
  };

  // Restricted Access Gate: Only Website Owner / Kitchen Admin can enter
  if (!isAdmin) {
    return (
      <div className="admin-page-container">
        <div className="admin-gate-card">
          <div className="admin-gate-icon">🔒</div>
          <span className="admin-gate-badge">RESTRICTED PORTAL</span>
          <h2 className="admin-gate-title">Kitchen & Owner Admin Only</h2>
          <p className="admin-gate-desc">
            This dashboard is private and strictly reserved for the restaurant owner, chefs, and kitchen staff.
            Please sign in with administrator credentials to manage live kitchen orders, menu items, and table reservations.
          </p>

          {adminLoginError && (
            <div className="admin-gate-error">{adminLoginError}</div>
          )}

          <form onSubmit={handleAdminQuickLogin} className="admin-gate-form">
            <div className="admin-gate-input-group">
              <label>Admin Email</label>
              <input
                type="email"
                placeholder="admin@foodie.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>
            <div className="admin-gate-input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="admin-gate-submit-btn"
              disabled={adminLoginLoading}
            >
              {adminLoginLoading ? "Authenticating..." : "⚡ Sign In as Kitchen Admin"}
            </button>
          </form>

          <div className="admin-gate-demo-tip">
            <span>🔑 Demo Admin Credentials:</span>
            <code>admin@foodie.com / admin123</code>
          </div>

          <div className="admin-gate-footer">
            <Link to="/" className="admin-gate-back-btn">
              ← Return to Food Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredMenuFoods = foods.filter(
    (f) =>
      f.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
      f.category?.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div className="admin-page-container">
      {/* Admin Top Header */}
      <div className="admin-header-row">
        <div>
          <div className="admin-badge-strip">
            <span className="admin-glow-dot"></span>
            <span>LIVE KITCHEN EXPEDITE & RESTAURANT CONTROL</span>
          </div>
          <h1 className="admin-title">⚡ Kitchen Live Dispatch Station</h1>
        </div>

        {/* Top Actions & Sound Control Center */}
        <div className="admin-header-actions">
          {/* Sound Synthesizer Bar */}
          <div className={`kitchen-sound-pill ${isChiming ? "chiming" : ""}`}>
            <button
              type="button"
              className={`sound-toggle-btn ${soundEnabled ? "on" : "off"}`}
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playKitchenChime(soundTone);
              }}
              title="Toggle Kitchen Chime"
            >
              <span className={`sound-bell-icon ${isChiming ? "ring" : ""}`}>
                {soundEnabled ? "🔔" : "🔕"}
              </span>
              <span>{soundEnabled ? "Chime: ON" : "Chime: OFF"}</span>
            </button>

            {soundEnabled && (
              <>
                <select
                  className="sound-tone-select"
                  value={soundTone}
                  onChange={(e) => {
                    setSoundTone(e.target.value);
                    playKitchenChime(e.target.value);
                  }}
                  title="Choose Audio Tone Preset"
                >
                  <option value="bell">🔔 Royal Bell</option>
                  <option value="station">👨‍🍳 Kitchen Ding</option>
                  <option value="horn">📣 Chef Horn</option>
                </select>

                <button
                  type="button"
                  className="test-sound-btn"
                  onClick={() => playKitchenChime(soundTone)}
                  title="Test Alert Chime Speaker"
                >
                  🔊 Test
                </button>
              </>
            )}
          </div>

          <button
            className="add-dish-top-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add New Dish
          </button>
        </div>
      </div>

      {statusMsg && <div className="admin-toast-message">{statusMsg}</div>}

      {/* Metrics Strip */}
      <div className="admin-stats-grid">
        <div className="metric-card">
          <div className="metric-icon bg-amber-soft">💰</div>
          <div>
            <span className="metric-label">Total Revenue</span>
            <strong className="metric-value">₹{Number(stats.totalRevenue || 0).toLocaleString()}</strong>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon bg-blue-soft">🍳</div>
          <div>
            <span className="metric-label">Active Kitchen Orders</span>
            <strong className="metric-value">{stats.activeOrders || 0}</strong>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon bg-green-soft">🎉</div>
          <div>
            <span className="metric-label">Delivered Orders</span>
            <strong className="metric-value">{stats.deliveredOrders || 0}</strong>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon bg-purple-soft">🍔</div>
          <div>
            <span className="metric-label">Menu Items</span>
            <strong className="metric-value">{foods.length} Dishes</strong>
          </div>
        </div>
      </div>

      {/* Live Radar Sync Strip */}
      <div className="admin-radar-strip">
        <div className="radar-status-left">
          <span className="radar-pulse-dot"></span>
          <span><strong>LIVE DISPATCH RADAR:</strong> Syncing real-time kitchen queue</span>
        </div>
        <div className="radar-status-right">
          <button
            type="button"
            className="radar-refresh-btn"
            onClick={() => {
              fetchOrders();
              fetchStats();
              setStatusMsg("🔄 Kitchen Queue Refreshed!");
              setTimeout(() => setStatusMsg(""), 2000);
            }}
          >
            🔄 Refresh Queue Now
          </button>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-item ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          📦 Live Kitchen Orders ({orders.length})
        </button>
        <button
          className={`admin-tab-item ${activeTab === "reservations" ? "active" : ""}`}
          onClick={() => setActiveTab("reservations")}
        >
          🥂 Table Reservations ({reservations.length})
        </button>
        <button
          className={`admin-tab-item ${activeTab === "menu" ? "active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          🍽️ Menu Manager ({foods.length})
        </button>
      </div>

      {/* TAB 1: LIVE ORDERS */}
      {activeTab === "orders" && (
        <div className="admin-orders-tab-content">
          {/* View Mode Bar */}
          <div className="orders-view-mode-bar">
            <div className="view-mode-toggle-group">
              <button
                type="button"
                className={`view-mode-btn ${ordersViewMode === "kanban" ? "active" : ""}`}
                onClick={() => setOrdersViewMode("kanban")}
              >
                <span>👨‍🍳 KDS Live Kanban Board</span>
              </button>
              <button
                type="button"
                className={`view-mode-btn ${ordersViewMode === "grid" ? "active" : ""}`}
                onClick={() => setOrdersViewMode("grid")}
              >
                <span>📋 Standard Grid View</span>
              </button>
            </div>
            <span className="live-orders-total-tag">
              ⚡ {orders.length} Live Tickets Synchronized
            </span>
          </div>

          {ordersViewMode === "kanban" ? (
            <KDSKanbanBoard
              orders={orders}
              onStatusChange={handleStatusChange}
              onOpenKot={(ord) => setSelectedKotOrder(ord)}
              onOpenReceipt={(ord) => setSelectedReceiptOrder(ord)}
              checkedItems={checkedItems}
              onToggleItemCheck={toggleItemChecked}
              getElapsedInfo={getElapsedInfo}
            />
          ) : (
            <>
              {/* Status Filter Bar */}
              <div className="admin-filter-strip">
                <span className="filter-label">Filter Orders:</span>
                <div className="status-filter-buttons">
                  {["all", "placed", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].map(
                    (st) => (
                      <button
                        key={st}
                        className={`status-btn-filter ${orderFilter === st ? "active" : ""}`}
                        onClick={() => setOrderFilter(st)}
                      >
                        {st === "all" ? "All Orders" : st.replace(/_/g, " ")}
                      </button>
                    )
                  )}
                </div>
              </div>

              {ordersLoading ? (
                <div className="orders-loading-state">
                  <div className="track-spinner"></div>
                  <p>Loading live kitchen queue...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="orders-empty-state">
                  <span className="empty-orders-emoji">☕</span>
                  <h3>No orders in this status</h3>
                  <p>New customer orders will appear here in real-time with sound alerts.</p>
                </div>
              ) : (
                <div className="admin-orders-grid">
                  {orders.map((order) => {
                    const elapsed = getElapsedInfo(order.createdAt);
                    const isCompleted = order.orderStatus === "delivered";
                    const isCancelled = order.orderStatus === "cancelled";

                    return (
                      <div key={order._id} className={`admin-order-card status-${order.orderStatus}`}>
                        {/* Order Head */}
                        <div className="admin-order-head">
                          <div>
                            <span className="admin-ord-id">
                              #{order.orderId || order._id?.slice(-6)}
                            </span>
                            <span className="admin-ord-time">
                              {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className={`elapsed-badge ${elapsed.badgeClass}`}>
                              {elapsed.label}
                            </span>
                          </div>

                          <span className={`admin-status-pill status-${order.orderStatus}`}>
                            {order.orderStatus?.replace(/_/g, " ")}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="admin-cust-info">
                          <strong>{order.customer?.name}</strong>
                          <span>📞 {order.customer?.phone}</span>
                        </div>

                        {/* Order Items */}
                        <div className="admin-ord-items">
                          <p className="admin-items-label">Order Items:</p>
                          <ul className="admin-items-list">
                            {order.items?.map((item, idx) => {
                              const isChecked = checkedItems[`${order._id}_${idx}`];
                              return (
                                <li
                                  key={idx}
                                  className={`admin-item-row ${isChecked ? "prepared" : ""}`}
                                  onClick={() => toggleItemChecked(order._id, idx)}
                                >
                                  <span className="item-check-box">
                                    {isChecked ? "✅" : "⬜"}
                                  </span>
                                  <span className="admin-item-qty">{item.quantity}x</span>
                                  <span className="admin-item-name">{item.name}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {/* Delivery Address */}
                        <div className="admin-ord-address">
                          <span className="addr-icon">📍</span>
                          <span>
                            {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                          </span>
                        </div>

                        {/* Special Note */}
                        {order.deliveryAddress?.instructions && (
                          <div className="admin-special-note">
                            <strong>Note:</strong> {order.deliveryAddress.instructions}
                          </div>
                        )}

                        {/* Kitchen Ordering Level Quick Actions */}
                        <div className="admin-level-quick-stepper">
                          <div className="level-stepper-label">
                            <span className="stepper-title">🍳 Kitchen Stage:</span>
                            <span className={`level-current-badge badge-${order.orderStatus}`}>
                              {ORDER_STATUSES.find((s) => s.value === order.orderStatus)?.label || order.orderStatus}
                            </span>
                          </div>

                          <div className="admin-stage-actions-strip">
                            {order.orderStatus === "placed" && (
                              <button
                                type="button"
                                className="admin-stage-btn confirm-btn"
                                onClick={() => handleStatusChange(order._id, "confirmed")}
                              >
                                👨‍🍳 1. Confirm Order ➔
                              </button>
                            )}
                            {order.orderStatus === "confirmed" && (
                              <button
                                type="button"
                                className="admin-stage-btn kitchen-btn"
                                onClick={() => handleStatusChange(order._id, "preparing")}
                              >
                                🍳 2. In Kitchen (Start Cooking) ➔
                              </button>
                            )}
                            {order.orderStatus === "preparing" && (
                              <button
                                type="button"
                                className="admin-stage-btn dispatch-btn"
                                onClick={() => handleStatusChange(order._id, "out_for_delivery")}
                              >
                                🛵 3. Start Bike & Dispatch ➔
                              </button>
                            )}
                            {order.orderStatus === "out_for_delivery" && (
                              <button
                                type="button"
                                className="admin-stage-btn deliver-btn"
                                onClick={() => handleStatusChange(order._id, "delivered")}
                              >
                                🎉 4. Confirm Delivered to Doorstep ➔
                              </button>
                            )}
                            {order.orderStatus === "delivered" && (
                              <div className="admin-delivered-completed-tag">
                                ✅ Delivered to Doorstep Successfully
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Change Status Controls */}
                        <div className="admin-status-changer">
                          <label>Manual Override:</label>
                          <select
                            className="status-dropdown"
                            value={order.orderStatus}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            disabled={isCompleted || isCancelled}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Order Foot */}
                        <div className="admin-order-foot">
                          <div className="admin-ord-total">
                            <span className="admin-total-val">₹{order.totalAmount || order.grandTotal}</span>
                            <span className="admin-pay-badge">{order.paymentMethod?.toUpperCase()}</span>
                          </div>

                          <div className="admin-card-action-links">
                            <button
                              type="button"
                              className="action-pill-btn kot-pill-btn"
                              onClick={() => setSelectedKotOrder(order)}
                              title="Print Kitchen Order Ticket (KOT)"
                            >
                              🎫 Print KOT
                            </button>

                            <button
                              type="button"
                              className="action-pill-btn invoice-pill-btn"
                              onClick={() => setSelectedReceiptOrder(order)}
                              title="View Tax Invoice"
                            >
                              📄 Invoice
                            </button>

                            <Link
                              to={`/track/${order.orderId || order._id}`}
                              className="view-tracker-link"
                              target="_blank"
                              title="Open Customer Live Tracker"
                            >
                              🌐 Tracker ➔
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: MENU MANAGER */}
      {activeTab === "menu" && (
        <div className="admin-menu-tab-content">
          <div className="menu-search-bar-row">
            <input
              type="text"
              placeholder="Search dishes to edit or view..."
              className="admin-menu-search-input"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
            />
            <button
              className="add-dish-btn-secondary"
              onClick={() => setShowAddModal(true)}
            >
              + Add Dish
            </button>
          </div>

          <div className="admin-foods-table-wrapper">
            <table className="admin-foods-table">
              <thead>
                <tr>
                  <th>Dish</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenuFoods.map((food) => (
                  <tr key={food._id || food.name}>
                    <td className="food-td-name">
                      <img
                        src={food.image}
                        alt={food.name}
                        className="admin-food-thumb"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
                      <div>
                        <strong>{food.name}</strong>
                        <p className="food-desc-short">{food.description}</p>
                      </div>
                    </td>
                    <td>{food.category}</td>
                    <td>
                      <span
                        className={`diet-tag-pill ${
                          food.type?.toLowerCase().includes("veg") ? "veg" : "non-veg"
                        }`}
                      >
                        {food.type}
                      </span>
                    </td>
                    <td><strong>₹{food.price}</strong></td>
                    <td>
                      <span className="in-stock-badge">✓ In Stock</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TABLE RESERVATIONS */}
      {activeTab === "reservations" && (
        <div className="admin-reservations-tab-content">
          <div className="admin-menu-header-bar">
            <div className="admin-search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by Guest Name, Phone, RES-ID, or Table #..."
                value={resSearch}
                onChange={(e) => setResSearch(e.target.value)}
              />
              {resSearch && (
                <button
                  className="clear-search-btn"
                  onClick={() => setResSearch("")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="reservation-header-actions">
              <button
                className="refresh-res-btn"
                onClick={fetchReservations}
                title="Refresh Reservations"
              >
                🔄 Refresh Bookings
              </button>
              <Link to="/reservation" className="add-dish-btn-secondary" target="_blank">
                + Book New Dine-In
              </Link>
            </div>
          </div>

          <div className="admin-filter-strip">
            <span className="filter-label">Filter Status:</span>
            <div className="status-filter-buttons">
              {[
                { id: "all", label: "All Bookings" },
                { id: "confirmed", label: "⏳ Confirmed" },
                { id: "seated", label: "🪑 Seated Now" },
                { id: "completed", label: "✅ Completed" },
                { id: "cancelled", label: "🚫 Cancelled" },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`status-btn-filter ${resFilter === item.id ? "active" : ""}`}
                  onClick={() => setResFilter(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {resLoading ? (
            <div className="orders-loading-state">
              <div className="track-spinner"></div>
              <p>Loading table bookings...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="orders-empty-state">
              <span className="empty-orders-emoji">🥂</span>
              <h3>No Reservations Found</h3>
              <p>Table bookings made online or in-house will appear here automatically.</p>
              <Link to="/reservation" className="status-btn-filter active" style={{ marginTop: "16px", display: "inline-block" }}>
                Make First Reservation
              </Link>
            </div>
          ) : (
            <div className="admin-reservations-grid">
              {reservations
                .filter((r) => {
                  const matchesFilter = resFilter === "all" || r.status === resFilter;
                  const query = resSearch.toLowerCase();
                  const matchesSearch =
                    !resSearch ||
                    r.guestName?.toLowerCase().includes(query) ||
                    r.phone?.toLowerCase().includes(query) ||
                    r.reservationId?.toLowerCase().includes(query) ||
                    r.tableName?.toLowerCase().includes(query) ||
                    r.tableNumber?.toString().includes(query);
                  return matchesFilter && matchesSearch;
                })
                .map((res) => (
                  <div key={res._id || res.reservationId} className={`admin-reservation-card status-${res.status}`}>
                    <div className="res-card-top-bar">
                      <span className="res-id-chip">🎫 {res.reservationId || res._id?.substring(0, 8)}</span>
                      <span className={`res-status-tag tag-${res.status}`}>
                        {res.status === "confirmed" && "⏳ Confirmed"}
                        {res.status === "seated" && "🪑 Seated Now"}
                        {res.status === "completed" && "✅ Finished"}
                        {res.status === "cancelled" && "🚫 Cancelled"}
                      </span>
                    </div>

                    <div className="res-card-table-banner">
                      <div className="res-table-icon">🍽️</div>
                      <div>
                        <h4 className="res-table-heading">
                          {(res.tableCount && res.tableCount > 1) || (res.tableNumbers && res.tableNumbers.length > 1)
                            ? `Tables (${res.tableCount || res.tableNumbers.length}): `
                            : "Table #"}
                          {res.tableNumber || res.tableNumbers?.join(", ")}
                        </h4>
                        <span className="res-zone-text">
                          📍 {res.seatingArea} {res.totalCapacity ? `• ${res.totalCapacity} Total Seats` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="res-card-details">
                      <div className="res-detail-row">
                        <span className="res-icon">👤</span>
                        <div>
                          <strong>{res.guestName}</strong>
                          <div className="res-contact-links">
                            <a href={`tel:${res.phone}`} className="res-contact-link">📞 {res.phone}</a>
                            {res.email && <a href={`mailto:${res.email}`} className="res-contact-link">✉️ {res.email}</a>}
                          </div>
                        </div>
                      </div>

                      <div className="res-detail-grid-2">
                        <div className="res-sub-detail">
                          <span className="res-icon">📅</span>
                          <div>
                            <span className="res-label">Date & Time</span>
                            <strong>{res.date} • {res.timeSlot}</strong>
                          </div>
                        </div>
                        <div className="res-sub-detail">
                          <span className="res-icon">👥</span>
                          <div>
                            <span className="res-label">Party Size</span>
                            <strong>{res.guestCount} Guests</strong>
                          </div>
                        </div>
                      </div>

                      {res.occasion && res.occasion !== "Casual Dining" && (
                        <div className="res-occasion-badge">
                          ✨ Occasion: <strong>{res.occasion}</strong>
                        </div>
                      )}

                      {res.specialRequests && (
                        <div className="res-special-note">
                          <span>📝 Chef Note:</span>
                          <em>"{res.specialRequests}"</em>
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="res-card-actions">
                      {res.status === "confirmed" && (
                        <>
                          <button
                            className="res-action-btn btn-seat"
                            onClick={() => handleReservationStatusChange(res._id, "seated")}
                          >
                            🪑 Seat Guests
                          </button>
                          <button
                            className="res-action-btn btn-cancel"
                            onClick={() => handleReservationStatusChange(res._id, "cancelled")}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {res.status === "seated" && (
                        <>
                          <button
                            className="res-action-btn btn-complete"
                            onClick={() => handleReservationStatusChange(res._id, "completed")}
                          >
                            ✅ Mark Dining Finished
                          </button>
                          <button
                            className="res-action-btn btn-cancel"
                            onClick={() => handleReservationStatusChange(res._id, "cancelled")}
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {res.status === "cancelled" && (
                        <button
                          className="res-action-btn btn-reopen"
                          onClick={() => handleReservationStatusChange(res._id, "confirmed")}
                        >
                          🔄 Reinstate Booking
                        </button>
                      )}

                      {res.status === "completed" && (
                        <div className="res-completed-stamp">
                          ✓ Dining Experience Completed
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Add New Dish Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>+ Add New Royal Dish</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFoodSubmit} className="modal-form">
              <div className="form-group">
                <label>Dish Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Smoky Truffle Burger"
                  value={newFood.name}
                  onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={newFood.category}
                    onChange={(e) => setNewFood({ ...newFood, category: e.target.value })}
                  >
                    <option value="Burgers">Burgers</option>
                    <option value="Pizza">Pizza</option>
                    <option value="Crispy Chicken">Crispy Chicken</option>
                    <option value="Sandwiches">Sandwiches</option>
                    <option value="Fries">Fries</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Dietary Type *</label>
                  <select
                    value={newFood.type}
                    onChange={(e) => setNewFood({ ...newFood, type: e.target.value })}
                  >
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Veg">Veg</option>
                    <option value="Chicken">Chicken</option>
                    <option value="Dessert">Dessert</option>
                    <option value="Drink">Drink</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  placeholder="e.g. 299"
                  value={newFood.price}
                  onChange={(e) => setNewFood({ ...newFood, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newFood.image}
                  onChange={(e) => setNewFood({ ...newFood, image: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="2"
                  placeholder="Fresh ingredients, recipe details..."
                  value={newFood.description}
                  onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-submit-btn">
                  Save & Publish Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kitchen Order Ticket (KOT) Modal */}
      <KOTModal
        isOpen={Boolean(selectedKotOrder)}
        onClose={() => setSelectedKotOrder(null)}
        order={selectedKotOrder}
      />

      {/* Royal Tax Invoice / Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />
    </div>
  );
};
