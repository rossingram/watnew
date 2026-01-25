import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Billing.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Billing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') {
      // Refresh subscription status after successful payment
      fetchSubscriptionStatus();
    } else {
      fetchSubscriptionStatus();
    }
  }, [success]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/subscription/status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSubscription(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/subscription/create-portal`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Redirect to Stripe Customer Portal
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Error opening billing portal. Please try again.');
      setPortalLoading(false);
    }
  };

  const handleSyncSubscription = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(
        `${API_URL}/subscription/sync`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        alert('Subscription synced successfully!');
        fetchSubscriptionStatus();
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Error syncing subscription: ${errorMessage}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading subscription status...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="billing-header">
        <h1>Billing & Subscription</h1>
        {success === 'true' && (
          <div className="alert alert-success">
            ✅ Subscription activated successfully! You now have full access to Watnew.
          </div>
        )}
      </div>

      {subscription?.hasSubscription && (subscription?.status === 'active' || subscription?.status === 'trialing') ? (
        <div className="billing-card">
          <div className="subscription-status active">
            <div className="status-badge active">Active</div>
            <h2>Watnew Pro</h2>
            {success === 'true' && (
              <div className="alert alert-success" style={{ marginBottom: '20px' }}>
                ✅ Subscription activated! Welcome to Watnew Pro.
              </div>
            )}
            <div className="subscription-details">
              <div className="detail-item">
                <span className="detail-label">Plan:</span>
                <span className="detail-value">$99/month</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{subscription.status}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Next billing date:</span>
                <span className="detail-value">{formatDate(subscription.currentPeriodEnd)}</span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div className="detail-item warning">
                  <span className="detail-label">⚠️ Subscription will cancel:</span>
                  <span className="detail-value">{formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="btn btn-primary"
            >
              {portalLoading ? 'Loading...' : 'Manage Billing'}
            </button>
            <p className="billing-note">
              Update payment method, view invoices, or cancel your subscription
            </p>
          </div>
        </div>
      ) : (
        <div className="billing-card">
          <div className="subscription-status inactive">
            <div className="status-badge inactive">No Active Subscription</div>
            <h2>Subscribe to Watnew Pro</h2>
            {success === 'true' && (
              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                Payment completed! If you just subscribed, click "Sync Subscription" to activate your account.
              </div>
            )}
            <p className="subscription-message">
              You need an active subscription to create and save financial models.
            </p>
            {success === 'true' && (
              <button
                onClick={handleSyncSubscription}
                disabled={syncing}
                className="btn btn-primary"
                style={{ marginBottom: '20px' }}
              >
                {syncing ? 'Syncing...' : 'Sync Subscription from Stripe'}
              </button>
            )}
            <div className="pricing-highlight">
              <div className="price-large">$99<span className="price-period">/month</span></div>
              <ul className="feature-list">
                <li>✅ Unlimited financial models</li>
                <li>✅ All revenue model types</li>
                <li>✅ Export to PDF & Excel</li>
                <li>✅ Cancel anytime</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="btn btn-primary btn-large"
            >
              Subscribe Now
            </button>
          </div>
        </div>
      )}

      <div className="billing-info">
        <h3>Billing Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>7-Day Money-Back Guarantee</h4>
            <p>Not satisfied? Get a full refund within 7 days of your first payment.</p>
          </div>
          <div className="info-item">
            <h4>Cancel Anytime</h4>
            <p>Cancel your subscription at any time. You'll retain access until the end of your billing period.</p>
          </div>
          <div className="info-item">
            <h4>Secure Payments</h4>
            <p>All payments are processed securely through Stripe. We never store your card details.</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #e0e0e0' }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>Need help with billing?</p>
          <p>
            <a href="mailto:help@watnew.me" style={{ color: '#449dd1', textDecoration: 'none', fontWeight: '500' }}>
              help@watnew.me
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Billing;