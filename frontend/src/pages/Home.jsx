import { API_URL } from "../config/api";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FoodCard } from "../components/FoodCard";
import { FoodDetailModal } from "../components/FoodDetailModal";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { id: "all", name: "All Dishes", icon: "✨" },
  { id: "favorites", name: "My Favorites", icon: "❤️" },
  { id: "Burgers", name: "Burgers", icon: "🍔" },
  { id: "Pizza", name: "Pizzas", icon: "🍕" },
  { id: "Crispy Chicken", name: "Crispy Chicken", icon: "🍗" },
  { id: "Sandwiches", name: "Sandwiches", icon: "🥪" },
  { id: "Fries", name: "French Fries", icon: "🍟" },
  { id: "Desserts", name: "Royal Desserts", icon: "🍰" },
  { id: "Drinks", name: "Juices & Shakes", icon: "🥤" },
];

// Priority rank for menu hierarchy:
// 1. Burgers -> 2. Pizzas -> 3. Crispy Chicken -> 4. Sandwiches -> 5. French Fries -> 6. Desserts -> 7. Juices & Shakes
export const getDishCategoryPriority = (food) => {
  if (!food) return 99;
  const cat = (food.category || "").toLowerCase();
  const name = (food.name || "").toLowerCase();

  // 1. Burgers
  if (cat.includes("burger")) return 1;
  // 2. Pizzas
  if (cat.includes("pizza")) return 2;
  // 3. Crispy Chicken (exclude fries so loaded chicken fries stay with fries)
  if (
    !cat.includes("frie") &&
    !name.includes("frie") &&
    (cat.includes("crispy chicken") ||
      (cat.includes("chicken") && !cat.includes("burger") && !cat.includes("pizza") && !cat.includes("sandwich")) ||
      name.includes("crispy chicken") ||
      name.includes("wings") ||
      name.includes("nuggets"))
  )
    return 3;
  // 4. Sandwiches
  if (cat.includes("sandwich") || cat.includes("panini") || name.includes("sandwich") || name.includes("panini"))
    return 4;
  // 5. French Fries & Loaded Sides
  if (cat.includes("frie") || cat.includes("side") || name.includes("fries")) return 5;
  // 6. Royal Desserts
  if (
    cat.includes("dessert") ||
    cat.includes("sweet") ||
    name.includes("cake") ||
    name.includes("waffle") ||
    name.includes("kunafah") ||
    name.includes("tiramisu") ||
    name.includes("pudding") ||
    name.includes("brownie") ||
    name.includes("jamun") ||
    name.includes("cheesecake")
  )
    return 6;
  // 7. Juices, Shakes & Beverages
  if (
    cat.includes("drink") ||
    cat.includes("beverage") ||
    cat.includes("shake") ||
    name.includes("shake") ||
    name.includes("mojito") ||
    name.includes("juice") ||
    name.includes("lime") ||
    name.includes("cola") ||
    name.includes("chocolate")
  )
    return 7;

  return 8;
};

// Deterministic unique rating for each dish (e.g. 4.9, 4.8, 4.7, 5.0, 4.6)
export const getDishRating = (food) => {
  if (!food) return "4.8";
  if (food.rating && typeof food.rating === "number") return food.rating.toFixed(1);
  const str = String(food._id || food.name || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const ratingVariations = ["4.9", "4.8", "4.7", "5.0", "4.6", "4.8", "4.9", "4.7", "4.9", "4.8", "4.6", "5.0"];
  const index = Math.abs(hash) % ratingVariations.length;
  return ratingVariations[index];
};

// Deterministic unique review count for each dish
export const getDishReviewCount = (food) => {
  if (!food) return 48;
  if (food.reviewsCount) return food.reviewsCount;
  const str = String(food._id || food.name || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 35 + (Math.abs(hash) % 180);
};

// Priority rank for diet inside category: Non-Veg first (0), Veg next (1)
export const getDishDietPriority = (food) => {
  const isVeg = isVegetarianDish(food);
  return isVeg ? 1 : 0;
};

// Robust vegetarian classifier
export const isVegetarianDish = (food) => {
  if (!food) return false;
  const type = (food.type || "").toLowerCase().trim();
  const category = (food.category || "").toLowerCase().trim();
  const name = (food.name || "").toLowerCase().trim();

  // Definite Non-Veg indicators
  if (
    type === "non-veg" ||
    type === "nonveg" ||
    type === "chicken" ||
    type === "crispy chicken" ||
    type === "wings & nuggets" ||
    category === "crispy chicken" ||
    (category === "burgers" &&
      !name.includes("plant-based") &&
      !name.includes("veg") &&
      !name.includes("paneer") &&
      !name.includes("mushroom") &&
      !name.includes("cheese")) ||
    name.includes("chicken") ||
    name.includes("beef") ||
    name.includes("bacon") ||
    name.includes("pepperoni") ||
    name.includes("mutton") ||
    name.includes("prawn") ||
    name.includes("wings") ||
    name.includes("nuggets") ||
    name.includes("fish") ||
    name.includes("alfredo pizza")
  ) {
    return false;
  }

  // All other dishes (Veg Burgers, Veg Pizza, Fries, Drinks, Shakes, Desserts, Paneer, Mushroom) are Pure Veg
  return true;
};

export const Home = ({ searchTerm }) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [dietFilter, setDietFilter] = useState("all"); // 'all' | 'veg' | 'non-veg'
  const [sortBy, setSortBy] = useState("default"); // 'default' | 'price-low' | 'price-high'
  const [selectedFood, setSelectedFood] = useState(null);
  const [copiedCoupon, setCopiedCoupon] = useState("");
  const { addToCart, setIsCartOpen, applyCoupon } = useCart();
  const { isFavorite, favorites } = useAuth();

  const handleApplyPromo = (code) => {
    if (applyCoupon) {
      applyCoupon(code);
    }
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(""), 3000);
    setIsCartOpen(true);
  };

  useEffect(() => {
    fetch(`${API_URL}/api/foods`)
      .then((res) => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFoods(data);
        }
      })
      .catch(() => {
        // Local fallback handled if needed
      })
      .finally(() => setLoading(false));
  }, []);

  // Smooth scroll to menu section whenever user searches
  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      const el = document.getElementById("menu-explorer");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 150);
      }
    }
  }, [searchTerm]);

  // Filter logic
  const filteredFoods = foods.filter((food) => {
    // 1. Search filter with comprehensive category & dish keyword matching
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();

      const matchesBurger =
        (q.includes("burger") || q === "burgers") &&
        (food.category === "Burgers" || food.category === "Veg Burgers");
      const matchesPizza =
        (q.includes("pizza") || q === "pizzas") &&
        (food.category === "Pizza" || food.category === "Veg Pizza");
      const matchesDrink =
        (q.includes("drink") ||
          q.includes("beverage") ||
          q.includes("shake") ||
          q.includes("mojito") ||
          q.includes("juice") ||
          q.includes("coffee") ||
          q.includes("tea") ||
          q.includes("cooler") ||
          q.includes("soda") ||
          q.includes("7up") ||
          q.includes("kitkat") ||
          q.includes("oreo") ||
          q.includes("watermelon")) &&
        food.category === "Drinks";
      const matchesDessert =
        (q.includes("dessert") ||
          q.includes("sweet") ||
          q.includes("cake") ||
          q.includes("brownie") ||
          q.includes("kunafah") ||
          q.includes("waffle") ||
          q.includes("pudding") ||
          q.includes("tiramisu") ||
          q.includes("ice cream")) &&
        food.category === "Desserts";
      const matchesChicken =
        (q.includes("chicken") || q.includes("wing") || q.includes("nugget")) &&
        (food.category === "Crispy Chicken" || food.name?.toLowerCase().includes("chicken"));
      const matchesSandwich =
        (q.includes("sandwich") || q === "sandwiches") && food.category === "Sandwiches";
      const matchesFries =
        (q.includes("frie") || q.includes("fry") || q.includes("potato") || q.includes("ring")) &&
        food.category === "Fries";

      const matchName = food.name?.toLowerCase().includes(q);
      const matchDesc = food.description?.toLowerCase().includes(q);
      const matchCat = food.category?.toLowerCase().includes(q);
      const matchType = food.type?.toLowerCase().includes(q);

      if (
        !matchName &&
        !matchDesc &&
        !matchCat &&
        !matchType &&
        !matchesBurger &&
        !matchesPizza &&
        !matchesDrink &&
        !matchesDessert &&
        !matchesChicken &&
        !matchesSandwich &&
        !matchesFries
      ) {
        return false;
      }
    }

    // 2. Category filter
    if (activeCategory === "favorites") {
      const isFav = isFavorite(food._id || food.name);
      if (!isFav) return false;
    } else if (activeCategory !== "all") {
      if (activeCategory === "Pizza") {
        if (food.category !== "Pizza" && food.category !== "Veg Pizza") return false;
      } else if (activeCategory === "Burgers") {
        if (food.category !== "Burgers" && food.category !== "Veg Burgers") return false;
      } else {
        if (food.category !== activeCategory) return false;
      }
    }

    // 3. Diet Filter (Pure Veg vs Non-Veg)
    if (dietFilter === "veg") {
      if (!isVegetarianDish(food)) return false;
    } else if (dietFilter === "non-veg") {
      if (isVegetarianDish(food)) return false;
    }

    return true;
  });

  // Sort logic - Structured Hierarchy:
  // Burgers (Non-Veg -> Veg) -> Pizzas (Non-Veg -> Veg) -> Crispy Chicken -> Sandwiches (Non-Veg -> Veg) -> Fries -> Desserts -> Juices
  const sortedFoods = [...filteredFoods].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;

    // Default / Featured ranking:
    const catA = getDishCategoryPriority(a);
    const catB = getDishCategoryPriority(b);
    if (catA !== catB) return catA - catB;

    const dietA = getDishDietPriority(a);
    const dietB = getDishDietPriority(b);
    if (dietA !== dietB) return dietA - dietB;

    return (a.name || "").localeCompare(b.name || "");
  });

  const hideDietButtons =
    activeCategory === "Crispy Chicken" ||
    activeCategory === "Desserts" ||
    activeCategory === "Drinks";

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    if (catId === "Crispy Chicken" || catId === "Desserts" || catId === "Drinks") {
      setDietFilter("all");
    }
  };

  return (
    <div className="home-page-container">
      {/* Hero Banner */}
      <section className="hero-banner-section">
        <div className="hero-content">
          <span className="hero-badge">🔥 Premium Gourmet Kitchen</span>
          <h1 className="hero-title">
            Craving Something <span className="highlight-text">Delicious?</span>
          </h1>
          <p className="hero-subtitle">
            Order fresh, artisan stone-baked pizzas, juicy smashed burgers, and royal desserts
            delivered hot to your doorstep in under 30 minutes!
          </p>

          <div className="hero-cta-row">
            <a href="#menu-explorer" className="hero-primary-btn">
              <span>Order Food Now</span>
              <span>➔</span>
            </a>
            <Link to="/customizer" className="hero-customizer-btn">
              <span>🎨 Craft Dish</span>
              <span>✨</span>
            </Link>
            <Link to="/about" className="hero-secondary-btn">
              <span>✨ About Us</span>
              <span>📖</span>
            </Link>
            <button
              className="hero-secondary-btn"
              onClick={() => setIsCartOpen(true)}
            >
              <span>🛒</span>
              <span>Cart</span>
            </button>
          </div>

          <div className="hero-stats-row">
            <div className="stat-pill">
              <strong>70+</strong> Gourmet Dishes
            </div>
            <div className="stat-pill">
              <strong>★ 4.9</strong> Rated by 10k+ Foodies
            </div>
            <div className="stat-pill">
              <strong>30 Min</strong> Lightning Delivery
            </div>
          </div>
        </div>

        <div className="hero-image-showcase">
          <div className="hero-floating-card top-left">
            <span className="hero-card-icon">🍔</span>
            <div>
              <strong>“Our Signature Burger”</strong>
              <p>Crafted to Royal Perfection</p>
            </div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85"
            alt="Royal Gourmet Burger"
            className="hero-main-burger-img"
          />
          <div className="hero-floating-card bottom-right">
            <span className="hero-card-icon">⚡</span>
            <div>
              <strong>Free Delivery</strong>
              <p>On orders ₹399+</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Dish Builder Spotlight Banner */}
      <section className="customizer-spotlight-strip">
        <div className="spotlight-strip-inner">
          <div className="spotlight-content-block">
            <div className="spotlight-icon-wrap">🎨</div>
            <div className="spotlight-text-wrap">
              <div className="spotlight-badge-row">
                <span className="spotlight-pill">👑 Master Chef Studio</span>
                <span className="spotlight-hot-tag">🔥 Live Preview</span>
              </div>
              <h3 className="spotlight-title">Build Your Royal Custom Burger & Stone-Baked Pizza</h3>
              <p className="spotlight-sub">
                Hand-pick your artisan buns, double smashed patties, imported cheeses, crisp toppings & chef sauces with live visual stack and instant calorie tracking!
              </p>
            </div>
          </div>
          <Link to="/customizer" className="spotlight-launch-btn">
            <span>Launch Studio</span>
            <span>➔</span>
          </Link>
        </div>
      </section>

      {/* Categories Bar */}
      <section id="menu-explorer" className="category-section">
        <div className="section-title-row">
          <div>
            <h2 className="section-heading">Explore By Category</h2>
            <p className="section-sub">Select your favorite royal feast category</p>
          </div>
          <span className="dish-count-label">
            {sortedFoods.length} {sortedFoods.length === 1 ? "Dish" : "Dishes"} Available
          </span>
        </div>

        {searchTerm && (
          <div className="active-search-badge-strip">
            <span className="search-badge-text">
              🔍 Showing results for <strong>"{searchTerm}"</strong> — {sortedFoods.length}{" "}
              {sortedFoods.length === 1 ? "dish" : "dishes"} found
            </span>
          </div>
        )}

        <div className="category-pills-row">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`cat-pill-btn ${activeCategory === cat.id ? "active" : ""}`}
              onClick={() => handleCategoryClick(cat.id)}
            >
              <span className="cat-pill-icon">{cat.icon}</span>
              <span className="cat-pill-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filter & Sort Controls */}
      <section className="filter-controls-bar">
        {/* Diet Toggles (Hidden on Crispy Chicken, Royal Desserts, and Shakes) */}
        {!hideDietButtons && (
          <div className="diet-toggle-group">
            <button
              className={`filter-btn ${dietFilter === "all" ? "active" : ""}`}
              onClick={() => setDietFilter("all")}
            >
              All Diets
            </button>
            <button
              className={`filter-btn veg-filter ${dietFilter === "veg" ? "active" : ""}`}
              onClick={() => setDietFilter("veg")}
            >
              <span className="dot-green"></span> Pure Veg
            </button>
            <button
              className={`filter-btn non-veg-filter ${dietFilter === "non-veg" ? "active" : ""}`}
              onClick={() => setDietFilter("non-veg")}
            >
              <span className="dot-red"></span> Non-Veg
            </button>
          </div>
        )}

        {/* Sort Dropdown */}
        <div className={`sort-select-wrap ${hideDietButtons ? "pushed-right" : ""}`}>
          <span className="sort-label">Sort By:</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Featured / Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Food Items Grid */}
      <section className="menu-grid-section">
        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="food-skeleton-card"></div>
            ))}
          </div>
        ) : sortedFoods.length === 0 ? (
          <div className="no-dishes-state">
            <span className="no-dish-emoji">🔍</span>
            <h3>No dishes found</h3>
            <p>Try clearing your search query or switching category filters.</p>
            <button
              className="reset-filters-btn"
              onClick={() => {
                setActiveCategory("all");
                setDietFilter("all");
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="food-items-grid">
            {sortedFoods.map((food) => (
              <FoodCard
                key={food._id || food.name}
                food={food}
                onSelectFood={setSelectedFood}
              />
            ))}
          </div>
        )}
      </section>

      {/* Dish Detail & Reviews Modal */}
      {selectedFood && (
        <FoodDetailModal
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </div>
  );
};
