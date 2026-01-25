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
              <span className="logo-tagline">What will your new product make?</span>
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
              Find Out in Minutes, Not Hours
            </h1>
            <p className="hero-subtitle">
              Watnew helps product managers answer that critical question quickly. Create revenue projections, 
              compare pricing strategies, and make data-driven decisions—no spreadsheet expertise required.
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

      <section className="features">
        <div className="container">
          <h2 className="section-title">Built for Product Managers</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Simple</h3>
              <p>No finance degree needed. Enter your assumptions and get projections instantly—no complex formulas or spreadsheet errors.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Compare Scenarios</h3>
              <p>Test different revenue models side-by-side. One-time sales vs. subscriptions? See the numbers in seconds.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Visual Insights</h3>
              <p>Beautiful charts and tables that make sense. Share clear projections with stakeholders and get buy-in faster.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💼</div>
              <h3>Export & Share</h3>
              <p>Download PDFs and Excel files to include in presentations, pitch decks, or stakeholder meetings.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="use-cases">
        <div className="container">
          <h2 className="section-title">Perfect For</h2>
          <div className="use-cases-list">
            <div className="use-case">
              <div className="use-case-icon">🎯</div>
              <div className="use-case-content">
                <h3>Pricing Strategy</h3>
                <p>Evaluate different pricing models—one-time purchase, subscription, or hybrid—to find the best fit for your product.</p>
              </div>
            </div>
            <div className="use-case">
              <div className="use-case-icon">📊</div>
              <div className="use-case-content">
                <h3>Revenue Forecasting</h3>
                <p>Project revenue over 12, 24, or 36 months with growth rates and churn assumptions built in.</p>
              </div>
            </div>
            <div className="use-case">
              <div className="use-case-icon">🤝</div>
              <div className="use-case-content">
                <h3>Stakeholder Presentations</h3>
                <p>Walk into meetings with professional projections that clearly communicate your product's financial potential.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-section">
        <div className="container">
          <h2 className="section-title">Simple Pricing</h2>
          <div className="pricing-card-landing">
            <div className="pricing-header-landing">
              <h3>Watnew Pro</h3>
              <div className="price-landing">
                <span className="price-amount-landing">$99</span>
                <span className="price-period-landing">/month</span>
              </div>
            </div>
            <ul className="pricing-features-landing">
              <li>✅ Unlimited financial models</li>
              <li>✅ All revenue model types</li>
              <li>✅ Export to PDF & Excel</li>
              <li>✅ Cancel anytime</li>
              <li>✅ 7-day money-back guarantee</li>
            </ul>
            <Link to="/pricing" className="btn btn-pricing-landing">
              View Pricing Details
            </Link>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to See What Your Product Will Make?</h2>
            <p>Join product managers who are making smarter financial decisions</p>
            <Link to="/register" className="btn btn-cta">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2026 Watnew. What will your new product make?</p>
          <p style={{ marginTop: '10px' }}>
            <a href="mailto:help@watnew.me" style={{ color: '#78c0e0', textDecoration: 'none' }}>help@watnew.me</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;