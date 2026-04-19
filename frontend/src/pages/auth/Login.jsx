import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { login as apiLogin, getMe } from "../../api/auth";
import { useAuth } from "../../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokenRes = await apiLogin(email, password);
      const { access_token } = tokenRes.data;
      localStorage.setItem("token", access_token);
      const userRes = await getMe();
      const user = userRes.data;
      login(access_token, user);
      const dest = from && from !== "/login" ? from : user.role === "ADMIN" ? "/admin" : "/books";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-showcase">
          <span className="auth-showcase-badge">Curated Digital Library</span>
          <h2 className="auth-showcase-title">Borrow beautifully organized knowledge.</h2>
          <p className="auth-showcase-copy">
            Browse approved titles, manage requests, and keep your reading flow inside one calm glassy workspace.
          </p>
          <div className="auth-showcase-grid">
            <div className="auth-showcase-card">
              <span>Requests</span>
              <strong>Fast review</strong>
            </div>
            <div className="auth-showcase-card">
              <span>Reading</span>
              <strong>Clean access</strong>
            </div>
          </div>
        </div>

        <div className="auth-box">
          <div className="auth-logo">
            <div className="logo-icon">📚</div>
            <h1>Book<span>gate</span></h1>
          </div>

          <h2>Welcome back</h2>
          <p className="subtitle">Sign in to your account</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 4 }} disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="auth-footer" style={{ marginTop: 24 }}>
            Don't have an account?&nbsp;<Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
