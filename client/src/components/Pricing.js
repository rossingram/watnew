import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Pricing.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (canceled === 'true') {
      // Show a message that payment was canceled
    }
  }, [canceled]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/register');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/subscription/create-checkout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Error starting checkout: ${errorMessage}\n\nPlease check:\n1. Server is running\n2. Stripe is configured\n3. You are logged in`);
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      <nav className="pricing-nav">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <span className="logo-text">Watnew</span>
              <span className="logo-tagline">What will your new product make?</span>
            </div>
            {user ? (
              <Link to="/dashboard" className="btn-nav">Dashboard</Link>
            ) : (
              <div className="nav-actions">
                <Link to="/login" className="btn-nav">Login</Link>
                <Link to="/register" className="btn-nav btn-primary-nav">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <section className="pricing-hero">
        <div className="container">
          <h1>Simple, Transparent Pricing</h1>
          <p className="pricing-subtitle">One plan. Unlimited models. No hidden fees.</p>
        </div>
      </section>

      <section className="pricing-plans">
        <div className="container">
          <div className="pricing-card featured">
            <div className="plan-badge">Most Popular</div>
            <div className="plan-header">
              <h2>Watnew Pro</h2>
              <div className="plan-price">
                <span className="price-amount">$99</span>
                <span className="price-period">/month</span>
              </div>
            </div>
            <ul className="plan-features">
              <li>✅ Unlimited financial models</li>
              <li>✅ All revenue model types (One-time, Subscription, Hybrid)</li>
              <li>✅ Export to PDF & Excel</li>
              <li>✅ Save unlimited scenarios</li>
              <li>✅ Beautiful charts & visualizations</li>
              <li>✅ Cancel anytime</li>
              <li>✅ 7-day money-back guarantee</li>
            </ul>
            {canceled === 'true' && (
              <div className="alert alert-info">
                Payment was canceled. You can try again anytime.
              </div>
            )}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="btn btn-subscribe"
            >
              {loading ? 'Processing...' : user ? 'Subscribe Now' : 'Get Started'}
            </button>
            <p className="plan-note">No credit card required to sign up. Subscribe to start creating models.</p>
          </div>
        </div>
      </section>

      <section className="pricing-faq">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>Is there a free trial?</h3>
              <p>You can sign up and explore the platform for free, but creating and saving models requires an active subscription.</p>
            </div>
            <div className="faq-item">
              <h3>Can I cancel anytime?</h3>
              <p>Yes! Cancel your subscription at any time from your billing dashboard. You'll continue to have access until the end of your billing period.</p>
            </div>
            <div className="faq-item">
              <h3>What's your refund policy?</h3>
              <p>We offer a 7-day money-back guarantee. If you're not satisfied, contact us within 7 days for a full refund.</p>
            </div>
            <div className="faq-item">
              <h3>Do you offer team plans?</h3>
              <p>Currently we offer individual subscriptions. For team or enterprise needs, please <a href="mailto:help@watnew.me">contact us</a>.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-cta">
        <div className="container">
          <h2>Ready to see what your product will make?</h2>
          <button onClick={handleSubscribe} disabled={loading} className="btn btn-cta-large">
            {loading ? 'Processing...' : 'Start Your Subscription'}
          </button>
        </div>
      </section>

      <footer className="pricing-footer">
        <div className="container">
          <div className="footer-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <a href="mailto:help@watnew.me">Support</a>
          </div>
          <p>&copy; 2026 Watnew. What will your new product make?</p>
        </div>
      </footer>
    </div>
  );
}

export default Pricing;