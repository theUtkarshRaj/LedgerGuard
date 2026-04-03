import { useEffect, useMemo, useState, useRef } from "react";
import {
  createRecord,
  deleteRecord,
  getRecords,
  updateRecord,
} from "../services/recordsApi.js";
import { getUsersForSelect } from "../services/usersApi.js";
import { useAuth } from "../context/AuthContext";

function money(s) {
  const n = Number(s);
  if (Number.isFinite(n))
    return n.toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  return s;
}

const emptyForm = {
  userId: "",
  amount: "",
  type: "EXPENSE",
  category: "",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

const emptyFilters = {
  from: "",
  to: "",
  category: "",
  type: "",
  q: "",
};

const LIMIT = 15;

function pageSlice(meta) {
  if (!meta?.total) return "0";
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);
  return `${start}–${end}`;
}

export default function RecordsPage() {
  const { isAdmin, user } = useAuth();
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
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [showCreateSuccess, setShowCreateSuccess] = useState(false);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);

  const abortControllerRef = useRef(null);

  const loadData = async (targetPage, filters) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setError("");
    setLoading(true);

    const type = filters.type === "INCOME" || filters.type === "EXPENSE" ? filters.type : undefined;
    const params = {
      page: targetPage,
      limit: LIMIT,
      ...(filters.from ? { from: filters.from } : {}),
      ...(filters.to ? { to: filters.to } : {}),
      ...(filters.category.trim() ? { category: filters.category.trim() } : {}),
      ...(type ? { type } : {}),
      ...(filters.q.trim() ? { q: filters.q.trim() } : {}),
    };

    try {
      const data = await getRecords(params, { signal: controller.signal });
      setRows(data?.data ?? []);
      setMeta(data?.meta ?? { page: 1, limit: LIMIT, total: 0, totalPages: 1 });
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message || "Failed to load records");
        setRows([]);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, emptyFilters);
    return () => abortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const data = await getUsersForSelect(20);
        setUsers(data?.data ?? []);
      } catch {
        setUsers([]);
      }
    })();
  }, [isAdmin]);

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
    setForm({
      ...emptyForm,
      userId: user?.id ? String(user.id) : "",
      date: new Date().toISOString().slice(0, 10),
    });
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
      await createRecord({
        userId: Number(form.userId),
        amount: form.amount,
        type: form.type,
        category: form.category.trim(),
        date: new Date(form.date + "T12:00:00").toISOString(),
        note: form.note.trim() || undefined,
      });
      setForm({
        ...emptyForm,
        userId: user?.id ? String(user.id) : "",
        date: new Date().toISOString().slice(0, 10),
      });
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

  async function handleDelete(id) {
    if (!window.confirm("Soft-delete this record?")) return;
    setError("");
    try {
      await deleteRecord(id);
      loadData(page, appliedFilters);
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    try {
      await updateRecord(editing.id, {
        amount: editing.amount,
        type: editing.type,
        category: editing.category.trim(),
        date: new Date(editing.date + "T12:00:00").toISOString(),
        note: editing.note.trim(),
      });
      setEditing(null);
      loadData(page, appliedFilters);
    } catch (err) {
      setError(err.message || "Update failed");
    }
  }

  const pageIncome = useMemo(
    () =>
      rows
        .filter((r) => r.type === "INCOME")
        .reduce((a, r) => a + Number(r.amount || 0), 0),
    [rows]
  );
  const pageExpense = useMemo(
    () =>
      rows
        .filter((r) => r.type === "EXPENSE")
        .reduce((a, r) => a + Number(r.amount || 0), 0),
    [rows]
  );

  const hasActiveFilters = Object.values(appliedFilters).some(
    (v) => String(v).trim() !== ""
  );

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

  return (
    <div className="page records-page">
      <header className="page-head records-head">
        <div className="records-head-title">
          <h1>Records</h1>
        </div>
        {isAdmin && (
          <button type="button" className="btn primary" onClick={openCreateModal}>
            + New record
          </button>
        )}
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
            From
            <input
              type="date"
              value={draftFilters.from}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, from: e.target.value }))
              }
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={draftFilters.to}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, to: e.target.value }))
              }
            />
          </label>
          <label>
            Type
            <select
              value={draftFilters.type}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, type: e.target.value }))
              }
            >
              <option value="">Any</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </label>
          <label>
            Category
            <input
              value={draftFilters.category}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, category: e.target.value }))
              }
              placeholder="Exact match"
            />
          </label>
          <label className="wide">
            Search
            <input
              value={draftFilters.q}
              onChange={(e) =>
                setDraftFilters((f) => ({ ...f, q: e.target.value }))
              }
              placeholder="Note or category (contains)"
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
              <span className="income">+{money(pageIncome)}</span>
              <span className="expense">−{money(pageExpense)}</span>
            </span>
          </div>
          <div className="mini-stat muted small">
            Totals reflect only the {rows.length} row(s) on this page.
          </div>
        </div>
      )}

      <div className="card section records-table-card">
        <div className="toolbar records-toolbar">
          <div>
            <h2>Ledger</h2>
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
            <table className="table records-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th className="num">Amount</th>
                  <th>Owner</th>
                  <th>Note</th>
                  {isAdmin && <th className="col-actions"> </th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`pill ${r.type.toLowerCase()}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="cell-strong">{r.category}</td>
                    <td
                      className={`num cell-amount ${
                        r.type === "INCOME" ? "text-income" : "text-expense"
                      }`}
                    >
                      {r.type === "EXPENSE" ? "−" : "+"}
                      {money(r.amount)}
                    </td>
                    <td>{r.user?.name ?? "—"}</td>
                    <td className="cell-note" title={r.note || ""}>
                      {r.note ? (
                        <span className="note-clip">{r.note}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="actions col-actions">
                        <button
                          type="button"
                          className="btn small ghost"
                          onClick={() =>
                            setEditing({
                              id: r.id,
                              amount: String(r.amount),
                              type: r.type,
                              category: r.category,
                              date: new Date(r.date)
                                .toISOString()
                                .slice(0, 10),
                              note: r.note || "",
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn small danger"
                          onClick={() => handleDelete(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="records-empty">
                <p>No records match these filters.</p>
                {hasActiveFilters && (
                  <button type="button" className="btn ghost" onClick={clearFilters}>
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

      {isAdmin && showCreate && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-record-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCreateModal();
          }}
        >
          <div className="modal card records-modal records-create-modal">
            <h2 id="new-record-title">New record</h2>
            <p className="chart-sub muted">
              Owner is required in the API; pick a user or yourself.
            </p>
            {createError && (
              <div className="banner error modal-inline-banner">{createError}</div>
            )}
            <form onSubmit={handleCreate} className="form records-create-form">
              <div className="records-create-fields">
                <label className="field-full">
                  Owner
                  <select
                    value={form.userId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, userId: e.target.value }))
                    }
                    required
                    autoFocus
                  >
                    <option value="">Select user</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email}) — {u.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Amount
                  <input
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    required
                    placeholder="0.00"
                  />
                </label>
                <label>
                  Type
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value }))
                    }
                  >
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </label>
                <label>
                  Category
                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    required
                  />
                </label>
                <label className="field-full">
                  Note
                  <input
                    value={form.note}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, note: e.target.value }))
                    }
                    placeholder="Optional"
                  />
                </label>
              </div>
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
                  {createSubmitting ? "Creating…" : "Create record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdmin && showCreateSuccess && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-success-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateSuccess(false);
          }}
        >
          <div className="modal card records-modal success-modal">
            <h2 id="record-success-title">Record added successfully</h2>
            <p className="muted">
              The new line is on the ledger. Filters still apply — clear them if
              you do not see it.
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

      {editing && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-record-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditing(null);
          }}
        >
          <div className="modal card records-modal">
            <h2 id="edit-record-title">Edit record #{editing.id}</h2>
            <form onSubmit={handleUpdate} className="form">
              <label>
                Amount
                <input
                  value={editing.amount}
                  onChange={(e) =>
                    setEditing({ ...editing, amount: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Type
                <select
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({ ...editing, type: e.target.value })
                  }
                >
                  <option value="INCOME">INCOME</option>
                  <option value="EXPENSE">EXPENSE</option>
                </select>
              </label>
              <label>
                Category
                <input
                  value={editing.category}
                  onChange={(e) =>
                    setEditing({ ...editing, category: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) =>
                    setEditing({ ...editing, date: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Note
                <input
                  value={editing.note}
                  onChange={(e) =>
                    setEditing({ ...editing, note: e.target.value })
                  }
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
