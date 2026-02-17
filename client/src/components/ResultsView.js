import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import './ResultsView.css';

function ResultsView({ formData, results, onBack, onSave, saving, onDuplicate }) {
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

  const hasCosts = projections.some(p => p.cost !== undefined || p.grossProfit !== undefined);
  const chartData = projections.map(proj => ({
    period: `Month ${proj.period}`,
    revenue: proj.revenue,
    ...(proj.oneTimeRevenue !== undefined && { oneTime: proj.oneTimeRevenue }),
    ...(proj.subscriptionRevenue !== undefined && { subscription: proj.subscriptionRevenue }),
    ...(proj.cost !== undefined && { cost: proj.cost }),
    ...(proj.grossProfit !== undefined && { grossProfit: proj.grossProfit })
  }));

  // Build assumptions list for exports (audit trail)
  const getAssumptionsList = (data) => {
    const list = [
      { label: 'Model name', value: data.name || '' },
      { label: 'Revenue model', value: data.revenue_model || '' },
      { label: 'Projection period (months)', value: String(data.timeFrame ?? 12) }
    ];
    if (data.revenue_model === 'one-time' || data.revenue_model === 'hybrid') {
      list.push(
        { label: 'Price per unit ($)', value: String(data.unitPrice ?? 0) },
        { label: 'Initial units sold (Month 1)', value: String(data.initialUnits ?? 0) },
        { label: 'Monthly growth rate (%)', value: String(data.growthRate ?? 0) }
      );
    }
    if (data.revenue_model === 'subscription' || data.revenue_model === 'hybrid') {
      list.push(
        { label: 'Subscription price ($/month)', value: String(data.subscriptionPrice ?? 0) },
        { label: 'Initial subscribers', value: String(data.initialSubscribers ?? 0) },
        { label: 'Monthly churn rate (%)', value: String(data.churnRate ?? 0) }
      );
      if (data.revenue_model === 'subscription') {
        list.push({ label: 'Monthly growth rate (%)', value: String(data.growthRate ?? 0) });
      }
    }
    if (data.revenue_model === 'one-time' || data.revenue_model === 'hybrid') {
      list.push({ label: 'Cost per unit ($)', value: String(data.costPerUnit ?? 0) });
    }
    if (data.revenue_model === 'subscription' || data.revenue_model === 'hybrid') {
      list.push({ label: 'Cost per subscriber per month ($)', value: String(data.costPerSubscriber ?? 0) });
    }
    return list;
  };

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

    // Assumptions section
    const assumptionsList = getAssumptionsList(formData);
    doc.setFontSize(14);
    doc.text('Assumptions', 20, 45);
    doc.setFontSize(11);
    let yPos = 55;
    assumptionsList.forEach(({ label, value }) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`${label}: ${value}`, 20, yPos);
      yPos += 7;
    });
    yPos += 5;

    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, yPos);
    doc.setFontSize(11);
    yPos += 10;
    doc.text(`Total Revenue: ${formatCurrency(results.summary.totalRevenue)}`, 20, yPos);
    yPos += 7;
    if (results.summary.totalCost !== undefined) {
      doc.text(`Total Cost: ${formatCurrency(results.summary.totalCost)}`, 20, yPos);
      yPos += 7;
      doc.text(`Total Gross Profit: ${formatCurrency(results.summary.totalGrossProfit)}`, 20, yPos);
      yPos += 7;
      doc.text(`Average Gross Margin: ${results.summary.averageGrossMarginPct ?? 0}%`, 20, yPos);
      yPos += 7;
    }
    doc.text(`Average Monthly Revenue: ${formatCurrency(results.summary.averageMonthlyRevenue)}`, 20, yPos);
    yPos += 7;
    doc.text(`Projection Period: ${results.summary.periods} months`, 20, yPos);
    yPos += 15;

    // Table
    doc.setFontSize(10);
    doc.text('Period', 20, yPos);
    doc.text('Revenue', 80, yPos);
    if (hasCosts) {
      doc.text('Cost', 120, yPos);
      doc.text('Gross Profit', 160, yPos);
    } else if (formData.revenue_model === 'hybrid') {
      doc.text('One-Time', 120, yPos);
      doc.text('Subscription', 160, yPos);
    }
    yPos += 10;
    projections.slice(0, 20).forEach((proj) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(`Month ${proj.period}`, 20, yPos);
      doc.text(formatCurrency(proj.revenue), 80, yPos);
      if (hasCosts) {
        doc.text(formatCurrency(proj.cost ?? 0), 120, yPos);
        doc.text(formatCurrency(proj.grossProfit ?? 0), 160, yPos);
      } else if (formData.revenue_model === 'hybrid') {
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
      if (hasCosts) {
        row['Cost'] = proj.cost ?? 0;
        row['Gross Profit'] = proj.grossProfit ?? 0;
        if (proj.marginPct !== undefined) row['Margin %'] = proj.marginPct;
      }
      if (formData.revenue_model === 'hybrid' && !hasCosts) {
        row['One-Time Revenue'] = proj.oneTimeRevenue || 0;
        row['Subscription Revenue'] = proj.subscriptionRevenue || 0;
      }
      if (proj.units !== undefined) row['Units'] = proj.units;
      if (proj.subscribers !== undefined) row['Subscribers'] = proj.subscribers;
      return row;
    });

    const wsProjections = XLSX.utils.json_to_sheet(csvData);
    const assumptionsList = getAssumptionsList(formData);
    const assumptionsRows = assumptionsList.map(({ label, value }) => ({ Assumption: label, Value: value }));
    const wsAssumptions = XLSX.utils.json_to_sheet(assumptionsRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsAssumptions, 'Assumptions');
    XLSX.utils.book_append_sheet(wb, wsProjections, 'Projections');
    XLSX.writeFile(wb, `${formData.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  return (
    <div className="container">
      <div className="results-header">
        <h1>{formData.name}</h1>
        <div className="results-actions">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBack();
            }} 
            className="btn btn-secondary"
            type="button"
          >
            Edit Assumptions
          </button>
          <button onClick={exportToPDF} className="btn btn-secondary">
            Export PDF
          </button>
          <button onClick={exportToCSV} className="btn btn-secondary">
            Export Excel
          </button>
          {onDuplicate && (
            <button onClick={onDuplicate} className="btn btn-secondary" type="button">
              Duplicate
            </button>
          )}
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
          {hasCosts && results.summary.totalCost !== undefined && (
            <>
              <div className="summary-item-large">
                <div className="summary-label">Total Cost</div>
                <div className="summary-value-large">{formatCurrency(results.summary.totalCost)}</div>
              </div>
              <div className="summary-item-large">
                <div className="summary-label">Total Gross Profit</div>
                <div className="summary-value-large">{formatCurrency(results.summary.totalGrossProfit)}</div>
              </div>
              <div className="summary-item-large">
                <div className="summary-label">Average Gross Margin</div>
                <div className="summary-value-large">{results.summary.averageGrossMarginPct ?? 0}%</div>
              </div>
            </>
          )}
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
        <h2 className="results-chart-title">Revenue Projection Chart</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 70 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#007bff" strokeWidth={2} name="Total Revenue" />
            {hasCosts && <Line type="monotone" dataKey="grossProfit" stroke="#28a745" strokeWidth={2} name="Gross Profit" />}
            {hasCosts && <Line type="monotone" dataKey="cost" stroke="#dc3545" strokeWidth={2} name="Cost" />}
            {formData.revenue_model === 'hybrid' && !hasCosts && (
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
                {formData.revenue_model === 'hybrid' && !hasCosts && <th>One-Time Revenue</th>}
                {formData.revenue_model === 'hybrid' && !hasCosts && <th>Subscription Revenue</th>}
                <th>Total Revenue</th>
                {hasCosts && <th>Cost</th>}
                {hasCosts && <th>Gross Profit</th>}
                {hasCosts && <th>Margin %</th>}
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
                  {formData.revenue_model === 'hybrid' && !hasCosts && (
                    <>
                      <td>{formatCurrency(proj.oneTimeRevenue || 0)}</td>
                      <td>{formatCurrency(proj.subscriptionRevenue || 0)}</td>
                    </>
                  )}
                  <td className="revenue-cell">{formatCurrency(proj.revenue)}</td>
                  {hasCosts && <td>{formatCurrency(proj.cost ?? 0)}</td>}
                  {hasCosts && <td>{formatCurrency(proj.grossProfit ?? 0)}</td>}
                  {hasCosts && <td>{proj.marginPct != null ? `${proj.marginPct}%` : '-'}</td>}
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