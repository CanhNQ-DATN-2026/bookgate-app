import React, { useState, useEffect } from "react";
import { adminGetRequests, adminApproveRequest, adminDeclineRequest } from "../../api/admin";

const STATUS_TABS = [
  { value: "PENDING",  label: "⏳ Pending" },
  { value: "APPROVED", label: "✓ Approved" },
  { value: "DECLINED", label: "✗ Declined" },
  { value: "",         label: "All" },
];

const statusBadge = (status) => {
  const map = { PENDING: "badge-pending", APPROVED: "badge-approved", DECLINED: "badge-declined" };
  return <span className={`badge ${map[status] || ""}`}>{status}</span>;
};

export default function RequestReview() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState(null);
  const [modal, setModal] = useState(null); // { id, action }
  const [note, setNote] = useState("");

  const fetchRequests = (status) => {
    setLoading(true);
    adminGetRequests(status || undefined)
      .then((res) => setRequests(res.data))
      .catch(() => setError("Failed to load requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(activeTab); }, [activeTab]);

  const confirmAction = async () => {
    if (!modal) return;
    const { id, action } = modal;
    setActionLoading(id);
    setModal(null);
    try {
      if (action === "approve") await adminApproveRequest(id, note || null);
      else await adminDeclineRequest(id, note || null);
      fetchRequests(activeTab);
    } catch (err) {
      alert(err.response?.data?.detail || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Download Requests</h1>
          <p>Review and approve or decline user download requests</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="tab-bar">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            className={`tab-btn${activeTab === t.value ? " active" : ""}`}
            onClick={() => setActiveTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card"><p className="text-muted">Loading…</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>Book</th>
                  <th>Status</th>
                  <th>User Note</th>
                  <th>Admin Note</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>No requests</h3>
                        <p>No {activeTab.toLowerCase() || ""} requests found.</p>
                      </div>
                    </td>
                  </tr>
                ) : requests.map((req) => (
                  <tr key={req.id}>
                    <td className="text-muted text-sm">#{req.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{req.user?.full_name || `User #${req.user_id}`}</div>
                      <div className="text-muted text-sm">{req.user?.email}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{req.book?.title || `Book #${req.book_id}`}</td>
                    <td>{statusBadge(req.status)}</td>
                    <td className="text-muted text-sm">{req.user_note || "—"}</td>
                    <td className="text-muted text-sm">{req.review_note || "—"}</td>
                    <td className="text-muted text-sm">{new Date(req.requested_at).toLocaleDateString()}</td>
                    <td>
                      {req.status === "PENDING" && (
                        <div className="flex-gap">
                          <button
                            className="btn btn-success btn-sm"
                            disabled={actionLoading === req.id}
                            onClick={() => { setNote(""); setModal({ id: req.id, action: "approve" }); }}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actionLoading === req.id}
                            onClick={() => { setNote(""); setModal({ id: req.id, action: "decline" }); }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modal.action === "approve" ? "✓ Approve" : "✗ Decline"} Request #{modal.id}
              </h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Review Note <span className="text-muted">(optional)</span></label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the user…"
                rows={3}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button
                className={`btn ${modal.action === "approve" ? "btn-success" : "btn-danger"}`}
                onClick={confirmAction}
              >
                Confirm {modal.action === "approve" ? "Approval" : "Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
