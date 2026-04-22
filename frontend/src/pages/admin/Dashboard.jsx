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
              <div className="skeleton skeleton-stat-icon" />
              <div className="skeleton skeleton-stat-label" />
              <div className="skeleton skeleton-stat-value" />
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card color-blue interactive-card" onClick={() => navigate("/admin/users")}>
            <span className="stat-icon">👥</span>
            <div className="label">Total Users</div>
            <div className="value">{stats.users}</div>
          </div>
          <div className="stat-card color-green interactive-card" onClick={() => navigate("/admin/books")}>
            <span className="stat-icon">📚</span>
            <div className="label">Books</div>
            <div className="value">{stats.books}</div>
          </div>
          <div className="stat-card color-amber interactive-card" onClick={() => navigate("/admin/requests")}>
            <span className="stat-icon">⏳</span>
            <div className="label">Pending Requests</div>
            <div className={`value${stats.pending > 0 ? " value-emphasis value-warning" : ""}`}>
              {stats.pending}
            </div>
          </div>
          <div className="stat-card color-rose interactive-card" onClick={() => navigate("/admin/downloads")}>
            <span className="stat-icon">⬇</span>
            <div className="label">Total Downloads</div>
            <div className="value">{stats.downloads}</div>
          </div>
          <div className="stat-card color-blue interactive-card" onClick={() => navigate("/admin/upload-requests")}>
            <span className="stat-icon">📬</span>
            <div className="label">Upload Requests</div>
            <div className={`value${stats.uploadPending > 0 ? " value-emphasis value-primary" : ""}`}>
              {stats.uploadPending}
            </div>
          </div>
        </div>
      )}

      {stats?.pending > 0 && (
        <div className="alert alert-warning">
          ⚠ You have <strong>{stats.pending}</strong> pending download request{stats.pending > 1 ? "s" : ""} awaiting review.
          <button
            className="btn btn-sm btn-warning-inline"
            onClick={() => navigate("/admin/requests")}
          >
            Review now
          </button>
        </div>
      )}

      <div className="section-grid">
        <div className="card dashboard-panel">
          <p className="panel-title">Quick Actions</p>
          <div className="quick-actions">
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

        <div className="card dashboard-panel">
          <p className="panel-title">How it works</p>
          <ol className="mini-list">
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
