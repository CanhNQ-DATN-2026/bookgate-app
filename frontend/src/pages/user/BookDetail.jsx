import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBook, requestDownload, downloadBook } from "../../api/books";
import { getMyRequests } from "../../api/users";

function RequestForm({ note, setNote, showNoteForm, setShowNoteForm, onSubmit, loading }) {
  return (
    <div>
      {showNoteForm ? (
        <div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label style={{ fontSize: "0.82rem" }}>
              Note for admin <span className="text-muted">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why do you need this book? Any specific reason…"
              rows={3}
              style={{ fontSize: "0.855rem" }}
            />
          </div>
          <div className="flex-gap">
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={onSubmit} disabled={loading}>
              {loading ? "Submitting…" : "Submit Request"}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setShowNoteForm(false); setNote(""); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-primary btn-block" onClick={() => setShowNoteForm(true)}>
          Request Download
        </button>
      )}
    </div>
  );
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [myRequest, setMyRequest] = useState(null); // most recent request for this book
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [note, setNote] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);

  useEffect(() => {
    Promise.all([getBook(id), getMyRequests()])
      .then(([bookRes, reqRes]) => {
        setBook(bookRes.data);
        // Get the most recent request for this book
        const bookReqs = reqRes.data
          .filter((r) => r.book_id === Number(id))
          .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));
        setMyRequest(bookReqs[0] || null);
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load book details." }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRequest = async () => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await requestDownload(id, { user_note: note || null });
      setMyRequest(res.data);
      setNote("");
      setShowNoteForm(false);
      setMessage({ type: "success", text: "Request submitted! Awaiting admin approval." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Failed to submit request." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async () => {
    setActionLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await downloadBook(id);
      window.open(res.data.download_url, "_blank");
      setMessage({ type: "success", text: "✓ Download started!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Download failed." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate("/books")} style={{ marginBottom: 20 }}>← Back</button>
      <div className="card">
        <div className="skeleton" style={{ height: 28, width: "50%", marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 16, width: "30%", marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 80 }} />
      </div>
    </div>
  );
  if (!book) return <p className="text-muted" style={{ padding: 24 }}>Book not found.</p>;

  const hasFile = !!book.file_type;
  const ICONS = ["📘", "📗", "📙", "📕", "📓", "📔"];
  const icon = ICONS[book.id % ICONS.length];
  const isDeclined = myRequest?.status === "DECLINED";

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate("/books")} style={{ marginBottom: 20 }}>
        ← Back to Library
      </button>

      <div className="card">
        <div className="book-detail-layout">
          {/* Main info */}
          <div className="book-detail-main">
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{
                width: 90, height: 120, background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)",
                borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.8rem", flexShrink: 0, boxShadow: "var(--shadow-sm)"
              }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
                  {book.title}
                </h1>
                <p style={{ color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>by {book.author}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {book.category && <span className="book-category-tag">{book.category}</span>}
                  {book.file_type && (
                    <span className="badge badge-approved">{book.file_type.split("/").pop().toUpperCase()}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="book-meta-list">
              {book.published_year && (
                <div className="book-meta-item">
                  <span className="meta-key">Published</span>
                  <span className="meta-val">{book.published_year}</span>
                </div>
              )}
              {book.isbn && (
                <div className="book-meta-item">
                  <span className="meta-key">ISBN</span>
                  <span className="meta-val" style={{ fontFamily: "monospace" }}>{book.isbn}</span>
                </div>
              )}
              {book.file_size && (
                <div className="book-meta-item">
                  <span className="meta-key">File size</span>
                  <span className="meta-val">{(book.file_size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              )}
            </div>

            {book.description && (
              <>
                <div className="divider" />
                <p style={{ fontWeight: 700, marginBottom: 8, fontSize: "0.9rem" }}>About this book</p>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.9rem" }}>{book.description}</p>
              </>
            )}
          </div>

          {/* Download sidebar */}
          <div className="book-detail-sidebar">
            <div className="download-box">
              <h3>Download</h3>

              {message.text && (
                <div className={`alert alert-${message.type === "error" ? "error" : "success"}`} style={{ marginBottom: 12 }}>
                  {message.text}
                </div>
              )}

              {!hasFile && (
                <div className="empty-state" style={{ padding: "16px 0" }}>
                  <span className="empty-icon">📭</span>
                  <p>No file uploaded yet.</p>
                </div>
              )}

              {/* No request yet */}
              {hasFile && !myRequest && (
                <RequestForm
                  note={note} setNote={setNote}
                  showNoteForm={showNoteForm} setShowNoteForm={setShowNoteForm}
                  onSubmit={handleRequest} loading={actionLoading}
                />
              )}

              {/* Pending */}
              {hasFile && myRequest?.status === "PENDING" && (
                <div style={{ textAlign: "center" }}>
                  <span className="badge badge-pending" style={{ padding: "6px 14px" }}>⏳ Pending Review</span>
                  {myRequest.user_note && (
                    <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--surface-2)", borderRadius: 8, textAlign: "left" }}>
                      <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: 4 }}>Your note:</p>
                      <p style={{ fontSize: "0.855rem", color: "var(--text-secondary)" }}>{myRequest.user_note}</p>
                    </div>
                  )}
                  <p className="text-muted" style={{ marginTop: 10, fontSize: "0.82rem" }}>
                    Waiting for admin review.
                  </p>
                </div>
              )}

              {/* Approved */}
              {hasFile && myRequest?.status === "APPROVED" && (
                <div>
                  <span className="badge badge-approved">✓ Approved</span>
                  {myRequest.review_note && (
                    <div style={{ margin: "10px 0", padding: "10px 12px", background: "var(--success-light)", borderRadius: 8 }}>
                      <p className="text-sm" style={{ color: "#065F46" }}>Admin note: {myRequest.review_note}</p>
                    </div>
                  )}
                  <button
                    className="btn btn-success btn-block"
                    style={{ marginTop: 10 }}
                    onClick={handleDownload}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Preparing…" : "⬇ Download Now"}
                  </button>
                </div>
              )}

              {/* Declined + Request Again */}
              {hasFile && isDeclined && (
                <div>
                  <span className="badge badge-declined">✗ Declined</span>

                  {myRequest.review_note && (
                    <div style={{ margin: "10px 0", padding: "10px 12px", background: "var(--danger-light)", borderRadius: 8 }}>
                      <p className="text-sm" style={{ color: "#991B1B" }}>Admin note: {myRequest.review_note}</p>
                    </div>
                  )}

                  <div className="divider" style={{ margin: "14px 0" }} />
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 10 }}>
                    You can submit a new request:
                  </p>
                  <RequestForm
                    note={note} setNote={setNote}
                    showNoteForm={showNoteForm} setShowNoteForm={setShowNoteForm}
                    onSubmit={handleRequest} loading={actionLoading}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
