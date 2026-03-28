import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRequests } from "../../api/users";

const statusBadge = (status) => {
  const map = { PENDING: "badge-pending", APPROVED: "badge-approved", DECLINED: "badge-declined" };
  return <span className={`badge ${map[status] || ""}`}>{status}</span>;
};

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getMyRequests()
      .then((res) => setRequests(res.data))
      .catch(() => setError("Failed to load requests."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>My Requests</h1>
          <p>Track the status of your download requests</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate("/books")}>Browse Books</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="card"><p className="text-muted">Loading…</p></div>
      ) : requests.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>No requests yet</h3>
            <p>Browse the library and request a book to download.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/books")}>
              Browse Library
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Reviewed</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <span
                        style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}
                        onClick={() => navigate(`/books/${req.book_id}`)}
                      >
                        {req.book?.title || `Book #${req.book_id}`}
                      </span>
                      <div className="text-muted text-sm">{req.book?.author}</div>
                    </td>
                    <td>{statusBadge(req.status)}</td>
                    <td className="text-muted text-sm">{new Date(req.requested_at).toLocaleDateString()}</td>
                    <td className="text-muted text-sm">{req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : "—"}</td>
                    <td className="text-muted text-sm">{req.review_note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
