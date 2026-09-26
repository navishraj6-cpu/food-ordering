import React from "react";
import { Link } from "react-router-dom";

export const AboutPage = () => {
  return (
    <div className="about-page-container">
      {/* Hero Section */}
      <section className="about-hero-section">
        <div className="about-hero-badge">👑 Royal Culinary Craftsmanship</div>
        <h1 className="about-hero-title">
          Crafting Unforgettable Flavors, <br />
          <span className="highlight-text">One Dish at a Time</span>
        </h1>
        <p className="about-hero-subtitle">
          At Foodie, we blend time-honored artisanal culinary techniques with modern gourmet
          creativity. Every smash burger, stone-baked pizza, and delicate dessert is prepared with passion,
          premium organic ingredients, and royal hospitality.
        </p>
      </section>

      {/* Story & Philosophy Split Section */}
      <section className="about-story-section">
        <div className="about-story-grid">
          <div className="about-story-content">
            <span className="story-label">✨ OUR JOURNEY</span>
            <h2 className="story-heading">From a Humble Kitchen to a Gourmet Foodie Kingdom</h2>
            <p className="story-p">
              Founded with a dream to redefine fast-casual dining into a fine culinary feast, Foodie began
              as an artisan kitchen driven by one core philosophy: <em>Food made with genuine love and top-tier ingredients heals the soul.</em>
            </p>
            <p className="story-p">
              We source our fresh vegetables from local organic farmers, grind our burger patties in-house daily,
              slow-ferment our sourdough pizza dough for 48 hours, and craft authentic middle-eastern Kunafah and Italian Tiramisu
              from scratch without preservatives.
            </p>
            <div className="story-stats-grid">
              <div className="story-stat-box">
                <span className="stat-num">50k+</span>
                <span className="stat-desc">Happy Foodies Served</span>
              </div>
              <div className="story-stat-box">
                <span className="stat-num">70+</span>
                <span className="stat-desc">Master Artisan Recipes</span>
              </div>
              <div className="story-stat-box">
                <span className="stat-num">4.9★</span>
                <span className="stat-desc">Customer Satisfaction</span>
              </div>
              <div className="story-stat-box">
                <span className="stat-num">100%</span>
                <span className="stat-desc">Fresh & Natural Ingredients</span>
              </div>
            </div>
          </div>

          <div className="about-story-media">
            <div className="story-image-card">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80"
                alt="Chef preparing artisanal food"
                className="story-main-img"
              />
              <div className="story-floating-badge">
                <span className="floating-badge-icon">🌿</span>
                <div>
                  <strong>Farm to Table</strong>
                  <p>100% Organic & Fresh Daily</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Pillars / Values */}
      <section className="about-values-section">
        <div className="values-header">
          <span className="story-label">🛡️ OUR PROMISE</span>
          <h2 className="story-heading">The Pillars of Foodie Excellence</h2>
          <p className="values-subtitle">Why thousands of gourmet enthusiasts choose us every single day</p>
        </div>

        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon-box">🥩</div>
            <h3 className="value-title">Prime Quality & Pure Cuts</h3>
            <p className="value-desc">
              Zero frozen patties or artificial fillers. We use 100% fresh, premium-grade meat and farm-fresh paneer with secret herb marinades.
            </p>
          </div>

          <div className="value-card">
            <div className="value-icon-box">🔥</div>
            <h3 className="value-title">Stone-Baked & Smashed Fresh</h3>
            <p className="value-desc">
              Crisp wood-fired pizza crusts and caramelized smashed patties seared to golden perfection on high-temperature cast-iron griddles.
            </p>
          </div>

          <div className="value-card">
            <div className="value-icon-box">⚡</div>
            <h3 className="value-title">Lightning 30-Min Delivery</h3>
            <p className="value-desc">
              Insulated temperature-controlled packaging ensures your meal arrives piping hot and fresh at your doorstep in 30 minutes.
            </p>
          </div>

          <div className="value-card">
            <div className="value-icon-box">👑</div>
            <h3 className="value-title">Royal Fine Dining Experience</h3>
            <p className="value-desc">
              Whether dining in our atmospheric restaurant or ordering at home, expect attentive luxury service and culinary art.
            </p>
          </div>
        </div>
      </section>

      {/* Meet Our Master Chefs */}
      <section className="about-chefs-section">
        <div className="values-header">
          <span className="story-label">👨‍🍳 CULINARY MASTERS</span>
          <h2 className="story-heading">Meet the Chefs Behind the Magic</h2>
          <p className="values-subtitle">Passionate culinary artists dedicated to perfection</p>
        </div>

        <div className="chefs-grid">
          <div className="chef-card">
            <div className="chef-avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80"
                alt="Executive Chef"
                className="chef-img"
              />
            </div>
            <h4 className="chef-name">Chef Antoine Laurent</h4>
            <span className="chef-role">Executive Head Chef</span>
            <p className="chef-bio">
              With 15+ years of Michelin-star kitchen experience, Chef Antoine curates our signature smash burgers and secret glaze blends.
            </p>
          </div>

          <div className="chef-card">
            <div className="chef-avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80"
                alt="Pizza Master"
                className="chef-img"
              />
            </div>
            <h4 className="chef-name">Chef Marco Bellini</h4>
            <span className="chef-role">Artisan Pizza Master</span>
            <p className="chef-bio">
              Specializing in Neapolitan dough fermentation and wood-fired stone oven techniques for that crispy, airy, bubbly crust.
            </p>
          </div>

          <div className="chef-card">
            <div className="chef-avatar-wrapper">
              <img
                src="https://images.unsplash.com/photo-1607631568010-a87245c0daf8?auto=format&fit=crop&w=600&q=80"
                alt="Pastry Specialist"
                className="chef-img"
              />
            </div>
            <h4 className="chef-name">Chef Sophia Chen</h4>
            <span className="chef-role">Master Pastry & Dessert Artist</span>
            <p className="chef-bio">
              Creator of our famous Turkish Kunafah, Classic Italian Tiramisu, and decadent Belgian Chocolate Molten Lava cakes.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="about-cta-section">
        <div className="about-cta-card">
          <h2 className="about-cta-title">Ready for an Unforgettable Dining Experience?</h2>
          <p className="about-cta-subtitle">
            Explore our curated menu for lightning doorstep delivery, or book a table for an intimate fine dining evening.
          </p>
          <div className="about-cta-btn-row">
            <Link to="/" className="about-cta-primary-btn">
              <span>🍔 Explore Gourmet Menu</span>
              <span>➔</span>
            </Link>
            <Link to="/reservation" className="about-cta-secondary-btn">
              <span>🍽️ Reserve a Table</span>
              <span>📅</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
