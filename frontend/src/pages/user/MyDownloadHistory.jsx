import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyDownloadHistory } from "../../api/users";
import { downloadBook } from "../../api/books";

export default function MyDownloadHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dlLoading, setDlLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getMyDownloadHistory()
      .then((res) => setHistory(res.data))
      .catch(() => setError("Failed to load download history."))
      .finally(() => setLoading(false));
  }, []);

  const handleRedownload = async (bookId) => {
    setDlLoading(bookId);
    const downloadWindow = window.open("", "_blank", "noopener,noreferrer");
    try {
      const res = await downloadBook(bookId);
      if (downloadWindow) {
        downloadWindow.location.replace(res.data.download_url);
      } else {
        window.location.assign(res.data.download_url);
      }
    } catch (err) {
      if (downloadWindow) {
        downloadWindow.close();
      }
      alert(err.response?.data?.detail || "Download failed.");
    } finally {
      setDlLoading(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Download History</h1>
          <p>Books you have downloaded</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="card"><p className="text-muted">Loading…</p></div>
      ) : history.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <span className="empty-icon">⬇</span>
            <h3>No downloads yet</h3>
            <p>After your requests are approved, your downloads will appear here.</p>
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
                  <th>Downloaded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>
                      <span
                        style={{ color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}
                        onClick={() => navigate(`/books/${h.book_id}`)}
                      >
                        {h.book?.title || `Book #${h.book_id}`}
                      </span>
                      <div className="text-muted text-sm">{h.book?.author}</div>
                    </td>
                    <td className="text-muted text-sm">{new Date(h.downloaded_at).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRedownload(h.book_id)}
                        disabled={dlLoading === h.book_id}
                      >
                        {dlLoading === h.book_id ? "…" : "⬇ Download Again"}
                      </button>
                    </td>
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
