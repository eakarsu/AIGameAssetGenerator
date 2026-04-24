import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CategoryPage from './pages/CategoryPage';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid token');
          return res.json();
        })
        .then((data) => setUser(data.user || data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  const handleLogin = (userData, tokenValue) => {
    localStorage.setItem('token', tokenValue);
    setToken(tokenValue);
    setUser(userData);
    showToast('Welcome back!');
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    showToast('Logged out successfully');
    navigate('/login');
  };

  const apiFetch = useCallback(
    async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || err.message || 'Request failed');
      }
      return res.json();
    },
    [token]
  );

  return (
    <div className="app">
      {token && user && <Navbar user={user} onLogout={handleLogout} />}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? '\u2713' : toast.type === 'error' ? '\u2717' : '\u2139'}
          </span>
          {toast.message}
        </div>
      )}

      <Routes>
        <Route
          path="/login"
          element={
            token && user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} showToast={showToast} />
          }
        />
        <Route
          path="/dashboard"
          element={
            token ? <Dashboard apiFetch={apiFetch} showToast={showToast} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/category/:name"
          element={
            token ? <CategoryPage apiFetch={apiFetch} showToast={showToast} /> : <Navigate to="/login" />
          }
        />
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </div>
  );
}

export default App;
