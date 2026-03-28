import React, { useState, useEffect } from "react";
import { adminGetUsers } from "../../api/admin";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminGetUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name) => name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Users</h1>
          <p>{users.length} registered accounts</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" />
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
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4}><div className="empty-state"><span className="empty-icon">👤</span><h3>No users found</h3></div></td></tr>
                ) : filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: u.role === "ADMIN"
                            ? "linear-gradient(135deg,#4F46E5,#7C3AED)"
                            : "linear-gradient(135deg,#059669,#0D9488)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0
                        }}>
                          {initials(u.full_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{u.full_name}</div>
                          <div className="text-muted text-sm">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === "ADMIN" ? "badge-admin" : "badge-user"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? "badge-approved" : "badge-declined"}`}>
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="text-muted text-sm">
                      {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
