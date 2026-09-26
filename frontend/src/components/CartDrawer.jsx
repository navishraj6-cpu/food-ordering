import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ChefPairingRail } from "./ChefPairingRail";
import { NutritionMacroWidget } from "./NutritionMacroWidget";

const fallbackSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%232b080b'/%3E%3Ctext x='50' y='58' font-size='32' text-anchor='middle'%3E%F0%9F%8D%B4%3C/text%3E%3C/svg%3E";

export const CartDrawer = () => {
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    subtotal,
    deliveryFee,
    tax,
    discount,
    grandTotal,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
    availableCoupons,
    clearCart,
    redeemedPoints,
    setRedeemedPoints,
    pointsDiscount,
    pointsToEarn,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    setIsCartOpen(false);
    navigate("/checkout");
  };

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div
        className="cart-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-title-row">
            <span className="cart-drawer-icon">🛒</span>
            <h2>Your Order Cart</h2>
            <span className="cart-item-count-pill">
              {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}
            </span>
          </div>
          <button
            className="cart-close-btn"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        {cartItems.length === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-cart-emoji">🍽️</div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added any royal delicacies yet.</p>
            <button
              className="explore-menu-btn"
              onClick={() => {
                setIsCartOpen(false);
                navigate("/");
              }}
            >
              Explore Delicious Menu
            </button>
          </div>
        ) : (
          <div className="cart-drawer-scrollable">
            {/* Delivery Alert / Free Shipping Threshold */}
            {subtotal < 399 && !appliedCoupon?.freeDelivery && (
              <div className="free-delivery-bar">
                <span>🚚</span>
                <span>
                  Add <strong>₹{399 - subtotal}</strong> more for{" "}
                  <strong>FREE Delivery!</strong>
                </span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="cart-items-list">
              {cartItems.map((item) => {
                const id = item.food._id || item.food.name;
                return (
                  <div key={id} className="cart-item-row">
                    <img
                      src={item.food.image || fallbackSvg}
                      alt={item.food.name}
                      className="cart-item-thumb"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallbackSvg;
                      }}
                    />
                    <div className="cart-item-info">
                      <h4 className="cart-item-title">{item.food.name}</h4>
                      <p className="cart-item-price-each">
                        ₹{item.food.price} each
                      </p>
                    </div>

                    <div className="cart-item-actions">
                      <div className="cart-drawer-stepper">
                        <button
                          className="drawer-sub-btn"
                          onClick={() => updateQuantity(id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="drawer-qty">{item.quantity}</span>
                        <button
                          className="drawer-add-btn"
                          onClick={() => updateQuantity(id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="cart-item-total">
                        ₹{item.food.price * item.quantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Nutrition & Macro HUD */}
            <NutritionMacroWidget cartItems={cartItems} />

            {/* VIP Lucky Spin Teaser Banner */}
            <div
              className="cart-rewards-banner"
              onClick={() => {
                setIsCartOpen(false);
                navigate("/rewards");
              }}
            >
              <div className="rewards-banner-left">
                <span className="rewards-banner-icon">🎡</span>
                <div>
                  <strong>VIP Rewards & Lucky Spin</strong>
                  <p>Spin the wheel for extra ₹150 OFF or free dessert!</p>
                </div>
              </div>
              <span className="rewards-banner-arrow">➔</span>
            </div>

            {/* Smart Chef's AI Recommendations & Food Pairings */}
            <ChefPairingRail
              title="👑 Chef's Smart Pairings"
              subtitle="Add matching drinks & loaded sides in 1-click"
              compact={true}
            />

            {/* Promo Code Section */}
            <div className="cart-coupon-section">
              <label className="coupon-label">🎟️ Apply Promo Code</label>
              {appliedCoupon ? (
                <div className="applied-coupon-pill">
                  <div className="applied-coupon-info">
                    <span className="applied-code">{appliedCoupon.code}</span>
                    <span className="applied-desc">{appliedCoupon.label}</span>
                  </div>
                  <button
                    className="remove-coupon-btn"
                    onClick={removeCoupon}
                    title="Remove coupon"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="coupon-input-wrap">
                  <input
                    type="text"
                    className="coupon-text-input"
                    placeholder="Enter code (e.g. FIRST50, FEAST35)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  />
                  <button
                    className="apply-coupon-btn"
                    onClick={() => {
                      applyCoupon(couponInput);
                      setCouponInput("");
                    }}
                  >
                    Apply
                  </button>
                </div>
              )}

              {couponError && <p className="coupon-error-msg">{couponError}</p>}

              {/* Quick Coupon Chips */}
              {!appliedCoupon && (
                <div className="quick-coupon-chips">
                  {availableCoupons.map((c) => (
                    <button
                      key={c.code}
                      className="coupon-chip"
                      onClick={() => applyCoupon(c.code)}
                    >
                      <span className="chip-code">{c.code}</span>
                      <span className="chip-desc">{c.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Loyalty Points Redemption Widget */}
            <div className="cart-loyalty-redeem-box">
              <div className="loyalty-redeem-head">
                <div className="loyalty-icon-title">
                  <span className="coin-emoji">💎</span>
                  <div>
                    <strong>Foodie Gold Coins</strong>
                    <small>Redeem points for instant discount</small>
                  </div>
                </div>
                {redeemedPoints > 0 ? (
                  <button
                    className="remove-points-btn"
                    onClick={() => setRedeemedPoints(0)}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="apply-points-btn"
                    onClick={() => setRedeemedPoints(100)}
                  >
                    Use 100 pts (₹10 off)
                  </button>
                )}
              </div>
              {redeemedPoints > 0 && (
                <div className="points-applied-banner">
                  <span>✓ 100 Gold Coins applied (−₹10)</span>
                </div>
              )}
            </div>

            {/* Bill Summary */}
            <div className="cart-bill-summary">
              <h3>Bill Details</h3>
              <div className="bill-row">
                <span>Item Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="bill-row">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="free-tag">FREE</span>
                  ) : (
                    `₹${deliveryFee}`
                  )}
                </span>
              </div>
              <div className="bill-row">
                <span>GST & Restaurant Charges (5%)</span>
                <span>₹{tax}</span>
              </div>
              {discount > 0 && (
                <div className="bill-row discount-row">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>− ₹{discount}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="bill-row discount-row">
                  <span>Foodie Gold Coins (100 pts)</span>
                  <span>− ₹{pointsDiscount}</span>
                </div>
              )}
              <hr className="bill-divider" />
              <div className="bill-row grand-total-row">
                <span>To Pay</span>
                <span className="grand-total-val">₹{grandTotal}</span>
              </div>

              <div className="earn-points-strip">
                <span>✨ You will earn <strong>+{pointsToEarn} Foodie Gold Coins</strong> on this order!</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Checkout Bar */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="footer-total-info">
              <span className="footer-total-label">Grand Total</span>
              <span className="footer-grand-amount">₹{grandTotal}</span>
            </div>
            <button
              id="proceed-to-checkout-btn"
              className="proceed-checkout-btn"
              onClick={handleCheckoutClick}
            >
              <span>Proceed to Checkout</span>
              <span className="checkout-arrow">➔</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
