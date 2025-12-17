// frontend/src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo and Brand */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link">
            <img
              src="/logo.png"
              alt="Assam University"
              className="brand-logo"
            />
            <h1 className="brand-title">Alumni Network</h1>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>
          <NavLink to="/jobs" className="nav-link">
            Jobs
          </NavLink>
          {user && (
            <NavLink to="/chat" className="nav-link">
              Chat
            </NavLink>
          )}
        </div>

        {/* Auth Section */}
        <div className="navbar-auth">
          {user ? (
            <>
              {/* Show "Post Job" button for alumni/admin */}
              {(user.role === "alumni" || user.role === "admin") && (
                <Link to="/post-job" className="btn btn-post-job">
                  Post Job
                </Link>
              )}
              
              {/* Notification Bell */}
              {(user.role === "student" || user.role === "alumni") && (
                <NotificationBell />
              )}
              
              {/* User Info */}
              <div className="user-info">
                <span className="user-email">{user.email}</span>
                <span className="user-role">{user.role}</span>
              </div>
              
              {/* Logout Button */}
              <button className="btn btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Login to Post button for non-logged-in users */}
              <Link to="/login" className="btn btn-login-post">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}