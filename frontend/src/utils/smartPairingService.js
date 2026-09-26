// Smart Chef's AI Pairing Engine
// Analyzes cart items or single dish and generates contextual recommendations

export const DEFAULT_POPULAR_PAIRINGS = [
  {
    name: "Crispy Chicken Loaded Fries",
    category: "Fries",
    price: 189,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNzXxN0WXjXxJNhT9XP3d_WgyKeU3ecvvP3wDv564gws-IwWiKcMimPe4&s=10",
    reason: "🔥 Best-Seller Side",
    badge: "Most Loved",
  },
  {
    name: "Royal KitKat Shake",
    category: "Drinks",
    price: 169,
    image: "https://thumbs.dreamstime.com/b/kitkat-chocolate-milkshake-topped-ice-cream-choco-chips-served-glass-jar-over-rustic-wooden-background-refreshing-223998504.jpg",
    reason: "👑 Royal Sweet Pairing",
    badge: "Chef's Pick",
  },
  {
    name: "Fresh Watermelon Mojito",
    category: "Drinks",
    price: 139,
    image: "https://www.watermelon.org/wp-content/uploads/2025/02/Smoky_Mezcal_Watermelon_Mojito_2025-1000x1000.jpg",
    reason: "🍹 Cool & Refreshing",
    badge: "Trending",
  },
  {
    name: "Cheesy Cheddar Fries",
    category: "Fries",
    price: 149,
    image: "https://www.cookwithnabeela.com/wp-content/uploads/2024/05/CheeseFries.webp",
    reason: "🧀 Molten Cheese Treat",
    badge: "Must Try",
  },
  {
    name: "7UP Chilled Can",
    category: "Drinks",
    price: 69,
    image: "https://cdn.uengage.io/uploads/28289/image-BI8MTR-1769876746.png",
    reason: "⚡ Crisp Lemon Soda",
    badge: "Quick Add",
  },
  {
    name: "Classic Italian Tiramisu",
    category: "Desserts",
    price: 189,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=900&q=85",
    reason: "☕ Royal Espresso Sweet",
    badge: "Sweet Finish",
  },
];

export const getSmartPairings = (cartItems = [], allFoods = []) => {
  // Extract all item names already in the cart (lowercased)
  const cartNames = new Set(
    cartItems.map((item) => (item.food?.name || "").toLowerCase().trim())
  );

  const cartCategories = cartItems.map((item) => (item.food?.category || "").toLowerCase());
  const hasBurger = cartCategories.some((c) => c.includes("burger"));
  const hasPizza = cartCategories.some((c) => c.includes("pizza"));
  const hasChicken = cartCategories.some((c) => c.includes("chicken"));
  const hasSandwich = cartCategories.some((c) => c.includes("sandwich"));
  const hasFries = cartCategories.some((c) => c.includes("frie"));
  const hasDrink = cartCategories.some((c) => c.includes("drink"));
  const hasDessert = cartCategories.some((c) => c.includes("dessert"));

  // Build targeted list from allFoods if available, otherwise use defaults
  const candidates = [];

  const addCandidate = (dishData, reason, badge) => {
    if (!dishData) return;
    const name = (dishData.name || "").toLowerCase().trim();
    if (cartNames.has(name)) return;
    if (candidates.some((c) => c.name.toLowerCase().trim() === name)) return;
    candidates.push({
      ...dishData,
      reason: reason || "✨ Perfect Match",
      badge: badge || "Chef Recommends",
    });
  };

  // Find dish from allFoods by name keyword or exact match
  const findDish = (keyword) => {
    if (!allFoods || allFoods.length === 0) return null;
    const kw = keyword.toLowerCase();
    return (
      allFoods.find((f) => f.name?.toLowerCase().includes(kw)) ||
      allFoods.find((f) => f.category?.toLowerCase().includes(kw))
    );
  };

  // Heuristic Pairing Rules:
  // 1. If Cart has Burgers or Sandwiches:
  if (hasBurger || hasSandwich) {
    if (!hasFries) {
      addCandidate(findDish("Crispy Chicken Loaded Fries"), "🍟 Perfect Burger Companion", "Signature Side");
      addCandidate(findDish("Cheesy Cheddar Fries"), "🧀 Melty Cheese Side", "Best Pairing");
    }
    if (!hasDrink) {
      addCandidate(findDish("Royal KitKat Shake"), "🥤 Thick Choco Milkshake", "Top Combo");
      addCandidate(findDish("7UP Chilled Can"), "⚡ Ice-Cold Refreshment", "Quick Match");
    }
  }

  // 2. If Cart has Pizza:
  if (hasPizza) {
    if (!hasDrink) {
      addCandidate(findDish("Fresh Watermelon Mojito"), "🍹 Refreshing Mojito Match", "Woodfired Pairing");
      addCandidate(findDish("Blueberry Mojito"), "🫐 Berry Spritz Fizz", "Trending");
      addCandidate(findDish("Coca-Cola"), "🥤 Classic Cold Soda", "Favorite");
    }
    if (!hasDessert) {
      addCandidate(findDish("Classic Italian Tiramisu"), "🍰 Authentic Italian Dessert", "Sweet Finish");
      addCandidate(findDish("New York Cheesecake"), "✨ Creamy Artisan Cake", "Chef's Pick");
    }
  }

  // 3. If Cart has Crispy Chicken:
  if (hasChicken) {
    if (!hasFries) {
      addCandidate(findDish("Peri Peri French Fries"), "🌶️ Fiery Spice Crunch", "Crunch Combo");
    }
    if (!hasDrink) {
      addCandidate(findDish("Belgian Chocolate Milkshake"), "🍫 Rich Velvety Shake", "Cool Down");
      addCandidate(findDish("Fresh Lime Cooler"), "🍋 Zesty Citrus Kick", "Refreshing");
    }
  }

  // 4. If Cart has Main course but no dessert:
  if ((hasBurger || hasPizza || hasChicken) && !hasDessert) {
    addCandidate(findDish("Cookies & Cream Oreo Shake"), "🍪 Crushed Oreo Indulgence", "Royal Sweet");
  }

  // 5. Fill remaining spots with top curated pairings from default list
  DEFAULT_POPULAR_PAIRINGS.forEach((def) => {
    if (candidates.length < 6) {
      const matchInDb = findDish(def.name);
      addCandidate(matchInDb || def, def.reason, def.badge);
    }
  });

  return candidates.slice(0, 6);
};
