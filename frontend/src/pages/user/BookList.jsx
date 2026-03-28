import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBooks } from "../../api/books";

const BOOK_ICONS = ["📘", "📗", "📙", "📕", "📓", "📔"];
const bookIcon = (id) => BOOK_ICONS[id % BOOK_ICONS.length];

const QUOTES = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "So many books, so little time.", author: "Frank Zappa" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "A book is a dream that you hold in your hands.", author: "Neil Gaiman" },
  { text: "One must always be careful of books, and what is inside them.", author: "Cassandra Clare" },
  { text: "Books are a uniquely portable magic.", author: "Stephen King" },
  { text: "Reading gives us someplace to go when we have to stay where we are.", author: "Mason Cooley" },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
  { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" },
];

function QuoteBanner() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 400);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const q = QUOTES[idx];
  return (
    <div className="quote-banner">
      <span className="quote-mark">"</span>
      <div className={`quote-content${visible ? " quote-in" : " quote-out"}`}>
        <p className="quote-text">{q.text}</p>
        <p className="quote-author">— {q.author}</p>
      </div>
    </div>
  );
}

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchBooks = async (q = search, cat = category) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (q) params.search = q;
      if (cat) params.category = cat;
      const res = await getBooks(params);
      setBooks(res.data);
    } catch {
      setError("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchBooks(); };
  const handleClear = () => { setSearch(""); setCategory(""); fetchBooks("", ""); };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Browse Books</h1>
          <p>Discover and request books from the library</p>
        </div>
      </div>

      <QuoteBanner />

      <form className="search-bar" onSubmit={handleSearch}>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author…"
          />
        </div>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          style={{ width: 160, padding: "9px 13px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "0.9rem", fontFamily: "inherit" }}
        />
        <button className="btn btn-primary" type="submit">Search</button>
        {(search || category) && (
          <button className="btn btn-secondary" type="button" onClick={handleClear}>Clear</button>
        )}
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="book-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="book-card" style={{ cursor: "default" }}>
              <div className="skeleton" style={{ height: 100, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 18, width: "80%", marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 14, width: "60%" }} />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>No books found</h3>
          <p>Try different search terms or clear the filter.</p>
        </div>
      ) : (
        <div className="book-grid">
          {books.map((book) => (
            <div key={book.id} className="book-card" onClick={() => navigate(`/books/${book.id}`)}>
              <div className="book-card-cover">{bookIcon(book.id)}</div>
              <h3>{book.title}</h3>
              <p className="author">{book.author}</p>
              <div className="meta">
                {book.category && <span className="book-category-tag">{book.category}</span>}
                {book.published_year && <span className="text-sm" style={{ color: "var(--text-subtle)" }}>{book.published_year}</span>}
                {book.file_type && (
                  <span className="badge" style={{ fontSize: "0.7rem", padding: "1px 7px", background: "#F0FDF4", color: "#15803D" }}>
                    {book.file_type.split("/").pop().toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
