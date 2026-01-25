import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ResultsView from './ResultsView';
import './CreateModel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function ViewModel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState(null);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetchScenario();
  }, [id]);

  const fetchScenario = async () => {
    try {
      const response = await axios.get(`${API_URL}/scenarios/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setScenario(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load scenario');
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      const response = await axios.post(`${API_URL}/calculate`, {
        revenue_model: scenario.revenue_model,
        assumptions: scenario.assumptions
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update scenario with new results
      await axios.put(`${API_URL}/scenarios/${id}`, {
        results: response.data
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setScenario(prev => ({
        ...prev,
        results: response.data
      }));
    } catch (error) {
      alert('Error recalculating: ' + (error.response?.data?.error || error.message));
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading scenario...</div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="container">
        <div className="error">{error || 'Scenario not found'}</div>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Convert scenario data to formData format for ResultsView
  const getFormData = () => ({
    name: scenario.name,
    revenue_model: scenario.revenue_model,
    timeFrame: scenario.assumptions.timeFrame || 12,
    unitPrice: scenario.assumptions.unitPrice || 0,
    initialUnits: scenario.assumptions.initialUnits || 0,
    subscriptionPrice: scenario.assumptions.subscriptionPrice || 0,
    initialSubscribers: scenario.assumptions.initialSubscribers || 0,
    growthRate: scenario.assumptions.growthRate || 0,
    churnRate: scenario.assumptions.churnRate || 0
  });

  // Initialize formData when scenario loads
  useEffect(() => {
    if (scenario) {
      setFormData({
        name: scenario.name,
        revenue_model: scenario.revenue_model,
        timeFrame: scenario.assumptions.timeFrame || 12,
        unitPrice: scenario.assumptions.unitPrice || 0,
        initialUnits: scenario.assumptions.initialUnits || 0,
        subscriptionPrice: scenario.assumptions.subscriptionPrice || 0,
        initialSubscribers: scenario.assumptions.initialSubscribers || 0,
        growthRate: scenario.assumptions.growthRate || 0,
        churnRate: scenario.assumptions.churnRate || 0
      });
    }
  }, [scenario]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'name' || name === 'revenue_model') {
        return { ...prev, [name]: value };
      }
      return { ...prev, [name]: parseFloat(value) || 0 };
    });
  };

  const handleRecalculateFromEdit = async () => {
    if (!formData) return;

    const nameValue = String(formData.name || '').trim();
    if (!nameValue) {
      alert('Please enter a model name');
      return;
    }

    try {
      const assumptions = {
        timeFrame: formData.timeFrame,
        ...(formData.revenue_model === 'one-time' || formData.revenue_model === 'hybrid' ? {
          unitPrice: formData.unitPrice,
          initialUnits: formData.initialUnits,
          growthRate: formData.growthRate
        } : {}),
        ...(formData.revenue_model === 'subscription' || formData.revenue_model === 'hybrid' ? {
          subscriptionPrice: formData.subscriptionPrice,
          initialSubscribers: formData.initialSubscribers,
          churnRate: formData.churnRate,
          growthRate: formData.growthRate
        } : {})
      };

      const response = await axios.post(`${API_URL}/calculate`, {
        revenue_model: formData.revenue_model,
        assumptions
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update scenario with new assumptions and results
      await axios.put(`${API_URL}/scenarios/${id}`, {
        name: formData.name,
        revenue_model: formData.revenue_model,
        assumptions,
        results: response.data
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update local state
      setScenario(prev => ({
        ...prev,
        name: formData.name,
        revenue_model: formData.revenue_model,
        assumptions,
        results: response.data
      }));

      setEditMode(false);
    } catch (error) {
      alert('Error recalculating: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSave = async () => {
    // Results are already saved, just navigate back
    navigate('/dashboard');
  };

  const handleBack = () => {
    if (editMode) {
      // Cancel edit mode, restore original data
      setFormData(getFormData());
      setEditMode(false);
    } else {
      navigate('/dashboard');
    }
  };

  const handleEditAssumptions = () => {
    setEditMode(true);
  };

  // Show edit form if in edit mode
  if (editMode && formData) {
    return (
      <div className="container">
        <h1>Edit Assumptions</h1>
        <div className="model-form">
          <div className="card">
            <h2>Model Details</h2>
            <div className="form-group">
              <label>Model Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Product X - Subscription Model"
                required
              />
            </div>

            <div className="form-group">
              <label>Revenue Model Type *</label>
              <select
                name="revenue_model"
                value={formData.revenue_model}
                onChange={handleInputChange}
              >
                <option value="one-time">One-Time Purchase</option>
                <option value="subscription">Subscription</option>
                <option value="hybrid">Hybrid (One-Time + Subscription)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Projection Period (months) *</label>
              <select
                name="timeFrame"
                value={formData.timeFrame}
                onChange={handleInputChange}
              >
                <option value={12}>12 months</option>
                <option value={24}>24 months</option>
                <option value={36}>36 months</option>
              </select>
            </div>
          </div>

          {(formData.revenue_model === 'one-time' || formData.revenue_model === 'hybrid') && (
            <div className="card">
              <h2>One-Time Purchase Assumptions</h2>
              <div className="form-group">
                <label>Price per Unit ($) *</label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Initial Units Sold (Month 1) *</label>
                <input
                  type="number"
                  name="initialUnits"
                  value={formData.initialUnits}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Monthly Growth Rate (%)</label>
                <input
                  type="number"
                  name="growthRate"
                  value={formData.growthRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          )}

          {(formData.revenue_model === 'subscription' || formData.revenue_model === 'hybrid') && (
            <div className="card">
              <h2>Subscription Assumptions</h2>
              <div className="form-group">
                <label>Subscription Price ($/month) *</label>
                <input
                  type="number"
                  name="subscriptionPrice"
                  value={formData.subscriptionPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Initial Subscribers (Month 1) *</label>
                <input
                  type="number"
                  name="initialSubscribers"
                  value={formData.initialSubscribers}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Monthly Growth Rate (%)</label>
                <input
                  type="number"
                  name="growthRate"
                  value={formData.growthRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Monthly Churn Rate (%)</label>
                <input
                  type="number"
                  name="churnRate"
                  value={formData.churnRate}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          )}

          <div className="form-actions">
            <button onClick={handleBack} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={handleRecalculateFromEdit} className="btn btn-primary">
              Recalculate Projections
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!scenario.results) {
    return (
      <div className="container">
        <div className="card">
          <h2>{scenario.name}</h2>
          <p>This scenario doesn't have calculated results yet.</p>
          <button onClick={handleRecalculate} className="btn btn-primary">
            Calculate Projections
          </button>
          <button onClick={handleBack} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ResultsView
      formData={getFormData()}
      results={scenario.results}
      onBack={handleEditAssumptions}
      onSave={handleSave}
      saving={false}
    />
  );
}

export default ViewModel;