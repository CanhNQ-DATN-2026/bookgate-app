import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { adminGetUsers, adminGetRequests, adminGetDownloadHistory, adminGetUploadRequests } from "../../api/admin";
import { getBooks } from "../../api/books";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      adminGetUsers(),
      getBooks({ limit: 100 }),
      adminGetRequests("PENDING"),
      adminGetDownloadHistory(),
      adminGetUploadRequests("PENDING"),
    ])
      .then(([users, books, pending, dl, uploadPending]) => {
        setStats({
          users: users.data.length,
          books: books.data.length,
          pending: pending.data.length,
          downloads: dl.data.length,
          uploadPending: uploadPending.data.length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>{greeting}, {user?.full_name?.split(" ")[0]} 👋</h1>
          <p>Here's what's happening in your library today</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/admin/books/new")}>
          + Add Book
        </button>
      </div>

      {loading ? (
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ height: 32, width: 32, borderRadius: "50%", marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 36, width: 60 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card color-blue" style={{ cursor: "pointer" }} onClick={() => navigate("/admin/users")}>
            <span className="stat-icon">👥</span>
            <div className="label">Total Users</div>
            <div className="value">{stats.users}</div>
          </div>
          <div className="stat-card color-green" style={{ cursor: "pointer" }} onClick={() => navigate("/admin/books")}>
            <span className="stat-icon">📚</span>
            <div className="label">Books</div>
            <div className="value">{stats.books}</div>
          </div>
          <div className="stat-card color-amber" style={{ cursor: "pointer" }} onClick={() => navigate("/admin/requests")}>
            <span className="stat-icon">⏳</span>
            <div className="label">Pending Requests</div>
            <div className="value" style={stats.pending > 0 ? { color: "var(--warning)" } : {}}>
              {stats.pending}
            </div>
          </div>
          <div className="stat-card color-rose" style={{ cursor: "pointer" }} onClick={() => navigate("/admin/downloads")}>
            <span className="stat-icon">⬇</span>
            <div className="label">Total Downloads</div>
            <div className="value">{stats.downloads}</div>
          </div>
          <div className="stat-card color-blue" style={{ cursor: "pointer" }} onClick={() => navigate("/admin/upload-requests")}>
            <span className="stat-icon">📬</span>
            <div className="label">Upload Requests</div>
            <div className="value" style={stats.uploadPending > 0 ? { color: "var(--primary)" } : {}}>
              {stats.uploadPending}
            </div>
          </div>
        </div>
      )}

      {stats?.pending > 0 && (
        <div className="alert alert-warning">
          ⚠ You have <strong>{stats.pending}</strong> pending download request{stats.pending > 1 ? "s" : ""} awaiting review.
          <button
            className="btn btn-sm"
            style={{ marginLeft: 12, background: "var(--warning)", color: "#fff", border: "none" }}
            onClick={() => navigate("/admin/requests")}
          >
            Review now
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        <div className="card">
          <p style={{ fontWeight: 700, marginBottom: 14 }}>Quick Actions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="btn btn-primary" onClick={() => navigate("/admin/books/new")}>
              📤 Upload New Book
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/admin/requests")}>
              📋 Review Requests
            </button>
            <button className="btn btn-secondary" onClick={() => navigate("/admin/users")}>
              👥 View All Users
            </button>
          </div>
        </div>

        <div className="card">
          <p style={{ fontWeight: 700, marginBottom: 12 }}>How it works</p>
          <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            <li>Users browse and request a book download</li>
            <li>Request appears here as <span className="badge badge-pending">PENDING</span></li>
            <li>You approve or decline with an optional note</li>
            <li>Approved users can download — history is recorded</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
