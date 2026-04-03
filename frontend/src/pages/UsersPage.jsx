import { useEffect, useMemo, useState, useRef } from "react";
import {
  createUser,
  getUsers,
  updateUser,
} from "../services/usersApi.js";
import { useAuth } from "../context/AuthContext";

const roles = ["VIEWER", "ANALYST", "ADMIN"];
const LIMIT = 15;

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "VIEWER",
  isActive: true,
};

const emptyFilters = {
  role: "",
  status: "",
  q: "",
};

function pageSlice(meta) {
  if (!meta?.total) return "0";
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  return `${start}–${end}`;
}

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [editing, setEditing] = useState(null);
  const abortControllerRef = useRef(null);

  const loadData = async (targetPage, filters) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError("");
    setLoading(true);

    const role =
      filters.role && roles.includes(filters.role) ? filters.role : undefined;
    const isActive =
      filters.status === "active"
        ? "true"
        : filters.status === "inactive"
          ? "false"
          : undefined;
    const params = {
      page: targetPage,
      limit: LIMIT,
      ...(role ? { role } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(filters.q.trim() ? { q: filters.q.trim() } : {}),
    };

    try {
      const data = await getUsers(params, { signal: controller.signal });
      setRows(data?.data ?? []);
      setMeta(data?.meta ?? { page: 1, limit: LIMIT, total: 0, totalPages: 1 });
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message || "Failed to load users");
        setRows([]);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadData(1, emptyFilters);
    return () => abortControllerRef.current?.abort();
  }, [isAdmin]);

  const hasActiveFilters = Object.values(appliedFilters).some(
    (v) => String(v).trim() !== ""
  );

  function applyFilters(e) {
    e.preventDefault();
    setAppliedFilters({ ...draftFilters });
    setPage(1);
    loadData(1, draftFilters);
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    loadData(1, emptyFilters);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
    loadData(newPage, appliedFilters);
  }

  function openCreateModal() {
    setForm(emptyForm);
    setCreateError("");
    setShowCreate(true);
  }

  function closeCreateModal() {
    setShowCreate(false);
    setCreateError("");
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    setCreateSubmitting(true);
    try {
      await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        isActive: form.isActive,
      });
      setForm(emptyForm);
      setShowCreate(false);
      setPage(1);
      setShowCreateSuccess(true);
      loadData(1, appliedFilters);
    } catch (err) {
      setCreateError(err.message || "Create failed");
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function patchUser(id, patch) {
    setError("");
    try {
      await updateUser(id, patch);
      loadData(page, appliedFilters);
    } catch (err) {
      setError(err.message || "Update failed");
    }
  }

  async function handleEditSave(e) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    const body = {
      name: editing.name.trim(),
      email: editing.email.trim(),
    };
    const pw = editing.password.trim();
    if (pw.length > 0) {
      if (pw.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      body.password = pw;
    }
    try {
      await updateUser(editing.id, body);
      setEditing(null);
      loadData(page, appliedFilters);
    } catch (err) {
      setError(err.message || "Update failed");
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      if (showCreateSuccess) {
        setShowCreateSuccess(false);
        return;
      }
      if (showCreate) {
        setShowCreate(false);
        setCreateError("");
        return;
      }
      if (editing) setEditing(null);
    }
    if (!editing && !showCreate && !showCreateSuccess) return;
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, showCreate, showCreateSuccess]);

  if (!isAdmin) {
    return (
      <div className="page">
        <div className="banner error">Only administrators can manage users.</div>
      </div>
    );
  }

  const activeOnPage = rows.filter((u) => u.isActive).length;

  return (
    <div className="page users-page">
      <header className="page-head records-head">
        <div className="records-head-title">
          <h1>Users</h1>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={openCreateModal}
        >
          + New user
        </button>
      </header>

      {error && <div className="banner error">{error}</div>}

      <form className="card records-filters" onSubmit={applyFilters}>
        <div className="records-filters-head">
          <h2>Filters</h2>
          {hasActiveFilters && (
            <span className="filters-active">Filters on</span>
          )}
        </div>
        <div className="records-filters-grid">
          <label>
            Role
            <select
              value={draftFilters.role}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, role: e.target.value }))
              }
            >
              <option value="">Any role</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={draftFilters.status}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option value="">Any</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
          </label>
          <label className="wide">
            Search
            <input
              value={draftFilters.q}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, q: e.target.value }))
              }
              placeholder="Name or email (contains)"
            />
          </label>
        </div>
        <div className="records-filters-actions">
          <button type="submit" className="btn primary">
            Apply filters
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={clearFilters}
            disabled={
              !hasActiveFilters &&
              !Object.values(draftFilters).some((v) => String(v).trim() !== "")
            }
          >
            Clear all
          </button>
        </div>
      </form>

      {!loading && rows.length > 0 && (
        <div className="records-mini-stats">
          <div className="mini-stat">
            <span className="mini-stat-label">This page</span>
            <span className="mini-stat-values">
              <span>{rows.length} user(s)</span>
              <span className="muted">·</span>
              <span className="text-income">{activeOnPage} active</span>
            </span>
          </div>
          <div className="mini-stat muted small">
            Role changes save immediately; use Edit for name, email, or password.
          </div>
        </div>
      )}

      {showCreate && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-user-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCreateModal();
          }}
        >
          <div className="modal card records-modal users-create-modal">
            <h2 id="new-user-title">New user</h2>
            <p className="chart-sub muted">
              Creates a login with the role you choose. Password min. 8
              characters.
            </p>
            {createError && (
              <div className="banner error modal-inline-banner">{createError}</div>
            )}
            <form onSubmit={handleCreate} className="form">
              <label>
                Name
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  autoFocus
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                  minLength={8}
                />
              </label>
              <label>
                Role
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, role: e.target.value }))
                  }
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                Active
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={closeCreateModal}
                  disabled={createSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                  disabled={createSubmitting}
                >
                  {createSubmitting ? "Creating…" : "Create user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateSuccess && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-success-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateSuccess(false);
          }}
        >
          <div className="modal card records-modal success-modal">
            <h2 id="user-success-title">User added successfully</h2>
            <p className="muted">
              The new account is in the directory and can sign in with the
              email and password you set.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn primary"
                onClick={() => setShowCreateSuccess(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card section records-table-card">
        <div className="toolbar records-toolbar">
          <div>
            <h2>Directory</h2>
            {!loading && meta.total > 0 && (
              <p className="records-meta muted">
                Rows {pageSlice(meta)} of {meta.total.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="records-skeleton" aria-hidden>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-line" />
            ))}
          </div>
        ) : (
          <div className="table-wrap records-table-wrap">
            <table className="table records-table users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="col-actions"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td className="mono">{u.id}</td>
                    <td className="cell-strong">{u.name}</td>
                    <td className="cell-email">{u.email}</td>
                    <td>
                      <select
                        className="inline-select role-select"
                        value={u.role}
                        aria-label={`Role for ${u.name}`}
                        onChange={(e) =>
                          patchUser(u.id, { role: e.target.value })
                        }
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span
                        className={
                          u.isActive ? "status-badge active" : "status-badge"
                        }
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="muted small-date">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="actions col-actions">
                      <button
                        type="button"
                        className="btn small ghost"
                        onClick={() =>
                          setEditing({
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            password: "",
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`btn small ${u.isActive ? "ghost" : "primary"}`}
                        onClick={() =>
                          patchUser(u.id, { isActive: !u.isActive })
                        }
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="records-empty">
                <p>No users match these filters.</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="pager records-pager">
          <button
            type="button"
            className="btn ghost"
            disabled={page <= 1 || loading}
            onClick={() => handlePageChange(1)}
          >
            First
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={page <= 1 || loading}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </button>
          <span className="pager-info muted">
            Page {meta.page} / {Math.max(1, meta.totalPages)}
          </span>
          <button
            type="button"
            className="btn ghost"
            disabled={page >= (meta.totalPages || 1) || loading}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </button>
          <button
            type="button"
            className="btn ghost"
            disabled={page >= (meta.totalPages || 1) || loading}
            onClick={() => handlePageChange(meta.totalPages || 1)}
          >
            Last
          </button>
        </div>
      </div>

      {editing && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <div className="modal card records-modal">
            <h2 id="edit-user-title">Edit user #{editing.id}</h2>
            <p className="chart-sub muted">
              Leave password empty to keep the current one.
            </p>
            <form onSubmit={handleEditSave} className="form">
              <label>
                Name
                <input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  required
                  minLength={2}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={editing.email}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                New password
                <input
                  type="password"
                  value={editing.password}
                  onChange={(e) =>
                    setEditing({ ...editing, password: e.target.value })
                  }
                  placeholder="Optional — min 8 chars"
                  minLength={editing.password ? 8 : 0}
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
