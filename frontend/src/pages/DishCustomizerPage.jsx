import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

// Simple, clear Burger ingredients library
const BURGER_OPTIONS = {
  buns: [
    { id: "brioche", name: "Toasted Brioche Bun", price: 0, cal: 180, icon: "🥖", simpleDesc: "Soft, golden & buttery sweet bakery bun", color: "#d97706" },
    { id: "sesame", name: "Classic Sesame Bun", price: 0, cal: 160, icon: "🍞", simpleDesc: "Fluffy bun topped with toasted white sesame", color: "#b45309" },
    { id: "charcoal", name: "Smoky Charcoal Bun", price: 30, cal: 170, icon: "🖤", simpleDesc: "Black artisan bun with a mild smoky flavor", color: "#1f2937" },
    { id: "pretzel", name: "Pretzel Glazed Bun", price: 35, cal: 190, icon: "🥨", simpleDesc: "Chewy, golden baked artisan pretzel bread", color: "#78350f" },
    { id: "sourdough", name: "Sourdough Herb Bun", price: 35, cal: 175, icon: "🌾", simpleDesc: "Crisp slow-fermented artisan sourdough", color: "#c2410c" },
    { id: "glutenfree", name: "Gluten-Free Herb Bun", price: 40, cal: 150, icon: "🌿", simpleDesc: "100% wheat-free, light & soft bun", color: "#ca8a04" },
    { id: "lettucewrap", name: "Lettuce Wrap (No Bun)", price: 0, cal: 30, icon: "🥬", simpleDesc: "Crisp iceberg lettuce wrap (Low-Carb / Keto)", color: "#15803d" },
  ],
  patties: [
    { id: "single-angus", name: "Prime Smashed Beef Patty", price: 120, cal: 280, icon: "🥩", category: "meat", simpleDesc: "100% juicy Angus beef smashed with crispy edges" },
    { id: "double-angus", name: "Double Smashed Beef Patty", price: 190, cal: 520, icon: "🥩🥩", category: "meat", simpleDesc: "Two thick juicy Angus patties with extra sear" },
    { id: "crispy-chicken", name: "Crispy Buttermilk Chicken", price: 130, cal: 310, icon: "🍗", category: "chicken", simpleDesc: "Tender chicken breast fried golden & crunchy" },
    { id: "grilled-chicken", name: "Flame-Grilled Chicken Breast", price: 120, cal: 220, icon: "🔥", category: "chicken", simpleDesc: "Smoky herb-marinated lean grilled chicken" },
    { id: "tandoori-lamb", name: "Spiced Lamb Kebab Patty", price: 150, cal: 340, icon: "🍖", category: "meat", simpleDesc: "Minced lamb infused with mint and tandoori spices" },
    { id: "fish-patty", name: "Crispy Golden Fish Fillet", price: 125, cal: 260, icon: "🐟", category: "seafood", simpleDesc: "Panko breaded flaky white fish with lemon" },
    { id: "herb-paneer", name: "Grilled Royal Paneer Steak", price: 100, cal: 240, icon: "🧀", category: "veg", simpleDesc: "Thick cottage cheese steak seared with herbs" },
    { id: "portobello", name: "Garlic Portobello Mushroom", price: 110, cal: 140, icon: "🍄", category: "veg", simpleDesc: "Whole roasted mushroom cap with garlic & thyme" },
    { id: "plant-based", name: "Plant-Based Beyond Patty", price: 140, cal: 230, icon: "🌱", category: "veg", simpleDesc: "100% vegan protein with juicy burger texture" },
  ],
  cheeses: [
    { id: "aged-cheddar", name: "Aged Yellow Cheddar", price: 35, cal: 95, icon: "🧀", simpleDesc: "Rich, sharp & gooey melted cheese" },
    { id: "swiss-emmental", name: "Melted Swiss Cheese", price: 40, cal: 90, icon: "🧀", simpleDesc: "Mild, nutty & super stretchy" },
    { id: "smoked-gouda", name: "Smoked Dutch Gouda", price: 45, cal: 100, icon: "🧀", simpleDesc: "Creamy with a delicious wood-smoked taste" },
    { id: "buffalo-mozzarella", name: "Fresh Mozzarella", price: 45, cal: 85, icon: "⚪", simpleDesc: "Soft, milky fresh buffalo cheese" },
    { id: "pepper-jack", name: "Spicy Pepper Jack", price: 40, cal: 95, icon: "🌶️", simpleDesc: "Creamy cheese with spicy jalapeño bits" },
    { id: "gorgonzola", name: "Blue Gorgonzola", price: 50, cal: 110, icon: "🧀", simpleDesc: "Bold gourmet Italian blue cheese" },
  ],
  toppings: [
    { id: "lettuce", name: "Crisp Green Lettuce", price: 0, cal: 10, icon: "🥬", type: "veg" },
    { id: "tomato", name: "Sliced Fresh Tomatoes", price: 0, cal: 15, icon: "🍅", type: "veg" },
    { id: "pickles", name: "Crunchy Dill Pickles", price: 0, cal: 10, icon: "🥒", type: "veg" },
    { id: "caramelized-onions", name: "Sweet Caramelized Onions", price: 25, cal: 45, icon: "🧅", type: "veg" },
    { id: "sauteed-mushrooms", name: "Garlic Sautéed Mushrooms", price: 30, cal: 35, icon: "🍄", type: "veg" },
    { id: "crispy-onions", name: "Crispy Fried Onion Straws", price: 25, cal: 60, icon: "✨", type: "crunch" },
    { id: "jalapenos", name: "Pickled Spicy Jalapeños", price: 15, cal: 10, icon: "🌶️", type: "veg" },
    { id: "turkey-bacon", name: "Crispy Turkey Bacon Strips", price: 45, cal: 85, icon: "🥓", type: "meat" },
    { id: "fried-egg", name: "Sunny-Side Farm Egg", price: 30, cal: 75, icon: "🍳", type: "protein" },
    { id: "avocado", name: "Fresh Avocado Slices", price: 45, cal: 65, icon: "🥑", type: "veg" },
    { id: "baby-arugula", name: "Wild Fresh Arugula", price: 20, cal: 10, icon: "🌿", type: "veg" },
    { id: "sweet-corn", name: "Charred Sweet Corn", price: 20, cal: 25, icon: "🌽", type: "veg" },
  ],
  sauces: [
    { id: "royal-secret", name: "Royal Secret Sauce", price: 0, cal: 65, icon: "✨", simpleDesc: "Creamy, tangy & savory house secret sauce" },
    { id: "truffle-aioli", name: "Black Truffle Garlic Mayo", price: 25, cal: 80, icon: "🍄", simpleDesc: "Rich garlic aioli with aromatic truffle" },
    { id: "bbq-chipotle", name: "Smoky BBQ Sauce", price: 15, cal: 50, icon: "🔥", simpleDesc: "Sweet & smoky hickory BBQ glaze" },
    { id: "peri-peri-mayo", name: "Spicy Peri Peri Mayo", price: 15, cal: 70, icon: "🌶️", simpleDesc: "Creamy mayo with a fiery chili kick" },
    { id: "honey-mustard", name: "Sweet Honey Mustard", price: 15, cal: 55, icon: "🍯", simpleDesc: "Mild mustard sweetened with natural honey" },
    { id: "garlic-ranch", name: "Cool Garlic Ranch", price: 15, cal: 75, icon: "🧄", simpleDesc: "Cool creamy herb & roasted garlic ranch" },
    { id: "sriracha-glaze", name: "Spicy Sriracha Glaze", price: 15, cal: 60, icon: "🌶️", simpleDesc: "Sweet chili sriracha sauce" },
    { id: "cheddar-drizzle", name: "Warm Liquid Cheddar", price: 25, cal: 90, icon: "🧀", simpleDesc: "Molten warm cheese drizzle" },
  ],
};

// Simple, clear Pizza ingredients library
const PIZZA_OPTIONS = {
  crusts: [
    { id: "neapolitan", name: '10" Hand-Tossed Neapolitan Crust', price: 140, cal: 450, icon: "🍕", simpleDesc: "Light, airy woodfired crust with crispy edge" },
    { id: "thin-roman", name: '10" Thin & Crispy Roman Crust', price: 130, cal: 380, icon: "🥖", simpleDesc: "Super crunchy, thin artisan pizza base" },
    { id: "cheese-stuffed", name: '12" Stuffed Cheese Crust', price: 190, cal: 620, icon: "🧀", simpleDesc: "Outer rim stuffed with melted mozzarella" },
    { id: "sourdough-crust", name: '10" Garlic Sourdough Crust', price: 160, cal: 420, icon: "🌾", simpleDesc: "Slow-fermented sourdough with garlic butter" },
    { id: "glutenfree-crust", name: '10" Cauliflower Gluten-Free Crust', price: 170, cal: 310, icon: "🌱", simpleDesc: "Certified gluten-free crispy veggie crust" },
  ],
  sauces: [
    { id: "san-marzano", name: "Classic Italian Tomato Sauce", price: 0, cal: 40, icon: "🍅", simpleDesc: "Sweet Italian plum tomatoes with fresh basil" },
    { id: "alfredo-white", name: "Creamy Garlic Alfredo", price: 30, cal: 90, icon: "🧄", simpleDesc: "Rich white cream with parmesan & garlic" },
    { id: "pesto-basil", name: "Fresh Basil Pesto", price: 35, cal: 110, icon: "🌿", simpleDesc: "Crushed sweet basil, olive oil & pine nuts" },
    { id: "fiery-arrabbiata", name: "Spicy Arrabbiata Chili Sauce", price: 25, cal: 45, icon: "🌶️", simpleDesc: "Zesty tomato sauce with red chili flakes" },
    { id: "bbq-smoky", name: "Smoky BBQ Pizza Sauce", price: 25, cal: 60, icon: "🔥", simpleDesc: "Sweet & tangy hickory smoke base" },
    { id: "truffle-cream", name: "Rich Black Truffle Cream", price: 40, cal: 100, icon: "🍄", simpleDesc: "Velvety cream infused with black truffles" },
  ],
  cheeses: [
    { id: "royal-mozzarella", name: "100% Mozzarella Cheese", price: 40, cal: 140, icon: "🧀", simpleDesc: "Classic stretchy, bubbly pizza cheese" },
    { id: "fresh-bocconcini", name: "Fresh Mozzarella Pearls", price: 50, cal: 120, icon: "⚪", simpleDesc: "Creamy fresh Italian cheese pearls" },
    { id: "smoked-provolone", name: "Smoked Provolone", price: 45, cal: 135, icon: "🧀", simpleDesc: "Aromatic melted smoked cheese" },
    { id: "gorgonzola", name: "Blue Gorgonzola", price: 55, cal: 150, icon: "🧀", simpleDesc: "Rich Italian blue cheese" },
    { id: "aged-parmesan", name: "Aged Parmesan Shavings", price: 40, cal: 110, icon: "🧀", simpleDesc: "Sharp & salty grated Italian hard cheese" },
    { id: "ricotta-cream", name: "Whipped Herb Ricotta", price: 45, cal: 115, icon: "🥛", simpleDesc: "Light, fluffy ricotta with herbs" },
  ],
  toppings: [
    { id: "smoky-chicken", name: "Grilled Chicken Chunks", price: 45, cal: 110, icon: "🍗", category: "meat" },
    { id: "pepperoni", name: "Classic Pepperoni Slices", price: 55, cal: 140, icon: "🥩", category: "meat" },
    { id: "spicy-sausage", name: "Crumbled Italian Sausage", price: 50, cal: 130, icon: "🥓", category: "meat" },
    { id: "paneer-tikka", name: "Tandoori Paneer Cubes", price: 40, cal: 110, icon: "🧀", category: "veg" },
    { id: "kalamata-olives", name: "Black Olives", price: 25, cal: 35, icon: "🫒", category: "veg" },
    { id: "sundried-tomatoes", name: "Sundried Tomatoes", price: 25, cal: 30, icon: "🍅", category: "veg" },
    { id: "portobello-slices", name: "Fresh Sliced Mushrooms", price: 30, cal: 25, icon: "🍄", category: "veg" },
    { id: "bell-peppers", name: "Crisp Bell Peppers", price: 20, cal: 20, icon: "🫑", category: "veg" },
    { id: "sweet-corn-jalapeno", name: "Sweet Corn & Jalapeños", price: 25, cal: 35, icon: "🌽", category: "veg" },
    { id: "caramelized-shallots", name: "Sweet Caramelized Onions", price: 25, cal: 30, icon: "🧅", category: "veg" },
    { id: "baby-spinach", name: "Fresh Baby Spinach", price: 20, cal: 15, icon: "🥬", category: "veg" },
    { id: "roasted-garlic", name: "Slow-Roasted Garlic Cloves", price: 20, cal: 25, icon: "🧄", category: "veg" },
  ],
  finishes: [
    { id: "truffle-oil", name: "Aromatic Truffle Oil", price: 30, cal: 45, icon: "🍄", simpleDesc: "A drop of gourmet black truffle oil" },
    { id: "hot-honey", name: "Spicy Hot Honey Glaze", price: 25, cal: 50, icon: "🍯", simpleDesc: "Chili-infused sweet honey drizzle" },
    { id: "fresh-basil", name: "Fresh Basil Leaves", price: 0, cal: 5, icon: "🌿", simpleDesc: "Aromatic freshly picked Genovese basil" },
    { id: "balsamic-glaze", name: "Sweet Balsamic Glaze", price: 20, cal: 35, icon: "🍇", simpleDesc: "Thick, sweet Italian balsamic reduction" },
    { id: "oregano-parm-dust", name: "Parmesan & Oregano Dust", price: 15, cal: 20, icon: "✨", simpleDesc: "Crisp herb & parmesan seasoning" },
    { id: "garlic-herb-butter", name: "Warm Garlic Butter", price: 15, cal: 40, icon: "🫒", simpleDesc: "Warm garlic herb butter brushed on top" },
  ],
};



const BURGER_QUICK_NOTES = [
  "🔥 Extra Crispy Patty",
  "🧅 No Raw Onions",
  "🧀 Extra Melted Cheese",
  "🥫 Sauce on the Side",
  "🔪 Cut in Half",
  "🥖 Extra Toasted Bun",
  "⚡ Well-Done Patty",
  "🌶️ Make it Extra Spicy",
  "🥗 Extra Lettuce & Pickles",
];

const PIZZA_QUICK_NOTES = [
  "🔥 Extra Crispy Crust",
  "🍕 Double Cut (8 Slices)",
  "🧀 Extra Cheese on Top",
  "🌶️ Extra Chili Flakes & Oregano",
  "🧄 Garlic Butter on Crust",
  "🌿 Fresh Basil on the Side",
  "🥫 Light Sauce Base",
  "📦 Pack with Extra Dip",
];

export const DishCustomizerPage = () => {
  const [activeTab, setActiveTab] = useState("burger"); // 'burger' | 'pizza'

  const { addToCart, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const [addedNotice, setAddedNotice] = useState(false);

  // Burger State
  const [burgerBun, setBurgerBun] = useState(BURGER_OPTIONS.buns[0].id);
  const [burgerPatty, setBurgerPatty] = useState(BURGER_OPTIONS.patties[0].id);
  const [burgerCheeses, setBurgerCheeses] = useState(["aged-cheddar"]);
  const [burgerToppings, setBurgerToppings] = useState(["lettuce", "tomato", "pickles"]);
  const [burgerSauces, setBurgerSauces] = useState(["royal-secret"]);
  const [burgerNotes, setBurgerNotes] = useState("");

  // Pizza State
  const [pizzaCrust, setPizzaCrust] = useState(PIZZA_OPTIONS.crusts[0].id);
  const [pizzaSauce, setPizzaSauce] = useState(PIZZA_OPTIONS.sauces[0].id);
  const [pizzaCheeses, setPizzaCheeses] = useState(["royal-mozzarella"]);
  const [pizzaToppings, setPizzaToppings] = useState(["smoky-chicken", "sundried-tomatoes", "bell-peppers"]);
  const [pizzaFinishes, setPizzaFinishes] = useState(["fresh-basil"]);
  const [pizzaNotes, setPizzaNotes] = useState("");

  // Multi-item toggle helper
  const toggleItem = (list, setList, id, max = 6) => {
    if (list.includes(id)) {
      if (list.length > 1) {
        setList(list.filter((x) => x !== id));
      }
    } else {
      if (list.length < max) {
        setList([...list, id]);
      }
    }
  };

  // Add quick note chip
  const appendQuickNote = (noteTag, currentNotes, setNotes) => {
    if (!currentNotes.includes(noteTag)) {
      setNotes(currentNotes ? `${currentNotes}, ${noteTag}` : noteTag);
    }
  };

  // Price calculations
  const calculateBurgerPrice = () => {
    const bun = BURGER_OPTIONS.buns.find((b) => b.id === burgerBun)?.price || 0;
    const patty = BURGER_OPTIONS.patties.find((p) => p.id === burgerPatty)?.price || 0;
    const cheeseTotal = burgerCheeses.reduce((sum, id) => sum + (BURGER_OPTIONS.cheeses.find((c) => c.id === id)?.price || 0), 0);
    const toppingsTotal = burgerToppings.reduce((sum, id) => sum + (BURGER_OPTIONS.toppings.find((t) => t.id === id)?.price || 0), 0);
    const saucesTotal = burgerSauces.reduce((sum, id) => sum + (BURGER_OPTIONS.sauces.find((s) => s.id === id)?.price || 0), 0);
    return 149 + bun + patty + cheeseTotal + toppingsTotal + saucesTotal;
  };

  const calculateBurgerCalories = () => {
    const bun = BURGER_OPTIONS.buns.find((b) => b.id === burgerBun)?.cal || 0;
    const patty = BURGER_OPTIONS.patties.find((p) => p.id === burgerPatty)?.cal || 0;
    const cheeseTotal = burgerCheeses.reduce((sum, id) => sum + (BURGER_OPTIONS.cheeses.find((c) => c.id === id)?.cal || 0), 0);
    const toppingsTotal = burgerToppings.reduce((sum, id) => sum + (BURGER_OPTIONS.toppings.find((t) => t.id === id)?.cal || 0), 0);
    const saucesTotal = burgerSauces.reduce((sum, id) => sum + (BURGER_OPTIONS.sauces.find((s) => s.id === id)?.cal || 0), 0);
    return bun + patty + cheeseTotal + toppingsTotal + saucesTotal;
  };

  const calculatePizzaPrice = () => {
    const crust = PIZZA_OPTIONS.crusts.find((c) => c.id === pizzaCrust)?.price || 0;
    const sauce = PIZZA_OPTIONS.sauces.find((s) => s.id === pizzaSauce)?.price || 0;
    const cheeseTotal = pizzaCheeses.reduce((sum, id) => sum + (PIZZA_OPTIONS.cheeses.find((c) => c.id === id)?.price || 0), 0);
    const toppingsTotal = pizzaToppings.reduce((sum, id) => sum + (PIZZA_OPTIONS.toppings.find((t) => t.id === id)?.price || 0), 0);
    const finishesTotal = pizzaFinishes.reduce((sum, id) => sum + (PIZZA_OPTIONS.finishes.find((f) => f.id === id)?.price || 0), 0);
    return 199 + crust + sauce + cheeseTotal + toppingsTotal + finishesTotal;
  };

  const calculatePizzaCalories = () => {
    const crust = PIZZA_OPTIONS.crusts.find((c) => c.id === pizzaCrust)?.cal || 0;
    const sauce = PIZZA_OPTIONS.sauces.find((s) => s.id === pizzaSauce)?.cal || 0;
    const cheeseTotal = pizzaCheeses.reduce((sum, id) => sum + (PIZZA_OPTIONS.cheeses.find((c) => c.id === id)?.cal || 0), 0);
    const toppingsTotal = pizzaToppings.reduce((sum, id) => sum + (PIZZA_OPTIONS.toppings.find((t) => t.id === id)?.cal || 0), 0);
    const finishesTotal = pizzaFinishes.reduce((sum, id) => sum + (PIZZA_OPTIONS.finishes.find((f) => f.id === id)?.cal || 0), 0);
    return crust + sauce + cheeseTotal + toppingsTotal + finishesTotal;
  };

  const currentBurgerPrice = calculateBurgerPrice();
  const currentBurgerCalories = calculateBurgerCalories();
  const currentPizzaPrice = calculatePizzaPrice();
  const currentPizzaCalories = calculatePizzaCalories();

  const selectedBunObj = BURGER_OPTIONS.buns.find((b) => b.id === burgerBun);
  const selectedPattyObj = BURGER_OPTIONS.patties.find((p) => p.id === burgerPatty);

  // Add Custom Creation to Cart
  const handleAddToCart = () => {
    const dishThumb = activeTab === "burger" ? "/images/hero-burger.jpg" : "/images/offer-pizza.jpg";

    if (activeTab === "burger") {
      const selectedCheesesNames = burgerCheeses.map((id) => BURGER_OPTIONS.cheeses.find((c) => c.id === id)?.name).filter(Boolean).join(", ");
      const selectedToppingsNames = burgerToppings.map((id) => BURGER_OPTIONS.toppings.find((t) => t.id === id)?.name).filter(Boolean).join(", ");
      const selectedSaucesNames = burgerSauces.map((id) => BURGER_OPTIONS.sauces.find((s) => s.id === id)?.name).filter(Boolean).join(", ");

      const customBurgerDish = {
        _id: `custom-burger-${Date.now()}`,
        name: `Custom Smashed Burger (${selectedPattyObj?.name.split(" ")[0] || "Gourmet"})`,
        category: "Burgers",
        type: selectedPattyObj?.category === "veg" ? "Veg" : "Non-Veg",
        price: currentBurgerPrice,
        image: dishThumb,
        description: `Custom build: ${selectedBunObj?.name} + ${selectedPattyObj?.name} + Cheeses: [${selectedCheesesNames}] + Toppings: [${selectedToppingsNames}] + Sauces: [${selectedSaucesNames}] (~${currentBurgerCalories} kcal). ${burgerNotes ? `Kitchen Notes: "${burgerNotes}"` : ""}`,
        isCustomCreation: true,
        specialInstructions: burgerNotes,
      };

      addToCart(customBurgerDish, 1);
    } else {
      const selectedCrustObj = PIZZA_OPTIONS.crusts.find((c) => c.id === pizzaCrust);
      const selectedSauceObj = PIZZA_OPTIONS.sauces.find((s) => s.id === pizzaSauce);
      const selectedCheesesNames = pizzaCheeses.map((id) => PIZZA_OPTIONS.cheeses.find((c) => c.id === id)?.name).filter(Boolean).join(", ");
      const selectedToppingsNames = pizzaToppings.map((id) => PIZZA_OPTIONS.toppings.find((t) => t.id === id)?.name).filter(Boolean).join(", ");
      const selectedFinishesNames = pizzaFinishes.map((id) => PIZZA_OPTIONS.finishes.find((f) => f.id === id)?.name).filter(Boolean).join(", ");

      const hasMeat = pizzaToppings.some((id) => PIZZA_OPTIONS.toppings.find((t) => t.id === id)?.category === "meat");

      const customPizzaDish = {
        _id: `custom-pizza-${Date.now()}`,
        name: `Custom Stone-Baked Pizza (${selectedCrustObj?.name.split(" ")[1] || "Artisan"})`,
        category: "Pizza",
        type: hasMeat ? "Non-Veg" : "Veg",
        price: currentPizzaPrice,
        image: dishThumb,
        description: `Custom build: ${selectedCrustObj?.name} + ${selectedSauceObj?.name} + Cheeses: [${selectedCheesesNames}] + Toppings: [${selectedToppingsNames}] + Finishes: [${selectedFinishesNames}] (~${currentPizzaCalories} kcal). ${pizzaNotes ? `Kitchen Notes: "${pizzaNotes}"` : ""}`,
        isCustomCreation: true,
        specialInstructions: pizzaNotes,
      };

      addToCart(customPizzaDish, 1);
    }

    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      setIsCartOpen(true);
    }, 300);
  };

  return (
    <div className="customizer-page-container">
      {/* Top Luxury Banner */}
      <section className="customizer-hero-banner">
        <div className="customizer-hero-content">
          <span className="customizer-badge">👑 Foodie Royal Craft Studio</span>
          <h1 className="customizer-title">
            Build Your Own <span className="highlight-gold">Custom Burger & Pizza</span>
          </h1>
          <p className="customizer-subtitle">
            Craft your culinary dream with real chef ingredients! Choose your fresh buns, juicy meat or veg patties, melting cheeses, crisp garden veggies, and delicious sauces to build your personalized masterpiece.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="customizer-mode-tabs">
            <button
              className={`mode-tab-btn ${activeTab === "burger" ? "active" : ""}`}
              onClick={() => setActiveTab("burger")}
            >
              <span className="mode-tab-icon">🍔</span>
              <div className="mode-tab-text">
                <strong>Craft Your Burger</strong>
                <span>From ₹149 Base • 6 Simple Steps</span>
              </div>
            </button>

            <button
              className={`mode-tab-btn ${activeTab === "pizza" ? "active" : ""}`}
              onClick={() => setActiveTab("pizza")}
            >
              <span className="mode-tab-icon">🍕</span>
              <div className="mode-tab-text">
                <strong>Craft Your Pizza</strong>
                <span>From ₹199 Base • 6 Simple Steps</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Main Studio 2-Column Grid */}
      <div className="customizer-studio-grid">
        {/* Left Column: Live Visual Builder & Recipe Summary */}
        <div className="studio-visual-panel">
          <div className="studio-preview-card">
            <div className="preview-header">
              <span className="preview-status-pill">
                {activeTab === "burger" ? "🍔 Custom Burger Preview" : "🍕 Custom Pizza Preview"}
              </span>
              <span className="preview-cal-badge">
                ⚡ ~{activeTab === "burger" ? currentBurgerCalories : currentPizzaCalories} kcal
              </span>
            </div>

            {/* Interactive Layer Stack Visualizer Stage */}
            <div className="visual-dish-stage">
              <div className="layer-stack-stage">
                {activeTab === "burger" ? (
                  <div className="burger-realistic-display">
                      {/* Top Bun */}
                      <div
                        className="burger-visual-bun-top"
                        style={{
                          background:
                            selectedBunObj?.id === "charcoal"
                              ? "linear-gradient(180deg, #374151 0%, #111827 100%)"
                              : selectedBunObj?.id === "lettucewrap"
                              ? "linear-gradient(180deg, #22c55e 0%, #15803d 100%)"
                              : "linear-gradient(180deg, #f59e0b 0%, #d97706 70%, #b45309 100%)",
                        }}
                      >
                        <div className="bun-shine"></div>
                        <div className="sesame-seeds-scatter">
                          <span>•</span>
                          <span>•</span>
                          <span>•</span>
                          <span>•</span>
                          <span>•</span>
                        </div>
                        <span className="layer-caption">🥖 {selectedBunObj?.name} (Top)</span>
                      </div>

                      {/* Sauces Drip Layer */}
                      {burgerSauces.length > 0 && (
                        <div className="burger-visual-sauce-layer">
                          <span className="layer-caption">
                            🥫 {burgerSauces.map((s) => BURGER_OPTIONS.sauces.find((x) => x.id === s)?.name).join(" + ")}
                          </span>
                        </div>
                      )}

                      {/* Fresh Veggies & Toppings Layer */}
                      {burgerToppings.length > 0 && (
                        <div className="burger-visual-veggies-layer">
                          <div className="lettuce-leaf-ruffle"></div>
                          <div className="tomato-slice-disc"></div>
                          <span className="layer-caption">
                            🥬 {burgerToppings.map((t) => BURGER_OPTIONS.toppings.find((x) => x.id === t)?.name).join(", ")}
                          </span>
                        </div>
                      )}

                      {/* Melted Cheese Drip Layer */}
                      {burgerCheeses.length > 0 && (
                        <div className="burger-visual-cheese-melt">
                          <div className="cheese-drip-edge"></div>
                          <span className="layer-caption">
                            🧀 Melted {burgerCheeses.map((c) => BURGER_OPTIONS.cheeses.find((x) => x.id === c)?.name).join(" & ")}
                          </span>
                        </div>
                      )}

                      {/* Sizzling Patty Layer */}
                      <div
                        className="burger-visual-patty"
                        style={{
                          background:
                            selectedPattyObj?.category === "veg"
                              ? "linear-gradient(180deg, #d97706 0%, #92400e 100%)"
                              : selectedPattyObj?.category === "chicken"
                              ? "linear-gradient(180deg, #ea580c 0%, #c2410c 100%)"
                              : "linear-gradient(180deg, #451a03 0%, #290f02 100%)",
                        }}
                      >
                        <div className="patty-sear-marks"></div>
                        <span className="layer-caption">
                          {selectedPattyObj?.icon} {selectedPattyObj?.name}
                        </span>
                      </div>

                      {/* Bottom Bun */}
                      <div
                        className="burger-visual-bun-bottom"
                        style={{
                          background:
                            selectedBunObj?.id === "charcoal"
                              ? "linear-gradient(180deg, #1f2937 0%, #111827 100%)"
                              : selectedBunObj?.id === "lettucewrap"
                              ? "linear-gradient(180deg, #16a34a 0%, #15803d 100%)"
                              : "linear-gradient(180deg, #d97706 0%, #b45309 100%)",
                        }}
                      >
                        <span className="layer-caption">🥖 Bottom Bun Base</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pizza-board-visual">
                      <div className="pizza-crust-disc">
                        <div
                          className="pizza-sauce-layer"
                          style={{
                            background:
                              pizzaSauce === "alfredo-white"
                                ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                                : pizzaSauce === "pesto-basil"
                                ? "linear-gradient(135deg, #15803d 0%, #166534 100%)"
                                : pizzaSauce === "truffle-cream"
                                ? "linear-gradient(135deg, #44403c 0%, #292524 100%)"
                                : "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                          }}
                        >
                          <div className="pizza-cheese-layer">
                            <div className="pizza-cut-lines">
                              <span className="cut-line cut-1"></span>
                              <span className="cut-line cut-2"></span>
                              <span className="cut-line cut-3"></span>
                              <span className="cut-line cut-4"></span>
                            </div>
                            <div className="pizza-toppings-scatter">
                              {pizzaToppings.map((tid) => {
                                const top = PIZZA_OPTIONS.toppings.find((t) => t.id === tid);
                                return (
                                  <span key={tid} className="pizza-scatter-badge">
                                    {top?.icon} {top?.name.split(" ")[0]}
                                  </span>
                                );
                              })}
                              {pizzaFinishes.map((fid) => {
                                const fin = PIZZA_OPTIONS.finishes.find((f) => f.id === fid);
                                return (
                                  <span key={fid} className="pizza-scatter-badge finish">
                                    {fin?.icon} {fin?.name.split(" ")[0]}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pizza-crust-caption">
                        <span>{PIZZA_OPTIONS.crusts.find((c) => c.id === pizzaCrust)?.name}</span>
                      </div>
                    </div>
                  )}
                </div>
            </div>

            {/* Live Recipe Breakdown Summary */}
            <div className="custom-recipe-summary-box">
              <h4 className="recipe-summary-title">📋 Your Selected Recipe:</h4>

              {activeTab === "burger" ? (
                <div className="recipe-summary-list">
                  <div className="summary-row">
                    <span className="summary-label">🍞 Bun:</span>
                    <strong className="summary-val">{selectedBunObj?.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">🥩 Patty:</span>
                    <strong className="summary-val">{selectedPattyObj?.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">🧀 Cheese:</span>
                    <strong className="summary-val">
                      {burgerCheeses.map((c) => BURGER_OPTIONS.cheeses.find((x) => x.id === c)?.name).join(", ")}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">🥬 Veggies:</span>
                    <strong className="summary-val">
                      {burgerToppings.map((t) => BURGER_OPTIONS.toppings.find((x) => x.id === t)?.name).join(", ")}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">🥫 Sauces:</span>
                    <strong className="summary-val">
                      {burgerSauces.map((s) => BURGER_OPTIONS.sauces.find((x) => x.id === s)?.name).join(", ")}
                    </strong>
                  </div>
                  {burgerNotes && (
                    <div className="summary-row note-row">
                      <span className="summary-label">📝 Notes:</span>
                      <em className="summary-val">"{burgerNotes}"</em>
                    </div>
                  )}
                </div>
              ) : (
                <div className="recipe-summary-list">
                  <div className="summary-row">
                    <span className="summary-label">🍕 Crust:</span>
                    <strong className="summary-val">{PIZZA_OPTIONS.crusts.find((c) => c.id === pizzaCrust)?.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">🍅 Sauce:</span>
                    <strong className="summary-val">{PIZZA_OPTIONS.sauces.find((s) => s.id === pizzaSauce)?.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">🧀 Cheese:</span>
                    <strong className="summary-val">
                      {pizzaCheeses.map((c) => PIZZA_OPTIONS.cheeses.find((x) => x.id === c)?.name).join(", ")}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">🍗 Toppings:</span>
                    <strong className="summary-val">
                      {pizzaToppings.map((t) => PIZZA_OPTIONS.toppings.find((x) => x.id === t)?.name).join(", ")}
                    </strong>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">✨ Finish:</span>
                    <strong className="summary-val">
                      {pizzaFinishes.map((f) => PIZZA_OPTIONS.finishes.find((f) => f.id === f)?.name).join(", ")}
                    </strong>
                  </div>
                  {pizzaNotes && (
                    <div className="summary-row note-row">
                      <span className="summary-label">📝 Notes:</span>
                      <em className="summary-val">"{pizzaNotes}"</em>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Price & Add to Cart Sticky Bar */}
            <div className="studio-checkout-bar">
              <div className="price-breakdown-col">
                <span className="total-label">Total Custom Dish Price</span>
                <div className="price-highlight-row">
                  <span className="currency-symbol">₹</span>
                  <span className="price-figure">
                    {activeTab === "burger" ? currentBurgerPrice : currentPizzaPrice}
                  </span>
                  <span className="gst-note">(Incl. all taxes)</span>
                </div>
              </div>

              <button
                className={`add-custom-cart-btn ${addedNotice ? "success" : ""}`}
                onClick={handleAddToCart}
              >
                <span>{addedNotice ? "✓ Added to Order Cart!" : "🛒 Add Custom Dish to Cart"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Step-by-Step Option Selectors */}
        <div className="studio-controls-panel">
          {activeTab === "burger" ? (
            /* ================= BURGER STEPS ================= */
            <div className="customizer-steps-list">
              {/* Step 1: Bun */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 1</span>
                  <h3>🥖 Choose Your Bun / Bread</h3>
                  <span className="step-rule-hint">Pick 1 option</span>
                </div>
                <div className="ingredients-grid">
                  {BURGER_OPTIONS.buns.map((bun) => (
                    <button
                      key={bun.id}
                      className={`ingredient-option-card ${burgerBun === bun.id ? "selected" : ""}`}
                      onClick={() => setBurgerBun(bun.id)}
                    >
                      <span className="ing-icon">{bun.icon}</span>
                      <div className="ing-info">
                        <strong>{bun.name}</strong>
                        <p>{bun.simpleDesc}</p>
                        <span className="ing-cost">{bun.price === 0 ? "Included" : `+₹${bun.price}`}</span>
                      </div>
                      <span className="ing-radio">{burgerBun === bun.id ? "●" : "○"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Patty / Meat or Veggie */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 2</span>
                  <h3>🥩 Choose Your Meat or Veggie Patty</h3>
                  <span className="step-rule-hint">Pick 1 patty</span>
                </div>
                <div className="ingredients-grid">
                  {BURGER_OPTIONS.patties.map((patty) => (
                    <button
                      key={patty.id}
                      className={`ingredient-option-card ${burgerPatty === patty.id ? "selected" : ""}`}
                      onClick={() => setBurgerPatty(patty.id)}
                    >
                      <span className="ing-icon">{patty.icon}</span>
                      <div className="ing-info">
                        <div className="ing-title-row">
                          <strong>{patty.name}</strong>
                          <span className={`ing-type-pill ${patty.category}`}>
                            {patty.category === "veg" ? "🌱 Veg" : patty.category === "chicken" ? "🍗 Chicken" : "🥩 Meat"}
                          </span>
                        </div>
                        <p>{patty.simpleDesc}</p>
                        <span className="ing-cost">+₹{patty.price}</span>
                      </div>
                      <span className="ing-radio">{burgerPatty === patty.id ? "●" : "○"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Cheeses */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 3</span>
                  <h3>🧀 Add Melting Cheeses</h3>
                  <span className="step-rule-hint">Select up to 3 cheeses</span>
                </div>
                <div className="ingredients-grid multi">
                  {BURGER_OPTIONS.cheeses.map((cheese) => {
                    const isSelected = burgerCheeses.includes(cheese.id);
                    return (
                      <button
                        key={cheese.id}
                        className={`ingredient-option-card ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleItem(burgerCheeses, setBurgerCheeses, cheese.id, 3)}
                      >
                        <span className="ing-icon">{cheese.icon}</span>
                        <div className="ing-info">
                          <strong>{cheese.name}</strong>
                          <p>{cheese.simpleDesc}</p>
                          <span className="ing-cost">+₹{cheese.price}</span>
                        </div>
                        <span className="ing-check">{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Fresh Veggies & Toppings */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 4</span>
                  <h3>🥬 Fresh Garden Veggies & Toppings</h3>
                  <span className="step-rule-hint">Select up to 6 toppings</span>
                </div>
                <div className="ingredients-grid multi">
                  {BURGER_OPTIONS.toppings.map((top) => {
                    const isSelected = burgerToppings.includes(top.id);
                    return (
                      <button
                        key={top.id}
                        className={`ingredient-option-card ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleItem(burgerToppings, setBurgerToppings, top.id, 6)}
                      >
                        <span className="ing-icon">{top.icon}</span>
                        <div className="ing-info">
                          <div className="ing-title-row">
                            <strong>{top.name}</strong>
                            <span className={`ing-type-pill ${top.type}`}>
                              {top.type === "meat" ? "🥩 Meat" : top.type === "protein" ? "🍳 Egg" : "🌱 Veg"}
                            </span>
                          </div>
                          <span className="ing-cost">{top.price === 0 ? "Free" : `+₹${top.price}`}</span>
                        </div>
                        <span className="ing-check">{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 5: Sauces */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 5</span>
                  <h3>🥫 Tasty Sauces & Spreads</h3>
                  <span className="step-rule-hint">Choose up to 3 sauces</span>
                </div>
                <div className="ingredients-grid multi">
                  {BURGER_OPTIONS.sauces.map((sauce) => {
                    const isSelected = burgerSauces.includes(sauce.id);
                    return (
                      <button
                        key={sauce.id}
                        className={`ingredient-option-card ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleItem(burgerSauces, setBurgerSauces, sauce.id, 3)}
                      >
                        <span className="ing-icon">{sauce.icon}</span>
                        <div className="ing-info">
                          <strong>{sauce.name}</strong>
                          <p>{sauce.simpleDesc}</p>
                          <span className="ing-cost">{sauce.price === 0 ? "Free" : `+₹${sauce.price}`}</span>
                        </div>
                        <span className="ing-check">{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 6: Kitchen Preparation Notes */}
              <div className="customizer-step-card special-instructions-card">
                <div className="step-header">
                  <span className="step-number">Step 6</span>
                  <h3>👨‍🍳 Chef Notes & Special Requests</h3>
                  <span className="step-rule-hint">1-Tap Quick Requests</span>
                </div>

                <div className="quick-notes-container">
                  <span className="quick-notes-label">Tap any quick request to add:</span>
                  <div className="quick-notes-chips-row">
                    {BURGER_QUICK_NOTES.map((qNote) => (
                      <button
                        key={qNote}
                        type="button"
                        className="quick-note-chip"
                        onClick={() => appendQuickNote(qNote, burgerNotes, setBurgerNotes)}
                      >
                        {qNote}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="custom-notes-textarea"
                    placeholder="E.g. Extra crispy smashed patty, sauce on the side, please cut burger in half..."
                    value={burgerNotes}
                    onChange={(e) => setBurgerNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ================= PIZZA STEPS ================= */
            <div className="customizer-steps-list">
              {/* Step 1: Crust */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 1</span>
                  <h3>🍕 Choose Pizza Crust & Size</h3>
                  <span className="step-rule-hint">Pick 1 crust</span>
                </div>
                <div className="ingredients-grid">
                  {PIZZA_OPTIONS.crusts.map((crust) => (
                    <button
                      key={crust.id}
                      className={`ingredient-option-card ${pizzaCrust === crust.id ? "selected" : ""}`}
                      onClick={() => setPizzaCrust(crust.id)}
                    >
                      <span className="ing-icon">{crust.icon}</span>
                      <div className="ing-info">
                        <strong>{crust.name}</strong>
                        <p>{crust.simpleDesc}</p>
                        <span className="ing-cost">+₹{crust.price}</span>
                      </div>
                      <span className="ing-radio">{pizzaCrust === crust.id ? "●" : "○"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Base Sauce */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 2</span>
                  <h3>🍅 Choose Base Pizza Sauce</h3>
                  <span className="step-rule-hint">Pick 1 sauce</span>
                </div>
                <div className="ingredients-grid">
                  {PIZZA_OPTIONS.sauces.map((sauce) => (
                    <button
                      key={sauce.id}
                      className={`ingredient-option-card ${pizzaSauce === sauce.id ? "selected" : ""}`}
                      onClick={() => setPizzaSauce(sauce.id)}
                    >
                      <span className="ing-icon">{sauce.icon}</span>
                      <div className="ing-info">
                        <strong>{sauce.name}</strong>
                        <p>{sauce.simpleDesc}</p>
                        <span className="ing-cost">{sauce.price === 0 ? "Included" : `+₹${sauce.price}`}</span>
                      </div>
                      <span className="ing-radio">{pizzaSauce === sauce.id ? "●" : "○"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Cheeses */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 3</span>
                  <h3>🧀 Add Pizza Cheeses</h3>
                  <span className="step-rule-hint">Select up to 3 cheeses</span>
                </div>
                <div className="ingredients-grid multi">
                  {PIZZA_OPTIONS.cheeses.map((cheese) => {
                    const isSelected = pizzaCheeses.includes(cheese.id);
                    return (
                      <button
                        key={cheese.id}
                        className={`ingredient-option-card ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleItem(pizzaCheeses, setPizzaCheeses, cheese.id, 3)}
                      >
                        <span className="ing-icon">{cheese.icon}</span>
                        <div className="ing-info">
                          <strong>{cheese.name}</strong>
                          <p>{cheese.simpleDesc}</p>
                          <span className="ing-cost">+₹{cheese.price}</span>
                        </div>
                        <span className="ing-check">{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Toppings (Meat & Veg) */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 4</span>
                  <h3>🍗 Meats & Fresh Veggie Toppings</h3>
                  <span className="step-rule-hint">Select up to 6 toppings</span>
                </div>
                <div className="ingredients-grid multi">
                  {PIZZA_OPTIONS.toppings.map((top) => {
                    const isSelected = pizzaToppings.includes(top.id);
                    return (
                      <button
                        key={top.id}
                        className={`ingredient-option-card ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleItem(pizzaToppings, setPizzaToppings, top.id, 6)}
                      >
                        <span className="ing-icon">{top.icon}</span>
                        <div className="ing-info">
                          <div className="ing-title-row">
                            <strong>{top.name}</strong>
                            <span className={`ing-type-pill ${top.category}`}>
                              {top.category === "meat" ? "🥩 Meat" : "🌱 Veg"}
                            </span>
                          </div>
                          <span className="ing-cost">+₹{top.price}</span>
                        </div>
                        <span className="ing-check">{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 5: Finishing Drizzles */}
              <div className="customizer-step-card">
                <div className="step-header">
                  <span className="step-number">Step 5</span>
                  <h3>✨ Finishing Drizzles & Herbs</h3>
                  <span className="step-rule-hint">Select up to 3 finishes</span>
                </div>
                <div className="ingredients-grid multi">
                  {PIZZA_OPTIONS.finishes.map((fin) => {
                    const isSelected = pizzaFinishes.includes(fin.id);
                    return (
                      <button
                        key={fin.id}
                        className={`ingredient-option-card ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleItem(pizzaFinishes, setPizzaFinishes, fin.id, 3)}
                      >
                        <span className="ing-icon">{fin.icon}</span>
                        <div className="ing-info">
                          <strong>{fin.name}</strong>
                          <p>{fin.simpleDesc}</p>
                          <span className="ing-cost">{fin.price === 0 ? "Free" : `+₹${fin.price}`}</span>
                        </div>
                        <span className="ing-check">{isSelected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 6: Kitchen Preparation Notes */}
              <div className="customizer-step-card special-instructions-card">
                <div className="step-header">
                  <span className="step-number">Step 6</span>
                  <h3>👨‍🍳 Chef Notes & Special Requests</h3>
                  <span className="step-rule-hint">1-Tap Quick Requests</span>
                </div>

                <div className="quick-notes-container">
                  <span className="quick-notes-label">Tap any quick request to add:</span>
                  <div className="quick-notes-chips-row">
                    {PIZZA_QUICK_NOTES.map((qNote) => (
                      <button
                        key={qNote}
                        type="button"
                        className="quick-note-chip"
                        onClick={() => appendQuickNote(qNote, pizzaNotes, setPizzaNotes)}
                      >
                        {qNote}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="custom-notes-textarea"
                    placeholder="E.g. Extra crispy blistered crust, double cut into 8 slices, fresh basil on the side..."
                    value={pizzaNotes}
                    onChange={(e) => setPizzaNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishCustomizerPage;
