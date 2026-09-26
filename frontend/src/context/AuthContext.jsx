import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

import { API_URL } from "../config/api";
const API_BASE = `${API_URL}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("foodie_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("foodie_token") || null);
  const [loading, setLoading] = useState(true);

  // Sync token to localStorage and fetch user profile if token exists
  useEffect(() => {
    if (token) {
      localStorage.setItem("foodie_token", token);
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("foodie_user", JSON.stringify(data.user));
          } else {
            // Token might be invalid
            logout();
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      localStorage.removeItem("foodie_token");
      localStorage.removeItem("foodie_user");
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("foodie_token", data.token);
      localStorage.setItem("foodie_user", JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (name, email, password, phone, role = "user") => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("foodie_token", data.token);
      localStorage.setItem("foodie_user", JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("foodie_token");
    localStorage.removeItem("foodie_user");
  };

  const addAddress = async (addressData) => {
    if (!token) return { success: false, message: "Please log in first." };
    try {
      const res = await fetch(`${API_BASE}/auth/address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUser((prev) => ({ ...prev, addresses: data.addresses }));
      return { success: true, addresses: data.addresses };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("foodie_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("foodie_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = async (foodIdOrName) => {
    setFavorites((prev) => {
      const exists = prev.includes(foodIdOrName);
      if (exists) {
        return prev.filter((id) => id !== foodIdOrName);
      } else {
        return [...prev, foodIdOrName];
      }
    });

    if (token) {
      try {
        await fetch(`${API_BASE}/auth/favorites/${foodIdOrName}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
  };

  const isFavorite = (foodIdOrName) => favorites.includes(foodIdOrName);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
        addAddress,
        favorites,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
