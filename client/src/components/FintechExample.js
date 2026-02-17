import React from 'react';
import './FintechExample.css';

function FintechExample() {
  return (
    <div className="fintech-example">
      <header className="fintech-nav">
        <div className="fintech-nav-inner">
          <div className="fintech-brand">
            <span className="fintech-brand-name">Watnew</span>
            <span className="fintech-brand-tagline">What will your new product make?</span>
          </div>
          <nav className="fintech-nav-menu">
            <a href="/dashboard" className="fintech-nav-link">Dashboard</a>
            <a href="/create" className="fintech-nav-link">New Model</a>
            <a href="/billing" className="fintech-nav-link">Billing</a>
            <span className="fintech-nav-user">user@example.com</span>
          </nav>
        </div>
      </header>

      <main className="fintech-example-container">
        <section className="fintech-page-header">
          <h1>Style guide</h1>
          <p className="fintech-subtitle">Fintech visual treatment — typography, cards, KPIs, and patterns.</p>
        </section>

        <section className="fintech-section">
          <h2 className="fintech-section-title">KPI summary</h2>
          <div className="summary-grid">
            <div className="summary-item-large">
              <div className="summary-label">Total revenue</div>
              <div className="summary-value-large">$1,247,000</div>
            </div>
            <div className="summary-item-large">
              <div className="summary-label">Subscribers</div>
              <div className="summary-value-large">12,840</div>
            </div>
            <div className="summary-item-large">
              <div className="summary-label">MRR</div>
              <div className="summary-value-large">$284,200</div>
            </div>
            <div className="summary-item-large">
              <div className="summary-label">Avg monthly</div>
              <div className="summary-value-large">$103,917</div>
            </div>
          </div>
        </section>

        <section className="fintech-section">
          <h2 className="fintech-section-title">Scenario cards</h2>
          <div className="scenarios-grid">
            <div className="scenario-card">
              <div className="scenario-header">
                <h3>SaaS growth scenario</h3>
                <span className="model-badge subscription">subscription</span>
              </div>
              <div className="scenario-summary">
                <div className="summary-item">
                  <span className="summary-label">Total revenue</span>
                  <span className="summary-value">$892,000</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Avg monthly</span>
                  <span className="summary-value">$74,333</span>
                </div>
              </div>
              <div className="scenario-footer">
                <span className="scenario-date">Updated: Feb 14, 2025</span>
                <div className="scenario-actions">
                  <button type="button" className="fintech-btn fintech-btn-primary fintech-btn-sm">View</button>
                  <button type="button" className="fintech-btn fintech-btn-secondary fintech-btn-sm">Duplicate</button>
                </div>
              </div>
            </div>
            <div className="scenario-card">
              <div className="scenario-header">
                <h3>Hybrid launch model</h3>
                <span className="model-badge hybrid">hybrid</span>
              </div>
              <div className="scenario-summary">
                <div className="summary-item">
                  <span className="summary-label">Total revenue</span>
                  <span className="summary-value">$1,104,500</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Avg monthly</span>
                  <span className="summary-value">$92,042</span>
                </div>
              </div>
              <div className="scenario-footer">
                <span className="scenario-date">Updated: Feb 12, 2025</span>
                <div className="scenario-actions">
                  <button type="button" className="fintech-btn fintech-btn-primary fintech-btn-sm">View</button>
                  <button type="button" className="fintech-btn fintech-btn-secondary fintech-btn-sm">Duplicate</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fintech-section">
          <h2 className="fintech-section-title">Projection table</h2>
          <div className="table-container">
            <table className="projection-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Revenue</th>
                  <th>Subscribers</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Month 1</td>
                  <td className="revenue-cell">$42,000</td>
                  <td>1,200</td>
                </tr>
                <tr>
                  <td>Month 2</td>
                  <td className="revenue-cell">$58,400</td>
                  <td>1,460</td>
                </tr>
                <tr>
                  <td>Month 3</td>
                  <td className="revenue-cell">$76,200</td>
                  <td>1,905</td>
                </tr>
                <tr>
                  <td>Month 4</td>
                  <td className="revenue-cell">$95,800</td>
                  <td>2,395</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="fintech-section">
          <h2 className="fintech-section-title">Buttons</h2>
          <div className="fintech-button-row">
            <button type="button" className="fintech-btn fintech-btn-primary">Primary</button>
            <button type="button" className="fintech-btn fintech-btn-secondary">Secondary</button>
            <button type="button" className="fintech-btn fintech-btn-danger">Danger</button>
          </div>
        </section>

        <section className="fintech-section">
          <h2 className="fintech-section-title">Form sample</h2>
          <div className="fintech-form">
            <div className="form-group">
              <label htmlFor="demo-name">Model name</label>
              <input id="demo-name" type="text" placeholder="e.g. Q1 launch scenario" readOnly />
              <span className="help-text">Choose a name that describes this projection.</span>
            </div>
            <div className="form-group">
              <label htmlFor="demo-price">Price per unit ($)</label>
              <input id="demo-price" type="number" placeholder="99" readOnly />
            </div>
          </div>
        </section>

        <section className="fintech-section">
          <h2 className="fintech-section-title">Empty state</h2>
          <div className="empty-state">
            <p>You haven&apos;t created any financial models yet.</p>
            <button type="button" className="fintech-btn fintech-btn-primary">Create your first model</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default FintechExample;
