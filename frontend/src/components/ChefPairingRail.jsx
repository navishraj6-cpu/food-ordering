import { API_URL } from "../config/api";
import React, { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";
import { getSmartPairings } from "../utils/smartPairingService";

const fallbackSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%232b080b'/%3E%3Ctext x='50' y='58' font-size='32' text-anchor='middle'%3E%F0%9F%8D%B4%3C/text%3E%3C/svg%3E";

export const ChefPairingRail = ({
  title = "👑 Complete Your Feast",
  subtitle = "Recommended artisanal sides & chilled drinks",
  compact = false,
}) => {
  const { cartItems, addToCart } = useCart();
  const [allFoods, setAllFoods] = useState([]);
  const [addedDishName, setAddedDishName] = useState("");
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/foods`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllFoods(data);
        }
      })
      .catch(() => {});
  }, []);

  const pairings = getSmartPairings(cartItems, allFoods);

  if (!pairings || pairings.length === 0) return null;

  const handleQuickAdd = (dish) => {
    addToCart(dish, 1);
    setAddedDishName(dish.name);
    setTimeout(() => setAddedDishName(""), 1200);
  };

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className={`chef-pairing-rail-container ${compact ? "compact-rail" : ""}`}>
      <div className="pairing-rail-header">
        <div className="pairing-header-left">
          <div className="pairing-title-wrap">
            <span className="pairing-ai-sparkle">✨</span>
            <h4 className="pairing-rail-title">{title}</h4>
          </div>
          {subtitle && <p className="pairing-rail-subtitle">{subtitle}</p>}
        </div>

        {/* Moveable Navigation Controls */}
        <div className="pairing-moveable-controls">
          <button
            type="button"
            className="pairing-move-btn"
            onClick={() => handleScroll("left")}
            aria-label="Scroll left"
            title="View previous dishes"
          >
            ◀
          </button>
          <button
            type="button"
            className="pairing-move-btn"
            onClick={() => handleScroll("right")}
            aria-label="Scroll right"
            title="View more dishes"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="pairing-cards-scroll" ref={scrollContainerRef}>
        {pairings.map((dish) => {
          const isJustAdded = addedDishName === dish.name;
          return (
            <div key={dish._id || dish.name} className="pairing-dish-card">
              <div className="pairing-dish-img-wrap">
                <img
                  src={dish.image || fallbackSvg}
                  alt={dish.name}
                  className="pairing-dish-thumb"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackSvg;
                  }}
                  loading="lazy"
                />
                {dish.badge && <span className="pairing-dish-badge">{dish.badge}</span>}
              </div>

              <div className="pairing-dish-details">
                <span className="pairing-reason-tag">{dish.reason}</span>
                <h5 className="pairing-dish-name" title={dish.name}>{dish.name}</h5>
                <div className="pairing-dish-footer">
                  <span className="pairing-dish-price">₹{dish.price}</span>
                  <button
                    type="button"
                    className={`pairing-quick-add-btn ${isJustAdded ? "added-pop" : ""}`}
                    onClick={() => handleQuickAdd(dish)}
                    title={`Add ${dish.name} to cart`}
                  >
                    {isJustAdded ? "✓ Added" : "+ Add"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChefPairingRail;
