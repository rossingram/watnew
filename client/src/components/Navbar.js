import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/dashboard" className="navbar-brand">
            <span className="brand-name">Watnew</span>
            <span className="brand-tagline">What will your new product make?</span>
          </Link>
          {user && (
            <div className="navbar-menu">
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              <Link to="/create" className="navbar-link">New Model</Link>
              <Link to="/billing" className="navbar-link">Billing</Link>
              <span className="navbar-user">{user.email}</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;