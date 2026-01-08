import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "./navbar.css"; 

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAuthDropdown(false);
      }
    };
    if (showAuthDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAuthDropdown]);

  return (
    <nav className="glass-navbar">
      <div className="navbar-container">
        {/* Brand Section */}
        <Link to="/" className="brand-section">
          <div className="logo-3d-wrapper">
            <img src="/assam-university-logo.png" alt="Logo" className="brand-logo" 
                 onError={(e) => (e.target.style.display = "none")} />
          </div>
          <span className="brand-text">Alumni-Student Portal</span>
        </Link>

        {/* Navigation Links */}
        <div className="nav-central-links">
          <NavLink to="/" label="Home" active={location.pathname === "/"} />
          <NavLink to="/jobs" label="Jobs" active={location.pathname === "/jobs"} />
          {user && <NavLink to="/chat" label="Chat" active={location.pathname === "/chat"} />}
        </div>

        {/* Right Action Section */}
        <div className="nav-right-actions">
          {user ? (
            <div className="user-control-group">
              {user.role === "alumni" && (
                <Link to="/post-job" className="btn-3d btn-primary">Post Job</Link>
              )}
              
              

              <div className="user-profile-tag">
                <div className="user-details">
                  <span className="user-email-text">{user.email}</span>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </div>
                <button onClick={handleLogout} className="btn-3d btn-outline-danger">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-dropdown-wrapper" ref={dropdownRef}>
              <button className="btn-3d btn-primary" onClick={() => setShowAuthDropdown(!showAuthDropdown)}>
                Get Started <span className={`arrow ${showAuthDropdown ? 'up' : ''}`}>▼</span>
              </button>

              {showAuthDropdown && (
                <div className="glass-dropdown">
                  <Link to="/signup" className="dropdown-item" onClick={() => setShowAuthDropdown(false)}>Sign Up</Link>
                  <div className="dropdown-divider"></div>
                  <Link to="/login" className="dropdown-item" onClick={() => setShowAuthDropdown(false)}>Sign In</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, label, active }) {
  return (
    <Link to={to} className={`nav-link-item ${active ? 'active' : ''}`}>
      {label}
      <div className="active-indicator"></div>
    </Link>
  );
}