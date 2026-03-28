import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../api/auth";

export default function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await register(form.full_name, form.email, form.password);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="logo-icon">📚</div>
          <h1>Book<span>gate</span></h1>
        </div>

        <h2>Create account</h2>
        <p className="subtitle">Join the library today</p>

        {error && <div className="alert alert-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.full_name} onChange={set("full_name")} placeholder="Jane Doe" required />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 characters" required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat password" required />
          </div>
          <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 4 }} disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 24 }}>
          Already have an account?&nbsp;<Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
