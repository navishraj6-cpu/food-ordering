import { API_URL } from "../config/api";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const CreateGroupModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hostName, setHostName] = useState(user?.name || "");
  const [hostPhone, setHostPhone] = useState(user?.phone || "");
  const [title, setTitle] = useState("Weekend Feast & Fun 🎉");
  const [street, setStreet] = useState("Royal Palms, 4th Block");
  const [city, setCity] = useState("Central City");
  const [pincode, setPincode] = useState("560001");
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setErrorMsg("Please enter your name as party host.");
      return;
    }

    setIsCreating(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_URL}/api/group-orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName: hostName.trim(),
          hostPhone: hostPhone.trim(),
          hostEmail: user?.email || "",
          title: title.trim(),
          street: street.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create group order");

      // Save host member ID in localStorage for this group
      localStorage.setItem(`group_member_${data.groupOrder.groupCode}`, JSON.stringify({
        id: data.hostId,
        name: hostName.trim(),
        isHost: true,
      }));

      onClose();
      navigate(`/group/${data.groupOrder.groupCode}`);
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong creating group order.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="group-modal-overlay" onClick={onClose}>
      <div className="group-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="group-modal-header">
          <div className="group-modal-title-row">
            <span className="group-party-icon">👥</span>
            <div>
              <h3>Start a Group Food Order</h3>
              <p>Invite friends & family to add their favorite dishes to one shared royal cart!</p>
            </div>
          </div>
          <button className="group-close-btn" onClick={onClose}>✕</button>
        </div>

        {errorMsg && <div className="group-error-alert">{errorMsg}</div>}

        <form onSubmit={handleCreateGroup} className="group-modal-form">
          <div className="form-group">
            <label>Your Name (Host) *</label>
            <input
              type="text"
              placeholder="e.g. Aarav Sharma"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Party Title / Occasion</label>
            <input
              type="text"
              placeholder="e.g. Friday Burger Night"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Host Phone Number</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={hostPhone}
                onChange={(e) => setHostPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Delivery City</label>
              <input
                type="text"
                placeholder="Central City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Delivery Street Address</label>
            <input
              type="text"
              placeholder="Apartment, Street, Landmark"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
            />
          </div>

          <div className="group-features-highlight">
            <div className="highlight-pill">🔗 Shareable Invite Link</div>
            <div className="highlight-pill">🛒 Multi-Device Live Cart</div>
            <div className="highlight-pill">💳 Instant Bill Splitter</div>
          </div>

          <button type="submit" className="group-submit-btn" disabled={isCreating}>
            {isCreating ? "Creating Royal Session..." : "🚀 Launch Group Order & Get Link"}
          </button>
        </form>
      </div>
    </div>
  );
};
