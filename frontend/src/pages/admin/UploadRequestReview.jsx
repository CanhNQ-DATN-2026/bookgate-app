import React, { useState, useEffect } from "react";
import { adminGetUploadRequests, adminApproveUploadRequest, adminDeclineUploadRequest } from "../../api/admin";

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

export default function UploadRequestReview() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [actionLoading, setActionLoading] = useState(null);
  const [modal, setModal] = useState(null); // { id, action }
  const [note, setNote] = useState("");

  const fetchRequests = (status) => {
    setLoading(true);
    adminGetUploadRequests(status || undefined)
      .then((res) => setRequests(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(activeTab); }, [activeTab]);

  const confirmAction = async () => {
    if (!modal) return;
    const { id, action } = modal;
    setActionLoading(id);
    setModal(null);
    try {
      if (action === "approve") await adminApproveUploadRequest(id, note || null);
      else await adminDeclineUploadRequest(id, note || null);
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
          <h1>Book Upload Requests</h1>
          <p>Users are asking you to add these books to the library</p>
        </div>
      </div>

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
                  <th>Requested Book</th>
                  <th>Requested By</th>
                  <th>Status</th>
                  <th>User Note</th>
                  <th>Admin Note</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <span className="empty-icon">📬</span>
                        <h3>No requests</h3>
                        <p>No book upload requests in this category.</p>
                      </div>
                    </td>
                  </tr>
                ) : requests.map((req) => (
                  <tr key={req.id}>
                    <td className="text-muted text-sm">#{req.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{req.title}</div>
                      {req.author && <div className="text-muted text-sm">{req.author}</div>}
                      {req.description && (
                        <div className="text-muted text-sm" style={{ marginTop: 2, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {req.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{req.user?.full_name || `User #${req.user_id}`}</div>
                      <div className="text-muted text-sm">{req.user?.email}</div>
                    </td>
                    <td>{statusBadge(req.status)}</td>
                    <td className="text-muted text-sm" style={{ maxWidth: 160 }}>{req.user_note || "—"}</td>
                    <td className="text-sm" style={{ maxWidth: 160 }}>
                      {req.admin_note
                        ? <span style={{ color: req.status === "DECLINED" ? "var(--danger)" : "var(--success)" }}>{req.admin_note}</span>
                        : "—"
                      }
                    </td>
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
                {modal.action === "approve" ? "✓ Approve" : "✗ Decline"} Upload Request #{modal.id}
              </h3>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>
                Note to user <span className="text-muted">(optional)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  modal.action === "approve"
                    ? "e.g. Book will be available within 2 days…"
                    : "e.g. Could not find a legal copy of this book…"
                }
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
