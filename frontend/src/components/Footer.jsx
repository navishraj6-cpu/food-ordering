import React from "react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="foodie-footer">
      <div className="footer-top-strip">
        <div className="feature-badge">
          <span className="feature-icon">⚡</span>
          <div>
            <strong>30 Min Delivery</strong>
            <p>Superfast hot delivery to your doorstep</p>
          </div>
        </div>
        <div className="feature-badge">
          <span className="feature-icon">🌿</span>
          <div>
            <strong>100% Fresh Quality</strong>
            <p>Gourmet grade authentic recipes</p>
          </div>
        </div>
        <div className="feature-badge">
          <span className="feature-icon">🛡️</span>
          <div>
            <strong>Zero Contact Delivery</strong>
            <p>Safety & hygiene certified kitchen</p>
          </div>
        </div>
      </div>

      <div className="footer-main-grid">
        {/* Col 1: Brand */}
        <div className="footer-col brand-col">
          <div className="footer-brand-title">
            <span>👑</span>
            <h3>Foodie</h3>
          </div>
          <p className="footer-about-text">
            Crafting gourmet moments with fresh hand-tossed pizzas, artisan smash burgers,
            crunchy buffalo wings, and royal desserts. Good Food, Good Mood!
          </p>
          <div className="footer-social-row">
            <span className="social-pill" title="Instagram">📸 @foodie.royal</span>
            <span className="social-pill" title="Twitter">🐦 @foodie_eats</span>
            <span className="social-pill" title="Facebook">📘 Foodie Official</span>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="footer-col">
          <h4 className="footer-heading">Quick Navigation</h4>
          <ul className="footer-links-list">
            <li><Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>🏠 Home Page</Link></li>
            <li><Link to="/">🍕 Full Gourmet Menu</Link></li>
            <li><Link to="/about">✨ About Us & Heritage</Link></li>
            <li><Link to="/reservation">🍽️ Reserve Table / Fine Dining</Link></li>
            <li><Link to="/orders">📦 Track Active Orders</Link></li>
            <li><Link to="/auth">🔐 Customer Account Login</Link></li>
          </ul>
        </div>

        {/* Col 3: Popular Categories */}
        <div className="footer-col">
          <h4 className="footer-heading">Royal Favorites</h4>
          <ul className="footer-links-list">
            <li><span>🍔 Artisan Smash Burgers</span></li>
            <li><span>🍕 Stone-Baked Gourmet Pizzas</span></li>
            <li><span>🍗 Crispy Wings & Nuggets</span></li>
            <li><span>🍰 Kunafah & Tiramisu Desserts</span></li>
          </ul>
        </div>

        {/* Col 4: Kitchen Timing */}
        <div className="footer-col">
          <h4 className="footer-heading">Kitchen Timings</h4>
          <div className="kitchen-hours-card">
            <p className="status-open">● We are currently OPEN & DELIVERING</p>
            <p className="hours-time">Mon - Sun: <strong>11:00 AM – 11:30 PM</strong></p>
            <p className="support-contact">📞 Support: <strong>+91 98765 43210</strong></p>
            <p className="support-email">✉️ orders@foodieroyal.com</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p>© 2026 Foodie Royal Restaurant Pvt Ltd. All rights reserved.</p>
        <p className="footer-made-with">Handcrafted with ❤️ for food lovers</p>
      </div>
    </footer>
  );
};
