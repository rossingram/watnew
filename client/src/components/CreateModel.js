import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ResultsView from './ResultsView';
import MultiCaseResultsView from './MultiCaseResultsView';
import './CreateModel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const defaultCaseForm = () => ({
  timeFrame: 12,
  unitPrice: 0,
  initialUnits: 0,
  growthRate: 0,
  subscriptionPrice: 0,
  initialSubscribers: 0,
  churnRate: 0,
  costPerUnit: 0,
  costPerSubscriber: 0
});

function buildAssumptions(form, revenueModel) {
  return {
    timeFrame: form.timeFrame,
    ...(revenueModel === 'one-time' || revenueModel === 'hybrid' ? {
      unitPrice: form.unitPrice,
      initialUnits: form.initialUnits,
      growthRate: form.growthRate,
      costPerUnit: form.costPerUnit ?? 0
    } : {}),
    ...(revenueModel === 'subscription' || revenueModel === 'hybrid' ? {
      subscriptionPrice: form.subscriptionPrice,
      initialSubscribers: form.initialSubscribers,
      churnRate: form.churnRate,
      growthRate: form.growthRate,
      costPerSubscriber: form.costPerSubscriber ?? 0
    } : {})
  };
}

function CreateModel() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState(null);
  const [caseResults, setCaseResults] = useState(null);
  const [scenarioType, setScenarioType] = useState('single'); // 'single' | 'cases'
  const [caseFormData, setCaseFormData] = useState({
    base: defaultCaseForm(),
    best: defaultCaseForm(),
    worst: defaultCaseForm()
  });
  const [formData, setFormData] = useState({
    name: '',
    revenue_model: 'one-time',
    timeFrame: 12,
    unitPrice: 0,
    initialUnits: 0,
    growthRate: 0,
    subscriptionPrice: 0,
    initialSubscribers: 0,
    churnRate: 0,
    costPerUnit: 0,
    costPerSubscriber: 0,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'name' || name === 'revenue_model') {
        return { ...prev, [name]: value };
      }
      return { ...prev, [name]: parseFloat(value) || 0 };
    });
  };

  const handleCaseInputChange = (caseKey, e) => {
    const { name, value } = e.target;
    setCaseFormData(prev => ({
      ...prev,
      [caseKey]: { ...prev[caseKey], [name]: parseFloat(value) || 0 }
    }));
  };

  const handleCalculate = async () => {
    const nameValue = String(formData.name || '').trim();
    if (!nameValue) {
      alert('Please enter a model name');
      return;
    }

    const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };

    if (scenarioType === 'cases') {
      try {
        const [baseRes, bestRes, worstRes] = await Promise.all([
          axios.post(`${API_URL}/calculate`, {
            revenue_model: formData.revenue_model,
            assumptions: buildAssumptions(caseFormData.base, formData.revenue_model)
          }, authHeader),
          axios.post(`${API_URL}/calculate`, {
            revenue_model: formData.revenue_model,
            assumptions: buildAssumptions(caseFormData.best, formData.revenue_model)
          }, authHeader),
          axios.post(`${API_URL}/calculate`, {
            revenue_model: formData.revenue_model,
            assumptions: buildAssumptions(caseFormData.worst, formData.revenue_model)
          }, authHeader)
        ]);
        setCaseResults({
          base: { assumptions: caseFormData.base, results: baseRes.data },
          best: { assumptions: caseFormData.best, results: bestRes.data },
          worst: { assumptions: caseFormData.worst, results: worstRes.data }
        });
        setStep('results');
      } catch (error) {
        alert('Error calculating: ' + (error.response?.data?.error || error.message));
      }
      return;
    }

    try {
      const assumptions = buildAssumptions(formData, formData.revenue_model);
      const response = await axios.post(`${API_URL}/calculate`, {
        revenue_model: formData.revenue_model,
        assumptions
      }, authHeader);
      setResults(response.data);
      setStep('results');
    } catch (error) {
      alert('Error calculating projections: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (scenarioType === 'cases' && caseResults) {
        await axios.post(`${API_URL}/scenarios`, {
          name: formData.name,
          revenue_model: formData.revenue_model,
          cases: {
            base: {
              assumptions: buildAssumptions(caseFormData.base, formData.revenue_model),
              results: caseResults.base
            },
            best: {
              assumptions: buildAssumptions(caseFormData.best, formData.revenue_model),
              results: caseResults.best
            },
            worst: {
              assumptions: buildAssumptions(caseFormData.worst, formData.revenue_model),
              results: caseResults.worst
            }
          }
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        const assumptions = buildAssumptions(formData, formData.revenue_model);
        await axios.post(`${API_URL}/scenarios`, {
          name: formData.name,
          revenue_model: formData.revenue_model,
          assumptions,
          results
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
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
    if (caseResults) {
      return (
        <MultiCaseResultsView
          scenarioName={formData.name}
          revenueModel={formData.revenue_model}
          cases={caseResults}
          onBack={() => { setCaseResults(null); setStep('form'); }}
          onSave={handleSave}
          saving={saving}
        />
      );
    }
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
      <h1 className="create-form-title">Create Revenue Projection</h1>
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
            <label>Scenario type</label>
            <select value={scenarioType} onChange={(e) => setScenarioType(e.target.value)}>
              <option value="single">Single scenario</option>
              <option value="cases">Best / Base / Worst</option>
            </select>
            <div className="help-text">Use Best/Base/Worst to compare three assumption sets in one model.</div>
          </div>

          {scenarioType === 'single' && (
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
          )}
        </div>

        {scenarioType === 'single' && (formData.revenue_model === 'one-time' || formData.revenue_model === 'hybrid') && (
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

        {scenarioType === 'single' && (formData.revenue_model === 'subscription' || formData.revenue_model === 'hybrid') && (
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

        {scenarioType === 'single' && (
        <div className="card">
          <h2>Cost Assumptions (optional)</h2>
          <p className="help-text" style={{ marginBottom: '16px' }}>Add costs to see gross profit and margin.</p>
          {(formData.revenue_model === 'one-time' || formData.revenue_model === 'hybrid') && (
            <div className="form-group">
              <label>Cost per unit ($)</label>
              <input
                type="number"
                name="costPerUnit"
                value={formData.costPerUnit}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
              <div className="help-text">Variable cost per one-time unit sold</div>
            </div>
          )}
          {(formData.revenue_model === 'subscription' || formData.revenue_model === 'hybrid') && (
            <div className="form-group">
              <label>Cost per subscriber per month ($)</label>
              <input
                type="number"
                name="costPerSubscriber"
                value={formData.costPerSubscriber}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
              <div className="help-text">Monthly cost per subscriber (e.g. hosting, support)</div>
            </div>
          )}
        </div>
        )}

        {scenarioType === 'cases' && (
          ['base', 'best', 'worst'].map((caseKey) => (
            <div key={caseKey} className="card">
              <h2>{caseKey === 'base' ? 'Base case' : caseKey === 'best' ? 'Best case' : 'Worst case'}</h2>
              <div className="form-group">
                <label>Projection Period (months)</label>
                <select
                  name="timeFrame"
                  value={caseFormData[caseKey].timeFrame}
                  onChange={(e) => handleCaseInputChange(caseKey, e)}
                >
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                  <option value={36}>36 months</option>
                </select>
              </div>
              {(formData.revenue_model === 'one-time' || formData.revenue_model === 'hybrid') && (
                <>
                  <div className="form-group">
                    <label>Price per unit ($)</label>
                    <input type="number" name="unitPrice" value={caseFormData[caseKey].unitPrice} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Initial units (Month 1)</label>
                    <input type="number" name="initialUnits" value={caseFormData[caseKey].initialUnits} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Monthly growth rate (%)</label>
                    <input type="number" name="growthRate" value={caseFormData[caseKey].growthRate} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" max="100" step="0.1" />
                  </div>
                </>
              )}
              {(formData.revenue_model === 'subscription' || formData.revenue_model === 'hybrid') && (
                <>
                  <div className="form-group">
                    <label>Subscription price ($/month)</label>
                    <input type="number" name="subscriptionPrice" value={caseFormData[caseKey].subscriptionPrice} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Initial subscribers</label>
                    <input type="number" name="initialSubscribers" value={caseFormData[caseKey].initialSubscribers} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" />
                  </div>
                  <div className="form-group">
                    <label>Monthly growth rate (%)</label>
                    <input type="number" name="growthRate" value={caseFormData[caseKey].growthRate} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" max="100" step="0.1" />
                  </div>
                  <div className="form-group">
                    <label>Monthly churn rate (%)</label>
                    <input type="number" name="churnRate" value={caseFormData[caseKey].churnRate} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" max="100" step="0.1" />
                  </div>
                </>
              )}
              {(formData.revenue_model === 'one-time' || formData.revenue_model === 'hybrid') && (
                <div className="form-group">
                  <label>Cost per unit ($)</label>
                  <input type="number" name="costPerUnit" value={caseFormData[caseKey].costPerUnit} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" step="0.01" />
                </div>
              )}
              {(formData.revenue_model === 'subscription' || formData.revenue_model === 'hybrid') && (
                <div className="form-group">
                  <label>Cost per subscriber/month ($)</label>
                  <input type="number" name="costPerSubscriber" value={caseFormData[caseKey].costPerSubscriber} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" step="0.01" />
                </div>
              )}
            </div>
          ))
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