import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function Dashboard() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScenarios();
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/subscription/status`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSubscriptionStatus(response.data);
      setSubscriptionLoading(false);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscriptionLoading(false);
    }
  };

  const fetchScenarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/scenarios`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setScenarios(response.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.data?.requiresSubscription) {
        setError('subscription_required');
      } else {
        setError('Failed to load scenarios');
      }
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scenario?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/scenarios/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchScenarios();
    } catch (err) {
      setError('Failed to delete scenario');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  // Check if subscription is required
  // Allow access if subscription status is 'active' or 'trialing'
  const hasActiveSubscription = subscriptionStatus && 
    subscriptionStatus.hasSubscription && 
    (subscriptionStatus.status === 'active' || subscriptionStatus.status === 'trialing');
  
  if (error === 'subscription_required' || 
      (subscriptionStatus && !subscriptionStatus.hasSubscription) ||
      (subscriptionStatus && subscriptionStatus.hasSubscription && !hasActiveSubscription)) {
    return (
      <div className="container">
        <div className="subscription-required-card">
          <h2>Subscription Required</h2>
          <p>You need an active subscription to access Watnew. Subscribe now to start creating unlimited financial models.</p>
          <div className="subscription-cta">
            <Link to="/pricing" className="btn btn-primary btn-large">
              View Pricing & Subscribe
            </Link>
            <Link to="/billing" className="btn btn-secondary">
              Check Subscription Status
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>My Revenue Projections</h1>
        <Link to="/create" className="btn btn-primary">
          Create New Model
        </Link>
      </div>

      {error && error !== 'subscription_required' && <div className="error">{error}</div>}

      {scenarios.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any financial models yet.</p>
          <Link to="/create" className="btn btn-primary">
            Create Your First Model
          </Link>
        </div>
      ) : (
        <div className="scenarios-grid">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="scenario-card">
              <div className="scenario-header">
                <h3>{scenario.name}</h3>
                <span className={`model-badge ${scenario.revenue_model}`}>
                  {scenario.revenue_model}
                </span>
              </div>
              {scenario.results && (
                <div className="scenario-summary">
                  <div className="summary-item">
                    <span className="summary-label">Total Revenue:</span>
                    <span className="summary-value">
                      {formatCurrency(scenario.results.summary?.totalRevenue)}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Avg Monthly:</span>
                    <span className="summary-value">
                      {formatCurrency(scenario.results.summary?.averageMonthlyRevenue)}
                    </span>
                  </div>
                </div>
              )}
              <div className="scenario-footer">
                <span className="scenario-date">
                  Updated: {formatDate(scenario.updated_at)}
                </span>
                <div className="scenario-actions">
                  <button
                    onClick={() => navigate(`/scenario/${scenario.id}`)}
                    className="btn btn-primary btn-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(scenario.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;