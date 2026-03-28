import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBooks } from "../../api/books";
import { adminDeleteBook } from "../../api/admin";

export default function BookManagement() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    getBooks({ limit: 100 })
      .then((res) => setBooks(res.data))
      .catch(() => setError("Failed to load books"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    try {
      await adminDeleteBook(book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    } catch {
      alert("Failed to delete book.");
    }
  };

  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Books</h1>
          <p>Manage the library catalog</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/admin/books/new")}>
          + Add Book
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by title or author…"
          />
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
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th>File</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <span className="empty-icon">📚</span>
                        <h3>No books yet</h3>
                        <p>Add your first book to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((book) => (
                  <tr key={book.id}>
                    <td className="text-muted text-sm">#{book.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{book.title}</div>
                      {book.isbn && <div className="text-muted text-sm">{book.isbn}</div>}
                    </td>
                    <td className="text-sm">{book.author}</td>
                    <td>
                      {book.category
                        ? <span className="book-category-tag">{book.category}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td className="text-muted text-sm">{book.published_year || "—"}</td>
                    <td>
                      {book.file_type
                        ? <span className="badge badge-approved">{book.file_type.split("/").pop().toUpperCase()}</span>
                        : <span className="badge badge-declined">No file</span>
                      }
                    </td>
                    <td>
                      <div className="flex-gap">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/admin/books/${book.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(book)}
                        >
                          Delete
                        </button>
                      </div>
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
