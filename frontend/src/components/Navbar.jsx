import { API_URL } from "../config/api";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export const Navbar = ({ searchTerm, setSearchTerm }) => {
  const { totalCount, setIsCartOpen, addToCart } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputVal, setInputVal] = useState(searchTerm || "");
  const [allFoods, setAllFoods] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Top Voice Recording & Voice Order state
  const [isListening, setIsListening] = useState(false);
  const [liveVoiceText, setLiveVoiceText] = useState("");
  const [voiceToast, setVoiceToast] = useState(null);
  const recognitionRef = useRef(null);

  const searchWrapRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Keep inputVal in sync with external searchTerm changes
  useEffect(() => {
    setInputVal(searchTerm || "");
  }, [searchTerm]);

  // Load food catalog once for instant autocomplete suggestions & voice ordering
  useEffect(() => {
    fetch(`${API_URL}/api/foods`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllFoods(data);
        }
      })
      .catch((err) => {
        console.warn("Could not load foods for search autocomplete:", err);
      });
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const adminRef = useRef(null);

  // Close admin dropdown on outside click
  useEffect(() => {
    const handleAdminClickOutside = (e) => {
      if (adminRef.current && !adminRef.current.contains(e.target)) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleAdminClickOutside);
    return () => document.removeEventListener("mousedown", handleAdminClickOutside);
  }, []);

  // Text-to-speech confirmation
  const speakFeedback = (text) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    }
  };

  // Natural Language Voice Order Parser
  const processVoiceOrder = (spokenText) => {
    if (!spokenText || !spokenText.trim()) return;
    const raw = spokenText.toLowerCase().trim();

    // Check quantity (e.g. 1, 2, 3...)
    const wordToNum = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };
    let quantity = 1;
    const digitMatch = raw.match(/\b([1-9]|10)\b/);
    if (digitMatch) {
      quantity = parseInt(digitMatch[1], 10);
    } else {
      for (const [word, val] of Object.entries(wordToNum)) {
        if (raw.includes(` ${word} `) || raw.startsWith(`${word} `)) {
          quantity = val;
          break;
        }
      }
    }

    // Clean spoken text to extract dish keywords
    const cleanTarget = raw
      .replace(/^add\s+/i, "")
      .replace(/^order\s+/i, "")
      .replace(/^get\s+me\s+/i, "")
      .replace(/^i\s+want\s+/i, "")
      .replace(/\s+to\s+cart$/i, "")
      .replace(/\s+please$/i, "")
      .replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|[1-9]|10)\b/gi, "")
      .trim();

    // Find best match in foods database
    const matchedFood = allFoods.find((food) => {
      const fName = (food.name || "").toLowerCase();
      const fCat = (food.category || "").toLowerCase();
      return (
        (cleanTarget.length >= 2 && fName.includes(cleanTarget)) ||
        (cleanTarget.length >= 2 && cleanTarget.includes(fName)) ||
        (cleanTarget.length >= 3 && fCat.includes(cleanTarget))
      );
    });

    const isOrderIntent =
      raw.includes("add") ||
      raw.includes("order") ||
      raw.includes("cart") ||
      raw.includes("buy") ||
      raw.includes("want");

    if (matchedFood && isOrderIntent) {
      addToCart(matchedFood, quantity);
      setVoiceToast({
        type: "success",
        icon: "🎉",
        msg: `Voice Order Added: ${quantity}x ${matchedFood.name} (₹${matchedFood.price * quantity}) to cart!`,
      });
      speakFeedback(`Added ${quantity} ${matchedFood.name} to your cart`);
      setTimeout(() => setVoiceToast(null), 5000);
    } else if (matchedFood) {
      setVoiceToast({
        type: "info",
        icon: "🔍",
        msg: `Found "${matchedFood.name}". Filtered menu! Say "Add ${matchedFood.name}" to order directly.`,
      });
      setTimeout(() => setVoiceToast(null), 4000);
    } else {
      setVoiceToast({
        type: "info",
        icon: "🔍",
        msg: `Filtered dishes for "${spokenText}"`,
      });
      setTimeout(() => setVoiceToast(null), 3500);
    }
  };

  // Direct Web Speech API Recording from Search Box Mic
  const startVoiceSearch = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceToast({
        type: "error",
        icon: "⚠️",
        msg: "Microphone speech recognition is not supported in this browser. Please type to search!",
      });
      setTimeout(() => setVoiceToast(null), 4500);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setLiveVoiceText("");
        setVoiceToast({
          type: "listening",
          icon: "🔴",
          msg: "Listening... Speak dish name or say 'Add 2 Burgers'...",
        });
      };

      recognition.onresult = (event) => {
        let currentInterim = "";
        let finalSpeech = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalSpeech += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }

        const heardText = (finalSpeech || currentInterim).trim();
        if (heardText) {
          setLiveVoiceText(heardText);
          setInputVal(heardText);
          setSearchTerm && setSearchTerm(heardText);
        }

        if (finalSpeech) {
          processVoiceOrder(finalSpeech);
          if (location.pathname !== "/") {
            navigate("/");
          }
          setTimeout(() => {
            const el = document.getElementById("menu-explorer");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }, 200);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setVoiceToast({
            type: "error",
            icon: "🚫",
            msg: "Microphone access blocked. Click the lock/tune icon in your browser address bar to allow microphone!",
          });
        } else if (event.error === "no-speech") {
          setVoiceToast({
            type: "info",
            icon: "🎙️",
            msg: "No speech detected. Click the mic again and speak clearly!",
          });
        } else {
          setVoiceToast({
            type: "info",
            icon: "🎙️",
            msg: `Voice ended (${event.error}). Click mic to try again.`,
          });
        }
        setTimeout(() => setVoiceToast(null), 4500);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Voice init exception:", err);
      setIsListening(false);
      setVoiceToast({
        type: "error",
        icon: "⚠️",
        msg: "Could not activate microphone. Please check browser permissions.",
      });
      setTimeout(() => setVoiceToast(null), 4500);
    }
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  const toggleVoiceSearch = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  // Handle typing inside search input (LIVE FILTERS INSTANTLY)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    setSearchTerm && setSearchTerm(val);

    const query = val.trim().toLowerCase();
    if (query.length >= 1 && allFoods.length > 0) {
      const matches = allFoods
        .filter((food) => {
          const nameMatch = (food.name || "").toLowerCase().includes(query);
          const catMatch = (food.category || "").toLowerCase().includes(query);
          return nameMatch || catMatch;
        })
        .slice(0, 6);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Execute full search on Enter, Click, or Suggestion selection
  const executeSearch = (query) => {
    const cleanQuery = (query !== undefined ? query : inputVal).trim();
    setSearchTerm && setSearchTerm(cleanQuery);
    setShowSuggestions(false);

    if (location.pathname !== "/") {
      navigate("/");
    }

    setTimeout(() => {
      const el = document.getElementById("menu-explorer");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  const handleSelectSuggestion = (food) => {
    setInputVal(food.name);
    executeSearch(food.name);
  };

  const handleClearSearch = () => {
    setInputVal("");
    setSearchTerm && setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    stopVoiceSearch();
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <header className="navbar-container">
      {/* Top Voice Recording & Order Alert Bar */}
      {voiceToast && (
        <div className={`nav-voice-alert-banner ${voiceToast.type}`}>
          <div className="alert-content">
            <span className="alert-icon">{voiceToast.icon}</span>
            <span className="alert-text">{voiceToast.msg}</span>
          </div>
          {isListening && (
            <button
              type="button"
              className="alert-stop-btn"
              onClick={stopVoiceSearch}
              title="Stop Recording"
            >
              ⏹️ Stop
            </button>
          )}
          <button
            type="button"
            className="alert-close-btn"
            onClick={() => setVoiceToast(null)}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className="navbar-inner">
        {/* Left: Brand Logo */}
        <Link
          to="/"
          className="brand-logo"
          onClick={() => {
            handleClearSearch();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="brand-icon">👑</span>
          <div className="brand-text-block">
            <span className="brand-name">Foodie</span>
            <span className="brand-tagline">Good Food • Good Mood</span>
          </div>
        </Link>

        {/* Center: Search Bar with Mic Recording and Suggestions */}
        <div className="nav-search-wrap" ref={searchWrapRef}>
          <button
            className="search-submit-btn"
            type="button"
            title="Search dishes"
            onClick={() => executeSearch()}
          >
            🔍
          </button>
          <input
            type="text"
            id="nav-search-input"
            className={`nav-search-input ${isListening ? "listening-glow" : ""}`}
            placeholder={
              isListening
                ? "🔴 Listening... Speak dish or say 'Add 2 Burgers'..."
                : "Search burgers, pizzas, wings, drinks, desserts..."
            }
            value={inputVal}
            onChange={handleInputChange}
            onFocus={() => {
              if (inputVal.trim().length >= 1 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                executeSearch();
              } else if (e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            autoComplete="off"
          />

          {/* Right Action Cluster: Clear Button and Mic Button (Neatly side-by-side, no overlap) */}
          <div className="nav-search-right-actions">
            {inputVal && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
                title="Clear search"
                aria-label="Clear search text"
              >
                ✕
              </button>
            )}

            <button
              type="button"
              className={`nav-voice-btn ${isListening ? "is-recording" : ""}`}
              onClick={toggleVoiceSearch}
              title={
                isListening
                  ? "Recording voice... Click to Stop"
                  : "Click to Speak & Order by Voice"
              }
              aria-label="Voice Search and Ordering"
            >
              {isListening ? (
                <span className="rec-pulse-indicator">🔴</span>
              ) : (
                <span>🎙️</span>
              )}
            </button>
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && !isListening && (
            <div className="search-suggestions-dropdown">
              <div className="suggestions-header">
                <span>Matching Dishes ({suggestions.length})</span>
                <small>Press Enter to view all</small>
              </div>
              <ul className="suggestions-list">
                {suggestions.map((food) => (
                  <li
                    key={food._id || food.name}
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(food)}
                  >
                    <img
                      src={food.image || "/images/fallback-food.jpg"}
                      alt={food.name}
                      className="suggestion-thumb"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <div className="suggestion-info">
                      <strong className="suggestion-title">{food.name}</strong>
                      <span className="suggestion-cat">{food.category}</span>
                    </div>
                    <span className="suggestion-price">₹{food.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Actions in EXACT requested order:
            1. Home -> 2. Menu -> 3. Book Table -> 4. My Orders -> 5. Craft Dish -> 6. Admin (with Kitchen sub-button) -> 7. User/Sign In -> 8. Cart */}
        <div className="nav-actions">
          {/* 1. Home */}
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" && !searchTerm ? "active" : ""}`}
            onClick={() => {
              handleClearSearch();
              if (location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            title="Home"
          >
            🏠 Home
          </Link>

          {/* 2. Menu */}
          <Link
            to="/"
            className="nav-link"
            onClick={(e) => {
              if (location.pathname === "/") {
                e.preventDefault();
                const el = document.getElementById("menu-explorer");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              } else {
                setTimeout(() => {
                  const el = document.getElementById("menu-explorer");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }, 150);
              }
            }}
            title="Menu"
          >
            🍔 Menu
          </Link>

          {/* 3. Book Table */}
          <Link
            to="/reservation"
            className={`nav-link ${location.pathname === "/reservation" ? "active" : ""}`}
            title="Book Tables"
          >
            🍽️ Book Tables
          </Link>

          {/* 4. My Orders */}
          <Link
            to="/orders"
            className={`nav-link ${location.pathname === "/orders" ? "active" : ""}`}
            title="My Orders"
          >
            📦 My Orders
          </Link>

          {/* 5. Craft Dish */}
          <Link
            to="/customizer"
            className={`nav-link customizer-nav-pill ${location.pathname === "/customizer" ? "active" : ""}`}
            title="Craft & Build Your Own Custom Burger or Pizza"
          >
            🎨 Craft Dish
          </Link>

          {/* 6. Admin Button with Kitchen sub-button dropdown */}
          <div className="nav-admin-dropdown-wrap" ref={adminRef}>
            <button
              className={`nav-link admin-pill ${location.pathname === "/admin" ? "active" : ""}`}
              onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
              title="Admin & Kitchen Controls"
              type="button"
            >
              <span>⚡ Admin</span>
              <span className="dropdown-caret">▾</span>
            </button>

            {adminDropdownOpen && (
              <div className="admin-sub-dropdown">
                <Link
                  to="/admin"
                  className="admin-sub-item"
                  onClick={() => setAdminDropdownOpen(false)}
                >
                  <span>⚡ Kitchen Dashboard</span>
                  <small>Live KOTs, Kanban & Orders</small>
                </Link>
                <Link
                  to="/admin"
                  className="admin-sub-item"
                  onClick={() => setAdminDropdownOpen(false)}
                >
                  <span>📊 Sales & Analytics</span>
                  <small>Revenue & Food Metrics</small>
                </Link>
                <Link
                  to="/driver"
                  className="admin-sub-item"
                  onClick={() => setAdminDropdownOpen(false)}
                >
                  <span>🚗 Driver Dispatch Hub</span>
                  <small>Live GPS Telemetry</small>
                </Link>
                <Link
                  to="/reservation"
                  className="admin-sub-item"
                  onClick={() => setAdminDropdownOpen(false)}
                >
                  <span>🍽️ Table Reservations</span>
                  <small>Manage Seating & Bookings</small>
                </Link>
              </div>
            )}
          </div>

          {/* 7. User Account / Sign In */}
          {isAuthenticated ? (
            <div className="user-dropdown-wrapper">
              <button
                className="user-avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className="avatar-circle">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </span>
                <span className="user-greeting">
                  {user?.name?.split(" ")[0] || "Account"}
                </span>
                <span className="dropdown-caret">▾</span>
              </button>

              {dropdownOpen && (
                <div className="user-menu-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-user-name">{user?.name}</p>
                    <p className="dropdown-user-email">{user?.email}</p>
                    {isAdmin && <span className="admin-badge">Admin</span>}
                  </div>
                  <hr className="dropdown-divider" />
                  <Link
                    to="/"
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    🏠 Home Page
                  </Link>
                  <Link
                    to="/customizer"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    🎨 Craft Your Dish
                  </Link>
                  <Link
                    to="/reservation"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    🍽️ Book a Table
                  </Link>
                  <Link
                    to="/about"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    ✨ About Our Kitchen
                  </Link>
                  <Link
                    to="/driver"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    🚗 Driver Delivery Portal
                  </Link>
                  <Link
                    to="/group"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    👥 Group Dining Room
                  </Link>
                  <Link
                    to="/orders"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    📦 My Orders
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      ⚡ Kitchen Dashboard
                    </Link>
                  )}
                  <hr className="dropdown-divider" />
                  <button
                    className="dropdown-item logout-action"
                    onClick={handleLogout}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="nav-login-btn" title="Sign In or Register to Foodie Account">
              <span className="login-user-icon">👤</span>
              <span className="login-btn-text">Sign In</span>
            </Link>
          )}

          {/* 8. Cart Trigger */}
          <button
            id="cart-trigger-btn"
            className="nav-cart-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label="View shopping cart"
          >
            <span className="cart-icon">🛒</span>
            <span className="cart-btn-label">Cart</span>
            {totalCount > 0 && (
              <span className="cart-badge-count">{totalCount}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
