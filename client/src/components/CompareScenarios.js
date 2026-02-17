import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import './CompareScenarios.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const CHART_COLORS = ['#007bff', '#28a745', '#ffc107'];

function CompareScenarios() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [compared, setCompared] = useState([]); // scenarios being compared (2 or 3)

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/scenarios`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setScenarios(response.data.filter(s =>
        (s.results && s.results.projections?.length) ||
        (s.cases?.base?.results?.projections?.length)
      ));
      setLoading(false);
    } catch (err) {
      if (err.response?.data?.requiresSubscription) setError('subscription_required');
      else setError('Failed to load scenarios');
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      alert('Select at least 2 scenarios to compare.');
      return;
    }
    const selected = scenarios.filter(s => selectedIds.includes(s.id));
    setCompared(selected);
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  // Build chart data: one row per period, one key per scenario (sanitized for Recharts)
  const getResults = (s) => s.results || s.cases?.base?.results;

  const getChartData = () => {
    if (compared.length === 0) return [];
    const maxPeriod = Math.max(...compared.map(s => (getResults(s)?.projections?.length || 0)));
    const data = [];
    for (let p = 1; p <= maxPeriod; p++) {
      const row = { period: `Month ${p}` };
      compared.forEach((s, i) => {
        const results = getResults(s);
        const proj = results?.projections?.find(pr => pr.period === p);
        const key = `rev_${i}`;
        row[key] = proj ? proj.revenue : null;
      });
      data.push(row);
    }
    return data;
  };

  const exportComparisonPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text('Scenario Comparison', pageWidth / 2, 20, { align: 'center' });

    let y = 40;
    doc.setFontSize(12);
    doc.text('Summary', 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text('Scenario', 20, y);
    doc.text('Total Revenue', 80, y);
    doc.text('Avg Monthly', 140, y);
    y += 8;
    compared.forEach(s => {
      const sum = getResults(s)?.summary;
      doc.text((s.name || '').substring(0, 30), 20, y);
      doc.text(sum ? formatCurrency(sum.totalRevenue) : 'N/A', 80, y);
      doc.text(sum ? formatCurrency(sum.averageMonthlyRevenue) : 'N/A', 140, y);
      y += 7;
    });
    y += 10;
    doc.setFontSize(10);
    doc.text('Period', 20, y);
    compared.forEach((s, i) => {
      doc.text(`${s.name || 'Scenario'} (Revenue)`, 50 + i * 45, y);
    });
    y += 8;
    const maxPeriod = Math.max(...compared.map(s => (getResults(s)?.projections?.length || 0)));
    for (let p = 1; p <= Math.min(maxPeriod, 24); p++) {
      doc.text(`Month ${p}`, 20, y);
      compared.forEach((s, i) => {
        const proj = getResults(s)?.projections?.find(pr => pr.period === p);
        doc.text(proj ? formatCurrency(proj.revenue) : '-', 50 + i * 45, y);
      });
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
    doc.save('scenario_comparison.pdf');
  };

  const exportComparisonExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryRows = [
      ['Scenario', 'Total Revenue', 'Average Monthly Revenue', 'Periods'],
      ...compared.map(s => {
        const res = getResults(s);
        return [
          s.name || '',
          res?.summary?.totalRevenue ?? '',
          res?.summary?.averageMonthlyRevenue ?? '',
          res?.summary?.periods ?? ''
        ];
      })
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Comparison Summary');

    const maxPeriod = Math.max(...compared.map(s => (getResults(s)?.projections?.length || 0)));
    const projRows = [['Period', ...compared.map(s => `${s.name || 'Scenario'} (Revenue)`)]];
    for (let p = 1; p <= maxPeriod; p++) {
      projRows.push([
        `Month ${p}`,
        ...compared.map(s => {
          const proj = getResults(s)?.projections?.find(pr => pr.period === p);
          return proj ? proj.revenue : '';
        })
      ]);
    }
    const wsProj = XLSX.utils.aoa_to_sheet(projRows);
    XLSX.utils.book_append_sheet(wb, wsProj, 'Projections');
    XLSX.writeFile(wb, 'scenario_comparison.xlsx');
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error === 'subscription_required') {
    return (
      <div className="container">
        <div className="subscription-required-card">
          <h2>Subscription Required</h2>
          <p>You need an active subscription to compare scenarios.</p>
          <Link to="/pricing" className="btn btn-primary">View Pricing</Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
        <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  if (compared.length > 0) {
    const chartData = getChartData();
    return (
      <div className="container compare-container">
        <div className="compare-header">
          <h1>Compare Scenarios</h1>
          <div className="compare-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setCompared([])}>
              Back to selection
            </button>
            <button type="button" className="btn btn-secondary" onClick={exportComparisonPDF}>
              Export PDF
            </button>
            <button type="button" className="btn btn-secondary" onClick={exportComparisonExcel}>
              Export Excel
            </button>
          </div>
        </div>

        <div className="card">
          <h2>Summary</h2>
          <div className="table-container">
            <table className="projection-table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Total Revenue</th>
                  <th>Avg Monthly Revenue</th>
                  <th>Periods</th>
                </tr>
              </thead>
              <tbody>
                {compared.map(s => {
                  const res = getResults(s);
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{formatCurrency(res?.summary?.totalRevenue)}</td>
                      <td>{formatCurrency(res?.summary?.averageMonthlyRevenue)}</td>
                      <td>{res?.summary?.periods ?? '-'} months</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h2>Revenue Comparison Chart</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={v => `$${v != null ? Number(v).toLocaleString() : ''}`} />
              <Tooltip formatter={v => (v != null ? formatCurrency(v) : '-')} />
              <Legend />
              {compared.map((s, i) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={`rev_${i}`}
                  name={s.name}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="container compare-container">
      <div className="compare-header">
        <h1>Compare Scenarios</h1>
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
      <p className="compare-instructions">Select 2 or 3 scenarios with calculated results to compare.</p>
      {scenarios.length < 2 ? (
        <div className="empty-state">
          <p>You need at least 2 scenarios with results to compare.</p>
          <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        </div>
      ) : (
        <>
          <div className="card compare-select-card">
            <h2>Select scenarios</h2>
            <ul className="compare-scenario-list">
              {scenarios.map(s => (
                <li key={s.id} className="compare-scenario-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleSelect(s.id)}
                    />
                    <span className="compare-scenario-name">{s.name}</span>
                    <span className={`model-badge ${s.revenue_model}`}>{s.revenue_model}</span>
                    {(s.results?.summary || s.cases?.base?.results?.summary) && (
                      <span className="compare-scenario-summary">
                        {formatCurrency((s.results || s.cases?.base?.results)?.summary?.totalRevenue)} total
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCompare}
              disabled={selectedIds.length < 2}
            >
              Compare selected ({selectedIds.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CompareScenarios;
