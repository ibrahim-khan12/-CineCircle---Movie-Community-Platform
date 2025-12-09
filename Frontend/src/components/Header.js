import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <h1>🎬 Movie Community</h1>
          </Link>
        </div>
        <nav className="nav">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin" className="admin-link">⚡ Admin</Link>
                  </li>
                )}
                <li>
                  <Link to="/movies">Movies</Link>
                </li>
                <li>
                  <Link to="/watchlist">Watchlist</Link>
                </li>
                <li>
                  <Link to="/events">Events</Link>
                </li>
                <li>
                  <span className="user-name">👤 {user?.first_name}</span>
                </li>
                <li>
                  <button onClick={handleLogout} className="btn-link">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
