import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <span className="navbar-logo">&#x1F3AE;</span>
          <span className="navbar-title">AI Game Assets</span>
        </div>

        <div className="navbar-right">
          <div className="navbar-user">
            <div className="user-avatar">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user?.name || user?.email}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
