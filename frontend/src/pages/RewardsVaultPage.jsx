import { API_URL } from "../config/api";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const WHEEL_PRIZES = [
  { label: "25% OFF Order", code: "LUCKY25", color: "#10b981", icon: "🎟️" },
  { label: "₹150 OFF Meal", code: "SPIN150", color: "#f59e0b", icon: "👑" },
  { label: "500 Gold Coins", code: "GOLD50", color: "#8b5cf6", icon: "💎" },
  { label: "Free Dessert", code: "SWEETGOLD", color: "#ec4899", icon: "🧁" },
  { label: "Chef 35% OFF", code: "SECRETCHEF", color: "#3b82f6", icon: "👨‍🍳" },
  { label: "Free Delivery", code: "VIPFREE", color: "#06b6d4", icon: "🚚" },
  { label: "₹50 Voucher", code: "SCRATCH50", color: "#eab308", icon: "🪙" },
  { label: "Double Points", code: "GOLD50", color: "#14b8a6", icon: "⚡" },
];

export const RewardsVaultPage = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { applyCoupon, setIsCartOpen } = useCart();
  const navigate = useNavigate();

  // Loyalty Profile State
  const [loyaltyData, setLoyaltyData] = useState({
    loyaltyPoints: 350,
    tier: "Silver Epicure",
    dailyStreak: { count: 3, lastClaimDate: null },
    canClaimDaily: true,
  });

  // Spin Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [spinsLeft, setSpinsLeft] = useState(3);
  const [couponAppliedNotice, setCouponAppliedNotice] = useState("");

  // Scratch Card Canvas State
  const scratchCanvasRef = useRef(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPrize, setScratchPrize] = useState({
    title: "Gold Chest Mystery",
    prizeName: "₹50 Instant Discount",
    promoCode: "SCRATCH50",
  });

  // Fetch Loyalty Profile from Backend
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/loyalty/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setLoyaltyData(data);
          }
        })
        .catch((err) => console.warn("Loyalty profile fetch fallback:", err));
    }
  }, [token]);

  // Handle Lucky Spin Execution
  const handleSpinWheel = () => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    setWonPrize(null);
    setCouponAppliedNotice("");

    // Calculate random prize
    const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const sliceAngle = 360 / WHEEL_PRIZES.length;
    // Extra full spins (5-8 rounds) + landing angle
    const extraSpins = 360 * 6;
    const targetAngle = extraSpins + (360 - (prizeIndex * sliceAngle + sliceAngle / 2));

    setWheelRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setSpinsLeft((prev) => Math.max(0, prev - 1));
      const prize = WHEEL_PRIZES[prizeIndex];
      setWonPrize(prize);
    }, 4500);
  };

  // 1-Click Apply Won Coupon to Cart
  const handleApplyWonCoupon = (code) => {
    const res = applyCoupon(code);
    if (res.success) {
      setCouponAppliedNotice(`✨ Promo code ${code} applied to your cart!`);
    } else {
      setCouponAppliedNotice(res.message || `Code ${code} ready for checkout.`);
    }
  };

  // Claim Daily Streak Bonus
  const handleClaimDaily = () => {
    if (!loyaltyData.canClaimDaily) return;

    if (token) {
      fetch(`${API_URL}/api/loyalty/daily-claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setLoyaltyData((prev) => ({
            ...prev,
            loyaltyPoints: data.loyaltyPoints || prev.loyaltyPoints + 50,
            canClaimDaily: false,
            dailyStreak: {
              count: data.streakCount || (prev.dailyStreak.count % 7) + 1,
              lastClaimDate: new Date(),
            },
          }));
        })
        .catch(() => {
          // Local fallback
          setLoyaltyData((prev) => ({
            ...prev,
            loyaltyPoints: prev.loyaltyPoints + 50,
            canClaimDaily: false,
            dailyStreak: { count: (prev.dailyStreak.count % 7) + 1, lastClaimDate: new Date() },
          }));
        });
    } else {
      setLoyaltyData((prev) => ({
        ...prev,
        loyaltyPoints: prev.loyaltyPoints + 50,
        canClaimDaily: false,
        dailyStreak: { count: (prev.dailyStreak.count % 7) + 1, lastClaimDate: new Date() },
      }));
    }
  };

  // Initialize Scratch Card Canvas
  useEffect(() => {
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Draw metallic gold mask
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#d97706");
    grad.addColorStop(0.3, "#fef08a");
    grad.addColorStop(0.7, "#b45309");
    grad.addColorStop(1, "#f59e0b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative text on scratch foil
    ctx.fillStyle = "#1e1b4b";
    ctx.font = "bold 16px 'Playfair Display', serif";
    ctx.textAlign = "center";
    ctx.fillText("✨ SCRATCH WITH MOUSE / TOUCH ✨", canvas.width / 2, canvas.height / 2 + 6);
  }, []);

  // Handle Scratch Event
  const scratch = (e) => {
    if (isScratched) return;
    const canvas = scratchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check scratch percentage
    try {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparentCount = 0;
      for (let i = 3; i < imgData.data.length; i += 16) {
        if (imgData.data[i] === 0) transparentCount++;
      }
      if (transparentCount / (imgData.data.length / 16) > 0.45) {
        setIsScratched(true);
      }
    } catch (err) {}
  };

  return (
    <div className="rewards-vault-page">
      {/* Hero Banner */}
      <div className="rewards-hero-section">
        <div className="rewards-hero-content">
          <span className="rewards-pill-badge">👑 Foodie Royal Privileges</span>
          <h1 className="rewards-title">VIP Loyalty Lounge & Rewards Vault</h1>
          <p className="rewards-subtitle">
            Spin daily for instant discounts, scratch gold mystery cards, and redeem VIP gourmet perks.
          </p>
        </div>

        {/* User Stats Card */}
        <div className="rewards-user-card">
          <div className="user-tier-badge">
            <span className="tier-crown">💎</span>
            <div>
              <span className="tier-label">Current Tier</span>
              <strong className="tier-name">{loyaltyData.tier}</strong>
            </div>
          </div>
          <div className="user-points-block">
            <span className="points-label">Available Balance</span>
            <div className="points-val-row">
              <span className="gold-coin-icon">🪙</span>
              <span className="gold-points-count">{loyaltyData.loyaltyPoints}</span>
              <span className="gold-unit">Gold Coins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Spin Wheel & Scratch Card Mini Games */}
      <div className="rewards-games-grid">
        {/* Left: Lucky Spin Wheel */}
        <div className="game-card lucky-spin-card">
          <div className="game-card-head">
            <span className="game-icon">🎡</span>
            <div>
              <h2>Spin & Win Gourmet Wheel</h2>
              <p>Guaranteed win every spin • {spinsLeft} free spins remaining</p>
            </div>
          </div>

          <div className="wheel-stage-container">
            {/* Wheel Pointer */}
            <div className="wheel-top-pointer">▼</div>

            {/* Spinning Wheel */}
            <div
              className="wheel-rotator"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning ? "transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)" : "none",
              }}
            >
              <svg viewBox="0 0 360 360" className="wheel-svg">
                {WHEEL_PRIZES.map((prize, idx) => {
                  const angle = 360 / WHEEL_PRIZES.length;
                  const startAngle = (idx * angle * Math.PI) / 180;
                  const endAngle = ((idx + 1) * angle * Math.PI) / 180;
                  const x1 = 180 + 175 * Math.cos(startAngle);
                  const y1 = 180 + 175 * Math.sin(startAngle);
                  const x2 = 180 + 175 * Math.cos(endAngle);
                  const y2 = 180 + 175 * Math.sin(endAngle);

                  const midAngle = ((idx + 0.5) * angle * Math.PI) / 180;
                  const textX = 180 + 110 * Math.cos(midAngle);
                  const textY = 180 + 110 * Math.sin(midAngle);

                  return (
                    <g key={idx}>
                      <path
                        d={`M180,180 L${x1},${y1} A175,175 0 0,1 ${x2},${y2} Z`}
                        fill={idx % 2 === 0 ? "#1e293b" : "#0f172a"}
                        stroke="#f59e0b"
                        strokeWidth="2"
                      />
                      <text
                        x={textX}
                        y={textY}
                        fill="#f8fafc"
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${(idx + 0.5) * angle + 90}, ${textX}, ${textY})`}
                      >
                        {prize.label}
                      </text>
                    </g>
                  );
                })}
                {/* Center Hub */}
                <circle cx="180" cy="180" r="28" fill="#f59e0b" stroke="#1e1b4b" strokeWidth="3" />
                <text x="180" y="184" fontSize="18" textAnchor="middle">👑</text>
              </svg>
            </div>
          </div>

          <div className="wheel-controls-area">
            <button
              className="hero-primary-btn spin-trigger-btn"
              onClick={handleSpinWheel}
              disabled={isSpinning || spinsLeft <= 0}
            >
              {isSpinning ? "💫 Testing Your Fortune..." : spinsLeft > 0 ? "🎡 Spin The Wheel Now!" : "No Spins Left (Come back tomorrow)"}
            </button>

            {/* Won Prize Notice */}
            {wonPrize && (
              <div className="won-prize-box">
                <span className="won-congrats">🎉 Congratulations! You Won:</span>
                <strong className="won-prize-title">{wonPrize.label}</strong>
                <div className="won-code-row">
                  <span className="won-code-badge">{wonPrize.code}</span>
                  <button
                    className="apply-code-btn"
                    onClick={() => handleApplyWonCoupon(wonPrize.code)}
                  >
                    Apply to Cart 🛒
                  </button>
                </div>
                {couponAppliedNotice && (
                  <p className="applied-notice-msg">{couponAppliedNotice}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Scratch Card & Daily Streak */}
        <div className="game-card scratch-streak-card">
          {/* Scratch Card Section */}
          <div className="game-card-head">
            <span className="game-icon">✨</span>
            <div>
              <h2>Royal Gold Scratch Card</h2>
              <p>Scratch to reveal secret dishes and cashback promos</p>
            </div>
          </div>

          <div className="scratch-card-wrapper">
            <div className="scratch-card-reveal-box">
              <span className="scratch-prize-emoji">🎁</span>
              <strong className="scratch-prize-name">{scratchPrize.prizeName}</strong>
              <div className="scratch-promo-pill">CODE: {scratchPrize.promoCode}</div>
              <button
                className="claim-scratch-btn"
                onClick={() => handleApplyWonCoupon(scratchPrize.promoCode)}
              >
                1-Click Apply Code 🚀
              </button>
            </div>

            {/* Overlay Foil Canvas */}
            <canvas
              ref={scratchCanvasRef}
              width={340}
              height={160}
              className={`scratch-canvas-overlay ${isScratched ? "faded-out" : ""}`}
              onMouseMove={scratch}
              onTouchMove={scratch}
            ></canvas>
          </div>

          {/* Daily Streak Check-in */}
          <div className="daily-streak-block">
            <div className="streak-head-row">
              <div>
                <h3>🔥 7-Day Gourmet Streak</h3>
                <p>Check in daily to earn escalating Gold Coins and surprise rewards</p>
              </div>
              <button
                className={`claim-streak-btn ${loyaltyData.canClaimDaily ? "ready" : "claimed"}`}
                onClick={handleClaimDaily}
                disabled={!loyaltyData.canClaimDaily}
              >
                {loyaltyData.canClaimDaily ? "Claim Day Bonus" : "Claimed Today ✓"}
              </button>
            </div>

            <div className="streak-days-row">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isPassed = day <= loyaltyData.dailyStreak.count;
                const isToday = day === loyaltyData.dailyStreak.count;
                return (
                  <div
                    key={day}
                    className={`streak-day-box ${isPassed ? "completed" : ""} ${isToday ? "today" : ""}`}
                  >
                    <span className="streak-day-num">D{day}</span>
                    <span className="streak-reward-icon">{day === 7 ? "👑" : "🪙"}</span>
                    <span className="streak-reward-val">+{day * 15}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* VIP Tiers & Privileges Matrix */}
      <div className="vip-tiers-section">
        <h2 className="tiers-main-title">🌟 VIP Connoisseur Privilege Tiers</h2>
        <div className="tiers-grid">
          <div className="tier-card bronze">
            <div className="tier-icon">🥉</div>
            <h3>Bronze Gourmand</h3>
            <span className="tier-threshold">0 - 499 Points</span>
            <ul className="tier-perks-list">
              <li>✓ 1x Points on all menu orders</li>
              <li>✓ Birthday Special Dessert Voucher</li>
              <li>✓ Standard Kitchen Queue</li>
            </ul>
          </div>

          <div className="tier-card silver active-tier">
            <div className="current-badge">Your Tier</div>
            <div className="tier-icon">🥈</div>
            <h3>Silver Epicure</h3>
            <span className="tier-threshold">500 - 1,499 Points</span>
            <ul className="tier-perks-list">
              <li>✓ 1.25x Points Multiplier</li>
              <li>✓ 3 Free Delivery Passes monthly</li>
              <li>✓ 3D Customizer priority baking</li>
            </ul>
          </div>

          <div className="tier-card gold">
            <div className="tier-icon">🥇</div>
            <h3>Gold Connoisseur</h3>
            <span className="tier-threshold">1,500 - 2,999 Points</span>
            <ul className="tier-perks-list">
              <li>✓ 1.5x Points Multiplier</li>
              <li>✓ Priority Kitchen Dispatch</li>
              <li>✓ Access to Chef's Secret Tasting Menu</li>
            </ul>
          </div>

          <div className="tier-card platinum">
            <div className="tier-icon">💎</div>
            <h3>Platinum Royale</h3>
            <span className="tier-threshold">3,000+ Points</span>
            <ul className="tier-perks-list">
              <li>✓ 2x Points on everything</li>
              <li>✓ 100% Free Express Delivery Forever</li>
              <li>✓ Dedicated Sommelier & Chef Hotline</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RewardsVaultPage;
