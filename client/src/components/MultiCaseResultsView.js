import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import './ResultsView.css';

const CASE_COLORS = { base: '#007bff', best: '#28a745', worst: '#dc3545' };

function MultiCaseResultsView({ scenarioName, revenueModel, cases, onBack, onSave, saving, onDuplicate, onEditAssumptions }) {
  const { base, best, worst } = cases || {};
  const caseKeys = ['base', 'best', 'worst'];
  const caseLabels = { base: 'Base', best: 'Best', worst: 'Worst' };

  // Normalize so each case has at least { results: { projections: [], summary: {} } } for safe access
  const normalizedCases = {
    base: base ? { assumptions: base.assumptions, results: base.results || { projections: [], summary: {} } } : { assumptions: {}, results: { projections: [], summary: {} } },
    best: best ? { assumptions: best.assumptions, results: best.results || { projections: [], summary: {} } } : { assumptions: {}, results: { projections: [], summary: {} } },
    worst: worst ? { assumptions: worst.assumptions, results: worst.results || { projections: [], summary: {} } } : { assumptions: {}, results: { projections: [], summary: {} } }
  };

  const formatCurrency = (v) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v ?? 0);

  const maxPeriod = Math.max(
    ...caseKeys.map(k => normalizedCases[k].results?.projections?.length || 0),
    1
  );
  const chartData = [];
  for (let p = 1; p <= maxPeriod; p++) {
    const row = { period: `Month ${p}` };
    caseKeys.forEach(k => {
      const proj = normalizedCases[k].results?.projections?.find(pr => pr.period === p);
      row[k] = proj ? proj.revenue : null;
    });
    chartData.push(row);
  }

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text(scenarioName, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Best / Base / Worst Comparison', pageWidth / 2, 30, { align: 'center' });

    let y = 45;
    doc.setFontSize(10);
    doc.text('Case', 20, y);
    doc.text('Total Revenue', 70, y);
    doc.text('Avg Monthly', 120, y);
    if (normalizedCases.base.results.summary?.totalCost !== undefined) {
      doc.text('Total Gross Profit', 170, y);
    }
    y += 8;
    caseKeys.forEach(k => {
      const sum = normalizedCases[k].results.summary;
      doc.text(caseLabels[k], 20, y);
      doc.text(formatCurrency(sum?.totalRevenue), 70, y);
      doc.text(formatCurrency(sum?.averageMonthlyRevenue), 120, y);
      if (normalizedCases.base.results.summary?.totalGrossProfit !== undefined) {
        doc.text(formatCurrency(sum?.totalGrossProfit), 170, y);
      }
      y += 7;
    });
    y += 10;
    doc.text('Period', 20, y);
    caseKeys.forEach((k, i) => doc.text(caseLabels[k], 50 + i * 45, y));
    y += 7;
    for (let p = 1; p <= Math.min(maxPeriod, 24); p++) {
      doc.text(`Month ${p}`, 20, y);
      caseKeys.forEach((k, i) => {
        const proj = normalizedCases[k].results.projections?.find(pr => pr.period === p);
        doc.text(proj ? formatCurrency(proj.revenue) : '-', 50 + i * 45, y);
      });
      y += 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
    doc.save(`${(scenarioName || 'comparison').replace(/[^a-z0-9]/gi, '_')}.pdf`);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const summaryRows = [
      ['Case', 'Total Revenue', 'Average Monthly Revenue', 'Total Cost', 'Total Gross Profit', 'Periods'],
      ...caseKeys.map(k => {
        const sum = normalizedCases[k].results.summary;
        return [
          caseLabels[k],
          sum?.totalRevenue ?? '',
          sum?.averageMonthlyRevenue ?? '',
          sum?.totalCost ?? '',
          sum?.totalGrossProfit ?? '',
          sum?.periods ?? ''
        ];
      })
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const projRows = [['Period', ...caseKeys.map(k => caseLabels[k])]];
    for (let p = 1; p <= maxPeriod; p++) {
      projRows.push([
        `Month ${p}`,
        ...caseKeys.map(k => {
          const proj = normalizedCases[k].results.projections?.find(pr => pr.period === p);
          return proj ? proj.revenue : '';
        })
      ]);
    }
    const wsProj = XLSX.utils.aoa_to_sheet(projRows);
    XLSX.utils.book_append_sheet(wb, wsProj, 'Projections');
    XLSX.writeFile(wb, `${(scenarioName || 'comparison').replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  return (
    <div className="container">
      <div className="results-header">
        <h1>{scenarioName}</h1>
        <div className="results-actions">
          {onEditAssumptions && <button type="button" className="btn btn-secondary" onClick={onEditAssumptions}>Edit Assumptions</button>}
          <button type="button" className="btn btn-secondary" onClick={onBack}>{onDuplicate ? 'Back to Dashboard' : (onEditAssumptions ? 'Back to Dashboard' : 'Edit Assumptions')}</button>
          <button type="button" className="btn btn-secondary" onClick={exportToPDF}>Export PDF</button>
          <button type="button" className="btn btn-secondary" onClick={exportToExcel}>Export Excel</button>
          {onDuplicate && <button type="button" className="btn btn-secondary" onClick={onDuplicate}>Duplicate</button>}
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Scenario'}
          </button>
        </div>
      </div>

      <div className="results-summary card">
        <h2>Summary by case</h2>
        <div className="table-container">
          <table className="projection-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Base</th>
                <th>Best</th>
                <th>Worst</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Revenue</td>
                {caseKeys.map(k => (
                  <td key={k}>{formatCurrency(normalizedCases[k].results.summary?.totalRevenue)}</td>
                ))}
              </tr>
              <tr>
                <td>Average Monthly Revenue</td>
                {caseKeys.map(k => (
                  <td key={k}>{formatCurrency(normalizedCases[k].results.summary?.averageMonthlyRevenue)}</td>
                ))}
              </tr>
              {normalizedCases.base.results.summary?.totalCost !== undefined && (
                <>
                  <tr>
                    <td>Total Cost</td>
                    {caseKeys.map(k => (
                      <td key={k}>{formatCurrency(normalizedCases[k].results.summary?.totalCost)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Total Gross Profit</td>
                    {caseKeys.map(k => (
                      <td key={k}>{formatCurrency(normalizedCases[k].results.summary?.totalGrossProfit)}</td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Revenue comparison</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={v => `$${v != null ? Number(v).toLocaleString() : ''}`} />
            <Tooltip formatter={v => (v != null ? formatCurrency(v) : '-')} />
            <Legend />
            {caseKeys.map(k => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                name={caseLabels[k]}
                stroke={CASE_COLORS[k]}
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

export default MultiCaseResultsView;
