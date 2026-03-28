import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { updateMyProfile } from "../../api/users";

export default function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || "", email: user?.email || "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    const payload = {};
    if (form.full_name !== user.full_name) payload.full_name = form.full_name;
    if (form.email !== user.email) payload.email = form.email;
    if (form.password) payload.password = form.password;

    if (!Object.keys(payload).length) {
      setMessage({ type: "info", text: "No changes to save." });
      setLoading(false);
      return;
    }

    try {
      const res = await updateMyProfile(payload);
      login(localStorage.getItem("token"), res.data);
      setForm((f) => ({ ...f, password: "" }));
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Update failed." });
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>
      </div>

      <div style={{ maxWidth: 520 }}>
        <div className="card">
          <div className="profile-header">
            <div className="avatar">{initials}</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>{user?.full_name}</p>
              <p className="text-muted text-sm">{user?.email}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                <span className="badge badge-user">{user?.role}</span>
                <span className="text-muted text-sm">
                  Joined {new Date(user?.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          <div className="divider" />

          {message.text && (
            <div className={`alert alert-${message.type === "error" ? "error" : message.type === "info" ? "info" : "success"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.full_name} onChange={set("full_name")} required />
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={form.password} onChange={set("password")} placeholder="Leave blank to keep current password" />
            </div>
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
