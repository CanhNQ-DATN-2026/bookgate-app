import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBook, requestDownload, downloadBook } from "../../api/books";
import { getMyRequests } from "../../api/users";

function RequestForm({ note, setNote, showNoteForm, setShowNoteForm, onSubmit, loading }) {
  return (
    <div>
      {showNoteForm ? (
        <div className="request-form">
          <div className="form-group form-group-tight">
            <label className="detail-section-label">
              Note for admin <span className="text-muted">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why do you need this book? Any specific reason…"
              rows={3}
              className="detail-note-input"
            />
          </div>
          <div className="flex-gap">
            <button className="btn btn-primary btn-flex" onClick={onSubmit} disabled={loading}>
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
    const downloadWindow = window.open("", "_blank", "noopener,noreferrer");
    try {
      const res = await downloadBook(id);
      if (downloadWindow) {
        downloadWindow.location.replace(res.data.download_url);
      } else {
        window.location.assign(res.data.download_url);
      }
      setMessage({ type: "success", text: "✓ Download started!" });
    } catch (err) {
      if (downloadWindow) {
        downloadWindow.close();
      }
      setMessage({ type: "error", text: err.response?.data?.detail || "Download failed." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="detail-page">
      <button className="btn btn-secondary btn-sm back-link" onClick={() => navigate("/books")}>← Back</button>
      <div className="card">
        <div className="skeleton skeleton-detail-title" />
        <div className="skeleton skeleton-detail-subtitle" />
        <div className="skeleton skeleton-detail-body" />
      </div>
    </div>
  );
  if (!book) return <p className="text-muted detail-not-found">Book not found.</p>;

  const hasFile = !!book.file_type;
  const ICONS = ["📘", "📗", "📙", "📕", "📓", "📔"];
  const icon = ICONS[book.id % ICONS.length];
  const isDeclined = myRequest?.status === "DECLINED";

  return (
    <div className="detail-page">
      <button className="btn btn-secondary btn-sm back-link" onClick={() => navigate("/books")}>
        ← Back to Library
      </button>

      <div className="card">
        <div className="book-detail-layout">
          {/* Main info */}
          <div className="book-detail-main">
            <div className="detail-hero">
              <div className="detail-cover">
                {icon}
              </div>
              <div className="detail-content">
                <h1 className="detail-title">
                  {book.title}
                </h1>
                <p className="detail-author">by {book.author}</p>
                <div className="meta-inline">
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
                  <span className="meta-val meta-mono">{book.isbn}</span>
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
                <p className="detail-section-title">About this book</p>
                <p className="detail-copy">{book.description}</p>
              </>
            )}
          </div>

          {/* Download sidebar */}
          <div className="book-detail-sidebar">
            <div className="download-box">
              <h3>Download</h3>

              {message.text && (
                <div className={`alert alert-${message.type === "error" ? "error" : "success"} detail-alert`}>
                  {message.text}
                </div>
              )}

              {!hasFile && (
                <div className="empty-state detail-empty-state">
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
                <div className="detail-status detail-status-center">
                  <span className="badge badge-pending badge-large">⏳ Pending Review</span>
                  {myRequest.user_note && (
                    <div className="detail-note detail-note-neutral">
                      <p className="text-sm detail-note-label">Your note:</p>
                      <p className="detail-note-copy">{myRequest.user_note}</p>
                    </div>
                  )}
                  <p className="text-muted detail-status-copy">
                    Waiting for admin review.
                  </p>
                </div>
              )}

              {/* Approved */}
              {hasFile && myRequest?.status === "APPROVED" && (
                <div className="detail-status">
                  <span className="badge badge-approved">✓ Approved</span>
                  {myRequest.review_note && (
                    <div className="detail-note detail-note-success">
                      <p className="text-sm detail-note-copy">Admin note: {myRequest.review_note}</p>
                    </div>
                  )}
                  <button
                    className="btn btn-success btn-block detail-download-btn"
                    onClick={handleDownload}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "Preparing…" : "⬇ Download Now"}
                  </button>
                </div>
              )}

              {/* Declined + Request Again */}
              {hasFile && isDeclined && (
                <div className="detail-status">
                  <span className="badge badge-declined">✗ Declined</span>

                  {myRequest.review_note && (
                    <div className="detail-note detail-note-danger">
                      <p className="text-sm detail-note-copy">Admin note: {myRequest.review_note}</p>
                    </div>
                  )}

                  <div className="divider detail-divider-tight" />
                  <p className="detail-status-copy">
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
