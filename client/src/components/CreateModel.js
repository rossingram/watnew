import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ResultsView from './ResultsView';
import './CreateModel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

function CreateModel() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // 'form' or 'results'
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    revenue_model: 'one-time',
    timeFrame: 12,
    // One-time purchase fields
    unitPrice: 0,
    initialUnits: 0,
    growthRate: 0,
    // Subscription fields
    subscriptionPrice: 0,
    initialSubscribers: 0,
    churnRate: 0,
    // Hybrid uses both sets
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Keep string values for name and revenue_model
      if (name === 'name' || name === 'revenue_model') {
        return { ...prev, [name]: value };
      }
      // Convert numeric fields to numbers
      return { ...prev, [name]: parseFloat(value) || 0 };
    });
  };

  const handleCalculate = async () => {
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

      setResults(response.data);
      setStep('results');
    } catch (error) {
      alert('Error calculating projections: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSave = async () => {
    setSaving(true);
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

      await axios.post(`${API_URL}/scenarios`, {
        name: formData.name,
        revenue_model: formData.revenue_model,
        assumptions,
        results
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert('Scenario saved successfully!');
      navigate('/dashboard');
    } catch (error) {
      alert('Error saving scenario: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setStep('form');
    setResults(null);
  };

  if (step === 'results') {
    return (
      <ResultsView
        formData={formData}
        results={results}
        onBack={handleBack}
        onSave={handleSave}
        saving={saving}
      />
    );
  }

  return (
    <div className="container">
      <h1>Create Revenue Projection</h1>
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
              <div className="help-text">The one-time sale price per unit</div>
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
              <div className="help-text">Expected number of units sold in the first month</div>
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
              <div className="help-text">Percentage increase in units sold each month (e.g., 5 for 5% growth)</div>
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
              <div className="help-text">Monthly recurring revenue per subscriber</div>
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
              <div className="help-text">Starting number of subscribers</div>
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
              <div className="help-text">Percentage increase in subscribers each month</div>
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
              <div className="help-text">Percentage of subscribers who cancel each month (e.g., 2 for 2% churn)</div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleCalculate} className="btn btn-primary">
            Calculate Projections
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateModel;