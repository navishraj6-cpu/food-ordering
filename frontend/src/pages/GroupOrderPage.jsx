import { API_URL } from "../config/api";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { CreateGroupModal } from "../components/CreateGroupModal";

const AVATAR_OPTIONS = ["👑", "🍔", "🍕", "🍟", "🥤", "🍗", "🧁", "🌮", "🦁", "⚡"];

export const GroupOrderPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentMember, setCurrentMember] = useState(null);
  const [joinName, setJoinName] = useState("");
  const [joinAvatar, setJoinAvatar] = useState("🍔");
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Menu items for quick adding
  const [foods, setFoods] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  // Bill split mode: 'equal' | 'itemized'
  const [splitMode, setSplitMode] = useState("equal");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Load member from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`group_member_${groupId}`);
    if (saved) {
      try {
        setCurrentMember(JSON.parse(saved));
      } catch (e) {}
    }
  }, [groupId]);

  // Fetch Menu
  useEffect(() => {
    fetch(`${API_URL}/api/foods`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setFoods(d);
        else if (d.success && Array.isArray(d.foods)) setFoods(d.foods);
      })
      .catch((e) => console.warn(e));
  }, []);

  // Fetch Group Order Details
  const fetchGroupOrder = useCallback(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/group-orders/${groupId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Group session not found");
        return r.json();
      })
      .then((d) => {
        if (d.success && d.groupOrder) {
          setGroup(d.groupOrder);
          if (d.groupOrder.status === "ordered" && d.groupOrder.finalOrderId) {
            navigate(`/track/${d.groupOrder.finalOrderId}`);
          }
        }
      })
      .catch((err) => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [groupId, navigate]);

  useEffect(() => {
    fetchGroupOrder();
    // Live polling every 3 seconds
    const interval = setInterval(fetchGroupOrder, 3000);
    return () => clearInterval(interval);
  }, [fetchGroupOrder]);

  // Join Party
  const handleJoinParty = async (e) => {
    e.preventDefault();
    if (!joinName.trim()) return;
    setIsJoining(true);

    try {
      const res = await fetch(`${API_URL}/api/group-orders/${groupId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: joinName.trim(), avatar: joinAvatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join group");

      const memberObj = {
        id: data.memberId,
        name: joinName.trim(),
        avatar: joinAvatar,
        isHost: false,
      };

      localStorage.setItem(`group_member_${groupId}`, JSON.stringify(memberObj));
      setCurrentMember(memberObj);
      setGroup(data.groupOrder);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  // Add Item
  const handleAddItem = async (food) => {
    if (!currentMember) {
      alert("Please join the party first with your name!");
      return;
    }
    if (group?.status !== "open") {
      alert("Group cart is locked by host.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/group-orders/${groupId}/add-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId: food._id,
          name: food.name,
          price: food.price,
          image: food.image,
          category: food.category,
          memberId: currentMember.id,
          memberName: currentMember.name,
          quantity: 1,
        }),
      });
      const data = await res.json();
      if (data.success && data.groupOrder) {
        setGroup(data.groupOrder);
      }
    } catch (err) {
      console.warn("Could not add item:", err);
    }
  };

  // Remove Item
  const handleRemoveItem = async (itemId) => {
    try {
      const res = await fetch(`${API_URL}/api/group-orders/${groupId}/remove-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (data.success && data.groupOrder) {
        setGroup(data.groupOrder);
      }
    } catch (err) {
      console.warn("Could not remove item:", err);
    }
  };

  // Toggle Lock (Host Only)
  const handleToggleLock = async () => {
    try {
      const res = await fetch(`${API_URL}/api/group-orders/${groupId}/toggle-lock`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.groupOrder) {
        setGroup(data.groupOrder);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  // Checkout (Host Only)
  const handleGroupCheckout = async () => {
    if (!group || group.items.length === 0) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch(`${API_URL}/api/group-orders/${groupId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "cod" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Checkout failed");

      // Save order ID to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem("foodie_recent_orders") || "[]");
        localStorage.setItem("foodie_recent_orders", JSON.stringify([data.order.orderId, ...existing]));
      } catch (e) {}

      navigate(`/track/${data.order.orderId || data.order._id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!groupId) {
    return (
      <div className="group-empty-launcher">
        <CreateGroupModal isOpen={true} onClose={() => navigate("/")} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="group-loading-screen">
        <div className="track-spinner"></div>
        <h2>Loading Group Party Session...</h2>
      </div>
    );
  }

  if (errorMsg || !group) {
    return (
      <div className="group-error-screen">
        <span>⚠️</span>
        <h2>Group Session Not Found</h2>
        <p>Could not find group order for code: <strong>{groupId}</strong></p>
        <Link to="/" className="hero-primary-btn">Return to Menu</Link>
      </div>
    );
  }

  const isHost = currentMember?.isHost || currentMember?.id === group.host?.id;
  const subtotal = group.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const deliveryFee = group.items.length > 0 ? 40 : 0;
  const grandTotal = subtotal + tax + deliveryFee;
  const memberCount = Math.max(1, group.members.length);
  const perPersonEqual = Math.round(grandTotal / memberCount);

  const categories = ["All", ...new Set(foods.map((f) => f.category).filter(Boolean))];
  const filteredFoods = activeCategory === "All" ? foods : foods.filter((f) => f.category === activeCategory);

  return (
    <div className="group-order-page-container">
      {/* Top Banner */}
      <div className="group-header-banner">
        <div className="group-header-left">
          <div className="group-code-pill">
            <span className="live-dot"></span> PARTY CODE: <strong>{group.groupCode}</strong>
          </div>
          <h1 className="group-page-title">{group.title}</h1>
          <p className="group-page-sub">
            Hosted by <strong>{group.host.name}</strong> • Delivering to: {group.deliveryAddress?.street}, {group.deliveryAddress?.city}
          </p>
        </div>

        <div className="group-header-right">
          <button className="copy-invite-btn" onClick={copyInviteLink}>
            {copied ? "✓ Link Copied!" : "🔗 Share Invite Link"}
          </button>
          {isHost && (
            <button
              className={`group-lock-btn ${group.status === "locked" ? "locked" : ""}`}
              onClick={handleToggleLock}
            >
              {group.status === "locked" ? "🔓 Unlock Cart" : "🔒 Lock Cart"}
            </button>
          )}
        </div>
      </div>

      {/* Guest Join Overlay Modal if not joined yet */}
      {!currentMember && (
        <div className="group-join-overlay">
          <div className="group-join-card">
            <span className="join-emoji">🎉</span>
            <h2>You've been invited to {group.host.name}'s Feast!</h2>
            <p>Enter your name to start picking your favorite dishes for this group order.</p>

            <form onSubmit={handleJoinParty}>
              <div className="join-form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rohan"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="join-form-group">
                <label>Choose Your Avatar</label>
                <div className="avatar-picker-row">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      type="button"
                      key={av}
                      className={`av-btn ${joinAvatar === av ? "selected" : ""}`}
                      onClick={() => setJoinAvatar(av)}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="join-submit-btn" disabled={isJoining || !joinName.trim()}>
                {isJoining ? "Joining..." : "🚀 Join Feast Cart"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Members Strip */}
      <div className="group-members-strip">
        <span className="strip-title">Party Guests ({group.members.length}):</span>
        <div className="members-pills-row">
          {group.members.map((m) => (
            <div key={m.id} className={`member-chip ${m.isHost ? "host" : ""}`}>
              <span className="m-avatar">{m.avatar || "👤"}</span>
              <span className="m-name">{m.name}</span>
              {m.isHost && <span className="host-badge">HOST</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Menu Browser & Group Cart */}
      <div className="group-main-grid">
        {/* Left Column: Quick Menu Explorer */}
        <div className="group-menu-col">
          <div className="group-card menu-picker-card">
            <div className="menu-picker-header">
              <h3>🍽️ Add Food to Group Feast</h3>
              <div className="category-filter-chips">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`cat-chip ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="group-dishes-grid">
              {filteredFoods.map((food) => (
                <div key={food._id} className="group-dish-card">
                  <img
                    src={
                      (food.name || "").toLowerCase().includes("sizzling brownie") &&
                      (!food.image || food.image.includes("ytimg"))
                        ? "/images/sizzling-brownie.jpg"
                        : food.image
                    }
                    alt={food.name}
                    className="group-dish-img"
                    onError={(e) => {
                      if ((food.name || "").toLowerCase().includes("sizzling brownie")) {
                        e.currentTarget.src = "/images/sizzling-brownie.jpg";
                      }
                    }}
                  />
                  <div className="group-dish-info">
                    <strong>{food.name}</strong>
                    <span className="group-dish-price">₹{food.price}</span>
                    <button
                      className="group-add-btn"
                      onClick={() => handleAddItem(food)}
                      disabled={group.status === "locked"}
                    >
                      + Add for Me 🛒
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Shared Group Cart & Bill Splitter */}
        <div className="group-cart-col">
          <div className="group-card shared-cart-card">
            <div className="cart-header-row">
              <h3>🛒 Shared Group Cart ({group.items.length} Items)</h3>
              <span className={`cart-status-badge ${group.status}`}>
                {group.status === "locked" ? "🔒 LOCKED BY HOST" : "🟢 OPEN FOR ADDITIONS"}
              </span>
            </div>

            {group.items.length === 0 ? (
              <div className="empty-group-cart">
                <span>🍽️</span>
                <p>The feast cart is currently empty. Pick dishes from the left to start!</p>
              </div>
            ) : (
              <div className="group-items-list">
                {group.members.map((member) => {
                  const memberItems = group.items.filter((i) => i.addedBy?.id === member.id);
                  if (memberItems.length === 0) return null;
                  const memberTotal = memberItems.reduce((s, i) => s + i.price * i.quantity, 0);

                  return (
                    <div key={member.id} className="member-cart-section">
                      <div className="member-section-header">
                        <div className="m-title">
                          <span>{member.avatar || "👤"}</span>
                          <strong>{member.name}'s Selection</strong>
                        </div>
                        <span className="m-subtotal">₹{memberTotal}</span>
                      </div>

                      <div className="member-items-stack">
                        {memberItems.map((item) => (
                          <div key={item.id || item._id} className="group-cart-item-row">
                            <div className="item-left">
                              <span className="item-qty">{item.quantity}x</span>
                              <span className="item-name">{item.name}</span>
                            </div>
                            <div className="item-right">
                              <span className="item-price">₹{item.price * item.quantity}</span>
                              {(currentMember?.id === member.id || isHost) && group.status === "open" && (
                                <button
                                  className="item-del-btn"
                                  onClick={() => handleRemoveItem(item.id || item._id)}
                                  title="Remove item"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bill Summary & Splitter */}
            {group.items.length > 0 && (
              <div className="group-bill-summary-block">
                <div className="bill-line">
                  <span>Items Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="bill-line">
                  <span>Restaurant GST (5%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="bill-line">
                  <span>Delivery & Packaging</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="bill-total-line">
                  <strong>Total Grand Feast</strong>
                  <strong>₹{grandTotal}</strong>
                </div>

                {/* Interactive Splitter */}
                <div className="bill-splitter-box">
                  <div className="splitter-header">
                    <span>💳 Smart Bill Splitter</span>
                    <div className="split-toggle">
                      <button
                        className={splitMode === "equal" ? "active" : ""}
                        onClick={() => setSplitMode("equal")}
                      >
                        Split Equally
                      </button>
                      <button
                        className={splitMode === "itemized" ? "active" : ""}
                        onClick={() => setSplitMode("itemized")}
                      >
                        Itemized
                      </button>
                    </div>
                  </div>

                  {splitMode === "equal" ? (
                    <div className="equal-split-display">
                      <span>Each person pays ({memberCount} guests):</span>
                      <strong className="split-amt">₹{perPersonEqual}</strong>
                    </div>
                  ) : (
                    <div className="itemized-split-display">
                      {group.members.map((m) => {
                        const mItems = group.items.filter((i) => i.addedBy?.id === m.id);
                        const mSub = mItems.reduce((s, i) => s + i.price * i.quantity, 0);
                        const mRatio = subtotal > 0 ? mSub / subtotal : 0;
                        const mFinal = Math.round(mSub + (tax + deliveryFee) * mRatio);

                        return (
                          <div key={m.id} className="itemized-row">
                            <span>{m.name} ({mItems.length} items)</span>
                            <strong>₹{mFinal}</strong>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Host Checkout Action */}
                {isHost ? (
                  <button
                    className="host-checkout-btn"
                    onClick={handleGroupCheckout}
                    disabled={isCheckingOut || group.items.length === 0}
                  >
                    {isCheckingOut ? "Placing Royal Feast..." : "👑 Place Order for Entire Group (Cash on Delivery)"}
                  </button>
                ) : (
                  <div className="non-host-notice">
                    <span>⏳ Waiting for Host (<strong>{group.host.name}</strong>) to lock cart and place order.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
