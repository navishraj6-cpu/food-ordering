import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { isVegetarianDish, getDishRating, getDishReviewCount } from "../pages/Home";
import { API_URL } from "../config/api";

const fallbackSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='100%25' height='100%25' fill='%230f2920'/%3E%3Ctext x='200' y='160' font-size='50' text-anchor='middle'%3E%F0%9F%8D%B4%3C/text%3E%3C/svg%3E";

const REVIEW_TAG_OPTIONS = [
  "🔥 Perfectly Cooked",
  "👌 Chef Quality",
  "🌿 Super Fresh",
  "🧀 Extra Cheesy",
  "⚡ Piping Hot",
  "✨ Royal Flavor",
];

export const FoodDetailModal = ({ food, onClose, initialOrderId = "" }) => {
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  // Review Form state
  const [showReviewForm, setShowReviewForm] = useState(Boolean(initialOrderId));
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitMessage, setReviewSubmitMessage] = useState("");

  const itemId = food?._id || food?.name;
  const currentQty = getItemQuantity(itemId);
  const defaultRating = getDishRating(food);
  const defaultReviewsCount = getDishReviewCount(food);

  const isVeg = isVegetarianDish(food);
  const isSweetOrBeverage =
    (food?.category || "").toLowerCase().includes("dessert") ||
    (food?.category || "").toLowerCase().includes("drink") ||
    (food?.category || "").toLowerCase().includes("shake") ||
    (food?.category || "").toLowerCase().includes("beverage") ||
    (food?.type || "").toLowerCase().includes("shake") ||
    (food?.type || "").toLowerCase().includes("drink") ||
    (food?.type || "").toLowerCase().includes("milkshake") ||
    (food?.name || "").toLowerCase().includes("shake") ||
    (food?.name || "").toLowerCase().includes("smoothie") ||
    (food?.name || "").toLowerCase().includes("mojito");

  // Fetch real reviews from backend
  useEffect(() => {
    if (!food) return;
    let isMounted = true;
    const fetchReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const dishParam = encodeURIComponent(food.name || food._id);
        const res = await fetch(`${API_URL}/api/reviews/dish/${dishParam}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setReviews(data.reviews || []);
          setSummary(data.summary || null);
        }
      } catch (err) {
        console.warn("Could not fetch reviews:", err.message);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    };

    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [food]);

  if (!food) return null;

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    setReviewSubmitMessage("");

    const reviewPayload = {
      foodId: food._id || food.name,
      foodName: food.name,
      userName: user?.name || "Verified Gourmet Guest",
      userEmail: user?.email || "",
      rating: newRating,
      title: newTitle.trim(),
      comment: newComment.trim(),
      tags: selectedTags,
      orderId: initialOrderId || "",
    };

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewPayload),
      });
      const data = await res.json();

      if (data.success && data.review) {
        setReviews([data.review, ...reviews]);
        setReviewSubmitMessage("🎉 Thank you! Your review is now live.");
        setNewComment("");
        setNewTitle("");
        setSelectedTags([]);
        setTimeout(() => {
          setShowReviewForm(false);
          setReviewSubmitMessage("");
        }, 2000);
      }
    } catch (err) {
      console.warn("Failed to post review:", err);
      // Optimistic local add
      const mockReview = {
        _id: "rev_" + Date.now(),
        userName: user?.name || "Verified Customer",
        rating: newRating,
        title: newTitle,
        comment: newComment.trim(),
        tags: selectedTags,
        createdAt: new Date(),
        verifiedPurchase: Boolean(initialOrderId),
      };
      setReviews([mockReview, ...reviews]);
      setShowReviewForm(false);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleLikeReview = async (reviewId) => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/${reviewId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r))
        );
      }
    } catch (err) {
      console.warn("Like failed:", err);
    }
  };

  const activeRating = summary?.averageRating || defaultRating;
  const activeReviewCount = summary?.totalReviews || (reviews.length > 0 ? reviews.length : defaultReviewsCount);

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
                src={
                  (food.name || "").toLowerCase().includes("sizzling brownie") &&
                  (!food.image || food.image.includes("ytimg"))
                    ? "/images/sizzling-brownie.jpg"
                    : food.image || fallbackSvg
                }
                alt={food.name}
                className="detail-main-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  if ((food.name || "").toLowerCase().includes("sizzling brownie")) {
                    e.currentTarget.src = "/images/sizzling-brownie.jpg";
                    return;
                  }
                  e.currentTarget.src = fallbackSvg;
                }}
              />
            </div>

            {!isSweetOrBeverage && (
              <div className={`diet-badge ${isVeg ? "veg" : "non-veg"}`}>
                <span className="diet-dot"></span>
                <span>{isVeg ? "VEG" : "NON-VEG"}</span>
              </div>
            )}

            {/* Quick Specs */}
            <div className="detail-specs-row" style={{ marginTop: "16px" }}>
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
          </div>

          {/* Right: Info, Dynamic Rating, Price, Reviews */}
          <div className="detail-info-section">
            <div className="detail-header">
              <span className="detail-category">{food.category} • {food.type}</span>
              <h2 className="detail-title">{food.name}</h2>
              <div className="detail-rating-row">
                <span className="stars-gold">{"★".repeat(Math.round(Number(activeRating)))}</span>
                <span className="rating-score">{activeRating} / 5</span>
                <span className="review-count">({activeReviewCount} Verified Reviews)</span>
              </div>
            </div>

            <p className="detail-description">
              {food.description || "Made fresh upon order using premium artisanal ingredients, savory seasonings, and chef-crafted secrets."}
            </p>

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

            {/* Reviews & Ratings Section */}
            <div className="detail-reviews-wrapper">
              <div className="reviews-header-bar">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "16px" }}>⭐ Guest Reviews & Ratings</h3>
                  <span style={{ fontSize: "12px", color: "#10b981", background: "rgba(16, 185, 129, 0.12)", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                    {summary?.recommendPercentage || 98}% Recommend
                  </span>
                </div>
                <button
                  className="write-review-toggle-btn"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? "Cancel" : "+ Write a Review"}
                </button>
              </div>

              {reviewSubmitMessage && (
                <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#34d399", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "12px" }}>
                  {reviewSubmitMessage}
                </div>
              )}

              {/* Review Input Form */}
              {showReviewForm && (
                <form onSubmit={handleAddReview} className="write-review-form">
                  <div className="rating-select-row">
                    <label style={{ fontSize: "13px", color: "#e4e4e7" }}>Your Star Rating:</label>
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

                  <input
                    type="text"
                    className="payment-input"
                    style={{ marginBottom: "8px", fontSize: "13px", padding: "8px 12px" }}
                    placeholder="Review headline (e.g. Incredibly tender and flavorful!)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />

                  <textarea
                    rows="2"
                    placeholder="Share your dining experience, aroma, and taste..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  ></textarea>

                  {/* Flavor Tags */}
                  <div style={{ margin: "8px 0 12px" }}>
                    <div style={{ fontSize: "11px", color: "#a1a1aa", marginBottom: "6px" }}>Highlight Dish Features:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {REVIEW_TAG_OPTIONS.map((tag) => (
                        <button
                          type="button"
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          style={{
                            background: selectedTags.includes(tag) ? "rgba(212, 175, 55, 0.2)" : "#27272a",
                            border: `1px solid ${selectedTags.includes(tag) ? "#d4af37" : "#3f3f46"}`,
                            color: selectedTags.includes(tag) ? "#facc15" : "#a1a1aa",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="submit-review-btn"
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? "Submitting..." : "🌟 Post Verified Review"}
                  </button>
                </form>
              )}

              {/* Reviews List */}
              {isLoadingReviews ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#71717a", fontSize: "13px" }}>
                  Loading royal reviews...
                </div>
              ) : (
                <div className="reviews-list-scroll">
                  {reviews.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "16px", color: "#a1a1aa", fontSize: "13px" }}>
                      Be the first to review this royal culinary dish!
                    </div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev._id || rev.id} className="review-card-item">
                        <div className="review-user-row">
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <strong>{rev.userName || rev.name}</strong>
                            {rev.verifiedPurchase && (
                              <span style={{ fontSize: "10px", color: "#34d399", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "1px 6px", borderRadius: "10px", fontWeight: "600" }}>
                                ✓ Verified Diner
                              </span>
                            )}
                          </div>
                          <span className="review-stars">
                            {"★".repeat(rev.rating)}
                            {"☆".repeat(5 - rev.rating)}
                          </span>
                        </div>

                        {rev.title && (
                          <div style={{ fontSize: "13px", fontWeight: "600", color: "#f4f4f5", margin: "4px 0 2px" }}>
                            {rev.title}
                          </div>
                        )}

                        <p className="review-comment-text">"{rev.comment}"</p>

                        {/* Review Tags */}
                        {Array.isArray(rev.tags) && rev.tags.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", margin: "4px 0" }}>
                            {rev.tags.map((t, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: "10px",
                                  color: "#fef08a",
                                  background: "rgba(250, 204, 21, 0.1)",
                                  padding: "2px 6px",
                                  borderRadius: "6px",
                                }}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                          <span className="review-date-text">
                            {rev.createdAt
                              ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : rev.date || "Recently"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleLikeReview(rev._id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#71717a",
                              fontSize: "11px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title="Helpful Review"
                          >
                            <span>👍 Helpful</span>
                            {rev.likesCount > 0 && <span>({rev.likesCount})</span>}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
