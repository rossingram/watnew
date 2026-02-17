import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ResultsView from './ResultsView';
import MultiCaseResultsView from './MultiCaseResultsView';
import './CreateModel.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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

function ViewModel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState(null);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [caseEditMode, setCaseEditMode] = useState(false);
  const [caseFormData, setCaseFormData] = useState({ base: defaultCaseForm(), best: defaultCaseForm(), worst: defaultCaseForm() });
  const [caseRecalculating, setCaseRecalculating] = useState(false);

  useEffect(() => {
    fetchScenario();
  }, [id]);

  // Initialize formData when scenario loads (single-scenario only; cases scenarios use MultiCaseResultsView)
  useEffect(() => {
    if (!scenario) return;
    const assumptions = scenario.assumptions ?? scenario.cases?.base?.assumptions;
    if (!assumptions) return;
    setFormData({
      name: scenario.name,
      revenue_model: scenario.revenue_model,
      timeFrame: assumptions.timeFrame || 12,
      unitPrice: assumptions.unitPrice || 0,
      initialUnits: assumptions.initialUnits || 0,
      subscriptionPrice: assumptions.subscriptionPrice || 0,
      initialSubscribers: assumptions.initialSubscribers || 0,
      growthRate: assumptions.growthRate || 0,
      churnRate: assumptions.churnRate || 0,
      costPerUnit: assumptions.costPerUnit ?? 0,
      costPerSubscriber: assumptions.costPerSubscriber ?? 0
    });
  }, [scenario]);

  // Initialize caseFormData when entering case edit mode
  useEffect(() => {
    if (scenario?.cases && caseEditMode) {
      const fromAssumptions = (a) => ({
        timeFrame: a?.timeFrame ?? 12,
        unitPrice: a?.unitPrice ?? 0,
        initialUnits: a?.initialUnits ?? 0,
        growthRate: a?.growthRate ?? 0,
        subscriptionPrice: a?.subscriptionPrice ?? 0,
        initialSubscribers: a?.initialSubscribers ?? 0,
        churnRate: a?.churnRate ?? 0,
        costPerUnit: a?.costPerUnit ?? 0,
        costPerSubscriber: a?.costPerSubscriber ?? 0
      });
      setCaseFormData({
        base: fromAssumptions(scenario.cases.base?.assumptions),
        best: fromAssumptions(scenario.cases.best?.assumptions),
        worst: fromAssumptions(scenario.cases.worst?.assumptions)
      });
    }
  }, [scenario?.cases, caseEditMode]);

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

  // Convert scenario data to formData format for ResultsView
  const getFormData = () => {
    if (!scenario) return null;
    const assumptions = scenario.assumptions ?? scenario.cases?.base?.assumptions;
    if (!assumptions) return null;
    return {
      name: scenario.name,
      revenue_model: scenario.revenue_model,
      timeFrame: assumptions.timeFrame || 12,
      unitPrice: assumptions.unitPrice || 0,
      initialUnits: assumptions.initialUnits || 0,
      subscriptionPrice: assumptions.subscriptionPrice || 0,
      initialSubscribers: assumptions.initialSubscribers || 0,
      growthRate: assumptions.growthRate || 0,
      churnRate: assumptions.churnRate || 0,
      costPerUnit: assumptions.costPerUnit ?? 0,
      costPerSubscriber: assumptions.costPerSubscriber ?? 0
    };
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
          growthRate: formData.growthRate,
          costPerUnit: formData.costPerUnit ?? 0
        } : {}),
        ...(formData.revenue_model === 'subscription' || formData.revenue_model === 'hybrid' ? {
          subscriptionPrice: formData.subscriptionPrice,
          initialSubscribers: formData.initialSubscribers,
          churnRate: formData.churnRate,
          growthRate: formData.growthRate,
          costPerSubscriber: formData.costPerSubscriber ?? 0
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

  const handleDuplicate = async () => {
    try {
      const body = scenario.cases
        ? {
            name: `${scenario.name} (Copy)`,
            revenue_model: scenario.revenue_model,
            cases: scenario.cases
          }
        : {
            name: `${scenario.name} (Copy)`,
            revenue_model: scenario.revenue_model,
            assumptions: scenario.assumptions,
            results: scenario.results || null
          };
      await axios.post(`${API_URL}/scenarios`, body, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to duplicate scenario: ' + (err.response?.data?.error || err.message));
    }
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

  const handleCaseInputChange = (caseKey, e) => {
    const { name, value } = e.target;
    setCaseFormData(prev => ({
      ...prev,
      [caseKey]: { ...prev[caseKey], [name]: parseFloat(value) || 0 }
    }));
  };

  const handleRecalculateCases = async () => {
    if (!scenario?.cases) return;
    setCaseRecalculating(true);
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const [baseRes, bestRes, worstRes] = await Promise.all([
        axios.post(`${API_URL}/calculate`, { revenue_model: scenario.revenue_model, assumptions: buildAssumptions(caseFormData.base, scenario.revenue_model) }, authHeader),
        axios.post(`${API_URL}/calculate`, { revenue_model: scenario.revenue_model, assumptions: buildAssumptions(caseFormData.best, scenario.revenue_model) }, authHeader),
        axios.post(`${API_URL}/calculate`, { revenue_model: scenario.revenue_model, assumptions: buildAssumptions(caseFormData.worst, scenario.revenue_model) }, authHeader)
      ]);
      const updatedCases = {
        base: { assumptions: buildAssumptions(caseFormData.base, scenario.revenue_model), results: baseRes.data },
        best: { assumptions: buildAssumptions(caseFormData.best, scenario.revenue_model), results: bestRes.data },
        worst: { assumptions: buildAssumptions(caseFormData.worst, scenario.revenue_model), results: worstRes.data }
      };
      await axios.put(`${API_URL}/scenarios/${id}`, { cases: updatedCases }, authHeader);
      setScenario(prev => ({ ...prev, cases: updatedCases }));
      setCaseEditMode(false);
    } catch (err) {
      alert('Error recalculating: ' + (err.response?.data?.error || err.message));
    } finally {
      setCaseRecalculating(false);
    }
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

          <div className="card">
            <h2>Cost Assumptions (optional)</h2>
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
              </div>
            )}
          </div>

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

  if (scenario.cases && caseEditMode) {
    const rev = scenario.revenue_model;
    return (
      <div className="container">
        <h1>Edit Assumptions – {scenario.name}</h1>
        <p className="help-text" style={{ marginBottom: 16 }}>Update assumptions for each case, then recalculate to refresh the comparison.</p>
        <div className="model-form">
          {['base', 'best', 'worst'].map((caseKey) => (
            <div key={caseKey} className="card">
              <h2>{caseKey === 'base' ? 'Base case' : caseKey === 'best' ? 'Best case' : 'Worst case'}</h2>
              <div className="form-group">
                <label>Projection Period (months)</label>
                <select name="timeFrame" value={caseFormData[caseKey].timeFrame} onChange={(e) => handleCaseInputChange(caseKey, e)}>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                  <option value={36}>36 months</option>
                </select>
              </div>
              {(rev === 'one-time' || rev === 'hybrid') && (
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
              {(rev === 'subscription' || rev === 'hybrid') && (
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
              {(rev === 'one-time' || rev === 'hybrid') && (
                <div className="form-group">
                  <label>Cost per unit ($)</label>
                  <input type="number" name="costPerUnit" value={caseFormData[caseKey].costPerUnit} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" step="0.01" />
                </div>
              )}
              {(rev === 'subscription' || rev === 'hybrid') && (
                <div className="form-group">
                  <label>Cost per subscriber/month ($)</label>
                  <input type="number" name="costPerSubscriber" value={caseFormData[caseKey].costPerSubscriber} onChange={(e) => handleCaseInputChange(caseKey, e)} min="0" step="0.01" />
                </div>
              )}
            </div>
          ))}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setCaseEditMode(false)}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleRecalculateCases} disabled={caseRecalculating}>
              {caseRecalculating ? 'Recalculating...' : 'Recalculate all cases'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (scenario.cases) {
    return (
      <MultiCaseResultsView
        scenarioName={scenario.name}
        revenueModel={scenario.revenue_model}
        cases={scenario.cases}
        onBack={() => navigate('/dashboard')}
        onSave={handleSave}
        saving={false}
        onDuplicate={handleDuplicate}
        onEditAssumptions={() => setCaseEditMode(true)}
      />
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

  const currentFormData = formData || getFormData();
  
  if (!currentFormData) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <ResultsView
      formData={currentFormData}
      results={scenario.results}
      onBack={handleEditAssumptions}
      onSave={handleSave}
      saving={false}
      onDuplicate={handleDuplicate}
    />
  );
}

export default ViewModel;