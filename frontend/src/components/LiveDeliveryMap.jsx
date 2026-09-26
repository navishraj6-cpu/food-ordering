import { API_URL } from "../config/api";
import React, { useState, useEffect, useRef, useCallback } from "react";

const CHAT_PRESETS = [
  "🔔 Please ring the doorbell upon arrival",
  "🛡️ Leave package with building security",
  "🧻 Please include extra tissues and cutlery",
  "📍 I am waiting at the main entrance gate",
];

export const LiveDeliveryMap = ({ order, onOrderUpdated }) => {
  const messagesEndRef = useRef(null);
  const routePathRef = useRef(null);
  const animTimerRef = useRef(null);

  // Exact customer delivery details
  const customerName = order?.customer?.name || "Valued Guest";
  const customerPhone = order?.customer?.phone || "+91 98765 43210";
  const customerStreet = order?.deliveryAddress?.street || "Residence Doorstep";
  const customerCity = order?.deliveryAddress?.city || "Central City";
  const customerPincode = order?.deliveryAddress?.pincode || "560001";
  const customerInstructions = order?.deliveryAddress?.instructions || "";

  const orderId = order?._id || order?.orderId;
  const backendStatus = order?.orderStatus || "placed";

  // Local state to manage smooth live delivery progression
  const [localStatus, setLocalStatus] = useState(backendStatus);
  const isDelivered = localStatus === "delivered" || backendStatus === "delivered";
  const isOut = localStatus === "out_for_delivery" || backendStatus === "out_for_delivery";

  // Initial driver chat messages
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "driver",
      text: "Namaste! I am your Royal Delivery Partner Raju Kumar. Your meal is hot and securely packed in my insulated thermal bag. 🛵",
      time: "Just now",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [customMsg, setCustomMsg] = useState("");
  const [etaSeconds, setEtaSeconds] = useState(720); // ~12 mins
  const [deliveredNoteSent, setDeliveredNoteSent] = useState(false);

  // Rider progress ratio along SVG road curve (0.00 to 1.00)
  const [riderProgress, setRiderProgress] = useState(() => {
    if (backendStatus === "delivered") return 1.0;
    if (backendStatus === "out_for_delivery") return 0.20;
    if (backendStatus === "preparing") return 0.10;
    if (backendStatus === "confirmed") return 0.05;
    return 0.02;
  });

  const [currentSpeed, setCurrentSpeed] = useState(() => (backendStatus === "out_for_delivery" ? 40 : 0));
  const [riderPos, setRiderPos] = useState({ x: 90, y: 230, angle: 0 });
  const [isDriving, setIsDriving] = useState(false);
  const [fastMode, setFastMode] = useState(false);

  // Accurate coordinate calculation along the SVG route curve
  // SVG path: M 90 230 C 180 230, 180 160, 290 160 S 390 160, 390 220 S 520 220, 610 220
  const getCoordinatesAlongPath = useCallback((prog) => {
    const clamped = Math.max(0, Math.min(1, prog));
    if (routePathRef.current) {
      try {
        const totalLen = routePathRef.current.getTotalLength();
        if (totalLen > 0) {
          const pt = routePathRef.current.getPointAtLength(clamped * totalLen);
          const nextPt = routePathRef.current.getPointAtLength(
            Math.min((clamped + 0.006) * totalLen, totalLen)
          );
          const angle =
            Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * (180 / Math.PI);
          const clampedAngle = Math.max(-22, Math.min(22, angle));
          return { x: pt.x, y: pt.y, angle: clampedAngle };
        }
      } catch {
        // Fallback below
      }
    }

    // Precise mathematical fallback matching the 3 cubic bezier segments:
    // (90, 230) -> (290, 160) -> (390, 220) -> (610, 220)
    if (clamped <= 0.35) {
      const t = clamped / 0.35;
      const x = 90 + (290 - 90) * t;
      const y = 230 + (160 - 230) * Math.sin(t * Math.PI * 0.5);
      return { x, y, angle: -14 * Math.sin(t * Math.PI) };
    } else if (clamped <= 0.65) {
      const t = (clamped - 0.35) / 0.30;
      const x = 290 + (390 - 290) * t;
      const y = 160 + (220 - 160) * Math.sin(t * Math.PI * 0.5);
      return { x, y, angle: 14 * Math.sin(t * Math.PI) };
    } else {
      const t = (clamped - 0.65) / 0.35;
      const x = 390 + (610 - 390) * t;
      const y = 220;
      return { x, y, angle: 0 };
    }
  }, []);

  // Update physical coordinates whenever riderProgress updates
  useEffect(() => {
    const coords = getCoordinatesAlongPath(riderProgress);
    setRiderPos(coords);
  }, [riderProgress, getCoordinatesAlongPath]);

  // Audio chime synthesizer for arrival
  const playArrivalChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(523.25, 0, 0.4); // C5
      playTone(659.25, 0.15, 0.5); // E5
      playTone(783.99, 0.32, 0.8); // G5
      playTone(1046.5, 0.52, 1.2); // C6
    } catch {
      // Audio context blocked
    }
  };

  // Trigger autonomous delivery completion when the bike physically reaches the customer address
  const handleReachDestination = useCallback(() => {
    setIsDriving(false);
    setRiderProgress(1.0);
    setCurrentSpeed(0);
    setEtaSeconds(0);
    setLocalStatus("delivered");
    playArrivalChime();

    // Auto send delivery message to chat
    if (!deliveredNoteSent) {
      setDeliveredNoteSent(true);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 100,
          sender: "driver",
          text: `🎉 Namaste ${customerName}! I have safely arrived and delivered your fresh royal food to ${customerStreet}. Enjoy your delicious meal! ⭐ Please rate your experience!`,
          time: "Just now",
        },
      ]);
    }

    // Call backend API to automatically mark order as delivered in database
    if (orderId) {
      fetch(`${API_URL}/api/orders/${orderId}/complete-delivery`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && onOrderUpdated) {
            onOrderUpdated();
          }
        })
        .catch(() => {});
    }
  }, [customerName, customerStreet, deliveredNoteSent, orderId, onOrderUpdated]);

  // Synchronize with external status updates from kitchen admin
  useEffect(() => {
    setLocalStatus(backendStatus);

    if (backendStatus === "delivered") {
      // Admin clicked "Confirm Delivered"
      setIsDriving(false);
      setRiderProgress(1.0);
      setCurrentSpeed(0);
      setEtaSeconds(0);

      if (!deliveredNoteSent) {
        setDeliveredNoteSent(true);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 100,
            sender: "driver",
            text: `🎉 Namaste ${customerName}! Order delivered to ${customerStreet}. Thank you for choosing Foodie Royal! ⭐`,
            time: "Just now",
          },
        ]);
      }
    } else if (backendStatus === "out_for_delivery") {
      // Admin clicked "Start Bike & Dispatch (Out for Delivery)" -> automatically start bike journey!
      if (!isDriving && riderProgress < 0.99) {
        setIsDriving(true);
        setCurrentSpeed(40);
      }
    } else if (backendStatus === "preparing") {
      setIsDriving(false);
      setRiderProgress(0.10);
      setCurrentSpeed(0);
    } else if (backendStatus === "confirmed") {
      setIsDriving(false);
      setRiderProgress(0.05);
      setCurrentSpeed(0);
    } else {
      setIsDriving(false);
      setRiderProgress(0.02);
      setCurrentSpeed(0);
    }
  }, [backendStatus, customerName, customerStreet, deliveredNoteSent, isDriving, riderProgress]);

  // Smooth, stable 30ms high-resolution animation loop when bike is driving to address
  useEffect(() => {
    if (!isDriving || isDelivered) {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
      return;
    }

    let tick = 0;
    // Step size: normal mode completes journey in ~16s (step 0.002 every 30ms), fast mode in ~2s (step 0.015)
    const step = fastMode ? 0.015 : 0.0022;

    animTimerRef.current = setInterval(() => {
      tick++;

      setRiderProgress((prev) => {
        const next = prev + step;
        if (next >= 1.0) {
          clearInterval(animTimerRef.current);
          handleReachDestination();
          return 1.0;
        }
        return next;
      });

      // Realistic speed fluctuation (38 - 45 km/h)
      if (!fastMode) {
        setCurrentSpeed(Math.floor(38 + Math.sin(tick * 0.2) * 5));
      } else {
        setCurrentSpeed(68);
      }

      // Decrement countdown
      setEtaSeconds((prev) => (prev > 5 ? prev - 1 : 1));
    }, 30);

    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    };
  }, [isDriving, isDelivered, fastMode, handleReachDestination]);

  // Manual interactive trigger: Start bike live ride
  const handleStartDeliveryRun = (fast = false) => {
    setFastMode(fast);
    if (riderProgress >= 0.99) {
      setRiderProgress(0.08);
    }
    setLocalStatus("out_for_delivery");
    setIsDriving(true);
    setCurrentSpeed(fast ? 65 : 40);
  };

  // Manual interactive trigger: Reset to kitchen
  const handleResetToKitchen = () => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    setIsDriving(false);
    setFastMode(false);
    setRiderProgress(0.02);
    setCurrentSpeed(0);
    setEtaSeconds(720);
    setDeliveredNoteSent(false);
    setLocalStatus("preparing");
  };

  // Format countdown mm:ss
  const formatCountdown = (secs) => {
    if (isDelivered) return "Delivered 🎉";
    if (!isOut && !isDriving) return "Queued in Kitchen";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Distance remaining in kilometers
  const distanceKm = isDelivered
    ? "0.0"
    : Math.max(0.1, (1 - riderProgress) * 3.8).toFixed(1);

  // Send quick chat message
  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: textToSend.trim(),
      time: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setCustomMsg("");
    setIsTyping(true);

    setTimeout(() => {
      let replyText = "Received your note! Following your instructions carefully. Arriving soon!";
      if (textToSend.includes("security"))
        replyText = "Understood! Will safely hand over to building security.";
      else if (textToSend.includes("doorbell"))
        replyText = "Got it! Will ring the bell when I reach your door.";
      else if (textToSend.includes("gate"))
        replyText = "Great, see you at the front gate in a few minutes!";

      const driverReply = {
        id: Date.now() + 1,
        sender: "driver",
        text: replyText,
        time: "Just now",
      };
      setMessages((prev) => [...prev, driverReply]);
      setIsTyping(false);
    }, 1200);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="live-gps-map-card">
      {/* Card Header */}
      <div className="map-card-header">
        <div className="map-title-row">
          <span className="radar-sweep-icon">📡</span>
          <div>
            <h3 className="gps-map-title">Live Satellite Delivery Telemetry</h3>
            <p className="gps-map-sub">
              Real-time GPS tracking • Autonomous bike movement to customer address
            </p>
          </div>
        </div>

        <div className="gps-live-telemetry-badge">
          <span className="live-telemetry-dot"></span>
          <span>
            {isDelivered
              ? "ARRIVED AT DOORSTEP 🎉"
              : isDriving || isOut
              ? "BIKE EN ROUTE (LIVE)"
              : backendStatus === "preparing"
              ? "IN KITCHEN (PACKING)"
              : "DISPATCH QUEUE"}
          </span>
        </div>
      </div>

      {/* Exact Customer Delivery Address Telemetry Strip */}
      <div className="exact-delivery-location-banner">
        <div className="exact-loc-left">
          <span className="loc-pin-beacon">📍</span>
          <div className="exact-loc-details">
            <div className="exact-loc-title-row">
              <span className="loc-badge-label">EXACT DESTINATION:</span>
              <strong className="exact-cust-name">{customerName}</strong>
              <span className="exact-cust-phone">({customerPhone})</span>
            </div>
            <p className="exact-street-address">
              <strong>{customerStreet}</strong>, {customerCity}{" "}
              {customerPincode ? `(${customerPincode})` : ""}
            </p>
            {customerInstructions && (
              <p className="exact-instructions-note">
                📝 <em>"{customerInstructions}"</em>
              </p>
            )}
          </div>
        </div>

        <div className="exact-loc-right">
          <div className="telemetry-coord-box">
            <span className="coord-sat-icon">🛰️</span>
            <div>
              <span className="coord-label">GPS Coordinates:</span>
              <span className="coord-val">13.0827° N, 80.2707° E</span>
            </div>
          </div>
          <div className="telemetry-dist-box">
            <span className="dist-label">Distance to Doorstep:</span>
            <strong className="dist-val">{distanceKm} KM</strong>
          </div>
        </div>
      </div>

      {/* Interactive Dispatcher Controls Bar */}
      <div className="delivery-action-control-bar">
        <div className="action-control-left">
          <span className="control-label">🛵 Live Delivery Controls:</span>
          {!isDelivered ? (
            <>
              <button
                type="button"
                className={`control-pill-btn drive-btn ${isDriving && !fastMode ? "active" : ""}`}
                onClick={() => handleStartDeliveryRun(false)}
              >
                <span>{isDriving && !fastMode ? "🛵 Bike Riding..." : "▶ Start Bike Live Ride"}</span>
              </button>
              <button
                type="button"
                className="control-pill-btn fast-btn"
                onClick={() => handleStartDeliveryRun(true)}
                title="Rapidly cruise to doorstep and automatically confirm delivery"
              >
                <span>⚡ Fast-Forward & Deliver</span>
              </button>
            </>
          ) : (
            <div className="delivered-banner-tag">
              <span>🎉 Delivered Successfully to Doorstep!</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="control-pill-btn reset-btn"
          onClick={handleResetToKitchen}
          title="Reset rider position back to kitchen"
        >
          <span>🔄 Replay Route</span>
        </button>
      </div>

      {/* Interactive Vector Topographical Street Map */}
      <div className="vector-city-map-container">
        <svg
          className="city-map-svg"
          viewBox="0 0 700 320"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background Map Grid Pattern */}
          <defs>
            <pattern
              id="cityGrid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(184, 134, 11, 0.08)"
                strokeWidth="1"
              />
            </pattern>
            <linearGradient
              id="routeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#d4af37" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter
              id="glowEffect"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Fill */}
          <rect width="700" height="320" fill="#062b1e" />
          <rect width="700" height="320" fill="url(#cityGrid)" />

          {/* City Geographic Blocks */}
          <rect
            x="40"
            y="30"
            width="130"
            height="90"
            rx="8"
            fill="rgba(255, 255, 255, 0.04)"
          />
          <text
            x="105"
            y="80"
            fill="rgba(255, 253, 249, 0.4)"
            fontSize="10"
            textAnchor="middle"
            fontWeight="bold"
          >
            CENTRAL KITCHEN DISTRICT
          </text>

          <rect
            x="210"
            y="30"
            width="170"
            height="80"
            rx="8"
            fill="rgba(16, 185, 129, 0.08)"
            stroke="rgba(16, 185, 129, 0.2)"
          />
          <text
            x="295"
            y="75"
            fill="#a7f3d0"
            fontSize="10"
            textAnchor="middle"
            fontWeight="bold"
          >
            🌳 GREENWOOD ROYAL PARK
          </text>

          <rect
            x="420"
            y="30"
            width="240"
            height="90"
            rx="8"
            fill="rgba(255, 255, 255, 0.04)"
          />
          <text
            x="540"
            y="80"
            fill="rgba(255, 253, 249, 0.4)"
            fontSize="10"
            textAnchor="middle"
            fontWeight="bold"
          >
            METRO RESIDENCES & TOWERS
          </text>

          {/* Roads & Avenues */}
          <path
            d="M 0 160 L 700 160"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="18"
          />
          <path
            d="M 0 160 L 700 160"
            stroke="rgba(184, 134, 11, 0.3)"
            strokeWidth="2"
            strokeDasharray="8 6"
          />

          <path
            d="M 180 0 L 180 320"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="14"
          />
          <path
            d="M 390 0 L 390 320"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="14"
          />
          <path
            d="M 520 0 L 520 320"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="14"
          />

          {/* S-Curved Glowing Delivery Route Line */}
          <path
            ref={routePathRef}
            id="delivery-route-path"
            d="M 90 230 C 180 230, 180 160, 290 160 S 390 160, 390 220 S 520 220, 610 220"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            filter="url(#glowEffect)"
          />
          <path
            d="M 90 230 C 180 230, 180 160, 290 160 S 390 160, 390 220 S 520 220, 610 220"
            fill="none"
            stroke="#fef08a"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            className="pulsing-dash-path"
          />

          {/* Restaurant Landmark Marker (Left Origin at 90, 230) */}
          <g transform="translate(90, 230)">
            <circle r="22" fill="rgba(184, 134, 11, 0.25)" />
            <circle r="16" fill="#b8860b" />
            <text
              y="5"
              fill="#062b1e"
              fontSize="14"
              textAnchor="middle"
              fontWeight="bold"
            >
              👑
            </text>
            <g transform="translate(0, 24)">
              <rect
                x="-75"
                y="0"
                width="150"
                height="32"
                rx="6"
                fill="#062b1e"
                stroke="#b8860b"
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="14"
                fill="#f3e5ab"
                fontSize="9.5"
                textAnchor="middle"
                fontWeight="bold"
              >
                Foodie Royal Kitchen
              </text>
              <text
                x="0"
                y="26"
                fill="rgba(243, 229, 171, 0.75)"
                fontSize="8"
                textAnchor="middle"
              >
                Central Dispatch Bay #1
              </text>
            </g>
          </g>

          {/* Destination Landmark Marker (Right Exact Address at 610, 220) */}
          <g transform="translate(610, 220)">
            <circle
              r={isDelivered ? "28" : "22"}
              fill={
                isDelivered
                  ? "rgba(16, 185, 129, 0.45)"
                  : "rgba(16, 185, 129, 0.25)"
              }
            />
            <circle r="16" fill={isDelivered ? "#10b981" : "#059669"} />
            <text
              y="5"
              fill="#ffffff"
              fontSize="14"
              textAnchor="middle"
              fontWeight="bold"
            >
              {isDelivered ? "✓" : "📍"}
            </text>
            <g transform="translate(0, 24)">
              <rect
                x="-85"
                y="0"
                width="170"
                height="34"
                rx="6"
                fill="#062b1e"
                stroke={isDelivered ? "#10b981" : "rgba(16, 185, 129, 0.7)"}
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="14"
                fill="#a7f3d0"
                fontSize="9.5"
                textAnchor="middle"
                fontWeight="bold"
              >
                {customerStreet.length > 22
                  ? customerStreet.slice(0, 22) + "..."
                  : customerStreet}
              </text>
              <text
                x="0"
                y="27"
                fill="rgba(255, 255, 255, 0.75)"
                fontSize="8"
                textAnchor="middle"
              >
                {customerCity} • {customerName}
              </text>
            </g>
          </g>

          {/* Dynamic Moving Courier Bike (Inside SVG following the exact curve) */}
          <g
            className="svg-moving-courier"
            transform={`translate(${riderPos.x}, ${riderPos.y}) rotate(${riderPos.angle || 0})`}
          >
            {/* Live Sonar Radar Waves when Riding */}
            {(isDriving || isOut) && !isDelivered && (
              <>
                <circle
                  r="28"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.5"
                  className="rider-sonar-wave"
                />
                <circle
                  r="18"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  className="rider-sonar-wave-delayed"
                />
              </>
            )}

            {/* Bike Core Halo & Circle */}
            <circle
              r="17"
              fill="#062b1e"
              stroke={isDelivered ? "#10b981" : isOut || isDriving ? "#10b981" : "#d4af37"}
              strokeWidth="2.5"
              filter="url(#glowEffect)"
            />

            {/* Vehicle Icon */}
            <text
              y="5"
              fontSize="16"
              textAnchor="middle"
              style={{
                userSelect: "none",
                transformOrigin: "center",
              }}
            >
              {isDelivered ? "🎉" : "🛵"}
            </text>

            {/* Floating Live Telemetry Badge Pill above bike */}
            <g transform="translate(0, -28)">
              <rect
                x="-70"
                y="-10"
                width="140"
                height="22"
                rx="11"
                fill="#062b1e"
                stroke={isDelivered ? "#10b981" : isOut || isDriving ? "#10b981" : "#d4af37"}
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="4"
                fill={isDelivered ? "#a7f3d0" : "#fdfbf7"}
                fontSize="9"
                textAnchor="middle"
                fontWeight="700"
              >
                {isDelivered
                  ? "🎉 ARRIVED AT DOORSTEP"
                  : isDriving || isOut
                  ? `🛵 EN ROUTE (${currentSpeed} km/h)`
                  : backendStatus === "preparing"
                  ? "🍳 IN KITCHEN (PACKING)"
                  : "📋 ORDER QUEUED"}
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Live Telemetry Sensors Grid */}
      <div className="gps-telemetry-strip">
        <div className="telemetry-pill">
          <span className="tel-icon">⏱️</span>
          <div>
            <small>Live Countdown</small>
            <strong>{formatCountdown(etaSeconds)}</strong>
          </div>
        </div>

        <div className="telemetry-pill">
          <span className="tel-icon">⚡</span>
          <div>
            <small>Partner Speed</small>
            <strong>
              {isDelivered
                ? "0 km/h (Parked at Door)"
                : `${currentSpeed} km/h (Active)`}
            </strong>
          </div>
        </div>

        <div className="telemetry-pill">
          <span className="tel-icon">📍</span>
          <div>
            <small>Distance Remaining</small>
            <strong>{isDelivered ? "0.0 km (Doorstep)" : `${distanceKm} km`}</strong>
          </div>
        </div>

        <div className="telemetry-pill">
          <span className="tel-icon">♨️</span>
          <div>
            <small>Hot Box Thermal</small>
            <strong>68°C Steam Sealed</strong>
          </div>
        </div>

        <div className="telemetry-pill">
          <span className="tel-icon">🛵</span>
          <div>
            <small>Vehicle Fleet</small>
            <strong>Royal Cargo EV #4091</strong>
          </div>
        </div>
      </div>

      {/* Driver Profile & Direct Contact */}
      <div className="driver-contact-cockpit">
        <div className="driver-profile-block">
          <div className="driver-avatar-circle">👨‍🍳</div>
          <div>
            <div className="driver-name-row">
              <strong>Raju Kumar</strong>
              <span className="driver-rating-badge">★ 4.9 (1,200+ trips)</span>
            </div>
            <p className="driver-fleet-desc">
              Royal Certified Courier • Insulated Bag • 100% Contactless Delivery
            </p>
          </div>
        </div>

        <div className="driver-call-actions">
          <a href={`tel:${customerPhone}`} className="driver-action-btn call-btn">
            <span>📞 Call Partner</span>
          </a>
        </div>
      </div>

      {/* Driver Quick-Chat Simulator */}
      <div className="driver-chat-simulator">
        <div className="chat-header">
          <div className="chat-header-left">
            <span className="chat-indicator-dot"></span>
            <div>
              <h4 className="chat-header-title">💬 Live Dispatch Chat with Courier</h4>
              <p className="chat-header-subtitle">Direct instant channel to Courier Raju Kumar</p>
            </div>
          </div>
          <span className="chat-online-badge">
            <span className="online-ping-dot"></span>{" "}
            {isDelivered ? "Delivered & Completed" : "Online & En Route"}
          </span>
        </div>

        <div className="chat-messages-scroll">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble-row ${m.sender}`}>
              <div className="chat-sender-avatar">
                {m.sender === "driver" ? "🛵" : "👤"}
              </div>
              <div className="chat-bubble-content">
                <div className="chat-sender-name">
                  {m.sender === "driver" ? "Raju Kumar (Courier)" : "You"}
                </div>
                <div className="chat-bubble">
                  <p>{m.text}</p>
                  <span className="chat-time">{m.time}</span>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-bubble-row driver">
              <div className="chat-sender-avatar">🛵</div>
              <div className="chat-bubble-content">
                <div className="chat-sender-name">Raju Kumar is typing...</div>
                <div className="chat-bubble typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Message Chips */}
        <div className="chat-quick-chips-wrapper">
          <span className="quick-chips-label">⚡ Tap to send fast instruction:</span>
          <div className="chat-quick-chips">
            {CHAT_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-chip-btn"
                onClick={() => handleSendMessage(p)}
              >
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Message Input */}
        <form
          className="chat-input-row"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(customMsg);
          }}
        >
          <input
            type="text"
            className="chat-text-input"
            placeholder="Type note to delivery partner (e.g. Landmark, gate code)..."
            value={customMsg}
            onChange={(e) => setCustomMsg(e.target.value)}
          />
          <button type="submit" className="send-chat-btn" disabled={!customMsg.trim()}>
            <span>Send</span>
            <span className="send-arrow-icon">➤</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default LiveDeliveryMap;
