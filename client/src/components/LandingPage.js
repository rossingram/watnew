import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <span className="logo-text">Watnew</span>
            </div>
            <div className="nav-actions">
              <Link to="/pricing" className="btn-nav">Pricing</Link>
              <Link to="/login" className="btn-nav">Login</Link>
              <Link to="/register" className="btn-nav btn-primary-nav">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Financial models that win stakeholder buy-in
            </h1>
            <p className="hero-subtitle">
              Revenue projections, pricing scenarios, and stakeholder-ready outputs for product managers—no spreadsheet expertise required. Try watnew.me.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-hero btn-primary-hero">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-hero btn-secondary-hero">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="container">
          <span className="trust-item">Export to Excel & PDF</span>
          <span className="trust-sep">·</span>
          <span className="trust-item">7-day money-back guarantee</span>
          <span className="trust-sep">·</span>
          <span className="trust-item">Cancel anytime</span>
        </div>
      </div>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Built for Product Managers</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Simple</h3>
              <p>Get projections you can defend in meetings. Enter your assumptions and get results instantly—no complex formulas or spreadsheet errors.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Compare Scenarios</h3>
              <p>One-time vs. subscription vs. hybrid—see the numbers side-by-side for leadership in seconds.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Visual Insights</h3>
              <p>Charts and tables ready for decks and stakeholder reviews. Share clear projections and get buy-in faster.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Export & Share</h3>
              <p>PDF and Excel for board packs, pitch decks, and investor updates. Download and present with confidence.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Pricing Strategy</h3>
              <p>Evaluate different pricing models—one-time purchase, subscription, or hybrid—to find the best fit for your product.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Revenue Forecasting</h3>
              <p>Project revenue over 12, 24, or 36 months with growth rates and churn assumptions built in.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Stakeholder Presentations</h3>
              <p>Walk into meetings with professional projections that clearly communicate your product's financial potential.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Transparent Assumptions</h3>
              <p>See and tweak every input—growth, churn, pricing. Easy to explain and defend to stakeholders.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="container">
          <h2 className="section-title">Simple Pricing</h2>
          <div className="pricing-card-landing">
            <div className="pricing-card-landing-inner">
              <div className="pricing-header-landing">
                <h3>Watnew Pro</h3>
                <div className="price-landing">
                  <span className="price-amount-landing">$99</span>
                  <span className="price-period-landing">/month</span>
                </div>
                <Link to="/pricing" className="btn btn-pricing-landing">
                  View Pricing Details
                </Link>
              </div>
              <ul className="pricing-features-landing">
                <li>✅ Unlimited financial models</li>
                <li>✅ All revenue model types</li>
                <li>✅ Export to PDF & Excel</li>
                <li>✅ Cancel anytime</li>
                <li>✅ 7-day money-back guarantee</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to see what your product will make?</h2>
            <p>Join product managers building credible financial models for stakeholders.</p>
            <Link to="/register" className="btn btn-cta">
              Get started with Watnew
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <p className="footer-tagline">Know what your product will make.</p>
          <p>&copy; 2026 Watnew</p>
          <div className="footer-links">
            <Link to="/terms" className="footer-link">Terms of Service</Link>
            <span className="footer-sep">·</span>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          </div>
          <p style={{ marginTop: '10px' }}>
            <a href="mailto:help@watnew.me" style={{ color: '#78c0e0', textDecoration: 'none' }}>help@watnew.me</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;