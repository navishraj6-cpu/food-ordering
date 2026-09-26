

import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { isVegetarianDish, getDishRating, getDishReviewCount } from "../pages/Home";

const fallbackSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='100%25' height='100%25' fill='%230f2920'/%3E%3Ctext x='200' y='160' font-size='50' text-anchor='middle'%3E%F0%9F%8D%B4%3C/text%3E%3C/svg%3E";

const INITIAL_REVIEWS = [
  { id: 1, name: "Priya Menon", rating: 5, date: "Yesterday", comment: "Absolutely delicious! The flavours were rich and it arrived steaming hot in 20 minutes." },
  { id: 2, name: "Vikram R", rating: 5, date: "3 days ago", comment: "One of the best dishes on Foodie! Fresh quality ingredients and perfect portion size." },
  { id: 3, name: "Ananya S", rating: 4, date: "1 week ago", comment: "Super tasty and well seasoned. Pairs wonderfully with the coolers!" },
];

export const FoodDetailModal = ({ food, onClose }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { user } = useAuth();
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  if (!food) return null;

  const itemId = food._id || food.name;
  const currentQty = getItemQuantity(itemId);
  const dishRating = getDishRating(food);
  const baseReviewsCount = getDishReviewCount(food);
  const totalReviewsCount = baseReviewsCount + (reviews.length - INITIAL_REVIEWS.length);

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

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const reviewObj = {
      id: Date.now(),
      name: user?.name || "Verified Customer",
      rating: newRating,
      date: "Just now",
      comment: newComment.trim(),
    };

    setReviews([reviewObj, ...reviews]);
    setNewComment("");
    setShowReviewForm(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="food-detail-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-corner-btn" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="detail-modal-grid">
          {/* Left: Uncropped Full View Image & Dietary Badges */}
          <div className="detail-image-section">
            <div className="detail-image-inner">
              <img
                src={food.image || fallbackSvg}
                alt={food.name}
                className="detail-main-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackSvg;
                }}
              />
            </div>

            {/* Dietary Badge on non-desserts & non-shakes */}
            {!isSweetOrBeverage && (
              <div className={`diet-badge ${isVeg ? "veg" : "non-veg"}`}>
                <span className="diet-dot"></span>
                <span>{isVeg ? "VEG" : "NON-VEG"}</span>
              </div>
            )}
          </div>

          {/* Right: Info, Dynamic Rating, Price, Reviews */}
          <div className="detail-info-section">
            <div className="detail-header">
              <span className="detail-category">{food.category} • {food.type}</span>
              <h2 className="detail-title">{food.name}</h2>
              <div className="detail-rating-row">
                <span className="stars-gold">{"★".repeat(Math.round(Number(dishRating)))}</span>
                <span className="rating-score">{dishRating} / 5</span>
                <span className="review-count">({totalReviewsCount} Customer Reviews)</span>
              </div>
            </div>

            <p className="detail-description">
              {food.description || "Made fresh upon order using premium artisanal ingredients, savory seasonings, and chef-crafted secrets."}
            </p>

            {/* Quick Specs */}
            <div className="detail-specs-row">
              <div className="spec-pill">
                <span>⏱️</span>
                <div>
                  <small>Prep Time</small>
                  <strong>15 - 20 Mins</strong>
                </div>
              </div>
              <div className="spec-pill">
                <span>🌶️</span>
                <div>
                  <small>Spice Level</small>
                  <strong>Medium Spiced</strong>
                </div>
              </div>
              <div className="spec-pill">
                <span>🍽️</span>
                <div>
                  <small>Serves</small>
                  <strong>1 - 2 Persons</strong>
                </div>
              </div>
            </div>

            {/* Price & Action Row */}
            <div className="detail-action-bar">
              <div className="detail-price-box">
                <span className="price-label">Price</span>
                <span className="price-amt">₹{food.price}</span>
              </div>

              {currentQty > 0 ? (
                <div className="card-stepper-btn detail-stepper" aria-label="Adjust quantity in cart">
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
                  className="hero-primary-btn detail-add-btn"
                  onClick={() => addToCart(food, 1)}
                >
                  <span>Add to Order Cart (₹{food.price})</span>
                  <span>🛒</span>
                </button>
              )}
            </div>

            {/* Reviews Section */}
            <div className="detail-reviews-wrapper">
              <div className="reviews-header-bar">
                <h3>💬 Customer Reviews</h3>
                <button
                  className="write-review-toggle-btn"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? "Cancel" : "+ Write a Review"}
                </button>
              </div>

              {showReviewForm && (
                <form onSubmit={handleAddReview} className="write-review-form">
                  <div className="rating-select-row">
                    <label>Rating:</label>
                    <div className="star-picker">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          className={`star-pick-btn ${s <= newRating ? "active" : ""}`}
                          onClick={() => setNewRating(s)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows="2"
                    placeholder="Share your taste experience..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  ></textarea>
                  <button type="submit" className="submit-review-btn">
                    Post Review
                  </button>
                </form>
              )}

              <div className="reviews-list-scroll">
                {reviews.map((rev) => (
                  <div key={rev.id} className="review-card-item">
                    <div className="review-user-row">
                      <strong>{rev.name}</strong>
                      <span className="review-stars">
                        {"★".repeat(rev.rating)}
                        {"☆".repeat(5 - rev.rating)}
                      </span>
                    </div>
                    <p className="review-comment-text">"{rev.comment}"</p>
                    <span className="review-date-text">{rev.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
