import React, { useState, useEffect } from "react";
import { adminGetDownloadHistory } from "../../api/admin";

export default function DownloadHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminGetDownloadHistory()
      .then((res) => setHistory(res.data))
      .catch(() => setError("Failed to load download history."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter((h) => {
    const q = search.toLowerCase();
    return h.book?.title?.toLowerCase().includes(q) || String(h.user_id).includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Download History</h1>
          <p>{history.length} total downloads recorded</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter by book title or user ID…" />
        </div>
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
                  <th>Book</th>
                  <th>User ID</th>
                  <th>Request #</th>
                  <th>Downloaded At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state">
                    <span className="empty-icon">⬇</span>
                    <h3>No downloads yet</h3>
                    <p>Downloads will appear here after users download books.</p>
                  </div></td></tr>
                ) : filtered.map((h) => (
                  <tr key={h.id}>
                    <td className="text-muted text-sm">#{h.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{h.book?.title || `Book #${h.book_id}`}</div>
                      {h.book?.author && <div className="text-muted text-sm">{h.book.author}</div>}
                    </td>
                    <td className="text-muted text-sm">#{h.user_id}</td>
                    <td className="text-muted text-sm">#{h.request_id}</td>
                    <td className="text-muted text-sm">{new Date(h.downloaded_at).toLocaleString()}</td>
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
