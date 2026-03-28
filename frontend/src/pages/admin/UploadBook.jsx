import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminCreateBook, adminUpdateBook } from "../../api/admin";
import { getBook } from "../../api/books";

export default function UploadBook() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef();

  const [form, setForm] = useState({ title: "", author: "", category: "", description: "", isbn: "", published_year: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isEdit) return;
    getBook(id)
      .then((res) => {
        const b = res.data;
        setForm({
          title: b.title || "", author: b.author || "", category: b.category || "",
          description: b.description || "", isbn: b.isbn || "",
          published_year: b.published_year?.toString() || "",
        });
      })
      .catch(() => setError("Failed to load book"))
      .finally(() => setFetching(false));
  }, [id]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    const data = new FormData();
    data.append("title", form.title);
    data.append("author", form.author);
    if (form.category) data.append("category", form.category);
    if (form.description) data.append("description", form.description);
    if (form.isbn) data.append("isbn", form.isbn);
    if (form.published_year) data.append("published_year", form.published_year);
    if (file) data.append("file", file);

    try {
      if (isEdit) {
        await adminUpdateBook(id, data);
        setSuccess("Book updated successfully.");
      } else {
        await adminCreateBook(data);
        setSuccess("Book created! Redirecting…");
        setTimeout(() => navigate("/admin/books"), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p className="text-muted" style={{ padding: 24 }}>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>{isEdit ? "Edit Book" : "Add New Book"}</h1>
          <p>{isEdit ? "Update metadata or replace the file" : "Upload a book to the library catalog"}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        <div className="card">
          <p style={{ fontWeight: 700, marginBottom: 20, fontSize: "0.95rem" }}>Book Details</p>

          {error && <div className="alert alert-error">⚠ {error}</div>}
          {success && <div className="alert alert-success">✓ {success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={set("title")} placeholder="e.g. Clean Code" required />
            </div>
            <div className="form-group">
              <label>Author *</label>
              <input value={form.author} onChange={set("author")} placeholder="e.g. Robert C. Martin" required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label>Category</label>
                <input value={form.category} onChange={set("category")} placeholder="e.g. Programming" />
              </div>
              <div className="form-group">
                <label>Published Year</label>
                <input type="number" value={form.published_year} onChange={set("published_year")} placeholder="e.g. 2023" min="1800" max="2100" />
              </div>
            </div>
            <div className="form-group">
              <label>ISBN</label>
              <input value={form.isbn} onChange={set("isbn")} placeholder="e.g. 9781234567890" style={{ fontFamily: "monospace" }} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={set("description")} rows={4} placeholder="Brief description of the book…" />
            </div>

            <div className="flex-gap" style={{ marginTop: 8 }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving…" : isEdit ? "Update Book" : "Create Book"}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => navigate("/admin/books")}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* File upload card */}
        <div className="card" style={{ position: "sticky", top: 76 }}>
          <p style={{ fontWeight: 700, marginBottom: 16, fontSize: "0.95rem" }}>
            Book File {isEdit && <span className="text-muted text-sm">(optional — replaces current)</span>}
          </p>

          <div
            className="file-input-wrap"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.epub,.zip"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
            <span className="file-icon">{file ? "📄" : "📤"}</span>
            {file ? (
              <>
                <p style={{ fontWeight: 600, color: "var(--text)" }}>{file.name}</p>
                <p className="text-muted text-sm">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 600, color: "var(--text)" }}>Click to upload</p>
                <p className="text-muted text-sm">PDF, EPUB, ZIP · max 200 MB</p>
              </>
            )}
          </div>

          {file && (
            <button
              className="btn btn-secondary btn-sm btn-block"
              style={{ marginTop: 10 }}
              onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
            >
              Remove file
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
