import React, { useState, useEffect } from "react";
import { createUploadRequest, getMyUploadRequests } from "../../api/users";

const statusBadge = (status) => {
  const map = { PENDING: "badge-pending", APPROVED: "badge-approved", DECLINED: "badge-declined" };
  return <span className={`badge ${map[status] || ""}`}>{status}</span>;
};

export default function RequestUpload() {
  const [form, setForm] = useState({ title: "", author: "", description: "", user_note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadHistory = () => {
    setLoadingHistory(true);
    getMyUploadRequests()
      .then((res) => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => { loadHistory(); }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      await createUploadRequest({
        title: form.title,
        author: form.author || undefined,
        description: form.description || undefined,
        user_note: form.user_note || undefined,
      });
      setSuccess("Request submitted! Admin will review it soon.");
      setForm({ title: "", author: "", description: "", user_note: "" });
      setShowForm(false);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Request a Book Upload</h1>
          <p>Can't find a book? Ask the admin to add it to the library.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New Request"}
        </button>
      </div>

      {success && <div className="alert alert-success">✓ {success}</div>}

      {showForm && (
        <div className="card" style={{ maxWidth: 560, marginBottom: 24 }}>
          <p style={{ fontWeight: 700, marginBottom: 18 }}>New Book Request</p>
          {error && <div className="alert alert-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Book Title *</label>
              <input value={form.title} onChange={set("title")} placeholder="e.g. The Pragmatic Programmer" required />
            </div>
            <div className="form-group">
              <label>Author</label>
              <input value={form.author} onChange={set("author")} placeholder="e.g. David Thomas" />
            </div>
            <div className="form-group">
              <label>Description <span className="text-muted">(optional)</span></label>
              <textarea value={form.description} onChange={set("description")} rows={2}
                placeholder="Brief description or edition info…" />
            </div>
            <div className="form-group">
              <label>Why do you need this book? <span className="text-muted">(optional)</span></label>
              <textarea value={form.user_note} onChange={set("user_note")} rows={2}
                placeholder="e.g. For my current project / course requirement…" />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </form>
        </div>
      )}

      {/* History */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700 }}>
          My Upload Requests
        </div>
        {loadingHistory ? (
          <div style={{ padding: 24 }}><p className="text-muted">Loading…</p></div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📬</span>
            <h3>No requests yet</h3>
            <p>Click "+ New Request" above to ask the admin to upload a book.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>My Note</th>
                  <th>Admin Note</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.title}</td>
                    <td className="text-muted text-sm">{r.author || "—"}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td className="text-muted text-sm">{r.user_note || "—"}</td>
                    <td className="text-sm">
                      {r.admin_note
                        ? <span style={{ color: r.status === "DECLINED" ? "var(--danger)" : "var(--success)" }}>{r.admin_note}</span>
                        : "—"
                      }
                    </td>
                    <td className="text-muted text-sm">{new Date(r.requested_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
