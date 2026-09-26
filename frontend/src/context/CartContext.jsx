import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

const COUPONS = {
  FIRST50: {
    code: "FIRST50",
    discountPercent: 50,
    maxDiscount: 300,
    minSubtotal: 500,
    label: "50% OFF First Order (On orders ₹500+)",
  },
  FEAST35: {
    code: "FEAST35",
    discountPercent: 35,
    maxDiscount: 200,
    minSubtotal: 399,
    label: "35% OFF Royal Feast (On orders ₹399+)",
  },
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem("foodie_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  useEffect(() => {
    localStorage.setItem("foodie_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (food, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => (item.food._id || item.food.name) === (food._id || food.name));
      if (existing) {
        return prev.map((item) =>
          (item.food._id || item.food.name) === (food._id || food.name)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { food, quantity }];
    });
  };

  const updateQuantity = (foodIdOrName, qty) => {
    if (qty <= 0) {
      removeFromCart(foodIdOrName);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        (item.food._id || item.food.name) === foodIdOrName
          ? { ...item, quantity: qty }
          : item
      )
    );
  };

  const removeFromCart = (foodIdOrName) => {
    setCartItems((prev) =>
      prev.filter((item) => (item.food._id || item.food.name) !== foodIdOrName)
    );
  };

  const getItemQuantity = (foodIdOrName) => {
    const item = cartItems.find(
      (i) => (i.food._id || i.food.name) === foodIdOrName
    );
    return item ? item.quantity : 0;
  };

  const applyCoupon = (code) => {
    let cleanCode = (code || "").trim().toUpperCase();
    setCouponError("");

    if (!cleanCode) {
      setCouponError("Please enter a promo code.");
      return { success: false, message: "Please enter a promo code." };
    }

    if (cleanCode === "ROYAL35" || cleanCode === "FOODIE35") cleanCode = "FEAST35";

    const coupon = COUPONS[cleanCode];
    if (!coupon) {
      setCouponError("Invalid coupon code. Try FIRST50 or FEAST35");
      return { success: false, message: "Invalid coupon code." };
    }

    if (subtotal < coupon.minSubtotal) {
      const remaining = coupon.minSubtotal - subtotal;
      const msg = `Minimum order of ₹${coupon.minSubtotal} required for ${cleanCode} (Add ₹${remaining} more).`;
      setCouponError(msg);
      return { success: false, message: msg };
    }

    setAppliedCoupon(coupon);
    return { success: true, message: `Coupon ${cleanCode} applied!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  // Price calculations
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.food.price * item.quantity,
    0
  );

  let deliveryFee = subtotal >= 399 || cartItems.length === 0 ? 0 : 35;
  if (appliedCoupon?.freeDelivery) {
    deliveryFee = 0;
  }

  const tax = Math.round(subtotal * 0.05); // 5% GST

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountPercent) {
      const calc = Math.round((subtotal * appliedCoupon.discountPercent) / 100);
      discount = Math.min(calc, appliedCoupon.maxDiscount || calc);
    }
  }

  const pointsDiscount = Math.round(Number(redeemedPoints || 0) / 10);
  const grandTotal = Math.max(0, subtotal + tax + deliveryFee - discount - pointsDiscount);
  const pointsToEarn = Math.max(10, Math.floor(grandTotal / 10));

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    setRedeemedPoints(0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        getItemQuantity,
        clearCart,
        appliedCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
        redeemedPoints,
        setRedeemedPoints,
        pointsDiscount,
        pointsToEarn,
        totalCount,
        subtotal,
        deliveryFee,
        tax,
        discount,
        grandTotal,
        availableCoupons: Object.values(COUPONS),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
