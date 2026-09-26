# 👑 Foodie - Royal Dining & Gourmet Food Ordering Platform

A full-stack, enterprise-grade gourmet food ordering web application built with **React 19**, **Vite**, **Express.js**, and **MongoDB**.

---

## 🌟 Highlights & Key Features

### 1. 🍽️ Gourmet Menu & Smart Discovery
- **78+ Curated Artisan Dishes**: Gourmet Burgers, Stone-Baked Pizzas, Crispy Chicken, Biryanis, Asian Specialties, Pasta, Beverages, and Handcrafted Desserts.
- **Dietary Badges & Filters**: Clear visual green `VEG` and red `NON-VEG` indicator badges on all savory dishes (excluded from sweet desserts and drinks).
- **Fast Search with Autocomplete**: Search dishes by name or category with debounced query suggestions without premature routing.
- **Food Detail Modal**: High-resolution dish photography, spice levels, preparation times, calorie counts, portion sizes, customer reviews, and interactive quantity selectors.

### 2. 🍔 Craft Dish Studio (Custom Burger & Pizza Builder)
- **Interactive Layered Customizer**: Step-by-step custom burger and pizza creation with simple, clear ingredient descriptions (Buns, Patties, Cheeses, Veggies, Sauces, Crusts, and Finishes).
- **Realistic Photography Studio**: Dynamic high-definition photography updates in real-time as you select your ingredients.
- **Artisan Photo Gallery**: Curated browser modal featuring 10+ high-definition presets (Angus Smash, Paneer Tikka, Buttermilk Crispy Chicken, Midnight Charcoal Truffle, Neapolitan Margherita, Truffle White Pizza, etc.).
- **📸 Snapshot Recipe Card**: Generates and downloads a gold-framed high-resolution recipe card PNG including your customized ingredients, price, calories, and kitchen notes.
- **Quick Chef Kitchen Notes**: One-tap quick note chips (*Extra Crispy Patty*, *No Raw Onions*, *Sauce on Side*, *Double Cut*, etc.).

### 3. 🛒 Streamlined Cart & Checkout
- **Sticky Header Cart**: Dedicated cart trigger in the navigation bar with real-time quantity badge and grand total.
- **Cart Drawer**: Fast slide-out cart showing items, quantity controls, delivery fee calculator (with free shipping threshold), GST breakdown, and promo codes.
- **💎 Foodie Gold Coins Loyalty Program**: Earn loyalty points on every order and redeem 100 points for instant ₹10 discounts.
- **🎟️ Promo Code Engine**: One-click coupon application (`FOODIE50`, `ROYAL100`, `FREESHIP`).
- **Seamless Checkout**: Address collection, delivery instructions, and payment options (UPI via Google Pay / PhonePe / Paytm / BHIM, Credit & Debit Cards, Netbanking, and Cash on Delivery).

### 4. 📍 Live Order Tracking & Receipts
- **Real-Time Progress Stepper**: Track orders across 5 live states: *Order Placed*, *Kitchen Preparing*, *Baking & Grilling*, *Rider on the Way*, and *Delivered*.
- **Downloadable Receipts**: Clean, print-friendly digital order receipts with itemized breakdown, tax, and delivery details.

### 5. 🏛️ Table Reservations
- **12 Handcrafted Dining Tables**: Rooftop Terrace Patio, Main Dining Grand Hall, Candlelight Romance Corner, and Private VIP Executive Lounge.
- **Instant Availability Checking**: Real-time date and guest count booking system with instant confirmation.

### 6. 🛡️ Admin Dashboard & Security
- **Order Management**: View all incoming orders, filter by status, and update live preparation states.
- **JWT Authentication & RBAC**: Secure password hashing with bcrypt and role-based route protection.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, Vanilla CSS (Modern Luxury Design System) |
| **Backend** | Node.js, Express.js, CORS, Dotenv |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Styling** | Custom HSL-tailored Luxury Emerald & Gold Theme, Glassmorphism, Responsive Grid |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- Active MongoDB connection URI (already configured in `backend/.env`)

### 1. Start the Backend Server
```bash
cd backend
npm install
node server.js
```
*The backend API will run on `http://localhost:5000` with automatic MongoDB reconnection and custom DNS resolution.*

### 2. Seed Initial Food Catalog (Optional)
```bash
cd backend
node seed.js
```
*Populates the database with 78+ authentic royal dishes, dietary tags, and pricing.*

### 3. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*The frontend will start on `http://localhost:5173`.*

### 4. Build for Production
```bash
cd frontend
npm run build
```
*Produces a production-ready, minified bundle in `frontend/dist/` with 0 errors.*

---

## 📁 Project Structure

```
food-ordering/
├── backend/
│   ├── models/            # Mongoose Schemas (Food, Order, User, Reservation)
│   ├── Routes/            # API Routes (food, auth, order, loyalty, reservation)
│   ├── middleware/        # JWT Authentication and Role Guards
│   ├── public/            # Static assets and fallbacks
│   ├── seed.js            # Initial menu seed script
│   ├── server.js          # Main Express server and DB connection
│   └── .env               # Server environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components (Navbar, CartDrawer, FoodCard, etc.)
│   │   ├── context/       # React Context Providers (CartContext, AuthContext)
│   │   ├── pages/         # Page Views (Home, Customizer, Checkout, Track, etc.)
│   │   ├── utils/         # Helper functions and business logic
│   │   ├── App.jsx        # App router and master layout
│   │   └── App.css        # Unified luxury styling and responsive design system
│   ├── public/            # High-res photography assets and icons
│   ├── vite.config.js     # Vite configuration
│   └── package.json       # Frontend scripts and dependencies
│
└── README.md              # Project documentation
```

---

## 👑 Credentials & Demo Access

- **Customer Login**: Any registered customer email/password or guest checkout.
- **Admin Access**: Sign in with an admin-designated account to access the `/admin` dashboard.
- **API Health Check**: `http://localhost:5000/health`
