import React from 'react';
import { Link } from 'react-router-dom';
import './Terms.css';

function Privacy() {
  return (
    <div className="terms-page">
      <nav className="terms-nav">
        <div className="container">
          <Link to="/" className="logo-link">
            <span className="logo-icon">📊</span>
            <span className="logo-text">Watnew</span>
          </Link>
          <Link to="/" className="btn-nav">Back to Home</Link>
        </div>
      </nav>

      <div className="container">
        <div className="terms-content">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: January 2026</p>

          <section>
            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Email address, password (hashed), and account preferences</li>
              <li><strong>Financial Models:</strong> The assumptions, projections, and scenarios you create</li>
              <li><strong>Payment Information:</strong> Processed securely through Stripe. We do not store credit card details.</li>
              <li><strong>Usage Data:</strong> How you interact with the Service, including features used and time spent</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send you service-related communications</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Analyze usage patterns to improve the Service (using aggregated, anonymized data)</li>
            </ul>
          </section>

          <section>
            <h2>3. Data Storage and Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. 
              Your data is stored securely and encrypted in transit. However, no method of transmission over the 
              Internet or electronic storage is 100% secure.
            </p>
            <p>
              Your financial models and data are stored in your account and are only accessible to you. We do not 
              share your individual models or data with third parties.
            </p>
          </section>

          <section>
            <h2>4. Third-Party Services</h2>
            <p>
              We use the following third-party services that may collect information:
            </p>
            <ul>
              <li><strong>Stripe:</strong> For payment processing. Stripe's privacy policy applies to payment data.</li>
              <li><strong>Hosting Services:</strong> Your data is stored on secure cloud infrastructure.</li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data and financial models</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and all associated data</li>
              <li>Export your data (available through the Service)</li>
              <li>Opt out of marketing communications (service emails are required for account management)</li>
            </ul>
            <p>
              To exercise these rights, contact us at <a href="mailto:help@watnew.me">help@watnew.me</a> or use the account deletion feature 
              in your billing dashboard.
            </p>
            <p>
              If you are a California resident, you may have additional rights under the California Consumer 
              Privacy Act (CCPA), including the right to know, delete, and opt out of the sale of your 
              personal information. We do not sell personal information. For more details, see the rights 
              above or contact us.
            </p>
          </section>

          <section>
            <h2>6. International Data and California</h2>
            <p>
              Your information may be processed and stored in the United States or other countries where our 
              service providers operate. By using the Service, you consent to such transfer. If you are located 
              outside the U.S., your data may be subject to different privacy laws.
            </p>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>
              We retain your account information and financial models for as long as your account is active. 
              If you cancel your subscription, we will retain your data for 30 days, after which it may be 
              permanently deleted. You can request immediate deletion by contacting support.
            </p>
          </section>

          <section>
            <h2>8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to maintain your session, remember your preferences, 
              and analyze Service usage. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2>9. Children's Privacy</h2>
            <p>
              The Service is not intended for users under the age of 18. We do not knowingly collect personal 
              information from children.
            </p>
          </section>

          <section>
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:help@watnew.me">help@watnew.me</a><br />
              <strong>Website:</strong> <Link to="/">watnew.me</Link>
            </p>
          </section>
        </div>
      </div>

      <footer className="terms-footer">
        <div className="container">
          <div style={{ marginBottom: '15px' }}>
            <Link to="/" style={{ marginRight: '20px' }}>← Back to Home</Link>
            <a href="mailto:help@watnew.me" style={{ color: '#78c0e0', textDecoration: 'none' }}>help@watnew.me</a>
          </div>
          <p>&copy; 2026 Watnew</p>
        </div>
      </footer>
    </div>
  );
}

export default Privacy;