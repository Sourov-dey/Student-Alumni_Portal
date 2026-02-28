// frontend/src/components/Navbar.jsx - FULLY RESPONSIVE
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowMobileMenu(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowAuthDropdown(false);
      }
    };
    if (showAuthDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAuthDropdown]);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showMobileMenu]);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <>
      <nav className="glass-navbar">
        <div className="navbar-container">
          {/* Brand Section */}
          <Link to="/" className="brand-section">
            <div className="logo-3d-wrapper">
              <img
                src="/assam-university-logo.png"
                alt="Logo"
                className="brand-logo"
                onError={(e) => (e.target.style.display = "none")}
              />
            </div>
            <span className="brand-text">Alumni-Student Portal</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="nav-central-links">
            <NavLink
              to="/"
              label="Home"
              active={location.pathname === "/"}
            />
            <NavLink
              to="/jobs"
              label="Jobs"
              active={location.pathname === "/jobs"}
            />
            {user && (
              <NavLink
                to="/chat"
                label="Chat"
                active={location.pathname === "/chat"}
              />
            )}
            {user?.role === "alumni" && (
              <NavLink
                to="/alumni-map"
                label="Map"
                active={location.pathname === "/alumni-map"}
              />
            )}
            {user && (
              <NavLink
                to="/profile"
                label="Profile"
                active={location.pathname === "/profile"}
              />
            )}
            {user && user.role === "admin" && (
              <NavLink
                to="/admin"
                label="Admin"
                active={location.pathname.startsWith("/admin")}
              />
            )}
          </div>

          {/* Right Action Section */}
          <div className="nav-right-actions">
            {user ? (
              <>
                {/* Mobile Menu Toggle */}
                <button
                  className={`mobile-menu-toggle ${showMobileMenu ? "active" : ""}`}
                  onClick={toggleMobileMenu}
                  aria-label="Toggle menu"
                >
                  <div className="hamburger-icon">
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                  </div>
                </button>

                {/* Desktop User Controls */}
                <div className="user-control-group">
                  {user.role === "alumni" && (
                    <Link to="/post-job" className="btn-3d btn-primary">
                      Post Job
                    </Link>
                  )}

                  <div className="user-profile-tag">
                    <div className="user-details">
                      <span className="user-email-text">{user.email}</span>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                        {user.role !== "admin" && (
                          user.verified ? (
                            <span title="Verified" style={{ fontSize: 14, cursor: "default" }}>✅</span>
                          ) : (
                            <Link to="/verify-id" style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>Verify</Link>
                          )
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="btn-3d btn-outline-danger"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Mobile Menu Toggle for Non-Authenticated Users */}
                <button
                  className={`mobile-menu-toggle ${showMobileMenu ? "active" : ""}`}
                  onClick={toggleMobileMenu}
                  aria-label="Toggle menu"
                >
                  <div className="hamburger-icon">
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                  </div>
                </button>

                {/* Desktop Auth Dropdown */}
                <div className="auth-dropdown-wrapper" ref={dropdownRef}>
                  <button
                    className="btn-3d btn-primary"
                    onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                  >
                    Get Started{" "}
                    <span className={`arrow ${showAuthDropdown ? "up" : ""}`}>
                      ▼
                    </span>
                  </button>

                  {showAuthDropdown && (
                    <div className="glass-dropdown">
                      <Link
                        to="/signup"
                        className="dropdown-item"
                        onClick={() => setShowAuthDropdown(false)}
                      >
                        Sign Up
                      </Link>
                      <div className="dropdown-divider"></div>
                      <Link
                        to="/login"
                        className="dropdown-item"
                        onClick={() => setShowAuthDropdown(false)}
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <>
          <div
            className="mobile-menu-overlay"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="mobile-menu" ref={mobileMenuRef}>
            {/* Mobile Navigation Links */}
            <div className="mobile-nav-links">
              <NavLink
                to="/"
                label="Home"
                active={location.pathname === "/"}
              />
              <NavLink
                to="/jobs"
                label="Jobs"
                active={location.pathname === "/jobs"}
              />
              {user && (
                <NavLink
                  to="/chat"
                  label="Chat"
                  active={location.pathname === "/chat"}
                />
              )}
              {user && (
                <NavLink
                  to="/alumni-map"
                  label="Map"
                  active={location.pathname === "/alumni-map"}
                />
              )}
              {user && (
                <NavLink
                  to="/profile"
                  label="Profile"
                  active={location.pathname === "/profile"}
                />
              )}
              {user && user.role === "admin" && (
                <NavLink
                  to="/admin"
                  label="Admin"
                  active={location.pathname.startsWith("/admin")}
                />
              )}
            </div>

            {/* Mobile User Section or Auth Buttons */}
            {user ? (
              <div className="mobile-user-section">
                <div className="mobile-user-info">
                  <div className="user-details">
                    <span className="user-email-text">{user.email}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                      {user.role !== "admin" && (
                        user.verified ? (
                          <span title="Verified" style={{ fontSize: 14, cursor: "default" }}>✅</span>
                        ) : (
                          <Link to="/verify-id" style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}
                            onClick={() => setShowMobileMenu(false)}>Verify</Link>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="mobile-actions">
                  {user.role === "alumni" && (
                    <Link
                      to="/post-job"
                      className="btn-3d btn-primary"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Post Job
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="btn-3d btn-outline-danger"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="mobile-auth-buttons">
                <Link
                  to="/signup"
                  className="btn-3d btn-primary"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="btn-3d btn-primary"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function NavLink({ to, label, active }) {
  return (
    <Link to={to} className={`nav-link-item ${active ? "active" : ""}`}>
      {label}
      <div className="active-indicator"></div>
    </Link>
  );
}