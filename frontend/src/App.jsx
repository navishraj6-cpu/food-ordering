import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { Navbar } from "./components/Navbar";
import { CartDrawer } from "./components/CartDrawer";
import { Footer } from "./components/Footer";

// Pages
import { Home } from "./pages/Home";
import { CheckoutPage } from "./pages/CheckoutPage";
import { TrackOrderPage } from "./pages/TrackOrderPage";
import { OrdersPage } from "./pages/OrdersPage";
import { AuthPage } from "./pages/AuthPage";
import { AdminPage } from "./pages/AdminPage";
import ReservationPage from "./pages/ReservationPage";
import { AboutPage } from "./pages/AboutPage";
import { DishCustomizerPage } from "./pages/DishCustomizerPage";
import { RewardsVaultPage } from "./pages/RewardsVaultPage";
import { DriverPortalPage } from "./pages/DriverPortalPage";
import { GroupOrderPage } from "./pages/GroupOrderPage";

import "./App.css";

export default function App() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="foodie-app-wrapper">
            {/* Ambient luxury atmospheric background layer */}
            <div className="ambient-background-layer" aria-hidden="true">
              <div className="ambient-orb orb-1"></div>
              <div className="ambient-orb orb-2"></div>
              <div className="ambient-orb orb-3"></div>
              <div className="ambient-orb orb-4"></div>
              <div className="ambient-grid-watermark"></div>
            </div>

            <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
            <CartDrawer />

            <main className="main-content-viewport">
              <Routes>
                <Route path="/" element={<Home searchTerm={searchTerm} />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/rewards" element={<RewardsVaultPage />} />
                <Route path="/driver" element={<DriverPortalPage />} />
                <Route path="/group" element={<GroupOrderPage />} />
                <Route path="/group/:groupId" element={<GroupOrderPage />} />
                <Route path="/customizer" element={<DishCustomizerPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/track/:orderId" element={<TrackOrderPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/reservation" element={<ReservationPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}