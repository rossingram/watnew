import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import Pricing from './components/Pricing';
import Billing from './components/Billing';
import Dashboard from './components/Dashboard';
import CreateModel from './components/CreateModel';
import ViewModel from './components/ViewModel';
import Terms from './components/Terms';
import Privacy from './components/Privacy';
import Navbar from './components/Navbar';
import './App.css';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route
              path="/billing"
              element={
                <PrivateRoute>
                  <Navbar />
                  <Billing />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Navbar />
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/create"
              element={
                <PrivateRoute>
                  <Navbar />
                  <CreateModel />
                </PrivateRoute>
              }
            />
            <Route
              path="/scenario/:id"
              element={
                <PrivateRoute>
                  <Navbar />
                  <ViewModel />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;