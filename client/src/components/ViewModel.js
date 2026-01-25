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
  const formData = {
    name: scenario.name,
    revenue_model: scenario.revenue_model,
    timeFrame: scenario.assumptions.timeFrame || 12,
    unitPrice: scenario.assumptions.unitPrice || 0,
    initialUnits: scenario.assumptions.initialUnits || 0,
    subscriptionPrice: scenario.assumptions.subscriptionPrice || 0,
    initialSubscribers: scenario.assumptions.initialSubscribers || 0,
    growthRate: scenario.assumptions.growthRate || 0,
    churnRate: scenario.assumptions.churnRate || 0
  };

  const handleSave = async () => {
    // Results are already saved, just navigate back
    navigate('/dashboard');
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

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
      formData={formData}
      results={scenario.results}
      onBack={handleBack}
      onSave={handleSave}
      saving={false}
    />
  );
}

export default ViewModel;