import React from "react";
import { useCart } from "../context/CartContext";

export const FloatingCartPill = () => {
  const { totalCount, grandTotal, setIsCartOpen } = useCart();

  return (
    <div
      className={`floating-cart-pill-wrap ${totalCount > 0 ? "has-items" : ""}`}
      onClick={() => setIsCartOpen(true)}
      title="View your Foodie Cart"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsCartOpen(true);
        }
      }}
    >
      <div className="floating-cart-inner">
        <div className="floating-cart-icon-box">
          <span className="floating-cart-icon">🛒</span>
          {totalCount > 0 && (
            <span className="floating-cart-badge">{totalCount}</span>
          )}
        </div>

        <div className="floating-cart-text-col">
          <span className="floating-cart-label">
            {totalCount > 0 ? `${totalCount} item${totalCount > 1 ? "s" : ""}` : "Cart"}
          </span>
          {totalCount > 0 && (
            <span className="floating-cart-price">₹{grandTotal}</span>
          )}
        </div>

        <span className="floating-cart-arrow">→</span>
      </div>
    </div>
  );
};

export default FloatingCartPill;
