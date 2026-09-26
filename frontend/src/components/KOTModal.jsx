import React, { useRef } from "react";

export const KOTModal = ({ isOpen, onClose, order }) => {
  const kotRef = useRef(null);

  if (!isOpen || !order) return null;

  const orderId = order.orderId || (order._id ? `ORD-${order._id.slice(-6).toUpperCase()}` : "ORD-FOODIE");
  const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = orderDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const handlePrint = () => {
    window.print();
  };

  const totalItemsCount = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);

  return (
    <div className="kot-modal-backdrop" onClick={onClose}>
      <div className="kot-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Actions header */}
        <div className="kot-actions-header no-print">
          <div className="kot-header-left">
            <span className="kot-badge">🎫 KITCHEN ORDER TICKET (KOT)</span>
          </div>
          <div className="kot-header-right">
            <button
              type="button"
              className="kot-action-btn print-btn"
              onClick={handlePrint}
              title="Print Kitchen Ticket"
            >
              🖨️ Print Ticket
            </button>
            <button
              type="button"
              className="kot-close-btn"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Kitchen Ticket Paper */}
        <div className="kot-ticket-paper" ref={kotRef}>
          <div className="kot-header">
            <h2 className="kot-title">FOODIE ROYAL KITCHEN</h2>
            <div className="kot-divider">================================</div>
            <h3 className="kot-subtitle">KITCHEN ORDER TICKET (KOT)</h3>
            <div className="kot-divider">================================</div>
          </div>

          <div className="kot-meta-block">
            <div className="kot-meta-row">
              <span><strong>TICKET #:</strong> KOT-{orderId}</span>
              <span><strong>ORDER:</strong> #{orderId}</span>
            </div>
            <div className="kot-meta-row">
              <span><strong>DATE:</strong> {formattedDate}</span>
              <span><strong>TIME:</strong> {formattedTime}</span>
            </div>
            <div className="kot-meta-row">
              <span><strong>TYPE:</strong> {order.deliveryAddress ? "DELIVERY" : "DINE-IN"}</span>
              <span><strong>PAYMENT:</strong> {order.paymentMethod?.toUpperCase()}</span>
            </div>
            <div className="kot-meta-row">
              <span><strong>CUSTOMER:</strong> {order.customer?.name}</span>
              <span><strong>PHONE:</strong> {order.customer?.phone}</span>
            </div>
          </div>

          <div className="kot-divider">--------------------------------</div>

          {/* Items to Cook */}
          <div className="kot-items-table">
            <div className="kot-items-header">
              <span className="kot-col-qty">QTY</span>
              <span className="kot-col-item">ITEM DESCRIPTION</span>
              <span className="kot-col-station">STATION</span>
            </div>
            <div className="kot-divider">--------------------------------</div>

            {(order.items || []).map((item, idx) => (
              <div key={idx} className="kot-item-row">
                <span className="kot-item-qty">{item.quantity}x</span>
                <div className="kot-item-details">
                  <strong className="kot-item-name">{item.name}</strong>
                  {item.category && <span className="kot-item-cat">[{item.category}]</span>}
                  {(item.specialInstructions || (item.description && item.description.includes("build:"))) && (
                    <div className="kot-item-custom-notes">
                      👨‍🍳 Note: {item.specialInstructions || item.description}
                    </div>
                  )}
                </div>
                <span className="kot-item-station">
                  {item.category?.toLowerCase().includes("drink") || item.category?.toLowerCase().includes("juice")
                    ? "🥤 BEV"
                    : item.category?.toLowerCase().includes("dessert")
                    ? "🍰 BAKE"
                    : item.category?.toLowerCase().includes("fries")
                    ? "🍟 FRY"
                    : item.category?.toLowerCase().includes("pizza")
                    ? "🍕 OVEN"
                    : "🍳 GRILL"}
                </span>
              </div>
            ))}
          </div>

          <div className="kot-divider">--------------------------------</div>

          {/* Chef Prep Notes & Instructions */}
          {order.deliveryAddress?.instructions ? (
            <div className="kot-special-instructions">
              <strong>⚠️ SPECIAL INSTRUCTIONS:</strong>
              <p>"{order.deliveryAddress.instructions}"</p>
            </div>
          ) : (
            <div className="kot-special-instructions standard">
              <span>Standard Gourmet Haute Preparation</span>
            </div>
          )}

          <div className="kot-divider">================================</div>

          <div className="kot-footer">
            <div className="kot-total-items">
              TOTAL DISHES TO PREPARE: <strong>{totalItemsCount} ITEMS</strong>
            </div>
            <p className="kot-chef-sign">Kitchen Station Dispatch • Chef Lead Initials: ________</p>
          </div>
        </div>
      </div>
    </div>
  );
};
