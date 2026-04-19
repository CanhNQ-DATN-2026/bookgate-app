import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";
  const initials = user.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <nav className="navbar">
      <div className="navbar-brand-wrap">
        <span className="navbar-brand-badge">BG</span>
        <span className="navbar-brand-copy">
          <span className="navbar-brand-kicker">Digital Library</span>
          <span className="navbar-brand">Book<span>gate</span></span>
        </span>
      </div>

      <div className="navbar-links">
        {isAdmin ? (
          <>
            <NavLink className="nav-link" to="/admin">Dashboard</NavLink>
            <NavLink className="nav-link" to="/admin/books">Books</NavLink>
            <NavLink className="nav-link" to="/admin/users">Users</NavLink>
            <NavLink className="nav-link" to="/admin/requests">Requests</NavLink>
            <NavLink className="nav-link" to="/admin/upload-requests">Upload Requests</NavLink>
            <NavLink className="nav-link" to="/admin/downloads">Downloads</NavLink>
          </>
        ) : (
          <>
            <NavLink className="nav-link" to="/books">Browse</NavLink>
            <NavLink className="nav-link" to="/profile">Profile</NavLink>
            <NavLink className="nav-link" to="/my-requests">My Requests</NavLink>
            <NavLink className="nav-link" to="/request-upload">Request Book</NavLink>
            <NavLink className="nav-link" to="/my-downloads">Downloads</NavLink>
          </>
        )}
      </div>

      <div className="navbar-right">
        <button className="btn-theme" onClick={toggle} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          <span className="theme-glyph">{theme === "dark" ? "☀" : "☾"}</span>
        </button>
        <div className="navbar-user-pill" title={user.full_name}>
          <span className="navbar-user-avatar">{initials}</span>
          <span className="navbar-user-name">{user.full_name.split(" ")[0]}</span>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Sign out</button>
      </div>
    </nav>
  );
}
