import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.message || "Invalid credentials.");
        } else {
          navigate(res.user?.role === "admin" ? "/admin" : "/");
        }
      } else {
        if (!name.trim()) {
          setErrorMsg("Please enter your name.");
          setLoading(false);
          return;
        }
        const res = await register(name, email, password, phone, role);
        if (!res.success) {
          setErrorMsg(res.message || "Registration failed.");
        } else {
          navigate(res.user?.role === "admin" ? "/admin" : "/");
        }
      }
    } catch (err) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const autofillDemo = (demoType) => {
    if (demoType === "admin") {
      setIsLogin(true);
      setEmail("admin@foodie.com");
      setPassword("admin123");
    } else {
      setIsLogin(true);
      setEmail("customer@foodie.com");
      setPassword("password123");
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        {/* Brand Header */}
        <div className="auth-brand-header">
          <span className="auth-logo-icon">👑</span>
          <h2>Welcome to Foodie</h2>
          <p>
            {isLogin
              ? "Sign in to access your orders, favorites & saved addresses"
              : "Create an account for superfast ordering & royal rewards"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs-row">
          <button
            className={`auth-tab-btn ${isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(true);
              setErrorMsg("");
            }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab-btn ${!isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(false);
              setErrorMsg("");
            }}
          >
            Create Account
          </button>
        </div>

        {errorMsg && <div className="auth-error-alert">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form-fields">
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Navis S"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              placeholder="e.g. foodie@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            id="auth-submit-btn"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : isLogin
              ? "Sign In to Foodie ➔"
              : "Create My Account ➔"}
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="demo-accounts-strip">
          <div className="demo-header-tag">
            <span className="demo-lightning-icon">⚡</span>
            <span className="demo-title">Quick 1-Click Demo Login</span>
          </div>
          <div className="demo-buttons-row">
            <button
              type="button"
              className="demo-pill-btn customer"
              onClick={() => autofillDemo("customer")}
              title="Autofill customer account"
            >
              <span className="demo-btn-icon">👤</span>
              <div className="demo-btn-info">
                <strong>Customer Account</strong>
                <small>Foodie Diner</small>
              </div>
              <span className="demo-arrow">➔</span>
            </button>

            <button
              type="button"
              className="demo-pill-btn admin"
              onClick={() => autofillDemo("admin")}
              title="Autofill kitchen admin account"
            >
              <span className="demo-btn-icon">👑</span>
              <div className="demo-btn-info">
                <strong>Kitchen Admin</strong>
                <small>Chef Dashboard</small>
              </div>
              <span className="demo-arrow">➔</span>
            </button>
          </div>
        </div>

        <div className="auth-card-footer">
          <Link to="/" className="auth-back-home">
            <span className="back-arrow">←</span>
            <span>Continue as Guest to Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
