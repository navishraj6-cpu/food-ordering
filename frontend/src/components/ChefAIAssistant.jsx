import { API_URL } from "../config/api";
import React, { useState, useEffect, useRef } from "react";
import { useCart } from "../context/CartContext";

// Complete Foodie Culinary Knowledge Base & Master Menu Dataset (60+ Dishes)
const FOODIE_MENU_DATASET = [
  // --- BURGERS ---
  {
    _id: "food_beef_burger",
    name: "Classic Beef Burger",
    category: "Burgers",
    type: "Non-Veg",
    price: 199,
    calories: "580 kcal",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",
    description: "Juicy beef patty with crisp lettuce, ripe tomatoes, caramelized onions, and signature royal relish.",
    tags: ["beef", "burger", "bestseller", "meaty", "classic", "non-veg", "mains"],
  },
  {
    _id: "food_chicken_burger",
    name: "Classic Chicken Burger",
    category: "Burgers",
    type: "Non-Veg",
    price: 179,
    calories: "520 kcal",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=900&q=85",
    description: "Tender buttermilk fried chicken patty with fresh crunchy slaw and creamy garlic herb sauce.",
    tags: ["chicken", "burger", "crispy", "classic", "non-veg", "mains"],
  },
  {
    _id: "food_plant_burger",
    name: "Plant-Based Meat Burger",
    category: "Veg Burgers",
    type: "Veg",
    price: 219,
    calories: "460 kcal",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=900&q=85",
    description: "100% plant-based gourmet patty with baby spinach, sliced avocado, and vegan smoked chipotle sauce.",
    tags: ["plant-based", "vegan", "veg", "healthy", "burger", "mains"],
  },
  {
    _id: "food_paneer_tikka_burger",
    name: "Paneer Tikka Burger",
    category: "Veg Burgers",
    type: "Veg",
    price: 199,
    calories: "490 kcal",
    rating: 4.8,
    image: "/images/paneer-tikka-burger.jpg",
    description: "Tandoori-spiced char-grilled paneer slab with mint chutney, pickled onion rings in a toasted bun.",
    tags: ["paneer", "tikka", "spicy", "veg", "indian", "burger", "mains"],
  },
  {
    _id: "food_crispy_paneer_burger",
    name: "Crispy Paneer Burger",
    category: "Veg Burgers",
    type: "Veg",
    price: 189,
    calories: "510 kcal",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=900&q=85",
    description: "Crumb-coated golden paneer steak with spicy peri-peri herb dressing and crisp iceberg lettuce.",
    tags: ["crispy", "paneer", "veg", "burger", "crunchy", "mains"],
  },
  {
    _id: "food_mushroom_swiss_burger",
    name: "Mushroom & Swiss Veggie Burger",
    category: "Veg Burgers",
    type: "Veg",
    price: 209,
    calories: "470 kcal",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&w=900&q=85",
    description: "Sautéed cremini & button mushrooms smothered under molten Swiss-style cheese and garlic butter.",
    tags: ["mushroom", "swiss", "cheese", "veg", "gourmet", "burger", "mains"],
  },
  {
    _id: "food_portobello_burger",
    name: "Portobello Mushroom Burger",
    category: "Veg Burgers",
    type: "Veg",
    price: 199,
    calories: "420 kcal",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?auto=format&fit=crop&w=900&q=85",
    description: "Whole marinated grilled portobello mushroom cap with wild arugula and aged balsamic drizzle.",
    tags: ["portobello", "mushroom", "healthy", "veg", "burger", "mains"],
  },
  {
    _id: "food_classic_veg_burger",
    name: "Classic Vegetarian Burger",
    category: "Veg Burgers",
    type: "Veg",
    price: 159,
    calories: "430 kcal",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=900&q=85",
    description: "Fresh vegetable patty with green peas, carrots, potatoes, and mild herb aioli.",
    tags: ["veg", "vegetarian", "budget", "classic", "burger", "mains"],
  },
  {
    _id: "food_california_burger",
    name: "California Burger",
    category: "Burgers",
    type: "Non-Veg",
    price: 239,
    calories: "620 kcal",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=85",
    description: "Juicy beef patty stacked with fresh Hass avocado slices, crispy bacon, and Monterey Jack cheese.",
    tags: ["california", "avocado", "bacon", "beef", "gourmet", "burger", "mains"],
  },
  {
    _id: "food_jalapeno_popper_burger",
    name: "Jalapeño Popper Burger",
    category: "Burgers",
    type: "Non-Veg",
    price: 249,
    calories: "650 kcal",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=85",
    description: "Fiery jalapeño poppers stuffed with cream cheese, crispy bacon, and seared beef patty.",
    tags: ["jalapeno", "spicy", "hot", "cheese", "beef", "burger", "mains"],
  },
  {
    _id: "food_patty_melt",
    name: "Patty Melt",
    category: "Burgers",
    type: "Non-Veg",
    price: 239,
    calories: "640 kcal",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=900&q=85",
    description: "Caramelized sweet onions, double melted Swiss & cheddar cheese with juicy seared beef on toasted bread.",
    tags: ["patty melt", "cheese", "onions", "beef", "burger", "mains"],
  },
  {
    _id: "food_bacon_bbq_burger",
    name: "Bacon BBQ Burger",
    category: "Burgers",
    type: "Non-Veg",
    price: 249,
    calories: "670 kcal",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=900&q=85",
    description: "Smoky hickory BBQ sauce with crispy bacon, crunchy onion rings, and sharp melted cheddar.",
    tags: ["bacon", "bbq", "smoky", "beef", "burger", "bestseller", "mains"],
  },
  {
    _id: "food_smash_burger",
    name: "Smash Burger",
    category: "Burgers",
    type: "Non-Veg",
    price: 229,
    calories: "590 kcal",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85",
    description: "Double crispy-smashed beef patties with melted American cheese, dill pickles, and secret mustard sauce.",
    tags: ["smash", "crispy", "beef", "double", "burger", "mains"],
  },
  {
    _id: "food_fish_burger",
    name: "Fish Burger",
    category: "Burgers",
    type: "Non-Veg",
    price: 189,
    calories: "480 kcal",
    rating: 4.7,
    image: "/images/fish-burger.jpg",
    description: "Golden crispy fried fish fillet with rich tangy tartar sauce, pickles and fresh slaw in a brioche bun.",
    tags: ["fish", "seafood", "tartar", "crispy", "burger", "mains"],
  },

  // --- PIZZAS ---
  {
    _id: "food_margherita_supreme",
    name: "Margherita Supreme Pizza",
    category: "Veg Pizza",
    type: "Veg",
    price: 239,
    calories: "680 kcal",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=900&q=85",
    description: "Classic Italian crust layered with San Marzano sauce, fresh basil, extra virgin olive oil and melted mozzarella.",
    tags: ["pizza", "margherita", "classic", "italian", "cheese", "veg", "mains"],
  },
  {
    _id: "food_four_cheese_pizza",
    name: "Four Cheese Gourmet Pizza",
    category: "Veg Pizza",
    type: "Veg",
    price: 319,
    calories: "780 kcal",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85",
    description: "Decadent blend of imported mozzarella, sharp cheddar, aged gouda, and grated parmesan cheese.",
    tags: ["pizza", "cheese", "four cheese", "gourmet", "veg", "mains"],
  },
  {
    _id: "food_farmhouse_pizza",
    name: "Farmhouse Veg Pizza",
    category: "Veg Pizza",
    type: "Veg",
    price: 269,
    calories: "690 kcal",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85",
    description: "Garden fresh capsicum, red onions, juicy ripe tomatoes, crisp mushrooms and mozzarella.",
    tags: ["pizza", "farmhouse", "veg", "vegetables", "mains"],
  },
  {
    _id: "food_bbq_chicken_pizza",
    name: "BBQ Chicken Pizza",
    category: "Pizza",
    type: "Chicken",
    price: 299,
    calories: "740 kcal",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=85",
    description: "Smoky BBQ chicken chunks, caramelized red onions, sweet corn, and molten mozzarella.",
    tags: ["pizza", "chicken", "bbq", "smoky", "non-veg", "mains"],
  },
  {
    _id: "food_chicken_alfredo_pizza",
    name: "Chicken Alfredo Pizza",
    category: "Pizza",
    type: "Chicken",
    price: 319,
    calories: "790 kcal",
    rating: 4.8,
    image: "https://therecipecritic.com/wp-content/uploads/2022/09/chickenalfredopizza-1.jpg",
    description: "Rich creamy garlic Alfredo sauce topped with tender sliced grilled chicken, mozzarella and Italian herbs.",
    tags: ["pizza", "alfredo", "chicken", "creamy", "white sauce", "non-veg", "mains"],
  },
  {
    _id: "food_paneer_tikka_pizza",
    name: "Paneer Tikka Pizza",
    category: "Veg Pizza",
    type: "Veg",
    price: 279,
    calories: "720 kcal",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=900&q=85",
    description: "Tandoori marinated paneer cubes, crunchy bell peppers, onions, and spicy herb drizzle.",
    tags: ["pizza", "paneer", "tikka", "spicy", "indian", "veg", "mains"],
  },
  {
    _id: "food_truffle_mushroom_pizza",
    name: "Truffle Mushroom Veg Pizza",
    category: "Veg Pizza",
    type: "Veg",
    price: 329,
    calories: "710 kcal",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=900&q=85",
    description: "Sautéed button and portobello mushrooms infused with aromatic black truffle oil and fresh thyme.",
    tags: ["pizza", "truffle", "mushroom", "gourmet", "veg", "mains"],
  },

  // --- FRIES & LOADED SIDES ---
  {
    _id: "food_crispy_chicken_fries",
    name: "Crispy Chicken Loaded Fries",
    category: "Fries",
    type: "Non-Veg",
    price: 189,
    calories: "560 kcal",
    rating: 4.9,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNzXxN0WXjXxJNhT9XP3d_WgyKeU3ecvvP3wDv564gws-IwWiKcMimPe4&s=10",
    description: "Crispy french fries drenched in hot cheese sauce, loaded with crispy fried chicken chunks & paprika mayo.",
    tags: ["fries", "loaded", "chicken", "cheese", "sides", "bestseller", "spicy"],
  },
  {
    _id: "food_cheesy_cheddar_fries",
    name: "Cheesy Cheddar Fries",
    category: "Fries",
    type: "Veg",
    price: 149,
    calories: "480 kcal",
    rating: 4.8,
    image: "https://www.cookwithnabeela.com/wp-content/uploads/2024/05/CheeseFries.webp",
    description: "Golden fries smothered under a blanket of warm melted Wisconsin cheddar cheese sauce and herbs.",
    tags: ["fries", "cheese", "cheddar", "veg", "sides"],
  },
  {
    _id: "food_salted_fries",
    name: "Classic Salted French Fries",
    category: "Fries",
    type: "Veg",
    price: 99,
    calories: "340 kcal",
    rating: 4.6,
    image: "https://myfoodstory.com/wp-content/uploads/2022/04/Perfect-French-Fries-1.jpg",
    description: "Golden potato matchsticks fried to perfection and tossed in fine sea salt.",
    tags: ["fries", "salted", "classic", "budget", "veg", "sides"],
  },
  {
    _id: "food_peri_peri_fries",
    name: "Peri Peri French Fries",
    category: "Fries",
    type: "Veg",
    price: 129,
    calories: "360 kcal",
    rating: 4.8,
    image: "https://t4.ftcdn.net/jpg/05/83/50/87/360_F_583508701_M4LdsNAnwZPcXJJsZzYJb9lnWn2gdoCo.jpg",
    description: "Crisp potato fries dusted in a zesty, fiery African peri-peri seasoning blend.",
    tags: ["fries", "peri peri", "spicy", "hot", "veg", "sides"],
  },
  {
    _id: "food_truffle_fries",
    name: "Truffle Parmesan Fries",
    category: "Fries",
    type: "Veg",
    price: 169,
    calories: "410 kcal",
    rating: 4.9,
    image: "https://cdn.shopify.com/s/files/1/0024/4137/9915/files/our-place-recipe-steps-truffle-parmesan-french-fries_1000x.jpg?v=1758653412",
    description: "Gourmet fries infused with white truffle oil, shaved aged parmesan, and chopped Italian parsley.",
    tags: ["fries", "truffle", "parmesan", "gourmet", "veg", "sides", "bestseller"],
  },

  // --- CRISPY CHICKEN & WINGS ---
  {
    _id: "food_classic_crispy_chicken",
    name: "Classic Golden Crispy Chicken",
    category: "Crispy Chicken",
    type: "Non-Veg",
    price: 249,
    calories: "590 kcal",
    rating: 4.8,
    image: "/images/classic-crispy-chicken.jpg",
    description: "Crispy, golden-fried chicken seasoned with our signature 11-spice herb blend.",
    tags: ["crispy chicken", "fried chicken", "chicken", "classic", "non-veg", "bestseller"],
  },
  {
    _id: "food_peri_peri_chicken",
    name: "Peri Peri Crispy Chicken",
    category: "Crispy Chicken",
    type: "Non-Veg",
    price: 269,
    calories: "610 kcal",
    rating: 4.9,
    image: "/images/peri-peri-crispy-chicken.jpg",
    description: "Crunchy fried chicken tossed in fiery African bird's eye chili peri-peri seasoning.",
    tags: ["crispy chicken", "peri peri", "spicy", "hot", "chicken", "non-veg"],
  },
  {
    _id: "food_buffalo_wings",
    name: "Hot Buffalo Chicken Wings",
    category: "Crispy Chicken",
    type: "Non-Veg",
    price: 229,
    calories: "530 kcal",
    rating: 4.8,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSA3HH0D6-FDLXtot9Og9ujhoVe2E0Tqnssfioem4SRhA&s=10",
    description: "Crisp, juicy fried chicken wings glazed in spicy tangy buffalo pepper sauce.",
    tags: ["wings", "buffalo", "chicken", "spicy", "tangy", "non-veg", "sides"],
  },
  {
    _id: "food_bbq_wings",
    name: "Smoky BBQ Glazed Wings",
    category: "Crispy Chicken",
    type: "Non-Veg",
    price: 239,
    calories: "550 kcal",
    rating: 4.8,
    image: "/images/bbq-chicken-wings.jpg",
    description: "Slow-glazed crispy chicken wings tossed in thick honey hickory BBQ sauce.",
    tags: ["wings", "bbq", "smoky", "honey", "chicken", "non-veg"],
  },
  {
    _id: "food_chicken_nuggets",
    name: "Golden Crunchy Chicken Nuggets",
    category: "Crispy Chicken",
    type: "Non-Veg",
    price: 179,
    calories: "420 kcal",
    rating: 4.7,
    image: "/images/crispy-chicken-nuggets.jpg",
    description: "Bite-sized tender chicken nuggets fried to crispy perfection served with honey mustard dip.",
    tags: ["nuggets", "chicken", "snacks", "kids", "budget", "non-veg"],
  },

  // --- SANDWICHES & PANINIS ---
  {
    _id: "food_veg_cheese_sandwich",
    name: "Classic Grilled Veg Cheese Sandwich",
    category: "Sandwiches",
    type: "Veg",
    price: 149,
    calories: "390 kcal",
    rating: 4.6,
    image: "/images/veg-cheese-sandwich.jpg",
    description: "Crisp golden toast packed with sliced cucumbers, tomatoes, bell peppers and melted cheddar cheese.",
    tags: ["sandwich", "cheese", "veg", "budget", "quick", "mains"],
  },
  {
    _id: "food_paneer_sandwich",
    name: "Paneer Tikka Grilled Sandwich",
    category: "Sandwiches",
    type: "Veg",
    price: 179,
    calories: "460 kcal",
    rating: 4.8,
    image: "/images/paneer-tikka-sandwich.jpg",
    description: "Tender paneer cubes marinated in tandoori spices layered with onions, capsicum and cheese.",
    tags: ["sandwich", "paneer", "tikka", "spicy", "veg", "mains"],
  },
  {
    _id: "food_chicken_club_sandwich",
    name: "Classic Grilled Chicken Club Sandwich",
    category: "Sandwiches",
    type: "Non-Veg",
    price: 199,
    calories: "540 kcal",
    rating: 4.8,
    image: "/images/classic-grilled-chicken-club-sandwich.jpg",
    description: "Triple-layered toasted bread with seasoned grilled chicken breast, fresh lettuce, tomatoes and cheese.",
    tags: ["sandwich", "club", "chicken", "grilled", "non-veg", "mains"],
  },
  {
    _id: "food_peri_peri_panini",
    name: "Peri Peri Chicken Panini",
    category: "Sandwiches",
    type: "Non-Veg",
    price: 219,
    calories: "510 kcal",
    rating: 4.9,
    image: "/images/peri-peri-chicken-panini.jpg",
    description: "Spicy peri-peri marinated chicken with melted cheddar grilled in toasted artisan Italian bread.",
    tags: ["panini", "sandwich", "peri peri", "chicken", "spicy", "non-veg"],
  },

  // --- DESSERTS ---
  {
    _id: "food_choco_lava",
    name: "Choco Lava Cake",
    category: "Desserts",
    type: "Dessert",
    price: 110,
    calories: "380 kcal",
    rating: 4.9,
    image: "/images/choco-lava-cake.jpg",
    description: "Warm Belgian chocolate cake with a rich molten chocolate center that flows upon cutting.",
    tags: ["dessert", "chocolate", "lava cake", "sweet", "bestseller"],
  },
  {
    _id: "food_cheesecake",
    name: "New York Cheesecake",
    category: "Desserts",
    type: "Dessert",
    price: 199,
    calories: "450 kcal",
    rating: 4.9,
    image: "/images/new-york-cheesecake.jpg",
    description: "Rich, velvety classic New York baked cheesecake on a buttery crumbly graham cracker crust.",
    tags: ["dessert", "cheesecake", "sweet", "gourmet", "bestseller"],
  },
  {
    _id: "food_tiramisu",
    name: "Classic Italian Tiramisu",
    category: "Desserts",
    type: "Dessert",
    price: 219,
    calories: "420 kcal",
    rating: 4.8,
    image: "/images/classic-italian-tiramisu.jpg",
    description: "Traditional Italian dessert with espresso-dipped ladyfingers and whipped mascarpone cream dusting.",
    tags: ["dessert", "tiramisu", "coffee", "italian", "sweet"],
  },
  {
    _id: "food_kunafah",
    name: "Royal Cheese Kunafah",
    category: "Desserts",
    type: "Dessert",
    price: 249,
    calories: "520 kcal",
    rating: 4.9,
    image: "/images/royal-cheese-kunafah.jpg",
    description: "Authentic Middle Eastern crispy shredded phyllo stuffed with stretchy cheese, soaked in rose syrup and pistachios.",
    tags: ["dessert", "kunafah", "cheese", "middle eastern", "sweet", "royal"],
  },
  {
    _id: "food_belgian_waffle",
    name: "Belgian Chocolate Waffle",
    category: "Desserts",
    type: "Dessert",
    price: 189,
    calories: "480 kcal",
    rating: 4.8,
    image: "/images/belgian-chocolate-waffle.jpg",
    description: "Freshly baked crisp golden Belgian waffle drizzled with melted warm dark chocolate and vanilla ice cream.",
    tags: ["dessert", "waffle", "chocolate", "sweet"],
  },
  {
    _id: "food_gulab_jamun",
    name: "Gulab Jamun with Ice Cream",
    category: "Desserts",
    type: "Dessert",
    price: 139,
    calories: "360 kcal",
    rating: 4.7,
    image: "/images/gulab-jamun-ice-cream.jpg",
    description: "Warm royal gulab jamun soaked in saffron cardamom syrup, served with creamy Madagascar vanilla ice cream.",
    tags: ["dessert", "gulab jamun", "indian", "sweet", "ice cream"],
  },

  // --- DRINKS & SHAKES ---
  {
    _id: "food_7up_can",
    name: "7UP Chilled Can",
    category: "Drinks",
    type: "Drink",
    price: 69,
    calories: "140 kcal",
    rating: 4.7,
    image: "https://cdn.uengage.io/uploads/28289/image-BI8MTR-1769876746.png",
    description: "Crisp, bubbly lemon-lime 7UP served ice-cold with fresh lemon slice.",
    tags: ["7up", "drink", "soda", "cold", "refreshing", "budget"],
  },
  {
    _id: "food_belgian_shake",
    name: "Belgian Chocolate Milkshake",
    category: "Drinks",
    type: "Drink",
    price: 159,
    calories: "450 kcal",
    rating: 4.9,
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj2UnheFNELLPYzkIYeFchtESJ1eKE-yhEYBAx-1T7BjEOcJ-WblOu708&s=10",
    description: "Rich, velvety shake crafted from premium melted Belgian dark chocolate and Madagascar vanilla ice cream.",
    tags: ["shake", "chocolate", "milkshake", "sweet", "drink", "bestseller"],
  },
  {
    _id: "food_blueberry_mojito",
    name: "Blueberry Mojito",
    category: "Drinks",
    type: "Drink",
    price: 129,
    calories: "180 kcal",
    rating: 4.8,
    image: "https://cdn.apartmenttherapy.info/image/upload/v1714407545/k/Photo/Recipes/2024-04-blueberry-mojito/blueberry-mojito-530_1.jpg",
    description: "Hand-muddled wild blueberries, fresh garden mint, zesty lime wedges, and sparkling club soda over crushed ice.",
    tags: ["mojito", "blueberry", "mocktail", "cold", "refreshing", "drink"],
  },
  {
    _id: "food_watermelon_mojito",
    name: "Fresh Watermelon Mojito",
    category: "Drinks",
    type: "Drink",
    price: 139,
    calories: "160 kcal",
    rating: 4.8,
    image: "https://www.watermelon.org/wp-content/uploads/2025/02/Smoky_Mezcal_Watermelon_Mojito_2025-1000x1000.jpg",
    description: "Fresh watermelon juice muddled with garden mint, tangy lime and sparkling soda over crushed ice.",
    tags: ["mojito", "watermelon", "mocktail", "fresh", "refreshing", "drink"],
  },
  {
    _id: "food_kitkat_shake",
    name: "Royal KitKat Shake",
    category: "Drinks",
    type: "Drink",
    price: 169,
    calories: "490 kcal",
    rating: 4.9,
    image: "https://thumbs.dreamstime.com/b/kitkat-chocolate-milkshake-topped-ice-cream-choco-chips-served-glass-jar-over-rustic-wooden-background-refreshing-223998504.jpg",
    description: "Thick gourmet chocolate milkshake blended with crispy KitKat wafers, chocolate fudge, and whipped cream.",
    tags: ["shake", "kitkat", "chocolate", "milkshake", "sweet", "drink"],
  },
  {
    _id: "food_oreo_shake",
    name: "Cookies & Cream Oreo Shake",
    category: "Drinks",
    type: "Drink",
    price: 169,
    calories: "510 kcal",
    rating: 4.9,
    image: "https://www.whiskaffair.com/wp-content/uploads/2020/07/Oreo-Milkshake-2-1.jpg",
    description: "Creamy vanilla bean shake loaded with real crushed Oreo cookies, dark chocolate drizzle, and whipped cream.",
    tags: ["shake", "oreo", "cookies", "milkshake", "sweet", "drink"],
  },
  {
    _id: "food_fresh_lime",
    name: "Fresh Lime Cooler",
    category: "Drinks",
    type: "Drink",
    price: 89,
    calories: "90 kcal",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85",
    description: "Refreshing freshly squeezed lime juice with mint and sparkling soda. Crisp and low calorie.",
    tags: ["lime", "cooler", "soda", "drink", "budget", "low calorie", "refreshing"],
  },
];

const QUICK_PROMPTS = [
  { label: "👑 Royal Signatures", prompt: "What are your top signature dishes and best sellers?" },
  { label: "🍕 Stone-Baked Pizzas", prompt: "Show me your best gourmet stone-baked pizzas!" },
  { label: "🌶️ Fiery Spicy Cravings", prompt: "I am hungry for something fiery and spicy with chicken!" },
  { label: "🥗 Vegetarian Feast", prompt: "Recommend a delicious vegetarian burger, pizza and loaded side" },
  { label: "💰 Meal Under ₹300", prompt: "What can I order for a great meal under ₹300?" },
  { label: "🍔 Feast for 2 (Under ₹500)", prompt: "Give me the best combo for 2 people under ₹500" },
  { label: "🍫 Sweet Tooth & Shakes", prompt: "Pair a rich chocolate dessert with a gourmet thick shake" },
  { label: "🎨 How to Custom Craft?", prompt: "How do I build my own custom burger or pizza in Foodie?" },
];

export const ChefAIAssistant = () => {
  const { addToCart, setIsCartOpen } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState(FOODIE_MENU_DATASET);
  const [inputQuery, setInputQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [addedToast, setAddedToast] = useState("");

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "chef",
      text: "Bonjour & Welcome! I am Chef Gaston, your Royal Foodie Concierge & Sommelier. 👨‍🍳 I have mastered our entire culinary kitchen (Burgers, Stone-Baked Pizzas, Crispy Chicken, Fries, Desserts & Artisan Shakes). Ask me for pairings, spicy cravings, dietary options, or any budget meal!",
      dishes: [
        FOODIE_MENU_DATASET.find((d) => d.name === "Bacon BBQ Burger") || FOODIE_MENU_DATASET[0],
        FOODIE_MENU_DATASET.find((d) => d.name === "Truffle Parmesan Fries") || FOODIE_MENU_DATASET[24],
        FOODIE_MENU_DATASET.find((d) => d.name === "Belgian Chocolate Milkshake") || FOODIE_MENU_DATASET[38],
      ],
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync with live backend database if available
  useEffect(() => {
    fetch(`${API_URL}/api/foods`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const merged = [...FOODIE_MENU_DATASET];
          data.forEach((liveFood) => {
            const idx = merged.findIndex(
              (m) => m.name.toLowerCase() === liveFood.name.toLowerCase()
            );
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...liveFood };
            } else {
              merged.push({
                ...liveFood,
                calories: liveFood.calories || "480 kcal",
                tags: [liveFood.category?.toLowerCase(), liveFood.type?.toLowerCase(), "foodie"],
              });
            }
          });
          setMenuItems(merged);
        }
      })
      .catch((err) => console.warn("Chef AI using embedded master dataset:", err));
  }, []);

  // Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
          handleUserSubmit(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [menuItems]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Text-To-Speech
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[^\w\s.,!?'"₹]/gi, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.02;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.includes("en")) || voices[0];
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Microphone voice recognition is not supported in this browser. You can type in the box below!");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Deep NLP Culinary Reasoning Engine
  const analyzeAndRecommend = (queryText) => {
    const q = queryText.toLowerCase().trim();
    let matchedDishes = [];
    let chefResponse = "";

    // 1. App Feature Inquiries (Customizer, Table booking, tracking, group party)
    if (q.includes("custom") || q.includes("build") || q.includes("craft") || q.includes("studio")) {
      const burger = menuItems.find((d) => d.name.includes("Beef Burger")) || menuItems[0];
      const pizza = menuItems.find((d) => d.name.includes("Four Cheese")) || menuItems[15];
      return {
        text: "You can build your dream burger or pizza in our 🎨 Dish Customizer Studio (/customizer)! Pick artisan brioche buns, smashed patties, truffle glazes, and molten cheeses with live calorie tracking!",
        dishes: [burger, pizza].filter(Boolean),
      };
    }

    if (q.includes("table") || q.includes("reserve") || q.includes("reservation") || q.includes("dine in")) {
      return {
        text: "Looking for an exquisite fine-dining table? You can book your VIP candle-lit table right here under 🍽️ 'Book Table' (/reservation) with instant WhatsApp & SMS confirmation!",
        dishes: [
          menuItems.find((d) => d.name.includes("Cheesecake")) || menuItems[33],
          menuItems.find((d) => d.name.includes("Truffle Mushroom")) || menuItems[20],
        ].filter(Boolean),
      };
    }

    if (q.includes("group") || q.includes("party") || q.includes("split") || q.includes("friends")) {
      return {
        text: "Ordering with friends? Click 👥 'Group Feast' in the top navbar to launch a shared ordering room with live 3-second multi-cart sync and automated equal or itemized bill splitting!",
        dishes: [
          menuItems.find((d) => d.name.includes("Loaded Fries")) || menuItems[21],
          menuItems.find((d) => d.name.includes("Wings")) || menuItems[27],
          menuItems.find((d) => d.name.includes("Pizza")) || menuItems[17],
        ].filter(Boolean),
      };
    }

    // 2. Greetings
    if (/^(hi|hello|hey|greetings|bonjour|namaste|good\s*(morning|afternoon|evening))\b/i.test(q)) {
      matchedDishes = [
        menuItems.find((d) => d.name.includes("Bacon BBQ") || d.name.includes("Beef Burger")) || menuItems[0],
        menuItems.find((d) => d.name.includes("Truffle") || d.name.includes("Loaded")) || menuItems[21],
        menuItems.find((d) => d.name.includes("Mojito") || d.name.includes("Shake")) || menuItems[39],
      ];
      return {
        text: "Greetings, royal patron! 👑 I am Chef Gaston, here to orchestrate your feast. What are your taste buds yearning for today?",
        dishes: matchedDishes.filter(Boolean),
      };
    }

    // 3. Multi-Person Feasts (e.g. "for 2", "for two", "couple", "for 4", "family")
    if (q.includes("for 2") || q.includes("for two") || q.includes("couple")) {
      const burger = menuItems.find((d) => d.name.includes("Chicken Burger")) || menuItems[1];
      const pizza = menuItems.find((d) => d.name.includes("Margherita") || d.name.includes("Farmhouse")) || menuItems[14];
      const fries = menuItems.find((d) => d.name.includes("Loaded") || d.name.includes("Peri Peri")) || menuItems[21];
      const drink = menuItems.find((d) => d.name.includes("Mojito") || d.name.includes("7UP")) || menuItems[39];
      matchedDishes = [burger, pizza, fries, drink].filter(Boolean).slice(0, 3);
      const totalCost = matchedDishes.reduce((s, i) => s + (i?.price || 0), 0);
      return {
        text: `Here is my signature Double Feast for 2! Includes mains, crispy sides, and sparkling refreshers for just ₹${totalCost}:`,
        dishes: matchedDishes,
      };
    }

    if (q.includes("for 4") || q.includes("for four") || q.includes("family") || q.includes("party")) {
      const p1 = menuItems.find((d) => d.name.includes("BBQ Chicken Pizza") || d.name.includes("Four Cheese")) || menuItems[17];
      const b1 = menuItems.find((d) => d.name.includes("Bacon BBQ") || d.name.includes("Crispy Chicken")) || menuItems[11];
      const w1 = menuItems.find((d) => d.name.includes("Wings") || d.name.includes("Loaded")) || menuItems[27];
      matchedDishes = [p1, b1, w1].filter(Boolean);
      return {
        text: "Here is our Grand Royal Party Platter! Perfectly crafted to satisfy 4 hungry foodies with pizzas, burgers, and glazed wings:",
        dishes: matchedDishes,
      };
    }

    // 4. Budget Matching (e.g., "under 300", "under 500", "under 200", "under 100")
    let maxBudget = null;
    const budgetMatch = q.match(/under\s*(?:₹|rs\.?|inr)?\s*(\d+)/i) || q.match(/(\d+)\s*(?:₹|rs\.?|rupees|budget)/i);
    if (budgetMatch) {
      maxBudget = parseInt(budgetMatch[1], 10);
    }

    // 5. Category-Specific Filters
    if (q.includes("pizza") || q.includes("pizzas")) {
      matchedDishes = menuItems.filter((d) => d.category.toLowerCase().includes("pizza")).slice(0, 3);
      chefResponse = "Here are our hand-tossed, stone-baked artisan pizzas:";
    } else if (q.includes("burger") || q.includes("burgers")) {
      matchedDishes = menuItems.filter((d) => d.category.toLowerCase().includes("burger")).slice(0, 3);
      chefResponse = "Here are our flame-grilled signature gourmet burgers:";
    } else if (q.includes("wing") || q.includes("wings") || q.includes("nugget") || q.includes("fried chicken") || q.includes("crispy chicken")) {
      matchedDishes = menuItems.filter((d) => d.category === "Crispy Chicken" || d.name.includes("Wings") || d.name.includes("Chicken")).slice(0, 3);
      chefResponse = "Golden, crunchy buttermilk-marinated fried chicken and glazed wings:";
    } else if (q.includes("sandwich") || q.includes("panini") || q.includes("toast")) {
      matchedDishes = menuItems.filter((d) => d.category === "Sandwiches" || d.name.includes("Sandwich") || d.name.includes("Panini")).slice(0, 3);
      chefResponse = "Toasted artisan sandwiches and cheesy Italian paninis:";
    } else if (q.includes("dessert") || q.includes("sweet") || q.includes("cake") || q.includes("waffle") || q.includes("kunafah") || q.includes("tiramisu") || q.includes("lava") || q.includes("cheesecake")) {
      matchedDishes = menuItems.filter((d) => d.category === "Desserts" || d.tags.includes("sweet")).slice(0, 3);
      chefResponse = "Indulgent royal desserts and sweet master chef creations:";
    } else if (q.includes("drink") || q.includes("shake") || q.includes("beverage") || q.includes("mojito") || q.includes("cooler") || q.includes("juice") || q.includes("7up") || q.includes("soda")) {
      matchedDishes = menuItems.filter((d) => d.category === "Drinks" || d.tags.includes("drink")).slice(0, 3);
      chefResponse = "Chilled artisan milkshakes, fruit coolers, and sparkling sodas:";
    } else if (q.includes("fries") || q.includes("loaded") || q.includes("sides")) {
      matchedDishes = menuItems.filter((d) => d.category === "Fries" || d.name.includes("Fries")).slice(0, 3);
      chefResponse = "Crispy golden french fries drenched in cheese and seasonings:";
    } else if (q.includes("spicy") || q.includes("fiery") || q.includes("hot") || q.includes("peri peri") || q.includes("jalapeno") || q.includes("tikka")) {
      matchedDishes = menuItems.filter((d) =>
        d.tags.includes("spicy") || d.name.includes("Peri Peri") || d.name.includes("Jalapeño") || d.name.includes("Tikka")
      ).slice(0, 3);
      chefResponse = "For that fiery, mouth-watering heat, here are our top spicy dishes:";
    } else if (q.includes("veg") || q.includes("vegetarian") || q.includes("paneer") || q.includes("mushroom") || q.includes("plant")) {
      matchedDishes = menuItems.filter((d) => d.type === "Veg" || d.category.includes("Veg")).slice(0, 3);
      chefResponse = "Prepared with garden-fresh produce, tandoori paneer, and imported cheeses:";
    } else if (q.includes("chicken") || q.includes("meat") || q.includes("beef") || q.includes("bacon") || q.includes("non veg") || q.includes("non-veg")) {
      matchedDishes = menuItems.filter((d) => d.type === "Non-Veg" || d.type === "Chicken").slice(0, 3);
      chefResponse = "Tender, protein-rich gourmet meat and buttermilk poultry selections:";
    } else if (q.includes("best") || q.includes("popular") || q.includes("signature") || q.includes("famous") || q.includes("top")) {
      matchedDishes = menuItems.filter((d) => d.tags.includes("bestseller") || d.rating >= 4.9).slice(0, 3);
      chefResponse = "Here are our crown jewels! Voted #1 by food connoisseurs for exceptional taste:";
    } else {
      // General Semantic search across tags, description, name, category
      const words = q.split(" ").filter((w) => w.length > 2);
      matchedDishes = menuItems.filter((dish) => {
        const fullText = `${dish.name} ${dish.category} ${dish.description} ${dish.tags.join(" ")}`.toLowerCase();
        return words.some((w) => fullText.includes(w));
      });

      if (matchedDishes.length === 0) {
        matchedDishes = menuItems.slice(0, 3);
      }
      chefResponse = `I have handcrafted this curated culinary selection for you:`;
    }

    // Apply budget constraint if specified
    if (maxBudget) {
      const withinBudget = matchedDishes.filter((d) => d.price <= maxBudget);
      if (withinBudget.length > 0) {
        matchedDishes = withinBudget.slice(0, 3);
      } else {
        matchedDishes = menuItems.filter((d) => d.price <= maxBudget).slice(0, 3);
      }
      chefResponse = `Here are our finest selections completely under your budget of ₹${maxBudget}:`;
    }

    return {
      text: chefResponse,
      dishes: matchedDishes.slice(0, 3),
    };
  };

  const handleUserSubmit = (userText) => {
    const clean = userText.trim();
    if (!clean) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: clean,
      dishes: [],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      const result = analyzeAndRecommend(clean);
      const chefMessage = {
        id: Date.now() + 1,
        sender: "chef",
        text: result.text,
        dishes: result.dishes,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, chefMessage]);
      setIsTyping(false);
    }, 650);
  };

  const handleDishAddToCart = (dish) => {
    addToCart(
      {
        _id: dish._id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        category: dish.category,
      },
      1
    );
    setAddedToast(`Added ${dish.name} to Cart!`);
    setTimeout(() => setAddedToast(""), 2500);
  };

  return (
    <div className="chef-ai-widget-wrapper">
      {/* Added Toast */}
      {addedToast && (
        <div className="chef-added-toast">
          <span>✓ {addedToast}</span>
        </div>
      )}

      {/* Floating Concierge Orb Button */}
      {!isOpen && (
        <button
          className="chef-ai-floating-trigger"
          onClick={() => setIsOpen(true)}
          title="Open Smart Chef AI Voice Concierge"
          aria-label="Open Chef AI Concierge"
        >
          <div className="chef-orb-glow"></div>
          <span className="chef-orb-icon">👨‍🍳</span>
          <div className="chef-orb-text">
            <strong>Ask Chef AI</strong>
            <small>Voice & Recommendations</small>
          </div>
          <span className="chef-pulse-radar"></span>
        </button>
      )}

      {/* Main Chef AI Chat Drawer / Modal */}
      {isOpen && (
        <div className="chef-ai-modal-container">
          {/* Header */}
          <div className="chef-ai-header">
            <div className="chef-ai-title-row">
              <div className="chef-ai-avatar">👨‍🍳</div>
              <div>
                <h3 className="chef-ai-name">Chef Gaston AI</h3>
                <span className="chef-ai-status">
                  <span className="chef-online-dot"></span> Royal Master Sommelier
                </span>
              </div>
            </div>

            <div className="chef-ai-header-actions">
              <button
                className="chef-clear-btn"
                onClick={() =>
                  setMessages([
                    {
                      id: Date.now(),
                      sender: "chef",
                      text: "Greetings! How may I delight your palate today? Ask for pairings, spicy cravings, dietary options, or any budget meal!",
                      dishes: [
                        FOODIE_MENU_DATASET.find((d) => d.name === "Crispy Chicken Loaded Fries") || FOODIE_MENU_DATASET[21],
                        FOODIE_MENU_DATASET.find((d) => d.name === "Blueberry Mojito") || FOODIE_MENU_DATASET[39],
                      ],
                      timestamp: new Date(),
                    },
                  ])
                }
                title="Restart Chat"
              >
                🔄
              </button>
              <button
                className="chef-close-btn"
                onClick={() => {
                  setIsOpen(false);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="chef-ai-messages-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chef-chat-row ${msg.sender === "chef" ? "chef-row" : "user-row"}`}
              >
                {msg.sender === "chef" && <div className="chef-msg-avatar">👑</div>}

                <div className={`chef-chat-bubble ${msg.sender === "chef" ? "chef-bubble" : "user-bubble"}`}>
                  <div className="bubble-text-row">
                    <p className="bubble-text">{msg.text}</p>
                    {msg.sender === "chef" && (
                      <button
                        className={`chef-speak-btn ${isSpeaking ? "speaking" : ""}`}
                        onClick={() => speakText(msg.text)}
                        title="Read out loud with Chef's voice"
                      >
                        {isSpeaking ? "🔊 Stop" : "🔈 Voice"}
                      </button>
                    )}
                  </div>

                  {/* Recommended Dishes Cards */}
                  {msg.dishes && msg.dishes.length > 0 && (
                    <div className="chef-recommended-dishes-grid">
                      {msg.dishes.map((dish) => (
                        <div key={dish._id || dish.name} className="chef-dish-card">
                          <img
                            src={dish.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80"}
                            alt={dish.name}
                            className="chef-dish-img"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80";
                            }}
                          />
                          <div className="chef-dish-details">
                            <div className="chef-dish-header-row">
                              <strong className="chef-dish-title">{dish.name}</strong>
                              <span className={`dish-diet-tag ${dish.type === "Veg" ? "veg" : "non-veg"}`}>
                                {dish.type === "Veg" ? "🟢" : "🔴"}
                              </span>
                            </div>
                            <div className="chef-dish-meta-line">
                              <span className="chef-dish-price">₹{dish.price}</span>
                              {dish.calories && <span className="chef-dish-cal">{dish.calories}</span>}
                              <span className="chef-dish-tag">{dish.category}</span>
                            </div>
                            <button
                              className="chef-add-cart-btn"
                              onClick={() => handleDishAddToCart(dish)}
                              title={`Add ${dish.name} to Cart for ₹${dish.price}`}
                            >
                              + Add to Cart 🛒
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="bubble-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chef-chat-row chef-row">
                <div className="chef-msg-avatar">👑</div>
                <div className="chef-chat-bubble chef-bubble chef-typing-bubble">
                  <div className="chef-typing-indicator-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <small>Chef Gaston is curating pairings...</small>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="chef-quick-prompts-bar">
            {QUICK_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                className="chef-quick-chip"
                onClick={() => handleUserSubmit(item.prompt)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Input & Voice Controls */}
          <form
            className="chef-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleUserSubmit(inputQuery);
            }}
          >
            <button
              type="button"
              className={`chef-mic-btn ${isListening ? "listening" : ""}`}
              onClick={toggleMic}
              title={isListening ? "Listening... Tap to stop" : "Tap to speak with voice"}
            >
              {isListening ? "🎙️" : "🎤"}
            </button>

            <input
              type="text"
              className="chef-text-input"
              placeholder="Ask for spicy chicken, budget under ₹300, pizzas..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
            />

            <button type="submit" className="chef-send-btn" disabled={!inputQuery.trim()}>
              Send ➔
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
