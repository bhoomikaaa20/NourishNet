import React, { useCallback, useEffect, useRef, useState } from "react";
import api, { parseError } from "../api";
import { useAuth } from "../components/AuthContext";
import { useToast } from "../components/Toast";
import { foodMeta, dietMeta } from "../components/foodMeta";
import TrendChart from "./TrendChart";

const REQUEST_STATUSES = ["pending", "approved", "completed", "rejected"];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");
const titleCase = (s) => String(s ?? "").replace(/_/g, " ");
const ROLES = ["user", "admin"];
const accountDetail = ["Account", "account", (v) => (v ? `${v.name} (${v.email})` : "Guest (not signed in)")];

// Per-collection table layout. `details` are the extra fields shown when a row is expanded.
// `permission` is what the signed-in account needs to see the tab (the server checks it too).
// Column renderers receive (row, ctx) where ctx carries row actions.
const TABS = {
  requests: {
    label: "Requests",
    icon: "fa-bowl-food",
    permission: "submissions:read",
    statuses: REQUEST_STATUSES,
    editable: true,
    columns: [
      { key: "trackingId", label: "Code" },
      { key: "name", label: "Name" },
      { key: "contactNumber", label: "Contact" },
      { key: "urgency", label: "Urgency", render: (r) => <span className={`pill pill-${r.urgency}`}>{titleCase(r.urgency)}</span> },
    ],
    details: [["Email", "email"], ["Address", "address"], ["City", "city"], ["Household size", "householdSize"], ["Notes", "notes"], accountDetail],
  },
  donations: {
    label: "Donations",
    icon: "fa-hand-holding-heart",
    permission: "submissions:read",
    statuses: REQUEST_STATUSES,
    editable: true,
    columns: [
      { key: "trackingId", label: "Code" },
      { key: "name", label: "Name" },
      { key: "contactNumber", label: "Contact" },
      { key: "foodType", label: "Food", render: (r) => foodMeta(r.foodType).label },
      { key: "quantity", label: "Qty (kg)" },
      { key: "city", label: "City", render: (r) => r.city || "—" },
      {
        key: "listing",
        label: "Listing",
        // Mirrors the public listing rule in backend/routes/public.js: approved, unclaimed, not expired.
        render: (r) =>
          r.claimedBy ? (
            <span className="pill pill-claimed">Reserved</span>
          ) : r.status === "approved" && r.availableUntil && new Date(r.availableUntil) < new Date() ? (
            <span className="pill pill-expired" title="Past its good-until date, so hidden from Find Food">Expired</span>
          ) : r.status === "approved" ? (
            <span className="pill pill-live">Live</span>
          ) : r.status === "pending" ? (
            <span className="muted" title="Approve this donation to list it on Find Food">Not listed</span>
          ) : (
            <span className="muted">—</span>
          ),
      },
    ],
    details: [
      ["Email", "email"],
      ["Pickup address", "address"],
      ["Diet", "dietType", (v) => dietMeta(v)?.label],
      ["Good until", "availableUntil", (v) => fmtDate(v)],
      ["Notes", "notes"],
      accountDetail,
    ],
  },
  contacts: {
    label: "Messages",
    icon: "fa-envelope",
    permission: "submissions:read",
    statuses: ["new", "resolved"],
    editable: true,
    noNote: true,
    columns: [
      { key: "name", label: "Name", render: (r) => `${r.firstName} ${r.lastName}` },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
    ],
    details: [["Message", "comments"]],
  },
  volunteers: {
    label: "Volunteers",
    icon: "fa-people-group",
    permission: "submissions:read",
    statuses: ["new", "active", "inactive"],
    editable: true,
    noNote: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "city", label: "City" },
      { key: "availability", label: "Availability", render: (r) => <span className="cap">{r.availability}</span> },
    ],
    details: [
      ["Email", "email"],
      ["Interests", "interests", (v) => (v || []).join(", ")],
      ["Has vehicle", "hasVehicle", (v) => (v ? "Yes" : "No")],
      ["Message", "message"],
      accountDetail,
    ],
  },
  connections: {
    label: "Subscribers",
    icon: "fa-users",
    permission: "submissions:read",
    statuses: null,
    editable: false,
    columns: [{ key: "email", label: "Email" }],
    details: [],
  },
  users: {
    label: "Users",
    icon: "fa-user-gear",
    permission: "users:read",
    deletePermission: "users:delete",
    updatePermission: "users:update",
    statuses: ["active", "suspended"],
    editable: true,
    noNote: true,
    columns: [
      { key: "name", label: "Name", render: (r) => (r.isSelf ? `${r.name} (you)` : r.name) },
      { key: "email", label: "Email" },
      {
        key: "role",
        label: "Role",
        render: (r, ctx) =>
          r.isSelf || !ctx.can("users:update") ? (
            <span className={`pill role-${r.role}`}>{r.role}</span>
          ) : (
            <select className={`status-select role-${r.role}`} value={r.role} onChange={(e) => ctx.changeRole(r, e.target.value)} aria-label="Role">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          ),
      },
    ],
    details: [
      ["Phone", "phone"],
      ["City", "city"],
      ["Donations", "donationCount"],
      ["Requests", "requestCount"],
      ["Last sign-in", "lastLoginAt", (v) => fmtDate(v)],
    ],
  },
};

const canDelete = (cfg, row, can) => !row.isSelf && can(cfg.deletePermission || "submissions:delete");
const canUpdate = (cfg, row, can) => !row.isSelf && can(cfg.updatePermission || "submissions:update");

const StatCard = ({ icon, label, value, sub, tone }) => (
  <div className={`stat-card ${tone || ""}`}>
    <span className="stat-icon" aria-hidden="true">
      <i className={`fa-solid ${icon}`} />
    </span>
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

const RowDetails = ({ type, cfg, row, onSaved, onDelete }) => {
  const toast = useToast();
  const { can } = useAuth();
  const [note, setNote] = useState(row.adminNote || "");
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/api/admin/${type}/${row._id}`, { adminNote: note });
      onSaved(data);
      toast.success("Note saved. The submitter can see it when tracking.");
    } catch (e) {
      toast.error(parseError(e).message);
    } finally {
      setSaving(false);
    }
  };

  const releaseClaim = async () => {
    if (!window.confirm("Release this reservation? The listing becomes available to others again.")) return;
    setSaving(true);
    try {
      const { data } = await api.patch(`/api/admin/${type}/${row._id}`, { releaseClaim: true });
      onSaved({ ...data, claimedByRequest: null, claimedAt: undefined });
      toast.success("Reservation released. The listing is live again.");
    } catch (e) {
      toast.error(parseError(e).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="row-details">
      <dl className="detail-list">
        {cfg.details.map(([label, key, format]) => {
          const value = format ? format(row[key]) : row[key];
          return (
            <div key={key} className={["comments", "notes", "message"].includes(key) ? "wide" : ""}>
              <dt>{label}</dt>
              <dd>{value === undefined || value === null || value === "" ? "—" : String(value)}</dd>
            </div>
          );
        })}
        <div>
          <dt>Submitted</dt>
          <dd>{fmtDate(row.createdAt)}</dd>
        </div>
      </dl>

      {type === "donations" && row.claimedBy && (
        <div className="link-box">
          <i className="fa-solid fa-link" aria-hidden="true" />
          <span>
            Reserved by <strong>{row.claimedByRequest?.trackingId || "a request"}</strong>
            {row.claimedByRequest?.name ? ` (${row.claimedByRequest.name})` : ""}
            {row.claimedAt ? ` on ${fmtDate(row.claimedAt)}` : ""}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={releaseClaim} disabled={saving}>
            Release reservation
          </button>
        </div>
      )}
      {type === "requests" && row.linkedDonation && (
        <div className="link-box">
          <i className="fa-solid fa-link" aria-hidden="true" />
          <span>
            Reserved from listing <strong>{row.linkedDonation.trackingId}</strong> ({row.linkedDonation.quantity} kg {foodMeta(row.linkedDonation.foodType).label.toLowerCase()})
          </span>
        </div>
      )}

      {cfg.editable && !cfg.noNote && canUpdate(cfg, row, can) && (
        <div className="note-editor">
          <label htmlFor={`note-${row._id}`}>Note for the submitter (shown on the tracking page)</label>
          <textarea id={`note-${row._id}`} rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="note-actions">
            <button type="button" className="btn btn-primary btn-sm" onClick={saveNote} disabled={saving || note === (row.adminNote || "")}>
              {saving ? "Saving…" : "Save note"}
            </button>
          </div>
        </div>
      )}

      {canDelete(cfg, row, can) && (
        <div className="row-actions">
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(row)}>
            <i className="fa-solid fa-trash" aria-hidden="true" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const toast = useToast();
  const { can } = useAuth();
  const visibleTabs = Object.entries(TABS).filter(([, t]) => can(t.permission));
  const [tab, setTab] = useState(visibleTabs[0]?.[0] || "requests");
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const requestId = useRef(0);
  const cfg = TABS[tab];

  // Debounce typing in the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadStats = useCallback(async () => {
    try {
      setStats((await api.get("/api/admin/stats")).data);
    } catch {
      /* the list request surfaces connectivity errors */
    }
  }, []);

  const loadList = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const { data: res } = await api.get(`/api/admin/${tab}`, {
        params: { q: query || undefined, status: status || undefined, sort, page, limit: 10 },
      });
      if (id === requestId.current) setData(res); // ignore out-of-order responses
    } catch (e) {
      if (id === requestId.current) setError(parseError(e).message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [tab, query, status, sort, page]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const switchTab = (key) => {
    setTab(key);
    setSearch("");
    setQuery("");
    setStatus("");
    setPage(1);
    setExpanded(null);
  };

  const replaceRow = (updated) =>
    setData((d) => ({ ...d, items: d.items.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)) }));

  const changeStatus = async (row, next) => {
    const previous = row.status;
    replaceRow({ _id: row._id, status: next });
    try {
      await api.patch(`/api/admin/${tab}/${row._id}`, { status: next });
      toast.success(`Marked ${next}`);
      loadStats();
      if (status && status !== next) loadList(); // row no longer matches the active filter
    } catch (e) {
      replaceRow({ _id: row._id, status: previous });
      toast.error(parseError(e).message);
    }
  };

  const changeRole = async (row, next) => {
    const previous = row.role;
    if (next === "admin" && !window.confirm(`Make ${row.email} an admin? They will be able to see all records and manage users.`)) return;
    replaceRow({ _id: row._id, role: next });
    try {
      await api.patch(`/api/admin/users/${row._id}`, { role: next });
      toast.success(`${row.email} is now ${next === "admin" ? "an admin" : "a user"}`);
    } catch (e) {
      replaceRow({ _id: row._id, role: previous });
      toast.error(parseError(e).message);
    }
  };
  const ctx = { can, changeRole };

  const deleteRow = async (row) => {
    const what = tab === "users" ? "this account? Their submissions are kept but no longer linked to it." : "this record permanently? This cannot be undone.";
    if (!window.confirm(`Delete ${what}`)) return;
    try {
      await api.delete(`/api/admin/${tab}/${row._id}`);
      toast.success("Record deleted");
      setExpanded(null);
      loadStats();
      // Step back a page if that was the last row on this one.
      if (data.items.length === 1 && page > 1) setPage(page - 1);
      else loadList();
    } catch (e) {
      toast.error(parseError(e).message);
    }
  };

  const exportCsv = async () => {
    try {
      const res = await api.get(`/api/admin/${tab}/export`, {
        params: { q: query || undefined, status: status || undefined, sort },
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tab}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Export failed. Please try again.");
    }
  };

  const colCount = cfg.columns.length + (cfg.statuses ? 1 : 0) + 2;

  return (
    <main className="dashboard">
      <div className="dashboard-inner">
        <div className="dash-head">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Dashboard</h1>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { loadList(); loadStats(); }}>
            <i className="fa-solid fa-rotate" aria-hidden="true" /> Refresh
          </button>
        </div>

        <section className="stat-grid" aria-label="Overview">
          <StatCard icon="fa-bowl-food" label="Requests" value={stats?.requests.total ?? "–"} sub={stats && `${stats.requests.pending} pending`} tone="coral" />
          <StatCard icon="fa-hand-holding-heart" label="Donations" value={stats?.donations.total ?? "–"} sub={stats && `${stats.donations.pending} pending`} />
          <StatCard icon="fa-weight-hanging" label="Food donated (kg)" value={stats?.kgDonated ?? "–"} sub={stats && `${stats.kgDelivered} kg completed`} />
          <StatCard icon="fa-envelope" label="Messages" value={stats?.contacts.total ?? "–"} sub={stats && `${stats.contacts.new} new`} tone="blue" />
          <StatCard icon="fa-people-group" label="Volunteers" value={stats?.volunteers?.total ?? "–"} sub={stats?.volunteers && `${stats.volunteers.new} new`} tone="amber" />
        </section>

        {stats?.trend && <TrendChart data={stats.trend} />}

        <div className="tabs" role="tablist">
          {visibleTabs.map(([key, t]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={`tab${tab === key ? " active" : ""}`} onClick={() => switchTab(key)}>
              <i className={`fa-solid ${t.icon}`} aria-hidden="true" /> {t.label}
            </button>
          ))}
        </div>

        <div className="panel">
          <div className="toolbar">
            <div className="search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${cfg.label.toLowerCase()}…`} aria-label={`Search ${cfg.label}`} />
            </div>
            {cfg.statuses && (
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
                <option value="">All statuses</option>
                {cfg.statuses.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </select>
            )}
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} aria-label="Sort order">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            {can("submissions:export") && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>
                <i className="fa-solid fa-download" aria-hidden="true" /> Export CSV
              </button>
            )}
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              <div>
                {error}{" "}
                <button type="button" className="link-btn" onClick={loadList}>
                  Retry
                </button>
              </div>
            </div>
          )}

          <div className="table-wrap" aria-busy={loading}>
            <table className="data-table">
              <thead>
                <tr>
                  {cfg.columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  {cfg.statuses && <th>Status</th>}
                  <th>Date</th>
                  <th className="sr-only">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading && data.items.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="empty">
                      Loading…
                    </td>
                  </tr>
                ) : data.items.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="empty">
                      {query || status ? "No records match your filters." : `No ${cfg.label.toLowerCase()} yet.`}
                    </td>
                  </tr>
                ) : (
                  data.items.map((row) => (
                    <React.Fragment key={row._id}>
                      <tr className={expanded === row._id ? "expanded" : ""}>
                        {cfg.columns.map((c) => (
                          <td key={c.key} data-label={c.label}>
                            {c.render ? c.render(row, ctx) : row[c.key]}
                          </td>
                        ))}
                        {cfg.statuses && (
                          <td data-label="Status">
                            <select className={`status-select status-${row.status}`} value={row.status} onChange={(e) => changeStatus(row, e.target.value)} aria-label="Status" disabled={!canUpdate(cfg, row, can)}>
                              {cfg.statuses.map((s) => (
                                <option key={s} value={s}>
                                  {titleCase(s)}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        <td data-label="Date">{fmtDate(row.createdAt)}</td>
                        <td className="row-toggle">
                          <button type="button" className="btn btn-ghost btn-sm" aria-expanded={expanded === row._id} onClick={() => setExpanded(expanded === row._id ? null : row._id)}>
                            {expanded === row._id ? "Hide" : "Details"}
                          </button>
                        </td>
                      </tr>
                      {expanded === row._id && (
                        <tr className="details-row">
                          <td colSpan={colCount}>
                            <RowDetails type={tab} cfg={cfg} row={row} onSaved={replaceRow} onDelete={deleteRow} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>
              {data.total} {data.total === 1 ? "record" : "records"}
            </span>
            <div>
              <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
                <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Prev
              </button>
              <span className="page-indicator">
                Page {data.page} of {data.pages}
              </span>
              <button type="button" className="btn btn-ghost btn-sm" disabled={page >= data.pages || loading} onClick={() => setPage(page + 1)}>
                Next <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
