import { API_URL } from "../config/api";
import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { ReceiptModal } from "../components/ReceiptModal";

const STATUS_LABELS = {
  placed: { text: "Order Placed", class: "status-placed", icon: "📝" },
  confirmed: { text: "Kitchen Accepted", class: "status-confirmed", icon: "👨‍🍳" },
  preparing: { text: "In Cooking", class: "status-preparing", icon: "🍳" },
  out_for_delivery: { text: "Out For Delivery", class: "status-delivery", icon: "🛵" },
  delivered: { text: "Delivered", class: "status-delivered", icon: "🎉" },
  cancelled: { text: "Cancelled", class: "status-cancelled", icon: "🚫" },
};

export const OrdersPage = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'active' | 'completed'
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFeedback, setSearchFeedback] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const navigate = useNavigate();

  // Multi-source loader: fetches user account orders + device local storage orders
  const loadOrders = useCallback(async () => {
    try {
      const fetchedMap = new Map();

      // 1. Fetch user authenticated orders if logged in
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/orders/my-orders`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            data.orders.forEach((ord) => fetchedMap.set(String(ord._id), ord));
          }
        } catch (e) {
          console.warn("Could not fetch user orders:", e);
        }
      }

      // 2. Fetch device recent orders from localStorage
      let localOrderIds = [];
      let savedPhone = "";
      let savedEmail = "";
      try {
        localOrderIds = JSON.parse(localStorage.getItem("foodie_recent_orders") || "[]");
        savedPhone = localStorage.getItem("foodie_customer_phone") || "";
        savedEmail = localStorage.getItem("foodie_customer_email") || "";
      } catch (e) {
        console.warn("Could not read localStorage:", e);
      }

      if (localOrderIds.length > 0 || savedPhone || savedEmail) {
        try {
          const batchRes = await fetch(`${API_URL}/api/orders/lookup-batch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderIds: localOrderIds,
              phone: savedPhone,
              email: savedEmail,
            }),
          });
          const batchData = await batchRes.json();
          if (batchData.success && Array.isArray(batchData.orders)) {
            batchData.orders.forEach((ord) => fetchedMap.set(String(ord._id), ord));
          }
        } catch (e) {
          console.warn("Could not batch lookup local orders:", e);
        }
      }

      const mergedList = Array.from(fetchedMap.values()).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setOrders(mergedList);
    } catch (err) {
      console.error("Order load error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadOrders();
    // Live polling every 5s for real-time status updates
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Handle Search / Lookup form
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // If matches single Order ID pattern (e.g. ORD-123456 or 6 digits), check or redirect
    if (/^ORD-\d+/i.test(query) || /^[a-f\d]{24}$/i.test(query)) {
      navigate(`/track/${query.toUpperCase()}`);
      return;
    }

    setIsSearching(true);
    setSearchFeedback("");
    try {
      const res = await fetch(`${API_URL}/api/orders/lookup-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: [query],
          phone: query,
          email: query,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        setOrders((prev) => {
          const map = new Map(prev.map((o) => [String(o._id), o]));
          data.orders.forEach((o) => map.set(String(o._id), o));
          return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        });
        setSearchFeedback(`Found ${data.orders.length} order(s) for "${query}"!`);
      } else {
        setSearchFeedback(`No orders found matching "${query}". Check your order ID or phone.`);
      }
    } catch (err) {
      setSearchFeedback("Failed to search orders. Please check your network.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReorder = (order) => {
    order.items?.forEach((item) => {
      addToCart(
        {
          _id: item.foodId,
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category,
        },
        item.quantity
      );
    });
    setIsCartOpen(true);
  };

  // Filtered list based on tabs
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "active") {
      return ["placed", "confirmed", "preparing", "out_for_delivery"].includes(order.orderStatus);
    }
    if (activeTab === "completed") {
      return order.orderStatus === "delivered" || order.orderStatus === "cancelled";
    }
    return true;
  });

  const activeCount = orders.filter((o) =>
    ["placed", "confirmed", "preparing", "out_for_delivery"].includes(o.orderStatus)
  ).length;
  const completedCount = orders.filter((o) =>
    ["delivered", "cancelled"].includes(o.orderStatus)
  ).length;

  return (
    <div className="orders-page-container">
      {/* Top Banner & Lookup Bar */}
      <div className="orders-page-header">
        <div>
          <span className="orders-eyebrow-badge">👑 Foodie Royal Dining</span>
          <h1 className="orders-title">Your Order History & Live Tracker</h1>
          <p className="orders-subtitle">
            Track active driver GPS deliveries in real-time, review tax invoices, and re-order your favorite royal feasts.
          </p>
        </div>

        {/* Quick Multi-Field Lookup Form */}
        <form onSubmit={handleSearchSubmit} className="order-lookup-form">
          <input
            type="text"
            placeholder="Order ID, Phone or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="lookup-btn" disabled={isSearching}>
            {isSearching ? "Searching..." : "🔍 Find / Track"}
          </button>
        </form>
      </div>

      {searchFeedback && (
        <div className="orders-search-feedback-banner">
          <span>ℹ️ {searchFeedback}</span>
          <button onClick={() => setSearchFeedback("")}>✕</button>
        </div>
      )}

      {/* Guest Notice if not signed in */}
      {!isAuthenticated && (
        <div className="orders-guest-notice-card">
          <div className="notice-icon">🔐</div>
          <div className="notice-text">
            <h3>Ordering as a Guest? All your device orders are shown below</h3>
            <p>Sign in to sync your order history across all phones and earn royal loyalty rewards on every meal.</p>
          </div>
          <Link to="/auth" className="hero-primary-btn">
            Sign In / Register
          </Link>
        </div>
      )}

      {/* Tabs Row */}
      <div className="orders-tabs-row">
        <button
          className={`orders-tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Orders <span className="tab-pill-count">{orders.length}</span>
        </button>
        <button
          className={`orders-tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          🔥 Live Active <span className="tab-pill-count active-pill">{activeCount}</span>
        </button>
        <button
          className={`orders-tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          ✅ Completed <span className="tab-pill-count">{completedCount}</span>
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="orders-loading-state">
          <div className="track-spinner"></div>
          <p>Fetching your royal order history & live delivery telemetry...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty-state">
          <span className="empty-orders-emoji">🧾</span>
          <h3>{activeTab === "active" ? "No active deliveries right now" : "No orders found"}</h3>
          <p>
            {activeTab === "active"
              ? "All your previous delicious feasts have been delivered successfully."
              : "You haven't placed any orders yet. Explore our royal menu to order something delicious!"}
          </p>
          <Link to="/" className="hero-primary-btn">
            🍔 Explore Royal Menu
          </Link>
        </div>
      ) : (
        <div className="orders-list-grid">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_LABELS[order.orderStatus] || STATUS_LABELS.placed;
            const isLiveActive = ["placed", "confirmed", "preparing", "out_for_delivery"].includes(order.orderStatus);
            const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={order._id} className={`order-history-card ${isLiveActive ? "is-live-active-card" : ""}`}>
                <div className="order-card-top">
                  <div className="order-id-block">
                    <div className="order-id-title-row">
                      <span className="order-id-label">
                        Order #{order.orderId || String(order._id).slice(-6)}
                      </span>
                      {isLiveActive && (
                        <span className="live-pulsing-badge">
                          <span className="live-dot"></span> LIVE IN-FLIGHT
                        </span>
                      )}
                    </div>
                    <span className="order-date-label">📅 {dateStr}</span>
                  </div>

                  <span className={`status-pill-badge ${statusConfig.class}`}>
                    <span className="status-badge-icon">{statusConfig.icon}</span>
                    {statusConfig.text}
                  </span>
                </div>

                {/* Delivery address snippet */}
                {order.deliveryAddress && (
                  <div className="order-delivery-address-snippet">
                    <span className="addr-pin">📍</span>
                    <span>
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}
                      {order.deliveryAddress.pincode ? ` - ${order.deliveryAddress.pincode}` : ""}
                    </span>
                  </div>
                )}

                {/* Items preview list */}
                <div className="order-items-preview">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="order-preview-item">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="order-item-tiny-thumb" />
                      )}
                      <span className="item-qty-tag">{item.quantity}x</span>
                      <span className="item-name-tag">{item.name}</span>
                      <span className="item-price-tag">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Card footer & actions */}
                <div className="order-card-bottom">
                  <div className="order-total-block">
                    <span>Total Paid:</span>
                    <strong className="order-total-amt">₹{order.totalAmount}</strong>
                    <span className="pay-method-badge">
                      {order.paymentMethod?.toUpperCase()} • {order.paymentStatus?.toUpperCase() || "PAID"}
                    </span>
                  </div>

                  <div className="order-card-actions">
                    <button
                      type="button"
                      className="order-invoice-btn"
                      onClick={() => setSelectedReceiptOrder(order)}
                      title="View & Print Official Tax Invoice"
                    >
                      📄 Tax Invoice
                    </button>

                    <button
                      type="button"
                      className="reorder-btn"
                      onClick={() => handleReorder(order)}
                      title="Re-add these items to cart"
                    >
                      🔄 Re-Order
                    </button>

                    <Link
                      to={`/track/${order.orderId || order._id}`}
                      className={`track-action-btn ${isLiveActive ? "highlight-track-btn" : ""}`}
                    >
                      {isLiveActive ? "🛵 Live GPS Map ➔" : "View Order ➔"}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Royal Tax Invoice & Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />
    </div>
  );
};
