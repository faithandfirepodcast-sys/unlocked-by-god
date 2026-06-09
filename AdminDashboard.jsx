import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

// ─── Helpers ────────────────────────────────────────────────
function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function csvDownload(data, filename) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(","), ...data.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─── Sub-panels ──────────────────────────────────────────────

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")))
      .then(s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () =>
    csvDownload(filtered.map(u => ({ name: u.displayName, email: u.email, joined: fmtDate(u.createdAt), role: u.role })), "users.csv");

  return (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <h3>Registered Users <span className="adm-badge">{filtered.length}</span></h3>
        <button className="adm-btn-sm" onClick={exportCSV}>Export CSV</button>
      </div>
      <input className="adm-search" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? <p className="adm-loading">Loading…</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Role</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.displayName || "—"}</td>
                  <td>{u.email}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td><span className={`adm-tag ${u.role === "admin" ? "adm-tag-gold" : "adm-tag-blue"}`}>{u.role || "member"}</span></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={4} className="adm-empty">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PrayerPanel() {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "prayerRequests"), orderBy("submittedAt", "desc")))
      .then(s => setPrayers(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function toggleAnswered(p) {
    await updateDoc(doc(db, "prayerRequests", p.id), { answered: !p.answered });
    setPrayers(prev => prev.map(x => x.id === p.id ? { ...x, answered: !x.answered } : x));
  }

  async function deleteRecord(id) {
    if (!confirm("Delete this prayer request?")) return;
    await deleteDoc(doc(db, "prayerRequests", id));
    setPrayers(prev => prev.filter(x => x.id !== id));
  }

  const exportCSV = () =>
    csvDownload(prayers.map(p => ({ name: p.name, email: p.email, request: p.request, date: fmtDate(p.submittedAt), answered: p.answered })), "prayer-requests.csv");

  return (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <h3>Prayer Requests <span className="adm-badge">{prayers.length}</span></h3>
        <button className="adm-btn-sm" onClick={exportCSV}>Export CSV</button>
      </div>
      {loading ? <p className="adm-loading">Loading…</p> : (
        <div className="adm-cards">
          {prayers.map(p => (
            <div key={p.id} className={`adm-card ${p.answered ? "adm-card-answered" : ""}`}>
              <div className="adm-card-top">
                <span className="adm-card-name">{p.name || "Anonymous"}</span>
                <span className="adm-card-date">{fmtDate(p.submittedAt)}</span>
              </div>
              <p className="adm-card-body">{p.request}</p>
              {p.email && <p className="adm-card-meta">{p.email}</p>}
              <div className="adm-card-actions">
                <button className={`adm-btn-sm ${p.answered ? "adm-btn-green" : ""}`} onClick={() => toggleAnswered(p)}>
                  {p.answered ? "✓ Answered" : "Mark Answered"}
                </button>
                <button className="adm-btn-sm adm-btn-red" onClick={() => deleteRecord(p.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!prayers.length && <p className="adm-empty">No prayer requests yet.</p>}
        </div>
      )}
    </div>
  );
}

function AssessmentsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(query(collection(db, "assessments"), orderBy("completedAt", "desc")))
      .then(s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () =>
    csvDownload(items.map(a => ({ name: a.displayName, email: a.email, result: a.primaryStruggle, date: fmtDate(a.completedAt) })), "assessments.csv");

  return (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <h3>Assessment Results <span className="adm-badge">{items.length}</span></h3>
        <button className="adm-btn-sm" onClick={exportCSV}>Export CSV</button>
      </div>
      {loading ? <p className="adm-loading">Loading…</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Member</th><th>Primary Struggle</th><th>Score</th><th>Date</th></tr></thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id}>
                  <td>{a.displayName || a.email || "—"}</td>
                  <td>{a.primaryStruggle || "—"}</td>
                  <td>{a.score ?? "—"}</td>
                  <td>{fmtDate(a.completedAt)}</td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={4} className="adm-empty">No assessments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TestimoniesPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "testimonies"), orderBy("submittedAt", "desc")))
      .then(s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function setStatus(id, status) {
    await updateDoc(doc(db, "testimonies", id), { status });
    setItems(prev => prev.map(x => x.id === id ? { ...x, status } : x));
  }

  async function deleteRecord(id) {
    if (!confirm("Delete this testimony?")) return;
    await deleteDoc(doc(db, "testimonies", id));
    setItems(prev => prev.filter(x => x.id !== id));
  }

  return (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <h3>Testimonies <span className="adm-badge">{items.length}</span></h3>
        <span className="adm-hint">Approve before they go live on the site</span>
      </div>
      {loading ? <p className="adm-loading">Loading…</p> : (
        <div className="adm-cards">
          {items.map(t => (
            <div key={t.id} className={`adm-card adm-card-testimony adm-status-${t.status || "pending"}`}>
              <div className="adm-card-top">
                <span className="adm-card-name">{t.name || "Anonymous"}</span>
                <span className={`adm-tag adm-tag-status-${t.status || "pending"}`}>{t.status || "Pending"}</span>
              </div>
              <p className="adm-card-body">{t.testimony}</p>
              <span className="adm-card-date">{fmtDate(t.submittedAt)}</span>
              <div className="adm-card-actions">
                {t.status !== "approved" && (
                  <button className="adm-btn-sm adm-btn-green" onClick={() => setStatus(t.id, "approved")}>Approve ✓</button>
                )}
                {t.status !== "rejected" && (
                  <button className="adm-btn-sm adm-btn-orange" onClick={() => setStatus(t.id, "rejected")}>Reject</button>
                )}
                <button className="adm-btn-sm adm-btn-red" onClick={() => deleteRecord(t.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!items.length && <p className="adm-empty">No testimonies submitted yet.</p>}
        </div>
      )}
    </div>
  );
}

function DevotionalsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", body: "", scripture: "", published: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "devotionals"), orderBy("createdAt", "desc")))
      .then(s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function save() {
    if (!form.title.trim() || !form.body.trim()) { setMsg("Title and body are required."); return; }
    setSaving(true);
    await addDoc(collection(db, "devotionals"), { ...form, createdAt: serverTimestamp() });
    setForm({ title: "", body: "", scripture: "", published: false });
    setMsg("Devotional uploaded!");
    setTimeout(() => setMsg(""), 3000);
    setSaving(false);
    load();
  }

  async function togglePublish(item) {
    await updateDoc(doc(db, "devotionals", item.id), { published: !item.published });
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, published: !x.published } : x));
  }

  async function deleteRecord(id) {
    if (!confirm("Delete this devotional?")) return;
    await deleteDoc(doc(db, "devotionals", id));
    setItems(prev => prev.filter(x => x.id !== id));
  }

  return (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <h3>Devotionals <span className="adm-badge">{items.length}</span></h3>
      </div>

      <div className="adm-upload-form">
        <h4 className="adm-form-title">Upload New Devotional</h4>
        <input className="adm-input" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <input className="adm-input" placeholder="Scripture reference (e.g. John 11:44)" value={form.scripture} onChange={e => setForm(f => ({ ...f, scripture: e.target.value }))} />
        <textarea className="adm-textarea" rows={5} placeholder="Devotional body…" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
        <label className="adm-checkbox">
          <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
          Publish to front page immediately
        </label>
        {msg && <p className="adm-msg">{msg}</p>}
        <button className="adm-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Upload Devotional"}</button>
      </div>

      {loading ? <p className="adm-loading">Loading…</p> : (
        <div className="adm-cards">
          {items.map(d => (
            <div key={d.id} className={`adm-card ${d.published ? "adm-card-published" : ""}`}>
              <div className="adm-card-top">
                <span className="adm-card-name">{d.title}</span>
                <span className={`adm-tag ${d.published ? "adm-tag-green" : "adm-tag-gray"}`}>{d.published ? "Live" : "Draft"}</span>
              </div>
              {d.scripture && <p className="adm-card-meta">{d.scripture}</p>}
              <p className="adm-card-body">{d.body?.slice(0, 120)}…</p>
              <div className="adm-card-actions">
                <button className={`adm-btn-sm ${d.published ? "adm-btn-orange" : "adm-btn-green"}`} onClick={() => togglePublish(d)}>
                  {d.published ? "Unpublish" : "Publish to Front Page"}
                </button>
                <button className="adm-btn-sm adm-btn-red" onClick={() => deleteRecord(d.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!items.length && <p className="adm-empty">No devotionals yet.</p>}
        </div>
      )}
    </div>
  );
}

function AudioPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", description: "", audioUrl: "", speaker: "", published: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    getDocs(query(collection(db, "audioTeachings"), orderBy("createdAt", "desc")))
      .then(s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function save() {
    if (!form.title.trim() || !form.audioUrl.trim()) { setMsg("Title and audio URL are required."); return; }
    setSaving(true);
    await addDoc(collection(db, "audioTeachings"), { ...form, createdAt: serverTimestamp() });
    setForm({ title: "", description: "", audioUrl: "", speaker: "", published: false });
    setMsg("Teaching uploaded!");
    setTimeout(() => setMsg(""), 3000);
    setSaving(false);
    load();
  }

  async function togglePublish(item) {
    await updateDoc(doc(db, "audioTeachings", item.id), { published: !item.published });
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, published: !x.published } : x));
  }

  async function deleteRecord(id) {
    if (!confirm("Delete this teaching?")) return;
    await deleteDoc(doc(db, "audioTeachings", id));
    setItems(prev => prev.filter(x => x.id !== id));
  }

  return (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <h3>Audio Teachings <span className="adm-badge">{items.length}</span></h3>
      </div>

      <div className="adm-upload-form">
        <h4 className="adm-form-title">Upload New Teaching</h4>
        <input className="adm-input" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <input className="adm-input" placeholder="Speaker name" value={form.speaker} onChange={e => setForm(f => ({ ...f, speaker: e.target.value }))} />
        <input className="adm-input" placeholder="Audio URL (Soundcloud, Buzzsprout, direct .mp3 link…)" value={form.audioUrl} onChange={e => setForm(f => ({ ...f, audioUrl: e.target.value }))} />
        <textarea className="adm-textarea" rows={3} placeholder="Description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <label className="adm-checkbox">
          <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
          Publish to front page immediately
        </label>
        {msg && <p className="adm-msg">{msg}</p>}
        <button className="adm-btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Upload Teaching"}</button>
      </div>

      {loading ? <p className="adm-loading">Loading…</p> : (
        <div className="adm-cards">
          {items.map(a => (
            <div key={a.id} className={`adm-card ${a.published ? "adm-card-published" : ""}`}>
              <div className="adm-card-top">
                <span className="adm-card-name">{a.title}</span>
                <span className={`adm-tag ${a.published ? "adm-tag-green" : "adm-tag-gray"}`}>{a.published ? "Live" : "Draft"}</span>
              </div>
              {a.speaker && <p className="adm-card-meta">Speaker: {a.speaker}</p>}
              {a.description && <p className="adm-card-body">{a.description}</p>}
              {a.audioUrl && (
                <audio controls src={a.audioUrl} className="adm-audio" />
              )}
              <div className="adm-card-actions">
                <button className={`adm-btn-sm ${a.published ? "adm-btn-orange" : "adm-btn-green"}`} onClick={() => togglePublish(a)}>
                  {a.published ? "Unpublish" : "Publish to Front Page"}
                </button>
                <button className="adm-btn-sm adm-btn-red" onClick={() => deleteRecord(a.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!items.length && <p className="adm-empty">No audio teachings yet.</p>}
        </div>
      )}
    </div>
  );
}

function AnalyticsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "prayerRequests")),
      getDocs(collection(db, "assessments")),
      getDocs(collection(db, "testimonies")),
      getDocs(collection(db, "devotionals")),
      getDocs(collection(db, "audioTeachings")),
    ]).then(([users, prayers, assessments, testimonies, devs, audio]) => {
      const now = new Date();
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const recentUsers = users.docs.filter(d => d.data().createdAt?.toDate?.() > weekAgo).length;
      const answeredPrayers = prayers.docs.filter(d => d.data().answered).length;
      const approvedTestimonies = testimonies.docs.filter(d => d.data().status === "approved").length;
      const pendingTestimonies = testimonies.docs.filter(d => !d.data().status || d.data().status === "pending").length;
      setStats({
        totalUsers: users.size,
        newUsersThisWeek: recentUsers,
        totalPrayers: prayers.size,
        answeredPrayers,
        totalAssessments: assessments.size,
        totalTestimonies: testimonies.size,
        approvedTestimonies,
        pendingTestimonies,
        publishedDevotionals: devs.docs.filter(d => d.data().published).length,
        publishedAudio: audio.docs.filter(d => d.data().published).length,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="adm-panel"><p className="adm-loading">Loading analytics…</p></div>;

  const cards = [
    { label: "Total Members", value: stats.totalUsers, sub: `+${stats.newUsersThisWeek} this week`, color: "#7c3aed" },
    { label: "Prayer Requests", value: stats.totalPrayers, sub: `${stats.answeredPrayers} answered`, color: "#059669" },
    { label: "Assessments Taken", value: stats.totalAssessments, sub: "spiritual freedom reports", color: "#0284c7" },
    { label: "Testimonies", value: stats.totalTestimonies, sub: `${stats.pendingTestimonies} awaiting review`, color: "#d97706" },
    { label: "Devotionals", value: stats.publishedDevotionals, sub: "published to front page", color: "#be185d" },
    { label: "Audio Teachings", value: stats.publishedAudio, sub: "published to front page", color: "#1d4ed8" },
  ];

  return (
    <div className="adm-panel">
      <div className="adm-panel-header">
        <h3>Analytics & Member Activity</h3>
      </div>
      <div className="adm-stats-grid">
        {cards.map(c => (
          <div key={c.label} className="adm-stat-card" style={{ borderTop: `3px solid ${c.color}` }}>
            <div className="adm-stat-value" style={{ color: c.color }}>{c.value}</div>
            <div className="adm-stat-label">{c.label}</div>
            <div className="adm-stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>
      {stats.pendingTestimonies > 0 && (
        <div className="adm-alert">
          ⚠️ {stats.pendingTestimonies} testimony{stats.pendingTestimonies > 1 ? "ies" : ""} waiting for your approval.
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ────────────────────────────────────

const TABS = [
  { id: "analytics", label: "📊 Analytics" },
  { id: "users", label: "👥 Users" },
  { id: "prayers", label: "🙏 Prayers" },
  { id: "assessments", label: "📋 Assessments" },
  { id: "testimonies", label: "✍️ Testimonies" },
  { id: "devotionals", label: "📖 Devotionals" },
  { id: "audio", label: "🎙️ Audio" },
];

export default function AdminDashboard({ onBack }) {
  const { currentUser, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("analytics");

  if (!isAdmin) {
    return (
      <div className="adm-blocked">
        <div className="adm-blocked-inner">
          <div className="adm-blocked-icon">🔒</div>
          <h2>Access Restricted</h2>
          <p>This area is restricted to authorized administrators only.</p>
          <button className="adm-btn-primary" onClick={onBack}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-root">
      {/* Sidebar */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <div className="adm-brand-icon">🔓</div>
          <div>
            <div className="adm-brand-name">Unlocked By God</div>
            <div className="adm-brand-sub">Admin Console</div>
          </div>
        </div>

        <nav className="adm-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`adm-nav-item ${activeTab === t.id ? "adm-nav-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-admin-info">
            <div className="adm-admin-avatar">CG</div>
            <div>
              <div className="adm-admin-name">Charlotte Gray</div>
              <div className="adm-admin-email">{currentUser?.email}</div>
            </div>
          </div>
          <button className="adm-nav-item adm-signout" onClick={onBack}>← Back to App</button>
          <button className="adm-nav-item adm-signout" onClick={logout}>Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="adm-main">
        <div className="adm-content">
          {activeTab === "analytics" && <AnalyticsPanel />}
          {activeTab === "users" && <UsersPanel />}
          {activeTab === "prayers" && <PrayerPanel />}
          {activeTab === "assessments" && <AssessmentsPanel />}
          {activeTab === "testimonies" && <TestimoniesPanel />}
          {activeTab === "devotionals" && <DevotionalsPanel />}
          {activeTab === "audio" && <AudioPanel />}
        </div>
      </main>
    </div>
  );
}
