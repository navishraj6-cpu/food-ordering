import React, { useRef } from "react";

// Convert number to Indian currency words
const numberToWords = (num) => {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const inWords = (n) => {
    if (n === 0) return "Zero";
    let str = "";
    if (Math.floor(n / 10000000) > 0) {
      str += inWords(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (Math.floor(n / 100000) > 0) {
      str += inWords(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (Math.floor(n / 1000) > 0) {
      str += inWords(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (Math.floor(n / 100) > 0) {
      str += inWords(Math.floor(n / 100)) + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) str += a[n];
      else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) str += " " + a[n % 10];
      }
    }
    return str.trim();
  };

  return inWords(Math.round(Number(num) || 0)) + " Rupees Only";
};

export const ReceiptModal = ({ isOpen, onClose, order }) => {
  const receiptRef = useRef(null);

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
  });

  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const tax = Number(order.tax || 0);
  const discount = Number(order.discount || 0);
  const pointsDiscount = Number(order.redeemedPoints ? order.redeemedPoints / 10 : 0);
  const totalAmount = Number(order.totalAmount || subtotal + deliveryFee + tax - discount - pointsDiscount);

  const cgst = (tax / 2).toFixed(2);
  const sgst = (tax / 2).toFixed(2);

  const isPaid = order.paymentStatus === "completed";
  const paymentMethodLabel = (
    order.paymentDetails?.provider ||
    order.paymentMethod ||
    "Online Pay"
  ).toUpperCase();

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Instant HTML / Printable Download handler
  const handleDownload = () => {
    const receiptElement = receiptRef.current;
    if (!receiptElement) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Tax_Invoice_${orderId}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              background: #fdfbf7;
              color: #1a1a1a;
              padding: 24px;
              display: flex;
              justify-content: center;
            }
            .invoice-wrapper {
              width: 100%;
              max-width: 680px;
              background: #ffffff;
              border: 2px solid #d4af37;
              border-radius: 12px;
              padding: 32px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            }
            .header { text-align: center; border-bottom: 2px dashed #e2d9cc; padding-bottom: 20px; margin-bottom: 20px; }
            .brand-crest { font-size: 32px; color: #b8860b; line-height: 1; margin-bottom: 6px; }
            .brand-name { font-family: 'Cinzel', serif; font-size: 24px; font-weight: 800; color: #064e3b; letter-spacing: 2px; }
            .brand-sub { font-size: 11px; text-transform: uppercase; color: #856404; letter-spacing: 1.5px; font-weight: 600; margin-top: 2px; }
            .lic-info { font-size: 11px; color: #666; margin-top: 8px; }
            .tax-tag { display: inline-block; background: #064e3b; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 3px 12px; border-radius: 20px; margin-top: 8px; }
            
            .meta-grid { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 20px; font-size: 12px; }
            .meta-block { flex: 1; background: #faf6ee; padding: 12px 14px; border-radius: 8px; border: 1px solid #ebdcc5; }
            .meta-block h4 { font-size: 11px; text-transform: uppercase; color: #856404; margin-bottom: 6px; letter-spacing: 0.5px; }
            .meta-block p { color: #2d3748; line-height: 1.4; }
            .meta-block strong { color: #111; }
            
            .paid-stamp {
              border: 2px solid #059669;
              color: #059669;
              display: inline-block;
              font-weight: 800;
              font-size: 11px;
              letter-spacing: 1px;
              padding: 2px 8px;
              border-radius: 4px;
              margin-top: 4px;
            }
            .cod-stamp {
              border: 2px solid #d97706;
              color: #d97706;
              display: inline-block;
              font-weight: 800;
              font-size: 11px;
              letter-spacing: 1px;
              padding: 2px 8px;
              border-radius: 4px;
              margin-top: 4px;
            }
            
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .items-table th { background: #064e3b; color: #fff; text-align: left; padding: 10px 12px; font-weight: 600; }
            .items-table th.right, .items-table td.right { text-align: right; }
            .items-table td { padding: 10px 12px; border-bottom: 1px solid #f0e6d6; color: #2d3748; }
            .items-table tr:nth-child(even) { background: #faf8f5; }
            
            .calc-section { display: flex; justify-content: flex-end; margin-bottom: 20px; }
            .calc-box { width: 280px; font-size: 12px; }
            .calc-row { display: flex; justify-content: space-between; padding: 4px 0; color: #555; }
            .calc-row.discount { color: #059669; font-weight: 600; }
            .calc-total { display: flex; justify-content: space-between; padding: 10px 0 6px; border-top: 2px solid #064e3b; margin-top: 6px; font-size: 16px; font-weight: 800; color: #064e3b; }
            .words-row { font-size: 10.5px; color: #718096; font-style: italic; text-align: right; margin-top: 2px; }
            
            .footer-strip {
              border-top: 2px dashed #e2d9cc;
              padding-top: 16px;
              text-align: center;
              font-size: 11px;
              color: #718096;
            }
            .footer-strip p { margin-bottom: 4px; }
            .footer-crest { color: #b8860b; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="header">
              <div class="brand-crest">👑</div>
              <div class="brand-name">FOODIE ROYAL</div>
              <div class="brand-sub">Haute Cuisine & Luxury Dining</div>
              <div class="lic-info">
                GSTIN: 27AABCF1234F1Z8 • FSSAI Lic No: 11521019000452<br />
                The Royal Pavilion, Marine Drive, Mumbai, Maharashtra 400020 • Tel: +91 (022) 2890-FOOD
              </div>
              <span class="tax-tag">ORIGINAL TAX INVOICE</span>
            </div>

            <div class="meta-grid">
              <div class="meta-block">
                <h4>Invoice Details</h4>
                <p><strong>Invoice No:</strong> ${orderId}</p>
                <p><strong>Date & Time:</strong> ${formattedDate}, ${formattedTime}</p>
                <p><strong>Payment:</strong> ${paymentMethodLabel}</p>
                ${
                  order.transactionId
                    ? `<p><strong>Txn ID:</strong> ${order.transactionId}</p>`
                    : ""
                }
                <div>
                  ${
                    isPaid
                      ? '<span class="paid-stamp">✓ PAYMENT VERIFIED</span>'
                      : '<span class="cod-stamp">⏳ COD (PAYMENT ON ARRIVAL)</span>'
                  }
                </div>
              </div>

              <div class="meta-block">
                <h4>Billed & Delivered To</h4>
                <p><strong>${order.customer?.name || "Valued Patron"}</strong></p>
                <p>📞 ${order.customer?.phone || ""}</p>
                <p>${order.deliveryAddress?.street || ""}, ${
      order.deliveryAddress?.city || "Mumbai"
    } - ${order.deliveryAddress?.pincode || "400001"}</p>
                ${
                  order.deliveryAddress?.instructions
                    ? `<p style="font-style:italic;color:#666;">Note: "${order.deliveryAddress.instructions}"</p>`
                    : ""
                }
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 35px;">#</th>
                  <th>Dish Item</th>
                  <th style="width: 60px; text-align: center;">Qty</th>
                  <th class="right" style="width: 90px;">Rate</th>
                  <th class="right" style="width: 100px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || [])
                  .map(
                    (item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>
                      <strong>${item.name}</strong> ${
                        item.category
                          ? `<span style="font-size:10px; color:#888;">(${item.category})</span>`
                          : ""
                      }
                      ${
                        item.specialInstructions || (item.description && item.description.includes("build:"))
                          ? `<div style="font-size:10px; color:#065f46; font-style:italic; margin-top:2px;">Note: ${item.specialInstructions || item.description}</div>`
                          : ""
                      }
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td class="right">₹${item.price}</td>
                    <td class="right">₹${item.price * item.quantity}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="calc-section">
              <div class="calc-box">
                <div class="calc-row">
                  <span>Subtotal</span>
                  <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="calc-row">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div class="calc-row">
                  <span>CGST (2.5%)</span>
                  <span>₹${cgst}</span>
                </div>
                <div class="calc-row">
                  <span>SGST (2.5%)</span>
                  <span>₹${sgst}</span>
                </div>
                ${
                  discount > 0
                    ? `
                  <div class="calc-row discount">
                    <span>Promo Discount (${order.couponApplied || "PROMO"})</span>
                    <span>− ₹${discount.toFixed(2)}</span>
                  </div>
                `
                    : ""
                }
                ${
                  pointsDiscount > 0
                    ? `
                  <div class="calc-row discount">
                    <span>Gold Coins (100 Pts)</span>
                    <span>− ₹${pointsDiscount.toFixed(2)}</span>
                  </div>
                `
                    : ""
                }
                <div class="calc-total">
                  <span>Grand Total</span>
                  <span>₹${totalAmount.toFixed(2)}</span>
                </div>
                <div class="words-row">
                  ${numberToWords(totalAmount)}
                </div>
              </div>
            </div>

            <div class="footer-strip">
              <p class="footer-crest">👑 Thank you for dining with Foodie Royal Haute Cuisine!</p>
              <p>For any inquiries regarding this order, please reach our 24/7 concierge at concierge@foodieroyal.com</p>
              <p style="font-size: 9.5px; margin-top: 6px;">This is a computer-generated official tax invoice under Section 31 of CGST Act, 2017.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Invoice_${orderId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div
        className="receipt-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Action Bar */}
        <div className="receipt-actions-header no-print">
          <div className="actions-header-left">
            <span className="receipt-modal-badge">
              📄 Official Tax Invoice & Bill
            </span>
          </div>
          <div className="actions-header-right">
            <button
              type="button"
              className="receipt-action-btn print-btn"
              onClick={handlePrint}
              title="Print Receipt"
            >
              🖨️ Print
            </button>
            <button
              type="button"
              className="receipt-action-btn download-btn"
              onClick={handleDownload}
              title="Download HTML/PDF Receipt"
            >
              ⬇️ Download Receipt
            </button>
            <button
              type="button"
              className="receipt-close-btn"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="receipt-paper-view" ref={receiptRef}>
          {/* Header */}
          <div className="receipt-header-section">
            <div className="receipt-brand-logo">
              <span className="royal-crown-glyph">👑</span>
              <h1 className="royal-restaurant-name">FOODIE ROYAL</h1>
              <p className="royal-tagline">Haute Cuisine & Luxury Dining</p>
            </div>
            <div className="receipt-tax-strip">
              <span className="tax-invoice-pill">TAX INVOICE / CASH RECEIPT</span>
              <p className="lic-number-row">
                GSTIN: <strong>27AABCF1234F1Z8</strong> • FSSAI Lic: <strong>11521019000452</strong>
              </p>
              <p className="store-address-row">
                The Royal Pavilion, Marine Drive, Mumbai, Maharashtra 400020
              </p>
            </div>
          </div>

          {/* Meta Grid */}
          <div className="receipt-meta-grid">
            <div className="receipt-meta-column">
              <div className="meta-item">
                <span className="meta-label">Invoice / Order ID:</span>
                <strong className="meta-val highlight-order">{orderId}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Date & Time:</span>
                <span className="meta-val">
                  {formattedDate}, {formattedTime}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Payment Mode:</span>
                <span className="meta-val">{paymentMethodLabel}</span>
              </div>
              {order.transactionId && (
                <div className="meta-item">
                  <span className="meta-label">Transaction Ref:</span>
                  <code className="meta-code">{order.transactionId}</code>
                </div>
              )}
            </div>

            <div className="receipt-meta-column customer-column">
              <div className="meta-item">
                <span className="meta-label">Customer Name:</span>
                <strong className="meta-val">
                  {order.customer?.name || "Valued Patron"}
                </strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Phone:</span>
                <span className="meta-val">{order.customer?.phone || "—"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Delivery Address:</span>
                <span className="meta-val">
                  {order.deliveryAddress?.street}, {order.deliveryAddress?.city}{" "}
                  {order.deliveryAddress?.pincode}
                </span>
              </div>
              <div className="meta-stamp-row">
                {isPaid ? (
                  <span className="receipt-stamp-paid">✓ PAID ONLINE</span>
                ) : (
                  <span className="receipt-stamp-cod">⏳ COD DUE (₹{totalAmount})</span>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="receipt-table-wrapper">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th className="col-sr">#</th>
                  <th className="col-desc">Dish Item</th>
                  <th className="col-qty">Qty</th>
                  <th className="col-rate">Rate</th>
                  <th className="col-amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="col-sr">{idx + 1}</td>
                    <td className="col-desc">
                      <strong>{item.name}</strong>
                      {item.category && (
                        <span className="item-sub-cat"> ({item.category})</span>
                      )}
                      {(item.specialInstructions || (item.description && item.description.includes("build:"))) && (
                        <div className="receipt-item-sub-note">
                          👨‍🍳 Note: {item.specialInstructions || item.description}
                        </div>
                      )}
                    </td>
                    <td className="col-qty">{item.quantity}</td>
                    <td className="col-rate">₹{item.price}</td>
                    <td className="col-amount">₹{item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Calculations */}
          <div className="receipt-bottom-summary">
            {/* Left note & QR */}
            <div className="receipt-summary-left">
              <div className="receipt-auth-qr">
                {/* SVG Authenticity QR code */}
                <svg
                  className="auth-qr-svg"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="100" height="100" fill="#ffffff" />
                  <rect x="10" y="10" width="25" height="25" fill="#064e3b" rx="2" />
                  <rect x="15" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="18" width="9" height="9" fill="#d4af37" />

                  <rect x="65" y="10" width="25" height="25" fill="#064e3b" rx="2" />
                  <rect x="70" y="15" width="15" height="15" fill="#ffffff" />
                  <rect x="73" y="18" width="9" height="9" fill="#d4af37" />

                  <rect x="10" y="65" width="25" height="25" fill="#064e3b" rx="2" />
                  <rect x="15" y="70" width="15" height="15" fill="#ffffff" />
                  <rect x="18" y="73" width="9" height="9" fill="#d4af37" />

                  <rect x="42" y="15" width="6" height="6" fill="#111" />
                  <rect x="52" y="15" width="6" height="12" fill="#111" />
                  <rect x="42" y="30" width="16" height="6" fill="#111" />
                  <rect x="15" y="45" width="6" height="12" fill="#111" />
                  <rect x="30" y="45" width="12" height="6" fill="#111" />
                  <rect x="50" y="45" width="16" height="6" fill="#111" />
                  <rect x="75" y="45" width="12" height="12" fill="#111" />
                  <rect x="45" y="65" width="8" height="8" fill="#111" />
                  <rect x="60" y="65" width="12" height="6" fill="#111" />
                  <rect x="78" y="65" width="8" height="18" fill="#111" />
                  <rect x="45" y="80" width="18" height="6" fill="#111" />
                </svg>
                <div className="auth-qr-label">
                  <strong>Digital Verification</strong>
                  <span>Scan to verify order origin</span>
                </div>
              </div>
            </div>

            {/* Right calculations */}
            <div className="receipt-summary-right">
              <div className="summary-calc-row">
                <span>Item Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-calc-row">
                <span>Packaging & Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="summary-calc-row">
                <span>CGST (2.5%)</span>
                <span>₹{cgst}</span>
              </div>
              <div className="summary-calc-row">
                <span>SGST (2.5%)</span>
                <span>₹{sgst}</span>
              </div>
              {discount > 0 && (
                <div className="summary-calc-row discount-row">
                  <span>Promo Discount ({order.couponApplied || "PROMO"})</span>
                  <span>− ₹${discount.toFixed(2)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="summary-calc-row discount-row">
                  <span>Foodie Gold Coins (100 Pts)</span>
                  <span>− ₹${pointsDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="summary-grand-total-box">
                <div className="grand-total-row">
                  <span>Total Amount</span>
                  <span className="grand-price">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="total-in-words">
                  {numberToWords(totalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="receipt-footer-strip">
            <p className="footer-greeting">
              👑 Thank you for indulging with Foodie Royal Haute Cuisine!
            </p>
            <p className="footer-subtext">
              Chef & Kitchen Concierge: <strong>+91 (022) 2890-FOOD</strong> • concierge@foodieroyal.com
            </p>
            <p className="footer-tax-compliance">
              Computer-generated official tax invoice under Section 31 of CGST Act, 2017.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
