const nodemailer = require("nodemailer");

/**
 * Configure Nodemailer transport
 * If SMTP credentials are provided in environment variables, use them.
 * Otherwise, initialize a graceful mock transporter for seamless development.
 */
let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log("📧 Live SMTP email service configured successfully.");
} else {
  console.log("ℹ️ Running in Notification Preview Mode (Transporter logs HTML output).");
}

const FROM_EMAIL = process.env.EMAIL_FROM || '"👑 Foodie Royal Dining" <orders@foodie-royal.com>';

/**
 * Send Royal HTML Order Confirmation Receipt
 */
async function sendOrderConfirmationEmail(order) {
  if (!order || !order.customer || !order.customer.email) {
    return { success: false, reason: "No customer email provided" };
  }

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #27272a;">
        <td style="padding: 12px 8px; color: #f4f4f5; font-size: 14px; font-weight: 500;">
          ${item.name} <span style="color: #a1a1aa; font-size: 12px;">× ${item.quantity}</span>
          ${item.specialInstructions ? `<br><small style="color: #d4af37; font-size: 11px;">Note: ${item.specialInstructions}</small>` : ""}
        </td>
        <td style="padding: 12px 8px; color: #10b981; font-weight: 600; text-align: right; font-size: 14px;">
          ₹${item.price * item.quantity}
        </td>
      </tr>
    `
    )
    .join("");

  const trackingUrl = `http://localhost:5173/track/${order.orderId}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Foodie Royal Dining</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
      <div style="max-width: 600px; margin: 0 auto; background: #18181b; border: 1px solid #3f3f46; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #d97706 100%); padding: 30px 24px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">👑</div>
          <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            FOODIE ROYAL DINING
          </h1>
          <p style="margin: 6px 0 0; color: #fef08a; font-size: 14px; font-weight: 500;">
            Order Confirmation & Invoice Receipt
          </p>
        </div>

        <!-- Body Content -->
        <div style="padding: 24px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="display: inline-block; background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; padding: 6px 16px; border-radius: 9999px; font-weight: 600; font-size: 13px;">
              ✓ ORDER CONFIRMED & KITCHEN NOTIFIED
            </span>
          </div>

          <p style="font-size: 15px; color: #e4e4e7; line-height: 1.5; margin: 0 0 16px;">
            Namaste <strong>${order.customer.name}</strong>,<br>
            Thank you for dining with Foodie Royal. Our master chefs are already preparing your gourmet dishes with artisanal ingredients!
          </p>

          <!-- Order Summary Card -->
          <div style="background: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #3f3f46; padding-bottom: 10px; margin-bottom: 10px;">
              <span style="color: #a1a1aa; font-size: 13px;">Order Number:</span>
              <strong style="color: #facc15; font-size: 14px; font-family: monospace;">#${order.orderId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #3f3f46; padding-bottom: 10px; margin-bottom: 10px;">
              <span style="color: #a1a1aa; font-size: 13px;">Estimated Arrival:</span>
              <strong style="color: #34d399; font-size: 14px;">~${order.estimatedDeliveryMinutes || 35} Minutes</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #a1a1aa; font-size: 13px;">Payment Method:</span>
              <strong style="color: #f4f4f5; font-size: 13px; text-transform: uppercase;">${order.paymentMethod} (${order.paymentStatus})</strong>
            </div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #3f3f46;">
                <th style="padding: 8px; text-align: left; color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Dish Item</th>
                <th style="padding: 8px; text-align: right; color: #a1a1aa; font-size: 12px; text-transform: uppercase;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Pricing Breakdown -->
          <div style="background: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #a1a1aa;">
              <span>Subtotal</span>
              <span style="color: #f4f4f5;">₹${order.subtotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #a1a1aa;">
              <span>Taxes & GST</span>
              <span style="color: #f4f4f5;">₹${order.tax}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #a1a1aa;">
              <span>Delivery Fee</span>
              <span style="color: #f4f4f5;">${order.deliveryFee === 0 ? "FREE" : "₹" + order.deliveryFee}</span>
            </div>
            ${
              order.discount > 0
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #34d399;">
                    <span>Royal Discount (${order.couponApplied || "Loyalty"})</span>
                    <span>-₹${order.discount}</span>
                  </div>`
                : ""
            }
            <div style="border-top: 1px solid #3f3f46; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-size: 16px; font-weight: bold;">
              <span style="color: #f4f4f5;">Grand Total</span>
              <span style="color: #facc15;">₹${order.totalAmount}</span>
            </div>
          </div>

          <!-- Delivery Address -->
          <div style="background: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 8px; color: #facc15; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">📍 Delivery Destination</h4>
            <p style="margin: 0; color: #d4d4d8; font-size: 13px; line-height: 1.4;">
              ${order.deliveryAddress.street}, ${order.deliveryAddress.city} ${order.deliveryAddress.pincode ? "- " + order.deliveryAddress.pincode : ""}<br>
              ${order.deliveryAddress.instructions ? `<em style="color: #a1a1aa;">Note: ${order.deliveryAddress.instructions}</em>` : ""}
            </p>
          </div>

          <!-- Live Tracking CTA -->
          <div style="text-align: center; margin: 30px 0 10px;">
            <a href="${trackingUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);">
              🛵 Track Live Order Progress →
            </a>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #09090b; padding: 20px; text-align: center; border-top: 1px solid #27272a; font-size: 12px; color: #71717a;">
          <p style="margin: 0 0 6px;">Foodie Royal Dining • Michelin-Grade Craft Cuisine</p>
          <p style="margin: 0;">Need assistance? Contact our concierge at support@foodie-royal.com or +91 98765 43210</p>
        </div>

      </div>
    </body>
    </html>
  `;

  try {
    if (transporter) {
      const info = await transporter.sendMail({
        from: FROM_EMAIL,
        to: order.customer.email,
        subject: `👑 Order Confirmed #${order.orderId} - Foodie Royal Dining`,
        html: htmlContent,
      });
      console.log(`📧 Order confirmation email sent to ${order.customer.email}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`📧 [Simulated Email] Sent Order Confirmation #${order.orderId} to ${order.customer.email}`);
      return { success: true, simulated: true };
    }
  } catch (err) {
    console.warn(`Could not send order confirmation email to ${order.customer.email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Royal HTML Order Status Update Notification
 */
async function sendOrderStatusUpdateEmail(order, status) {
  if (!order || !order.customer || !order.customer.email) return { success: false };

  const statusLabels = {
    confirmed: { title: "Order Confirmed & Sent to Kitchen", emoji: "👨‍🍳", color: "#10b981" },
    preparing: { title: "Kitchen Is Sizzling & Grilling Your Feast", emoji: "🔥", color: "#f59e0b" },
    out_for_delivery: { title: "Royal Delivery Partner is on the Way!", emoji: "🛵", color: "#06b6d4" },
    delivered: { title: "Order Delivered! Bon Appétit", emoji: "🎉", color: "#10b981" },
    cancelled: { title: "Order Cancelled", emoji: "❌", color: "#ef4444" },
  };

  const currentInfo = statusLabels[status] || { title: `Status: ${status}`, emoji: "📦", color: "#10b981" };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #09090b; font-family: sans-serif; color: #f4f4f5;">
      <div style="max-width: 550px; margin: 0 auto; background: #18181b; border: 1px solid #3f3f46; border-radius: 16px; overflow: hidden;">
        <div style="background: ${currentInfo.color}; padding: 24px; text-align: center; color: #fff;">
          <div style="font-size: 36px; margin-bottom: 6px;">${currentInfo.emoji}</div>
          <h2 style="margin: 0; font-size: 20px;">${currentInfo.title}</h2>
          <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Order #${order.orderId}</p>
        </div>
        <div style="padding: 20px; text-align: center;">
          <p style="font-size: 14px; color: #d4d4d8;">
            Hi <strong>${order.customer.name}</strong>, your order status has been updated to <strong>${status.replace(/_/g, " ").toUpperCase()}</strong>.
          </p>
          <div style="margin: 20px 0;">
            <a href="http://localhost:5173/track/${order.orderId}" style="background: #10b981; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: inline-block;">
              View Live Tracker →
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (transporter) {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to: order.customer.email,
        subject: `${currentInfo.emoji} Update on Order #${order.orderId}: ${currentInfo.title}`,
        html: htmlContent,
      });
    } else {
      console.log(`📧 [Simulated Email] Sent Status Update (${status}) for #${order.orderId} to ${order.customer.email}`);
    }
    return { success: true };
  } catch (err) {
    console.warn("Could not send status update email:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Table Reservation Confirmation Email
 */
async function sendReservationConfirmationEmail(reservation) {
  if (!reservation || !reservation.email) return { success: false, reason: "No email provided" };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px; background-color: #09090b; font-family: sans-serif; color: #f4f4f5;">
      <div style="max-width: 580px; margin: 0 auto; background: #18181b; border: 1px solid #d4af37; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(212, 175, 55, 0.2);">
        <div style="background: linear-gradient(135deg, #1c1917 0%, #292524 100%); padding: 28px; text-align: center; border-bottom: 2px solid #d4af37;">
          <div style="font-size: 32px; margin-bottom: 6px;">🏛️ 👑</div>
          <h1 style="margin: 0; color: #facc15; font-size: 22px; letter-spacing: 1px;">ROYAL VIP RESERVATION CONFIRMED</h1>
          <p style="margin: 4px 0 0; color: #e7e5e4; font-size: 13px;">Pass Code: <strong>${reservation.reservationId}</strong></p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 15px; color: #e4e4e7; line-height: 1.5; margin: 0 0 16px;">
            Honored Guest <strong>${reservation.guestName}</strong>,<br>
            Your exclusive dining reservation has been confirmed with premier hostess concierge seating.
          </p>
          <div style="background: #27272a; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="margin-bottom: 8px;">📅 <strong>Date:</strong> ${reservation.date}</div>
            <div style="margin-bottom: 8px;">⏰ <strong>Time Slot:</strong> ${reservation.timeSlot}</div>
            <div style="margin-bottom: 8px;">👥 <strong>Party Size:</strong> ${reservation.guestCount} Guests</div>
            <div style="margin-bottom: 8px;">🪑 <strong>Table(s):</strong> ${reservation.tableNumber} (${reservation.tableName || "Reserved Area"})</div>
            <div style="margin-bottom: 8px;">📍 <strong>Dining Zone:</strong> ${reservation.seatingArea}</div>
            <div>🎉 <strong>Occasion:</strong> ${reservation.occasion}</div>
          </div>
          <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin: 0;">
            Please present this VIP Pass code upon arrival. We hold reservations up to 15 minutes past scheduled slot.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    if (transporter) {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to: reservation.email,
        subject: `👑 VIP Table Reservation Confirmed (${reservation.reservationId}) - Foodie Royal`,
        html: htmlContent,
      });
      console.log(`📧 Reservation email sent to ${reservation.email}`);
    } else {
      console.log(`📧 [Simulated Email] Sent Reservation Voucher #${reservation.reservationId} to ${reservation.email}`);
    }
    return { success: true };
  } catch (err) {
    console.warn("Could not send reservation email:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Simulated SMS / WhatsApp Message Dispatcher
 */
async function sendSMSNotification({ to, message, orderId }) {
  console.log(`📱 [SMS/WhatsApp Gateway] Dispatched to ${to}: "${message}" (Ref: ${orderId || "N/A"})`);
  return {
    success: true,
    channel: "SMS/WhatsApp",
    recipient: to,
    status: "delivered",
    timestamp: new Date(),
  };
}

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendReservationConfirmationEmail,
  sendSMSNotification,
};
