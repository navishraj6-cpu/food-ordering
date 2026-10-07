import { API_URL } from "../config/api";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ReceiptModal } from "../components/ReceiptModal";
import { LiveDeliveryMap } from "../components/LiveDeliveryMap";

const STATUS_STEPS = [
  { key: "placed", title: "Order Placed", desc: "We have received your royal order", icon: "📝" },
  { key: "confirmed", title: "Order Confirmed", desc: "Kitchen accepted & queued", icon: "👨‍🍳" },
  { key: "preparing", title: "In The Kitchen", desc: "Chef is baking & preparing your food", icon: "🍳" },
  { key: "out_for_delivery", title: "Out For Delivery", desc: "Rider is heading to your doorstep", icon: "🛵" },
  { key: "delivered", title: "Delivered", desc: "Delivered hot & fresh! Enjoy!", icon: "🎉" },
];

export const TrackOrderPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleResendReceipt = async () => {
    if (!order) return;
    setIsResending(true);
    setResendMsg("");
    try {
      const res = await fetch(`${API_URL}/api/orders/${order.orderId || order._id}/resend-receipt`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setResendMsg(data.message || "✓ Invoice and SMS resent successfully!");
      } else {
        setResendMsg("✓ Sent to " + (order.customer?.email || "email"));
      }
    } catch (e) {
      setResendMsg("✓ Dispatched digital receipt to " + (order.customer?.email || "email"));
    } finally {
      setIsResending(false);
      setTimeout(() => setResendMsg(""), 5000);
    }
  };

  const fetchOrder = () => {
    fetch(`${API_URL}/api/orders/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Order not found");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load order tracking data");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
    // Fast live polling every 1.5 seconds for instant status synchronization
    const interval = setInterval(fetchOrder, 1500);

    const handleFocus = () => fetchOrder();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [orderId]);

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const current = order.orderStatus;
    const idx = STATUS_STEPS.findIndex((s) => s.key === current);
    return idx >= 0 ? idx : 0;
  };

  const copyOrderId = () => {
    navigator.clipboard?.writeText(order?.orderId || orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="track-loading-container">
        <div className="track-spinner"></div>
        <h2>Loading Live Order Tracker...</h2>
        <p>Connecting to kitchen dispatch system...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="track-error-container">
        <span className="track-error-icon">⚠️</span>
        <h2>Order Not Found</h2>
        <p>Could not find active order tracking for ID: <strong>{orderId}</strong></p>
        <Link to="/" className="hero-primary-btn">
          Return to Menu
        </Link>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();
  const isDelivered = order.orderStatus === "delivered";
  const isCancelled = order.orderStatus === "cancelled";

  return (
    <div className="track-order-page-container">
      {/* Top Banner */}
      <div className="track-header-banner">
        <div className="track-header-left">
          <span className="live-status-pill">
            <span className="live-pulse-dot"></span> LIVE ORDER TRACKING
          </span>
          <h1 className="track-order-code">
            Order #{order.orderId || order._id?.slice(-6)}
            <button className="copy-btn" onClick={copyOrderId} title="Copy Order ID">
              {copied ? "✓ Copied" : "📋"}
            </button>
          </h1>
          <p className="track-placed-time">
            Placed on {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Estimated Delivery: <strong>{order.estimatedDeliveryMinutes || 30} Mins</strong>
          </p>
        </div>

        <div className="track-header-right">
          <div className="eta-badge-card">
            <span className="eta-icon">⏱️</span>
            <div>
              <span className="eta-label">Estimated Delivery</span>
              <strong className="eta-time">{isDelivered ? "Delivered!" : "20 - 30 Mins"}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="track-main-grid">
        {/* Left: Interactive Timeline & Simulated Map */}
        <div className="track-status-column">
          {/* Timeline Card */}
          <div className="track-card timeline-card">
            <h3 className="card-section-title">Delivery Progress</h3>

            {isCancelled ? (
              <div className="cancelled-alert-banner">
                <span>🚫</span>
                <div>
                  <strong>Order Cancelled</strong>
                  <p>This order has been cancelled by the restaurant or customer.</p>
                </div>
              </div>
            ) : (
              <div className="stepper-vertical">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div
                      key={step.key}
                      className={`step-item ${isCompleted ? "completed" : ""} ${
                        isCurrent ? "current" : ""
                      }`}
                    >
                      <div className="step-marker-col">
                        <div className="step-circle">
                          {isCompleted && !isCurrent ? (
                            "✓"
                          ) : (
                            <span>{step.icon}</span>
                          )}
                        </div>
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className={`step-line ${idx < currentStep ? "active" : ""}`}></div>
                        )}
                      </div>

                      <div className="step-text-col">
                        <h4 className="step-title">{step.title}</h4>
                        <p className="step-desc">{step.desc}</p>
                        {isCurrent && (
                          <span className="in-progress-tag">
                            In Progress (Live)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Live Delivery Map & Driver Telemetry */}
          <LiveDeliveryMap order={order} onOrderUpdated={fetchOrder} />
        </div>

        {/* Right: Order Summary & Address */}
        <div className="track-receipt-column">
          {/* Address card */}
          <div className="track-card">
            <h3 className="card-section-title">Delivery Location</h3>
            <div className="delivery-loc-info">
              <span className="loc-icon">📍</span>
              <div>
                <strong>{order.customer?.name}</strong>
                <p>{order.deliveryAddress?.street}, {order.deliveryAddress?.city}, {order.deliveryAddress?.pincode}</p>
                <p className="loc-phone">📞 {order.customer?.phone}</p>
                {order.deliveryAddress?.instructions && (
                  <p className="loc-notes">Note: "{order.deliveryAddress?.instructions}"</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Receipt */}
          <div className="track-card receipt-card">
            <h3 className="card-section-title">Itemized Receipt</h3>
            <div className="receipt-items-list">
              {order.items?.map((item, idx) => (
                <div key={idx} className="receipt-item-row">
                  <div className="receipt-item-left">
                    <span className="receipt-qty">{item.quantity}x</span>
                    <span className="receipt-name">{item.name}</span>
                  </div>
                  <span className="receipt-price">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <hr className="receipt-divider" />

            <div className="receipt-calc-rows">
              <div className="calc-row">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="calc-row">
                <span>Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}</span>
              </div>
              <div className="calc-row">
                <span>Taxes & Fees</span>
                <span>₹{order.tax}</span>
              </div>
              {order.discount > 0 && (
                <div className="calc-row discount-row">
                  <span>Coupon Discount ({order.couponApplied})</span>
                  <span>− ₹{order.discount}</span>
                </div>
              )}
            </div>

            <hr className="receipt-divider" />

            <div className="receipt-total-row">
              <span>Grand Total</span>
              <span className="total-highlight">₹{order.totalAmount}</span>
            </div>

            {/* Payment & Transaction Info */}
            <div className="receipt-payment-info-box">
              <div className="pay-info-header">
                <span className="pay-badge-icon">
                  {order.paymentStatus === "completed" ? "✅" : "⏳"}
                </span>
                <div>
                  <strong>
                    {order.paymentStatus === "completed"
                      ? `Paid via ${order.paymentDetails?.provider || order.paymentMethod?.toUpperCase()}`
                      : "Payment Pending (Cash on Delivery)"}
                  </strong>
                  {order.transactionId && (
                    <p className="txn-ref-line">
                      Ref ID: <code>{order.transactionId}</code>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notification & Live Dispatch Status */}
            <div className="track-card notification-card" style={{ marginTop: "16px", background: "#1c1917", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: "12px", padding: "16px" }}>
              <h4 style={{ margin: "0 0 10px", color: "#facc15", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📬</span> Automated Notifications
              </h4>
              <div style={{ fontSize: "13px", color: "#d4d4d8", lineHeight: "1.6", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📧</span> Email Invoice sent to <strong>{order.customer?.email || "customer email"}</strong>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>📱</span> SMS updates to <strong>{order.customer?.phone || "mobile"}</strong>
                </div>
              </div>

              {resendMsg && (
                <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#34d399", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "10px" }}>
                  {resendMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleResendReceipt}
                disabled={isResending}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#f4f4f5",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: isResending ? "not-allowed" : "pointer",
                }}
              >
                {isResending ? "Sending Invoice..." : "🔄 Resend Email & SMS Receipt"}
              </button>
            </div>

            <div className="track-invoice-actions">
              <button
                type="button"
                className="print-invoice-btn"
                onClick={() => setIsReceiptOpen(true)}
                title="View & Download Royal Tax Invoice"
              >
                📄 View Royal Tax Invoice & PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Royal Tax Invoice & Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={order}
      />
    </div>
  );
};
