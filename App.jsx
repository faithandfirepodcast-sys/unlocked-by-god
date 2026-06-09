import { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth, ADMIN_EMAIL } from "./contexts/AuthContext";
import AdminDashboard from "./components/AdminDashboard";
import {
  collection, addDoc, getDocs, doc, updateDoc,
  serverTimestamp, query, orderBy, where
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Assessment Questions ────────────────────────────────────
const ASSESSMENT_QUESTIONS = [
  { id: 1, text: "How have you been feeling lately?", options: ["Peaceful and hopeful", "Anxious or overwhelmed", "Spiritually dry or distant", "Defeated and stuck"] },
  { id: 2, text: "What are you struggling with most right now?", options: ["Fear and worry", "Guilt or shame", "Unforgiveness toward others", "Confusion about my purpose"] },
  { id: 3, text: "Do you feel distant from God?", options: ["No, I feel close", "Sometimes yes", "Often distant", "Very distant or disconnected"] },
  { id: 4, text: "Are you carrying unforgiveness?", options: ["No, I've forgiven", "Working through it", "Yes, toward someone specific", "Yes, toward God or myself"] },
  { id: 5, text: "Do you struggle with fear of people's opinions?", options: ["Not much", "Sometimes", "Often holds me back", "It controls many decisions"] },
  { id: 6, text: "Have you experienced church hurt?", options: ["No", "Minor disappointments", "Yes, significant hurt", "Yes, and I've left the church"] },
  { id: 7, text: "Do you feel called but stuck?", options: ["I'm walking in my calling", "I sense a calling but unsure", "I feel stuck despite knowing my purpose", "I don't know what I'm called to"] },
  { id: 8, text: "Do you struggle with shame or guilt?", options: ["Rarely", "Sometimes", "Often weigh me down", "They define how I see myself"] },
];

const STRUGGLES = {
  fear: { label: "Fear & Anxiety", color: "#7c3aed", verses: ["Isaiah 41:10", "2 Timothy 1:7", "Psalm 23:4"], prayer: "Lord, I surrender my fears to You. Fill me with Your perfect love that casts out all fear.", steps: ["Journal your specific fears daily", "Memorize Isaiah 41:10", "Practice the Freedom Pathways: Overcoming Fear module"] },
  shame: { label: "Shame & Guilt", color: "#dc2626", verses: ["Romans 8:1", "1 John 1:9", "Psalm 103:12"], prayer: "Father, I receive Your forgiveness. No condemnation can stand against me in Christ Jesus.", steps: ["Read Romans 8:1 each morning", "Speak your identity in Christ aloud", "Complete the Identity in Christ pathway"] },
  unforgiveness: { label: "Unforgiveness", color: "#d97706", verses: ["Matthew 6:14", "Colossians 3:13", "Ephesians 4:31-32"], prayer: "God, I choose to forgive as You have forgiven me. Release this burden from my heart.", steps: ["Write a forgiveness letter (you don't have to send it)", "Complete the Forgiveness Journey pathway", "Pray for the person daily for 7 days"] },
  purpose: { label: "Purpose & Calling", color: "#059669", verses: ["Jeremiah 29:11", "Psalm 138:8", "Ephesians 2:10"], prayer: "Lord, reveal my calling and give me courage to walk in it fully.", steps: ["Take the Spiritual Gifts assessment", "Join a coaching session", "Begin the Discovering Purpose pathway"] },
  churchHurt: { label: "Church Hurt", color: "#0284c7", verses: ["Hebrews 10:25", "Psalm 27:10", "Matthew 18:20"], prayer: "Heal my wounds, Lord. Restore my trust and help me find safe community again.", steps: ["Complete the Church Hurt Recovery pathway", "Seek a spiritual mentor or counselor", "Give yourself permission to heal before returning"] },
  identity: { label: "Identity Issues", color: "#be185d", verses: ["Psalm 139:14", "2 Corinthians 5:17", "John 1:12"], prayer: "Father, show me who I truly am in You. Silence every voice that contradicts Your truth.", steps: ["Memorize 5 identity scriptures this week", "Complete the Identity in Christ pathway", "Replace negative self-talk with scripture declarations"] },
};

function scoreAssessment(answers) {
  let scores = { fear: 0, shame: 0, unforgiveness: 0, purpose: 0, churchHurt: 0, identity: 0 };
  if (answers[1] === 1 || answers[1] === 2) scores.fear += 2;
  if (answers[2] === 0) scores.fear += 1;
  if (answers[2] === 1) scores.shame += 2;
  if (answers[2] === 2) scores.unforgiveness += 2;
  if (answers[2] === 3) scores.purpose += 2;
  if (answers[3] === 2 || answers[3] === 3) scores.fear += 1;
  if (answers[4] === 2 || answers[4] === 3) scores.unforgiveness += 2;
  if (answers[5] === 2 || answers[5] === 3) scores.identity += 2;
  if (answers[6] === 2 || answers[6] === 3) scores.churchHurt += 3;
  if (answers[7] === 2 || answers[7] === 3) scores.purpose += 2;
  if (answers[8] === 2 || answers[8] === 3) scores.shame += 2;
  const primary = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  return { scores, primary, struggle: STRUGGLES[primary] };
}

// ─── Scripture Library ───────────────────────────────────────
const SCRIPTURES = [
  { ref: "John 11:44", text: "Loose him, and let him go.", theme: "Freedom" },
  { ref: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.", theme: "Fear" },
  { ref: "Romans 8:1", text: "There is therefore now no condemnation to them which are in Christ Jesus.", theme: "Shame" },
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you.", theme: "Purpose" },
  { ref: "Psalm 139:14", text: "I am fearfully and wonderfully made; your works are wonderful.", theme: "Identity" },
  { ref: "2 Timothy 1:7", text: "For God hath not given us the spirit of fear; but of power, and of love.", theme: "Fear" },
  { ref: "Colossians 3:13", text: "Bear with each other and forgive one another if any of you has a grievance.", theme: "Forgiveness" },
  { ref: "Hebrews 10:25", text: "Not giving up meeting together, as some are in the habit of doing.", theme: "Community" },
];

const PATHWAYS = [
  { id: "fear", title: "Overcoming Fear", icon: "🛡️", color: "#7c3aed", desc: "A 7-step biblical journey from fear to faith.", steps: ["Identify your specific fear", "Find the root (trauma, past experience, lie)", "Replace the lie with scripture", "Pray the Fear Breaker prayer daily", "Practice courage in one small way this week", "Find an accountability partner", "Declare your freedom aloud each morning"] },
  { id: "forgiveness", title: "Forgiveness Journey", icon: "💜", color: "#be185d", desc: "Release the weight of unforgiveness.", steps: ["Write the name and the hurt", "Acknowledge the pain honestly before God", "Choose to forgive (it's a decision, not a feeling)", "Pray for the person who hurt you", "Burn or shred the letter as a symbol", "Replace bitterness with a blessing", "Walk in freedom daily"] },
  { id: "identity", title: "Identity in Christ", icon: "👑", color: "#059669", desc: "Discover who God says you truly are.", steps: ["List 5 negative labels you've believed about yourself", "Find a scripture that contradicts each one", "Declare your identity scriptures each morning", "Write 'I am…' statements based on God's Word", "Share your identity with one trusted person", "Revisit your list weekly and track your belief", "Live from identity, not performance"] },
  { id: "purpose", title: "Discovering Purpose", icon: "🌟", color: "#d97706", desc: "Unlock the calling God placed inside you.", steps: ["Ask God: What gifts did You place in me?", "List 3 things that light you up", "Ask trusted friends what they see in you", "Research how those gifts can serve others", "Take one small step toward your vision", "Find a mentor in your field", "Commit to daily progress, not perfection"] },
  { id: "church-hurt", title: "Church Hurt Recovery", icon: "🕊️", color: "#0284c7", desc: "Heal from spiritual wounds and find community again.", steps: ["Give yourself permission to grieve", "Separate the people from the Church", "Journal every hurt without judgment", "Bring each hurt to God in prayer", "Forgive those who wounded you", "Find a safe, small community", "Take one small step back toward fellowship"] },
  { id: "renewal", title: "Spiritual Renewal", icon: "🌿", color: "#047857", desc: "Revive your walk when you feel spiritually dry.", steps: ["Spend 10 minutes in silence daily", "Read one psalm each morning", "Fast from something distracting for one week", "Write 3 things you're grateful for each day", "Worship outside of church — just you and God", "Confess and release anything blocking flow", "Ask God to speak and then listen"] },
];

// ─── Components ──────────────────────────────────────────────

function AuthGate({ onLogin }) {
  const { signup, login, resetPassword } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup | reset
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setErr(""); setLoading(true);
    try {
      if (mode === "reset") {
        await resetPassword(form.email);
        setResetSent(true);
      } else if (mode === "signup") {
        if (!form.name.trim()) { setErr("Please enter your name."); setLoading(false); return; }
        await signup(form.email, form.password, form.name);
        onLogin();
      } else {
        await login(form.email, form.password);
        onLogin();
      }
    } catch (e) {
      setErr(e.message?.replace("Firebase: ", "").replace(/\(auth\/[^)]+\)/, "") || "Something went wrong.");
    }
    setLoading(false);
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">🔓</div>
          <h1 className="auth-brand-title">Unlocked By God</h1>
          <p className="auth-brand-sub">Your spiritual freedom journey starts here</p>
        </div>

        {resetSent ? (
          <div className="auth-success">
            <p>✅ Password reset email sent! Check your inbox.</p>
            <button className="auth-link" onClick={() => { setResetSent(false); setMode("login"); }}>Back to Sign In</button>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Sign In</button>
              <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>Create Account</button>
            </div>

            {mode === "signup" && (
              <input className="auth-input" placeholder="Full Name" value={form.name} onChange={set("name")} />
            )}
            <input className="auth-input" placeholder="Email" type="email" value={form.email} onChange={set("email")} />
            {mode !== "reset" && (
              <input className="auth-input" placeholder="Password" type="password" value={form.password} onChange={set("password")}
                onKeyDown={e => e.key === "Enter" && submit()} />
            )}

            {err && <p className="auth-err">{err}</p>}

            <button className="auth-submit" onClick={submit} disabled={loading}>
              {loading ? "Please wait…" : mode === "reset" ? "Send Reset Email" : mode === "signup" ? "Create Account" : "Sign In"}
            </button>

            {mode === "login" && (
              <button className="auth-link" onClick={() => setMode("reset")}>Forgot password?</button>
            )}
            {mode === "reset" && (
              <button className="auth-link" onClick={() => setMode("login")}>Back to Sign In</button>
            )}
          </>
        )}

        <p className="auth-scripture">"Loose him, and let him go." — John 11:44</p>
      </div>
    </div>
  );
}

function Dashboard({ user, setPage }) {
  const menuItems = [
    { id: "assessment", icon: "📋", label: "Spiritual Assessment", desc: "Discover what God wants to unlock in you" },
    { id: "prayer", icon: "🙏", label: "Prayer Center", desc: "Submit and receive prayer" },
    { id: "testimony", icon: "✍️", label: "Testimony Center", desc: "Share what God has done" },
    { id: "scripture", icon: "📖", label: "Scripture Library", desc: "Prescriptions for your soul" },
    { id: "pathways", icon: "🛤️", label: "Freedom Pathways", desc: "Guided journeys to breakthrough" },
    { id: "chat", icon: "💬", label: "Biblical Guidance", desc: "AI-powered scripture guidance" },
  ];
  return (
    <div className="page dashboard-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-welcome">Welcome{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}! 👋</h1>
        <p className="dashboard-verse">"Loose him, and let him go." — John 11:44</p>
      </div>
      <div className="menu-grid">
        {menuItems.map(item => (
          <button key={item.id} className="menu-card" onClick={() => setPage(item.id)}>
            <div className="menu-card-icon">{item.icon}</div>
            <div className="menu-card-label">{item.label}</div>
            <div className="menu-card-desc">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AssessmentPage({ user, setPage }) {
  const [step, setStep] = useState(0); // 0 = intro
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  function answer(optionIdx) {
    const q = ASSESSMENT_QUESTIONS[step - 1];
    const newAnswers = { ...answers, [q.id]: optionIdx };
    setAnswers(newAnswers);
    if (step < ASSESSMENT_QUESTIONS.length) {
      setStep(s => s + 1);
    } else {
      const r = scoreAssessment(newAnswers);
      setResult(r);
      // Save to Firestore
      if (user) {
        addDoc(collection(db, "assessments"), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          primaryStruggle: r.struggle?.label,
          scores: r.scores,
          completedAt: serverTimestamp(),
        }).catch(() => {});
      }
    }
  }

  if (result) {
    const s = result.struggle;
    return (
      <div className="page">
        <div className="result-card">
          <div className="result-header" style={{ background: s.color }}>
            <h2 className="result-title">Your Spiritual Freedom Report</h2>
            <div className="result-struggle">{s.label}</div>
          </div>
          <div className="result-body">
            <h3>Your Scripture Prescriptions</h3>
            {s.verses.map(v => <div key={v} className="result-verse">{v}</div>)}
            <h3 style={{ marginTop: 20 }}>Freedom Prayer</h3>
            <p className="result-prayer">"{s.prayer}"</p>
            <h3 style={{ marginTop: 20 }}>Next Steps</h3>
            {s.steps.map((step, i) => <div key={i} className="result-step"><span className="step-num">{i + 1}</span>{step}</div>)}
            <div className="result-actions">
              <button className="btn-primary" onClick={() => setPage("pathways")}>Explore Freedom Pathways</button>
              <button className="btn-secondary" onClick={() => { setStep(0); setAnswers({}); setResult(null); }}>Retake Assessment</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 0) {
    return (
      <div className="page">
        <div className="assessment-intro">
          <div className="assessment-intro-icon">📋</div>
          <h2>Spiritual Freedom Assessment</h2>
          <p>Answer {ASSESSMENT_QUESTIONS.length} questions to receive your personalized Spiritual Freedom Report. Be honest — this is between you and God.</p>
          <button className="btn-primary" onClick={() => setStep(1)}>Begin Assessment</button>
        </div>
      </div>
    );
  }

  const q = ASSESSMENT_QUESTIONS[step - 1];
  return (
    <div className="page">
      <div className="question-card">
        <div className="question-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((step - 1) / ASSESSMENT_QUESTIONS.length) * 100}%` }} />
          </div>
          <span className="progress-text">{step} of {ASSESSMENT_QUESTIONS.length}</span>
        </div>
        <h2 className="question-text">{q.text}</h2>
        <div className="options-grid">
          {q.options.map((opt, i) => (
            <button key={i} className="option-btn" onClick={() => answer(i)}>{opt}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrayerPage({ user }) {
  const [form, setForm] = useState({ name: user?.displayName || "", request: "" });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!form.request.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "prayerRequests"), {
        uid: user?.uid || null,
        name: form.name || "Anonymous",
        email: user?.email || "",
        request: form.request,
        submittedAt: serverTimestamp(),
        answered: false,
      });
    } catch (e) { console.error(e); }
    setForm(f => ({ ...f, request: "" }));
    setSubmitted(true);
    setSaving(false);
    setTimeout(() => setSubmitted(false), 5000);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-icon">🙏</div>
        <h2>Prayer Center</h2>
        <p>Bring your burdens to God. Every prayer matters.</p>
      </div>
      <div className="prayer-card">
        <input className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <textarea className="form-textarea" rows={5} placeholder="Share your prayer request…" value={form.request} onChange={e => setForm(f => ({ ...f, request: e.target.value }))} />
        {submitted && <div className="success-msg">✅ Your prayer has been received. You are covered.</div>}
        <button className="btn-primary" onClick={submit} disabled={saving || submitted}>{saving ? "Submitting…" : "Submit Prayer Request"}</button>
      </div>
      <div className="prayer-promise">
        <p>"The prayer of a righteous person is powerful and effective." — James 5:16</p>
      </div>
    </div>
  );
}

function TestimonyPage({ user }) {
  const [form, setForm] = useState({ name: user?.displayName || "", testimony: "" });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approved, setApproved] = useState([]);

  useEffect(() => {
    getDocs(query(collection(db, "testimonies"), where("status", "==", "approved"), orderBy("submittedAt", "desc")))
      .then(s => setApproved(s.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, []);

  async function submit() {
    if (!form.testimony.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "testimonies"), {
        uid: user?.uid || null,
        name: form.name || "Anonymous",
        email: user?.email || "",
        testimony: form.testimony,
        submittedAt: serverTimestamp(),
        status: "pending",
      });
    } catch (e) { console.error(e); }
    setForm(f => ({ ...f, testimony: "" }));
    setSubmitted(true);
    setSaving(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-icon">✍️</div>
        <h2>Testimony Center</h2>
        <p>Share what God has done. Your story unlocks someone else's breakthrough.</p>
      </div>
      <div className="prayer-card">
        <input className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <textarea className="form-textarea" rows={5} placeholder="Share your testimony…" value={form.testimony} onChange={e => setForm(f => ({ ...f, testimony: e.target.value }))} />
        {submitted ? (
          <div className="success-msg">✅ Testimony submitted! It will go live after review. Thank you for sharing!</div>
        ) : (
          <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? "Submitting…" : "Share My Testimony"}</button>
        )}
      </div>
      {approved.length > 0 && (
        <div className="testimonies-list">
          <h3>Community Testimonies</h3>
          {approved.map(t => (
            <div key={t.id} className="testimony-card">
              <p className="testimony-text">"{t.testimony}"</p>
              <p className="testimony-author">— {t.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScripturePage() {
  const [filter, setFilter] = useState("All");
  const themes = ["All", ...new Set(SCRIPTURES.map(s => s.theme))];
  const filtered = filter === "All" ? SCRIPTURES : SCRIPTURES.filter(s => s.theme === filter);
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-icon">📖</div>
        <h2>Scripture Library</h2>
        <p>Prescriptions for your soul from the living Word.</p>
      </div>
      <div className="filter-pills">
        {themes.map(t => (
          <button key={t} className={`pill ${filter === t ? "pill-active" : ""}`} onClick={() => setFilter(t)}>{t}</button>
        ))}
      </div>
      <div className="scripture-grid">
        {filtered.map(s => (
          <div key={s.ref} className="scripture-card">
            <p className="scripture-text">"{s.text}"</p>
            <div className="scripture-ref">{s.ref}</div>
            <span className="scripture-theme">{s.theme}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PathwaysPage() {
  const [active, setActive] = useState(null);
  const [step, setStep] = useState(0);

  if (active) {
    const p = PATHWAYS.find(x => x.id === active);
    return (
      <div className="page">
        <button className="btn-back" onClick={() => { setActive(null); setStep(0); }}>← Back to Pathways</button>
        <div className="pathway-detail">
          <div className="pathway-detail-header" style={{ borderColor: p.color }}>
            <span className="pathway-icon">{p.icon}</span>
            <h2>{p.title}</h2>
            <p>{p.desc}</p>
          </div>
          <div className="pathway-steps">
            {p.steps.map((s, i) => (
              <div key={i} className={`pathway-step ${i <= step ? "step-active" : ""}`} onClick={() => setStep(i)}>
                <div className="step-circle" style={{ background: i <= step ? p.color : "#e5e7eb" }}>{i < step ? "✓" : i + 1}</div>
                <p>{s}</p>
              </div>
            ))}
          </div>
          {step < p.steps.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep(s => s + 1)}>Next Step</button>
          ) : (
            <div className="success-msg">🎉 You've completed this pathway! Walk in your freedom.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-icon">🛤️</div>
        <h2>Freedom Pathways</h2>
        <p>Guided biblical journeys toward breakthrough and freedom.</p>
      </div>
      <div className="pathways-grid">
        {PATHWAYS.map(p => (
          <button key={p.id} className="pathway-card" onClick={() => setActive(p.id)} style={{ borderTop: `3px solid ${p.color}` }}>
            <div className="pathway-card-icon">{p.icon}</div>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <span className="pathway-steps-count">{p.steps.length} steps</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GuidancePage({ user }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! I'm here to offer biblical guidance. Share what's on your heart and I'll walk with you through scripture." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a compassionate biblical counselor for the Unlocked By God platform. Your role is to offer encouragement, scripture-based guidance, and prayer for people seeking spiritual freedom. Always ground your responses in scripture. Be warm, supportive, and never condemning. Focus on freedom, healing, and God's love. Keep responses concise and pastoral.`,
          messages: [
            ...messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0).map(m => ({ role: m.role, content: m.text })),
            { role: "user", content: userMsg }
          ],
        })
      });
      const data = await res.json();
      const reply = data.content?.map(c => c.text).join("") || "I'm here with you. Let's seek God's word together.";
      setMessages(m => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "I'm here with you. Please try again in a moment." }]);
    }
    setLoading(false);
  }

  return (
    <div className="page chat-page">
      <div className="page-header">
        <div className="page-icon">💬</div>
        <h2>Biblical Guidance</h2>
        <p>Scripture-based support for your journey.</p>
      </div>
      <div className="chat-box">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg chat-msg-${m.role}`}>
              <p>{m.text}</p>
            </div>
          ))}
          {loading && <div className="chat-msg chat-msg-assistant"><p className="typing">…</p></div>}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-row">
          <input className="chat-input" placeholder="Share what's on your heart…" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()} />
          <button className="chat-send" onClick={send} disabled={loading}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────
function Nav({ page, setPage, isAdmin }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { id: "dashboard", icon: "🏠", label: "Home" },
    { id: "assessment", icon: "📋", label: "Assessment" },
    { id: "prayer", icon: "🙏", label: "Prayer" },
    { id: "testimony", icon: "✍️", label: "Testimony" },
    { id: "scripture", icon: "📖", label: "Scripture" },
    { id: "pathways", icon: "🛤️", label: "Pathways" },
    { id: "chat", icon: "💬", label: "Guidance" },
  ];

  return (
    <nav className="nav">
      <div className="nav-brand" onClick={() => setPage("dashboard")}>
        🔓 <span>Unlocked By God</span>
      </div>
      <div className="nav-desktop">
        {links.map(l => (
          <button key={l.id} className={`nav-link ${page === l.id ? "nav-link-active" : ""}`} onClick={() => setPage(l.id)}>
            {l.label}
          </button>
        ))}
        {isAdmin && (
          <button className="nav-link nav-link-admin" onClick={() => setPage("admin")}>⚙️ Admin</button>
        )}
        <button className="nav-link nav-link-logout" onClick={logout}>Sign Out</button>
      </div>
      <button className="nav-hamburger" onClick={() => setOpen(o => !o)}>☰</button>
      {open && (
        <div className="nav-mobile-menu" onClick={() => setOpen(false)}>
          {links.map(l => (
            <button key={l.id} className={`nav-mobile-link ${page === l.id ? "active" : ""}`} onClick={() => setPage(l.id)}>
              {l.icon} {l.label}
            </button>
          ))}
          {isAdmin && (
            <button className="nav-mobile-link" onClick={() => setPage("admin")}>⚙️ Admin</button>
          )}
          <button className="nav-mobile-link" onClick={logout}>Sign Out</button>
        </div>
      )}
    </nav>
  );
}

// ─── Main Shell ───────────────────────────────────────────────
function AppShell() {
  const { currentUser, isAdmin } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (!currentUser) return <AuthGate onLogin={() => setPage("dashboard")} />;

  if (page === "admin") {
    return <AdminDashboard onBack={() => setPage("dashboard")} />;
  }

  return (
    <div className="shell">
      <Nav page={page} setPage={setPage} isAdmin={isAdmin} />
      <div className="shell-content">
        {page === "dashboard" && <Dashboard user={currentUser} setPage={setPage} />}
        {page === "assessment" && <AssessmentPage user={currentUser} setPage={setPage} />}
        {page === "prayer" && <PrayerPage user={currentUser} />}
        {page === "testimony" && <TestimonyPage user={currentUser} />}
        {page === "scripture" && <ScripturePage />}
        {page === "pathways" && <PathwaysPage />}
        {page === "chat" && <GuidancePage user={currentUser} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
