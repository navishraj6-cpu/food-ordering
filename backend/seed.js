require("dotenv").config();
const dns = require("dns");

// Set reliable DNS servers (Google & Cloudflare IPv6 + IPv4) to prevent SRV ETIMEOUT/ECONNREFUSED on Windows
try {
  dns.setServers([
    "2001:4860:4860::8888",
    "2001:4860:4860::8844",
    "2606:4700:4700::1111",
    "8.8.8.8",
    "1.1.1.1",
  ]);
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  console.warn("Could not configure custom DNS servers:", e.message);
}

const mongoose = require("mongoose");
const Food = require("./models/food");
const User = require("./models/User");

const foods = [
  {
    "name": "Classic Beef Burger",
    "category": "Burgers",
    "type": "Non-Veg",
    "price": 199,
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",
    "description": "Juicy beef patty with fresh vegetables and signature sauce."
  },
  {
    "name": "Classic Chicken Burger",
    "category": "Burgers",
    "type": "Non-Veg",
    "price": 179,
    "image": "https://images.unsplash.com/photo-1615297928064-24977384d0da?auto=format&fit=crop&w=900&q=85",
    "description": "Tender chicken patty with fresh lettuce and creamy sauce."
  },
  {
    "name": "Plant-Based Meat Burger",
    "category": "Veg Burgers",
    "type": "Veg",
    "price": 219,
    "image": "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?auto=format&fit=crop&w=900&q=85",
    "description": "Plant-based patty with fresh greens and signature sauce."
  },
  {
    "name": "Paneer Tikka Burger",
    "category": "Veg Burgers",
    "type": "Veg",
    "price": 199,
    "image": "/images/paneer-tikka-burger.jpg",
    "description": "Spicy paneer tikka with fresh vegetables in a soft bun."
  },
  {
    "name": "Crispy Paneer Burger",
    "category": "Veg Burgers",
    "type": "Veg",
    "price": 189,
    "image": "https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=900&q=85",
    "description": "Crispy paneer patty with fresh vegetables and creamy sauce."
  },
  {
    "name": "Mushroom & Swiss Veggie Burger",
    "category": "Veg Burgers",
    "type": "Veg",
    "price": 209,
    "image": "https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&w=900&q=85",
    "description": "Mushroom veggie patty with Swiss-style cheese."
  },
  {
    "name": "Portobello Mushroom Burger",
    "category": "Veg Burgers",
    "type": "Veg",
    "price": 199,
    "image": "https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?auto=format&fit=crop&w=900&q=85",
    "description": "Grilled portobello mushroom with fresh greens and sauce."
  },
  {
    "name": "Classic Vegetarian Burger",
    "category": "Veg Burgers",
    "type": "Veg",
    "price": 159,
    "image": "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=900&q=85",
    "description": "Fresh vegetarian patty with crisp vegetables and sauce."
  },
  {
    "name": "California Burger",
    "category": "Burgers",
    "type": "Non-Veg",
    "price": 239,
    "image": "https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=85",
    "description": "Fresh California-style burger with creamy avocado and salad."
  },
  {
    "name": "Jalapeño Popper Burger",
    "category": "Burgers",
    "type": "Non-Veg",
    "price": 249,
    "image": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=85",
    "description": "Spicy jalapeños, creamy cheese and a juicy beef patty."
  },
  {
    "name": "Patty Melt",
    "category": "Burgers",
    "type": "Non-Veg",
    "price": 239,
    "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=900&q=85",
    "description": "Juicy beef patty with caramelized onions and melted cheese."
  },
  {
    "name": "Bacon BBQ Burger",
    "category": "Burgers",
    "type": "Non-Veg",
    "price": 249,
    "image": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=900&q=85",
    "description": "Smoky BBQ burger topped with crispy bacon and cheese."
  },
  {
    "name": "Smash Burger",
    "category": "Burgers",
    "type": "Non-Veg",
    "price": 229,
    "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85",
    "description": "Crispy-edged smashed beef patty with melted cheese."
  },
  {
    "name": "Hamburger / Cheeseburger",
    "category": "Burgers",
    "type": "Non-Veg",
    "price": 219,
    "image": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=900&q=85",
    "description": "Classic cheeseburger with a juicy patty and melted cheese."
  },
  {
    "name": "Fish Burger",
    "category": "Burgers",
    "type": "Non-Veg",
    "price": 189,
    "image": "/images/fish-burger.jpg",
    "description": "Crispy golden fried fish fillet burger with creamy tartar sauce, tangy pickles and fresh slaw in a toasted brioche bun."
  },
  {
    "name": "7UP Chilled Can",
    "category": "Drinks",
    "type": "Drink",
    "price": 69,
    "image": "https://cdn.uengage.io/uploads/28289/image-BI8MTR-1769876746.png",
    "description": "Crisp, bubbly lemon-lime 7UP served ice-cold with fresh lemon slice."
  },
  {
    "name": "Fresh Watermelon Mojito",
    "category": "Drinks",
    "type": "Mojito",
    "price": 139,
    "image": "https://www.watermelon.org/wp-content/uploads/2025/02/Smoky_Mezcal_Watermelon_Mojito_2025-1000x1000.jpg",
    "description": "Refreshing fresh watermelon juice muddled with garden mint, tangy lime and sparkling soda over crushed ice."
  },
  {
    "name": "Royal KitKat Shake",
    "category": "Drinks",
    "type": "Milkshake",
    "price": 169,
    "image": "https://thumbs.dreamstime.com/b/kitkat-chocolate-milkshake-topped-ice-cream-choco-chips-served-glass-jar-over-rustic-wooden-background-refreshing-223998504.jpg",
    "description": "Thick gourmet chocolate milkshake blended with crispy KitKat wafers, chocolate fudge, and whipped cream."
  },
  {
    "name": "Cookies & Cream Oreo Shake",
    "category": "Drinks",
    "type": "Milkshake",
    "price": 169,
    "image": "https://www.whiskaffair.com/wp-content/uploads/2020/07/Oreo-Milkshake-2-1.jpg",
    "description": "Creamy vanilla bean shake loaded with real crushed Oreo cookies, dark chocolate drizzle, and whipped cream."
  },
  {
    "name": "Coca-Cola",
    "category": "Drinks",
    "type": "Drink",
    "price": 79,
    "image": "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=900&q=85",
    "description": "Chilled Coca-Cola served ice cold."
  },
  {
    "name": "Fresh Lime Cooler",
    "category": "Drinks",
    "type": "Cooler",
    "price": 89,
    "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=85",
    "description": "Refreshing freshly squeezed lime juice with mint and sparkling soda."
  },
  {
    "name": "Blueberry Mojito",
    "category": "Drinks",
    "type": "Mojito",
    "price": 129,
    "image": "https://cdn.apartmenttherapy.info/image/upload/v1714407545/k/Photo/Recipes/2024-04-blueberry-mojito/blueberry-mojito-530_1.jpg",
    "description": "Refreshing blueberry mojito with fresh berries and aromatic mint."
  },
  {
    "name": "Vanilla Bean Milkshake",
    "category": "Drinks",
    "type": "Milkshake",
    "price": 149,
    "image": "https://wholefoodsoulfoodkitchen.com/wp-content/uploads/2023/07/vanilla-milkshake-without-ice-cream-1.jpg",
    "description": "Creamy Madagascar vanilla bean milkshake topped with luscious whipped cream."
  },
  {
    "name": "Fresh Strawberry Milkshake",
    "category": "Drinks",
    "type": "Milkshake",
    "price": 159,
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkWwrviFZNq2sSbLVvZtsygZgxPG4qIJuRLyyxZ0j2yw&s=10",
    "description": "Refreshing milkshake made with real farm strawberries, thick ice cream and strawberry glaze."
  },
  {
    "name": "Belgian Chocolate Milkshake",
    "category": "Drinks",
    "type": "Milkshake",
    "price": 159,
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRj2UnheFNELLPYzkIYeFchtESJ1eKE-yhEYBAx-1T7BjEOcJ-WblOu708&s=10",
    "description": "Rich and thick Belgian chocolate milkshake topped with chocolate drizzle and curls."
  },
  {
    "name": "Signature Hot Chocolate",
    "category": "Drinks",
    "type": "Hot Beverage",
    "price": 139,
    "image": "https://www.starbucksathome.com/gb/sites/default/files/2023-02/Starbucks_SBU_Signature%20Chocolate%20Recipes%202022_Website%20Recipe_KV_Classic%20Signature%20Chocolate_LS.png",
    "description": "Warm, thick and velvety European hot chocolate topped with fluffy marshmallows."
  },
  {
    "name": "Orange Mint Mojito",
    "category": "Drinks",
    "type": "Mojito",
    "price": 119,
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvru0q_MgQRGqQ3nVg2M6KcqUxcdZRg_lVViOCgXIb0isJHWFAxB4ypeA&s=10",
    "description": "Refreshing orange mojito with fresh citrus juice and crushed mint."
  },
  {
    "name": "New York Cheesecake",
    "category": "Desserts",
    "type": "Cheesecake",
    "price": 199,
    "image": "/images/new-york-cheesecake.jpg",
    "description": "Rich, velvety classic New York baked cheesecake on a buttery crumbly crust."
  },
  {
    "name": "Classic Italian Tiramisu",
    "category": "Desserts",
    "type": "Tiramisu",
    "price": 219,
    "image": "/images/classic-italian-tiramisu.jpg",
    "description": "Traditional Italian dessert with espresso-dipped ladyfingers and whipped mascarpone cream."
  },
  {
    "name": "Caramel Custard Pudding",
    "category": "Desserts",
    "type": "Pudding",
    "price": 159,
    "image": "/images/caramel-custard-pudding.jpg",
    "description": "Silky-smooth vanilla custard pudding with rich caramel glaze."
  },
  {
    "name": "Belgian Chocolate Waffle",
    "category": "Desserts",
    "type": "Waffle",
    "price": 189,
    "image": "/images/belgian-chocolate-waffle.jpg",
    "description": "Freshly baked crisp golden Belgian waffle drizzled with melted warm chocolate and ice cream."
  },
  {
    "name": "Royal Cheese Kunafah",
    "category": "Desserts",
    "type": "Kunafah",
    "price": 249,
    "image": "/images/royal-cheese-kunafah.jpg",
    "description": "Authentic Middle Eastern crispy shredded phyllo stuffed with stretchy cheese, soaked in rose sugar syrup and pistachios."
  },
  {
    "name": "Choco Lava Cake",
    "category": "Desserts",
    "type": "Dessert",
    "price": 110,
    "image": "/images/choco-lava-cake.jpg",
    "description": "Warm chocolate cake with a molten chocolate centre."
  },
  {
    "name": "Crinkle-Top Brownie",
    "category": "Desserts",
    "type": "Dessert",
    "price": 129,
    "image": "/images/crinkle-top-brownie.jpg",
    "description": "Rich chocolate brownie with a beautiful crinkle top."
  },
  {
    "name": "Sticky Toffee Pudding",
    "category": "Desserts",
    "type": "Dessert",
    "price": 149,
    "image": "https://addictedtodates.com/wp-content/uploads/2024/11/the-best-vegan-stciky-toffee-pudding.jpg",
    "description": "Warm sticky toffee pudding with rich caramel flavour."
  },
  {
    "name": "Gulab Jamun with Ice Cream",
    "category": "Desserts",
    "type": "Indian Dessert",
    "price": 139,
    "image": "/images/gulab-jamun-ice-cream.jpg",
    "description": "Warm gulab jamun served with creamy ice cream."
  },
  {
    "name": "Sizzling Brownie",
    "category": "Desserts",
    "type": "Hot Dessert",
    "price": 229,
    "image": "/images/sizzling-brownie.jpg",
    "description": "Hot sizzling brownie served with rich melted fudge topping."
  },
  {
    "name": "Farmhouse Veg Pizza",
    "category": "Veg Pizza",
    "type": "Veg",
    "price": 269,
    "image": "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85",
    "description": "A delicious combination of fresh vegetables, herbs and cheese."
  },

  {
    "name": "BBQ Chicken Pizza",
    "category": "Pizza",
    "type": "Chicken",
    "price": 299,
    "image": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=85",
    "description": "Smoky BBQ chicken, cheese and fresh toppings."
  },
  {
    "name": "Chicken Alfredo Pizza",
    "category": "Pizza",
    "type": "Chicken",
    "price": 319,
    "image": "https://therecipecritic.com/wp-content/uploads/2022/09/chickenalfredopizza-1.jpg",
    "description": "Rich creamy Alfredo sauce topped with tender chicken, mozzarella and Italian herbs."
  },
  {
    "name": "Chicken Bacon Ranch Pizza",
    "category": "Pizza",
    "type": "Chicken",
    "price": 329,
    "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85",
    "description": "Chicken, crispy bacon and creamy ranch-style topping."
  },

  {
    "name": "Chicken Tikka Pizza",
    "category": "Pizza",
    "type": "Chicken",
    "price": 309,
    "image": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=85",
    "description": "Indian-style chicken tikka with cheese and fresh toppings."
  },
  {
    "name": "Peri Peri Chicken Pizza",
    "category": "Pizza",
    "type": "Chicken",
    "price": 319,
    "image": "https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?auto=format&fit=crop&w=900&q=85",
    "description": "Spicy peri peri chicken with cheese and peppers."
  },
  {
    "name": "Butter Chicken Pizza",
    "category": "Pizza",
    "type": "Chicken",
    "price": 329,
    "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85",
    "description": "Creamy butter chicken flavours combined with pizza."
  },
  {
    "name": "Classic Veg Pizza",
    "category": "Veg Pizza",
    "type": "Veg",
    "price": 249,
    "image": "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?auto=format&fit=crop&w=900&q=85",
    "description": "Fresh vegetables, herbs and melted cheese on a crispy pizza base."
  },
  {
    "name": "Paneer Tikka Pizza",
    "category": "Veg Pizza",
    "type": "Veg",
    "price": 279,
    "image": "https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=900&q=85",
    "description": "Spicy paneer tikka, onions, peppers and melted cheese."
  },
  {
    "name": "Mushroom & Cheese Pizza",
    "category": "Veg Pizza",
    "type": "Veg",
    "price": 279,
    "image": "https://images.unsplash.com/photo-1574126154517-d1e0d89ef734?auto=format&fit=crop&w=900&q=85",
    "description": "Juicy mushrooms with creamy cheese and fresh herbs."
  },
  {
    "name": "Peri Peri Veg Pizza",
    "category": "Veg Pizza",
    "type": "Veg",
    "price": 289,
    "image": "https://images.unsplash.com/photo-1576458088443-04a19bb13da6?auto=format&fit=crop&w=900&q=85",
    "description": "Fresh vegetables with spicy peri peri seasoning and cheese."
  },
  {
    "name": "Margherita Supreme Pizza",
    "category": "Veg Pizza",
    "type": "Veg",
    "price": 239,
    "image": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=900&q=85",
    "description": "Classic Italian crust layered with San Marzano sauce, fresh basil and melted mozzarella."
  },
  {
    "name": "Four Cheese Gourmet Pizza",
    "category": "Veg Pizza",
    "type": "Veg",
    "price": 319,
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85",
    "description": "A decadent blend of mozzarella, cheddar, gouda, and parmesan cheese."
  },
  {
    "name": "Corn & Jalapeño Fiesta Pizza",
    "category": "Veg Pizza",
    "type": "Veg",
    "price": 259,
    "image": "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=85",
    "description": "Sweet golden American corn, tangy jalapeños, and gooey mozzarella cheese."
  },
  {
    "name": "Truffle Mushroom Veg Pizza",
    "category": "Veg Pizza",
    "type": "Veg",
    "price": 329,
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=900&q=85",
    "description": "Sautéed button and portobello mushrooms infused with aromatic truffle oil and fresh herbs."
  },
  {
    "name": "Classic Salted French Fries",
    "category": "Fries",
    "type": "Classic",
    "price": 99,
    "image": "https://myfoodstory.com/wp-content/uploads/2022/04/Perfect-French-Fries-1.jpg",
    "description": "Crispy golden salted French fries served piping hot with signature garlic dip."
  },
  {
    "name": "Peri Peri French Fries",
    "category": "Fries",
    "type": "Spicy",
    "price": 129,
    "image": "https://t4.ftcdn.net/jpg/05/83/50/87/360_F_583508701_M4LdsNAnwZPcXJJsZzYJb9lnWn2gdoCo.jpg",
    "description": "Crispy golden fries tossed in fiery African peri peri spice blend."
  },
  {
    "name": "Cheesy Cheddar Fries",
    "category": "Fries",
    "type": "Veg",
    "price": 149,
    "image": "https://www.cookwithnabeela.com/wp-content/uploads/2024/05/CheeseFries.webp",
    "description": "Crispy fries smothered in rich creamy warm melted cheddar cheese and herbs."
  },
  {
    "name": "Crispy Chicken Loaded Fries",
    "category": "Fries",
    "type": "Non-Veg",
    "price": 189,
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNzXxN0WXjXxJNhT9XP3d_WgyKeU3ecvvP3wDv564gws-IwWiKcMimPe4&s=10",
    "description": "Crispy golden fries loaded with tender seasoned chicken chunks, melted cheese sauce, jalapeños, and savory BBQ drizzle."
  },
  {
    "name": "Truffle Parmesan Fries",
    "category": "Fries",
    "type": "Gourmet",
    "price": 169,
    "image": "https://cdn.shopify.com/s/files/1/0024/4137/9915/files/our-place-recipe-steps-truffle-parmesan-french-fries_1000x.jpg?v=1758653412",
    "description": "Crispy French fries tossed with aromatic black truffle oil, aged parmesan, and fresh herbs."
  },
  {
    "name": "Classic Golden Crispy Chicken",
    "category": "Crispy Chicken",
    "type": "Crispy Chicken",
    "price": 249,
    "image": "/images/classic-crispy-chicken.jpg",
    "description": "Crispy, golden-fried chicken seasoned with our signature 11-spice herb blend."
  },
  {
    "name": "Peri Peri Crispy Chicken",
    "category": "Crispy Chicken",
    "type": "Crispy Chicken",
    "price": 269,
    "image": "/images/peri-peri-crispy-chicken.jpg",
    "description": "Crispy chicken tossed in fiery African bird's eye chili peri peri seasoning."
  },
  {
    "name": "Smoky BBQ Glazed Crispy Chicken",
    "category": "Crispy Chicken",
    "type": "Crispy Chicken",
    "price": 279,
    "image": "/images/bbq-crispy-chicken.jpg",
    "description": "Crunchy fried chicken coated in rich, sweet and smoky hickory BBQ glaze."
  },
  {
    "name": "Korean Sweet & Spicy Crispy Chicken",
    "category": "Crispy Chicken",
    "type": "Crispy Chicken",
    "price": 289,
    "image": "/images/korean-crispy-chicken.jpg",
    "description": "Double-crunch crispy chicken tossed in authentic gochujang sweet-spicy glaze with sesame."
  },
  {
    "name": "Cheesy Jalapeño Crispy Chicken",
    "category": "Crispy Chicken",
    "type": "Crispy Chicken",
    "price": 299,
    "image": "/images/cheesy-jalapeno-crispy-chicken.jpg",
    "description": "Crispy chicken smothered in warm melted cheddar cheese sauce and sliced jalapeños."
  },
  {
    "name": "Hot Buffalo Chicken Wings",
    "category": "Crispy Chicken",
    "type": "Wings & Nuggets",
    "price": 229,
    "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSA3HH0D6-FDLXtot9Og9ujhoVe2E0Tqnssfioem4SRhA&s=10",
    "description": "Crisp, juicy fried chicken wings glazed in spicy tangy buffalo pepper sauce."
  },
  {
    "name": "Smoky BBQ Glazed Wings",
    "category": "Crispy Chicken",
    "type": "Wings & Nuggets",
    "price": 239,
    "image": "/images/bbq-chicken-wings.jpg",
    "description": "Slow-glazed crispy chicken wings tossed in thick honey BBQ sauce."
  },
  {
    "name": "Golden Crunchy Chicken Nuggets",
    "category": "Crispy Chicken",
    "type": "Wings & Nuggets",
    "price": 179,
    "image": "/images/crispy-chicken-nuggets.jpg",
    "description": "Bite-sized tender chicken nuggets fried to crispy perfection served with dip."
  },
  {
    "name": "Cheesy Stuffed Chicken Nuggets",
    "category": "Crispy Chicken",
    "type": "Wings & Nuggets",
    "price": 199,
    "image": "/images/cheesy-chicken-nuggets.jpg",
    "description": "Crispy chicken nuggets stuffed with gooey melted mozzarella cheese."
  },
  {
    "name": "Classic Grilled Veg Cheese Sandwich",
    "category": "Sandwiches",
    "type": "Veg",
    "price": 149,
    "image": "/images/veg-cheese-sandwich.jpg",
    "description": "Crisp golden toast packed with sliced cucumbers, tomatoes, bell peppers and melted cheese."
  },
  {
    "name": "Bombay Masala Toast Sandwich",
    "category": "Sandwiches",
    "type": "Veg",
    "price": 139,
    "image": "/images/bombay-masala-toast.jpg",
    "description": "Spiced potato masala, crunchy onions, and fresh mint chutney toasted to perfection."
  },
  {
    "name": "Paneer Tikka Grilled Sandwich",
    "category": "Sandwiches",
    "type": "Veg",
    "price": 179,
    "image": "/images/paneer-tikka-sandwich.jpg",
    "description": "Tender paneer cubes marinated in tandoori spices layered with onions, capsicum and cheese."
  },
  {
    "name": "Corn & Spinach Delight Sandwich",
    "category": "Sandwiches",
    "type": "Veg",
    "price": 159,
    "image": "/images/corn-spinach-sandwich.jpg",
    "description": "Creamy sweet corn and tender spinach sautéed in white cheese sauce between toasted bread."
  },
  {
    "name": "Garden Veggie Triple Club Sandwich",
    "category": "Sandwiches",
    "type": "Veg",
    "price": 189,
    "image": "/images/garden-veggie-triple-club-sandwich.jpg",
    "description": "Three-tiered toasted club sandwich stacked with fresh crisp greens, avocado, sliced cucumbers, roasted peppers and cheese."
  },
  {
    "name": "Mushroom & Mozzarella Panini",
    "category": "Sandwiches",
    "type": "Veg",
    "price": 179,
    "image": "/images/mushroom-mozzarella-panini.jpg",
    "description": "Herb-sautéed button mushrooms and stretchy melted mozzarella grilled in an Italian crust."
  },
  {
    "name": "Classic Grilled Chicken Club Sandwich",
    "category": "Sandwiches",
    "type": "Non-Veg",
    "price": 199,
    "image": "/images/classic-grilled-chicken-club-sandwich.jpg",
    "description": "Triple-layered toasted bread with seasoned grilled chicken breast, fresh lettuce, tomatoes and melted cheese."
  },
  {
    "name": "Chicken Tikka Spiced Sandwich",
    "category": "Sandwiches",
    "type": "Non-Veg",
    "price": 209,
    "image": "/images/chicken-tikka-sandwich.jpg",
    "description": "Smoky tandoori chicken tikka chunks with mint mayo, sliced red onions and cheese."
  },
  {
    "name": "Crispy Fried Chicken Breast Sandwich",
    "category": "Sandwiches",
    "type": "Non-Veg",
    "price": 219,
    "image": "/images/crispy-chicken-sandwich.jpg",
    "description": "Extra-crispy chicken fillet with creamy mayonnaise and crisp lettuce in toasted bread."
  },
  {
    "name": "Smoky BBQ Pulled Chicken Sandwich",
    "category": "Sandwiches",
    "type": "Non-Veg",
    "price": 229,
    "image": "/images/bbq-pulled-chicken-sandwich.jpg",
    "description": "Tender shredded chicken smothered in smoky BBQ sauce topped with pickled onions."
  },
  {
    "name": "Creamy Chicken Mayo & Herb Sandwich",
    "category": "Sandwiches",
    "type": "Non-Veg",
    "price": 189,
    "image": "/images/chicken-mayo-sandwich.jpg",
    "description": "Tender diced chicken tossed in black pepper, fresh herbs and velvety mayonnaise."
  },
  {
    "name": "Peri Peri Chicken Panini",
    "category": "Sandwiches",
    "type": "Non-Veg",
    "price": 219,
    "image": "/images/peri-peri-chicken-panini.jpg",
    "description": "Spicy peri peri marinated chicken with melted cheddar grilled in toasted artisan bread."
  }
];

async function seedDatabase(attempts = 3) {
  const mongoUri = (process.env.MONGO_URI || "").trim();
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      console.log(`Connecting to MongoDB (attempt ${attempt}/${attempts})...`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 25000,
      });

      console.log("MongoDB connected!");

      // Remove old menu data
      await Food.deleteMany({});

      // Add complete menu
      await Food.insertMany(foods);
      console.log(`${foods.length} food items added successfully!`);

      // Seed demo users if they don't exist
      const demoCustomerEmail = "customer@foodie.com";
      const existingCust = await User.findOne({ email: demoCustomerEmail });
      if (!existingCust) {
        await User.create({
          name: "Alex Johnson",
          email: demoCustomerEmail,
          password: "password123",
          phone: "9876543210",
          role: "user",
          addresses: [
            {
              label: "Home",
              street: "42 Royal Crescent Avenue, Apt 3B",
              city: "Metropolis",
              state: "NY",
              pincode: "10001",
              phone: "9876543210",
              isDefault: true,
            },
          ],
        });
        console.log("Demo customer created: customer@foodie.com / password123");
      }

      const demoAdminEmail = "admin@foodie.com";
      const existingAdmin = await User.findOne({ email: demoAdminEmail });
      if (!existingAdmin) {
        await User.create({
          name: "Chef Gordon (Kitchen Admin)",
          email: demoAdminEmail,
          password: "admin123",
          phone: "9876500000",
          role: "admin",
        });
        console.log("Demo admin created: admin@foodie.com / admin123");
      }

      await mongoose.disconnect().catch(() => { });
      console.log("MongoDB disconnected.");
      return;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      await mongoose.disconnect().catch(() => { });
      if (attempt === attempts) {
        console.error("All seed attempts failed.");
        if (error.message.includes("auth")) {
          console.error("\n[!] AUTHENTICATION ERROR: The username or password in MONGO_URI is incorrect.");
        }
        process.exitCode = 1;
      } else {
        console.log("Waiting 3 seconds before retrying...");
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
}

seedDatabase();