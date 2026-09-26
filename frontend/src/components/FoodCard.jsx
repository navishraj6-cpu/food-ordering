import React from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { isVegetarianDish, getDishRating } from "../pages/Home";

const fallbackSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='100%25' height='100%25' fill='%230f2920'/%3E%3Crect x='15' y='15' width='370' height='270' fill='none' stroke='%2310b981' stroke-width='2' stroke-dasharray='6,6' rx='8'/%3E%3Ccircle cx='200' cy='125' r='48' fill='%23143d2f' stroke='%2310b981' stroke-width='2'/%3E%3Ctext x='200' y='142' font-size='46' text-anchor='middle'%3E%F0%9F%8D%B4%3C/text%3E%3Ctext x='200' y='215' fill='%23faf6ee' font-family='sans-serif' font-size='18' font-weight='bold' text-anchor='middle'%3EFoodie Royal Dish%3C/text%3E%3Ctext x='200' y='240' fill='%23a7f3d0' font-family='sans-serif' font-size='13' text-anchor='middle'%3EFreshly Prepared%3C/text%3E%3C/svg%3E";

export const FoodCard = ({ food, onSelectFood }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { toggleFavorite, isFavorite } = useAuth();
  const itemId = food._id || food.name;
  const currentQty = getItemQuantity(itemId);
  const favorited = isFavorite(itemId);

  const isVeg = isVegetarianDish(food);
  const isSweetOrBeverage =
    (food.category || "").toLowerCase().includes("dessert") ||
    (food.category || "").toLowerCase().includes("drink") ||
    (food.category || "").toLowerCase().includes("shake") ||
    (food.category || "").toLowerCase().includes("beverage") ||
    (food.type || "").toLowerCase().includes("shake") ||
    (food.type || "").toLowerCase().includes("drink") ||
    (food.type || "").toLowerCase().includes("milkshake") ||
    (food.name || "").toLowerCase().includes("shake") ||
    (food.name || "").toLowerCase().includes("smoothie") ||
    (food.name || "").toLowerCase().includes("mojito");

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallbackSvg;
  };

  return (
    <div
      className="food-card-modern"
      id={`food-card-${itemId}`}
      onClick={() => onSelectFood && onSelectFood(food)}
    >
      {/* Image Wrap */}
      <div className="card-image-wrap">
        <img
          src={food.image || fallbackSvg}
          alt={food.name}
          className="card-food-img"
          onError={handleImageError}
          loading="lazy"
        />

        {/* Dietary Tag Pill */}
        {!isSweetOrBeverage && (
          <div className={`diet-badge ${isVeg ? "veg" : "non-veg"}`}>
            <span className="diet-dot"></span>
            <span className="diet-text">{isVeg ? "VEG" : "NON-VEG"}</span>
          </div>
        )}

        {/* Category Pill */}
        {food.category && (
          <span className="card-category-pill">{food.category}</span>
        )}

        {/* Favorite Heart Button - Top Right */}
        <button
          className={`card-fav-heart-btn ${favorited ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(itemId);
          }}
          title={favorited ? "Remove from Favorites" : "Add to Favorites"}
        >
          {favorited ? "❤️" : "🤍"}
        </button>
      </div>

      {/* Details Wrap */}
      <div className="card-body">
        <div className="card-header-row">
          <h3 className="card-food-title" title={food.name}>
            {food.name}
          </h3>
          <div className="card-rating-badge">
            <span>★</span>
            <span>{getDishRating(food)}</span>
          </div>
        </div>

        <p className="card-description">
          {food.description || "Crafted fresh with handpicked ingredients and chef-special seasoning."}
        </p>

        {/* Bottom Price & Add Action */}
        <div className="card-footer-row" onClick={(e) => e.stopPropagation()}>
          <div className="card-price-block">
            <span className="currency-symbol">₹</span>
            <span className="price-number">{food.price}</span>
          </div>

          {currentQty > 0 ? (
            <div className="card-stepper-btn" aria-label="Adjust quantity">
              <button
                className="stepper-sub-btn"
                onClick={() => updateQuantity(itemId, currentQty - 1)}
                title="Decrease quantity"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <div className="stepper-qty-badge">
                <span className="stepper-count">{currentQty}</span>
                <span className="stepper-in-cart">in cart</span>
              </div>
              <button
                className="stepper-add-btn"
                onClick={() => updateQuantity(itemId, currentQty + 1)}
                title="Increase quantity"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              className="card-add-btn"
              onClick={() => addToCart(food, 1)}
              aria-label={`Add ${food.name} to cart`}
              title={`Add ${food.name} to cart for ₹${food.price}`}
            >
              <span className="add-btn-icon">+</span>
              <span className="add-btn-label">Add to Cart</span>
              <span className="add-btn-cart">🛒</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

