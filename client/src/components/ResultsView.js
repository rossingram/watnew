import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import './ResultsView.css';

function ResultsView({ formData, results, onBack, onSave, saving }) {
  // Add defensive checks - server returns 'projections' (plural)
  const projections = results?.projections || results?.projection || [];
  if (!results || !Array.isArray(projections) || projections.length === 0) {
    return (
      <div className="container">
        <div className="error">
          <h2>Error: Invalid results data</h2>
          <p>Unable to display projections. Please try calculating again.</p>
          <button onClick={onBack} className="btn btn-primary">
            Back to Form
          </button>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const chartData = projections.map(proj => ({
    period: `Month ${proj.period}`,
    revenue: proj.revenue,
    ...(proj.oneTimeRevenue !== undefined && { oneTime: proj.oneTimeRevenue }),
    ...(proj.subscriptionRevenue !== undefined && { subscription: proj.subscriptionRevenue })
  }));

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(18);
    doc.text(formData.name, pageWidth / 2, 20, { align: 'center' });

    // Model type
    doc.setFontSize(12);
    doc.text(`Revenue Model: ${formData.revenue_model}`, pageWidth / 2, 30, { align: 'center' });

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, 50);
    doc.setFontSize(11);
    doc.text(`Total Revenue: ${formatCurrency(results.summary.totalRevenue)}`, 20, 60);
    doc.text(`Average Monthly Revenue: ${formatCurrency(results.summary.averageMonthlyRevenue)}`, 20, 67);
    doc.text(`Projection Period: ${results.summary.periods} months`, 20, 74);

    // Table
    let yPos = 90;
    doc.setFontSize(10);
    doc.text('Period', 20, yPos);
    doc.text('Revenue', 80, yPos);
    if (formData.revenue_model === 'hybrid') {
      doc.text('One-Time', 120, yPos);
      doc.text('Subscription', 160, yPos);
    }

    yPos += 10;
    projections.slice(0, 20).forEach((proj, idx) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`Month ${proj.period}`, 20, yPos);
      doc.text(formatCurrency(proj.revenue), 80, yPos);
      if (formData.revenue_model === 'hybrid') {
        doc.text(formatCurrency(proj.oneTimeRevenue || 0), 120, yPos);
        doc.text(formatCurrency(proj.subscriptionRevenue || 0), 160, yPos);
      }
      yPos += 7;
    });

    doc.save(`${formData.name.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const exportToCSV = () => {
    const csvData = projections.map(proj => {
      const row = {
        Period: `Month ${proj.period}`,
        Revenue: proj.revenue
      };
      if (formData.revenue_model === 'hybrid') {
        row['One-Time Revenue'] = proj.oneTimeRevenue || 0;
        row['Subscription Revenue'] = proj.subscriptionRevenue || 0;
      }
      if (proj.units !== undefined) row['Units'] = proj.units;
      if (proj.subscribers !== undefined) row['Subscribers'] = proj.subscribers;
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projections');
    XLSX.writeFile(wb, `${formData.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  return (
    <div className="container">
      <div className="results-header">
        <h1>{formData.name}</h1>
        <div className="results-actions">
          <button onClick={onBack} className="btn btn-secondary">
            Edit Assumptions
          </button>
          <button onClick={exportToPDF} className="btn btn-secondary">
            Export PDF
          </button>
          <button onClick={exportToCSV} className="btn btn-secondary">
            Export Excel
          </button>
          <button onClick={onSave} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Scenario'}
          </button>
        </div>
      </div>

      <div className="results-summary card">
        <h2>Summary</h2>
        <div className="summary-grid">
          <div className="summary-item-large">
            <div className="summary-label">Total Revenue</div>
            <div className="summary-value-large">{formatCurrency(results.summary.totalRevenue)}</div>
          </div>
          <div className="summary-item-large">
            <div className="summary-label">Average Monthly Revenue</div>
            <div className="summary-value-large">{formatCurrency(results.summary.averageMonthlyRevenue)}</div>
          </div>
          <div className="summary-item-large">
            <div className="summary-label">Projection Period</div>
            <div className="summary-value-large">{results.summary.periods} months</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Revenue Projection Chart</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#007bff" strokeWidth={2} name="Total Revenue" />
            {formData.revenue_model === 'hybrid' && (
              <>
                <Line type="monotone" dataKey="oneTime" stroke="#28a745" strokeWidth={2} name="One-Time Revenue" />
                <Line type="monotone" dataKey="subscription" stroke="#ffc107" strokeWidth={2} name="Subscription Revenue" />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2>Revenue Projection Table</h2>
        <div className="table-container">
          <table className="projection-table">
            <thead>
              <tr>
                <th>Period</th>
                {formData.revenue_model === 'hybrid' && <th>One-Time Revenue</th>}
                {formData.revenue_model === 'hybrid' && <th>Subscription Revenue</th>}
                <th>Total Revenue</th>
                {formData.revenue_model === 'one-time' && <th>Units</th>}
                {formData.revenue_model === 'subscription' && <th>Subscribers</th>}
                {formData.revenue_model === 'hybrid' && (
                  <>
                    <th>Units</th>
                    <th>Subscribers</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {projections.map((proj) => (
                <tr key={proj.period}>
                  <td>Month {proj.period}</td>
                  {formData.revenue_model === 'hybrid' && (
                    <>
                      <td>{formatCurrency(proj.oneTimeRevenue || 0)}</td>
                      <td>{formatCurrency(proj.subscriptionRevenue || 0)}</td>
                    </>
                  )}
                  <td className="revenue-cell">{formatCurrency(proj.revenue)}</td>
                  {formData.revenue_model === 'one-time' && <td>{proj.units || 0}</td>}
                  {formData.revenue_model === 'subscription' && <td>{Math.round(proj.subscribers || 0)}</td>}
                  {formData.revenue_model === 'hybrid' && (
                    <>
                      <td>{proj.units || 0}</td>
                      <td>{Math.round(proj.subscribers || 0)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ResultsView;