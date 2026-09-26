import { API_URL } from "../config/api";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { PaymentModal } from "../components/PaymentModal";
import { ChefPairingRail } from "../components/ChefPairingRail";

export const CheckoutPage = () => {
  const {
    cartItems,
    subtotal,
    deliveryFee,
    tax,
    discount,
    grandTotal,
    appliedCoupon,
    clearCart,
    redeemedPoints,
    setRedeemedPoints,
    pointsDiscount,
    pointsToEarn,
  } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    street: user?.addresses?.[0]?.street || "",
    city: user?.addresses?.[0]?.city || "Mumbai",
    state: user?.addresses?.[0]?.state || "Maharashtra",
    pincode: user?.addresses?.[0]?.pincode || "",
    instructions: "",
    paymentMethod: "upi",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty-container">
        <span className="empty-cart-icon">🛒</span>
        <h2>Your Cart is Empty</h2>
        <p>Please select some delicious items before heading to checkout.</p>
        <Link to="/" className="hero-primary-btn">
          Back to Menu
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setErrorMsg("Please enter your full name.");
      return false;
    }
    if (!formData.phone.trim()) {
      setErrorMsg("Please enter a valid phone number.");
      return false;
    }
    if (!formData.street.trim()) {
      setErrorMsg("Please enter your delivery street address.");
      return false;
    }
    if (!formData.pincode.trim()) {
      setErrorMsg("Please enter your delivery pincode.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const placeFinalOrder = async (paymentData = null) => {
    setIsSubmitting(true);
    try {
      const isDigital = formData.paymentMethod !== "cod";
      const orderPayload = {
        customer: {
          name: formData.name.trim(),
          email: formData.email.trim() || `${formData.phone}@customer.foodie`,
          phone: formData.phone.trim(),
        },
        items: cartItems.map((item) => ({
          foodId: item.food._id || `food_${Date.now()}`,
          name: item.food.name,
          price: item.food.price,
          quantity: item.quantity,
          image: item.food.image,
          category: item.food.category,
          description: item.food.description || "",
          specialInstructions: item.food.specialInstructions || "",
        })),
        deliveryAddress: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          instructions: formData.instructions.trim(),
        },
        subtotal,
        tax,
        deliveryFee,
        discount,
        couponApplied: appliedCoupon?.code || "",
        redeemedPoints: Number(redeemedPoints || 0),
        totalAmount: grandTotal,
        paymentMethod: formData.paymentMethod,
        paymentStatus: isDigital ? "completed" : "pending",
        transactionId: paymentData?.transactionId || (isDigital ? `TXN_${Date.now()}` : ""),
        paymentDetails: paymentData?.paymentDetails || {
          method: formData.paymentMethod,
          provider: isDigital ? "Foodie Pay" : "Cash",
          paidAt: isDigital ? new Date() : null,
        },
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create order");

      const createdOrder = data.order;
      try {
        const existing = JSON.parse(localStorage.getItem("foodie_recent_orders") || "[]");
        const updated = [
          createdOrder.orderId,
          createdOrder._id,
          ...existing.filter((id) => id !== createdOrder.orderId && id !== createdOrder._id),
        ].slice(0, 30);
        localStorage.setItem("foodie_recent_orders", JSON.stringify(updated));
        if (formData.phone) localStorage.setItem("foodie_customer_phone", formData.phone.trim());
        if (formData.email) localStorage.setItem("foodie_customer_email", formData.email.trim());
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }

      clearCart();
      setIsPaymentModalOpen(false);
      navigate(`/track/${createdOrder.orderId || createdOrder._id}`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (formData.paymentMethod === "cod") {
      placeFinalOrder();
    } else {
      setIsPaymentModalOpen(true);
    }
  };

  return (
    <div className="checkout-page-container">
      <div className="checkout-header-row">
        <Link to="/" className="checkout-back-link">
          ← Back to Menu
        </Link>
        <h1 className="checkout-page-title">Secure Royal Checkout</h1>
      </div>

      <div className="checkout-layout-grid">
        {/* Left Form Column */}
        <form onSubmit={handleSubmit} className="checkout-form-column">
          {errorMsg && <div className="checkout-error-banner">{errorMsg}</div>}

          {/* Section 1: Customer Details */}
          <div className="checkout-card-section">
            <div className="checkout-section-header">
              <span className="step-num">1</span>
              <h3>Contact Information</h3>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="e.g. rahul@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Section 2: Delivery Address */}
          <div className="checkout-card-section">
            <div className="checkout-section-header">
              <span className="step-num">2</span>
              <h3>Delivery Address</h3>
            </div>

            <div className="form-group">
              <label>Flat / House / Street / Landmark *</label>
              <textarea
                name="street"
                rows="2"
                placeholder="e.g. Flat 402, Royal Palms, Link Road"
                value={formData.street}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="Enter 6-digit Pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength="6"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Delivery Instructions (Optional)</label>
              <input
                type="text"
                name="instructions"
                placeholder="e.g. Please do not ring bell, leave at door"
                value={formData.instructions}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Complete Your Feast - Moveable Interactive Slider */}
          <div className="checkout-card-section checkout-feast-card-section">
            <ChefPairingRail
              title="👑 Complete Your Feast"
              subtitle="Add chef-curated sides, crispy fries, royal desserts & drinks"
            />
          </div>

          {/* Section 3: Payment Method */}
          <div className="checkout-card-section">
            <div className="checkout-section-header">
              <span className="step-num">3</span>
              <h3>Payment Method</h3>
            </div>

            <div className="payment-options-grid">
              <label
                className={`payment-option-card ${
                  formData.paymentMethod === "upi" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={formData.paymentMethod === "upi"}
                  onChange={handleChange}
                />
                <span className="payment-icon">📱</span>
                <div>
                  <strong>Instant UPI / QR</strong>
                  <p>Google Pay, PhonePe, Paytm, BHIM</p>
                </div>
                <span className="fast-badge">FASTEST</span>
              </label>

              <label
                className={`payment-option-card ${
                  formData.paymentMethod === "card" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={handleChange}
                />
                <span className="payment-icon">💳</span>
                <div>
                  <strong>Credit / Debit Card</strong>
                  <p>Visa, Mastercard, RuPay</p>
                </div>
              </label>

              <label
                className={`payment-option-card ${
                  formData.paymentMethod === "netbanking" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="netbanking"
                  checked={formData.paymentMethod === "netbanking"}
                  onChange={handleChange}
                />
                <span className="payment-icon">🏦</span>
                <div>
                  <strong>Net Banking</strong>
                  <p>HDFC, ICICI, SBI, Axis & 50+ Banks</p>
                </div>
              </label>

              <label
                className={`payment-option-card ${
                  formData.paymentMethod === "cod" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={handleChange}
                />
                <span className="payment-icon">💵</span>
                <div>
                  <strong>Cash on Delivery (COD)</strong>
                  <p>Pay cash or UPI to delivery rider upon arrival</p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            id="place-order-submit-btn"
            className="place-order-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span>Placing Your Royal Order...</span>
            ) : formData.paymentMethod === "cod" ? (
              <span>Confirm & Place COD Order (₹{grandTotal}) ➔</span>
            ) : (
              <span>Proceed to Secure Pay (₹{grandTotal}) 🔒</span>
            )}
          </button>
        </form>

        {/* Right Order Summary Column */}
        <div className="checkout-summary-column">
          <div className="checkout-summary-card">
            <h3>Order Summary ({cartItems.length} items)</h3>

            <div className="summary-items-list">
              {cartItems.map((item) => {
                const id = item.food._id || item.food.name;
                return (
                  <div key={id} className="summary-item-row">
                    <span className="summary-item-qty">{item.quantity}x</span>
                    <span className="summary-item-name">{item.food.name}</span>
                    <span className="summary-item-price">
                      ₹{item.food.price * item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>

            <hr className="summary-divider" />

            <div className="summary-price-lines">
              <div className="price-line">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="price-line">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
              </div>
              <div className="price-line">
                <span>Taxes (5% GST)</span>
                <span>₹{tax}</span>
              </div>
              {discount > 0 && (
                <div className="price-line discount">
                  <span>Promo Discount ({appliedCoupon?.code})</span>
                  <span>− ₹{discount}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="price-line discount">
                  <span>Foodie Gold Coins (100 pts)</span>
                  <span>− ₹{pointsDiscount}</span>
                </div>
              )}
            </div>

            {/* Loyalty points toggle in checkout */}
            <div className="checkout-loyalty-strip">
              <div className="checkout-loyalty-left">
                <span>💎 Foodie Gold Coins</span>
                <small>{redeemedPoints > 0 ? "100 pts applied (−₹10)" : "Use 100 pts for ₹10 off"}</small>
              </div>
              {redeemedPoints > 0 ? (
                <button
                  type="button"
                  className="loyalty-toggle-btn active"
                  onClick={() => setRedeemedPoints(0)}
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="loyalty-toggle-btn"
                  onClick={() => setRedeemedPoints(100)}
                >
                  Apply
                </button>
              )}
            </div>

            <hr className="summary-divider" />

            <div className="summary-total-line">
              <span>Total Payable</span>
              <span>₹{grandTotal}</span>
            </div>

            <div className="earn-points-strip">
              <span>✨ You will earn <strong>+{pointsToEarn} Foodie Gold Coins</strong> on this order!</span>
            </div>

            <div className="summary-trust-badge">
              <span>🛡️ 100% Secure & Hygienic Delivery Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={grandTotal}
        customerInfo={{ name: formData.name, phone: formData.phone }}
        onPaymentSuccess={(paymentData) => placeFinalOrder(paymentData)}
      />
    </div>
  );
};
