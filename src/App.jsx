import { useState, useEffect, useRef } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const ADMIN_EMAIL = "cmalaysia56@gmail.com";

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --gold: #C9A84C;
    --gold-light: #E8C97A;
    --deep: #1A1A2E;
    --navy: #16213E;
    --purple: #2D1B69;
    --white: #FFFFFF;
    --off-white: #F8F6F2;
    --text: #2C2C2C;
    --muted: #6B7280;
    --border: #E5E7EB;
    --success: #10B981;
    --error: #EF4444;
    --radius: 12px;
    --shadow: 0 4px 24px rgba(0,0,0,0.12);
  }
  body { font-family: 'Inter', sans-serif; background: var(--off-white); color: var(--text); min-height: 100vh; }
  h1, h2, h3 { font-family: 'Playfair Display', serif; }

  /* Auth */
  .auth-bg { min-height: 100vh; background: linear-gradient(135deg, var(--deep) 0%, var(--purple) 50%, var(--navy) 100%); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .auth-card { background: white; border-radius: 20px; padding: 40px; width: 100%; max-width: 420px; box-shadow: var(--shadow); }
  .auth-brand { text-align: center; margin-bottom: 28px; }
  .auth-brand-icon { font-size: 3rem; margin-bottom: 8px; }
  .auth-brand-title { font-size: 1.8rem; color: var(--deep); margin-bottom: 4px; }
  .auth-brand-sub { color: var(--muted); font-size: 0.9rem; }
  .auth-tabs { display: flex; background: var(--off-white); border-radius: 8px; padding: 4px; margin-bottom: 20px; }
  .auth-tab { flex: 1; padding: 8px; border: none; background: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 500; color: var(--muted); transition: all 0.2s; }
  .auth-tab.active { background: white; color: var(--deep); box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
  .auth-input { width: 100%; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 0.95rem; margin-bottom: 12px; outline: none; transition: border-color 0.2s; font-family: inherit; }
  .auth-input:focus { border-color: var(--gold); }
  .auth-submit { width: 100%; padding: 13px; background: linear-gradient(135deg, var(--gold), var(--gold-light)); color: var(--deep); border: none; border-radius: var(--radius); font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 4px; transition: opacity 0.2s; }
  .auth-submit:hover { opacity: 0.9; }
  .auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .auth-link { background: none; border: none; color: var(--gold); cursor: pointer; font-size: 0.85rem; display: block; margin: 12px auto 0; text-decoration: underline; }
  .auth-err { color: var(--error); font-size: 0.85rem; margin-bottom: 8px; text-align: center; }
  .auth-success { text-align: center; color: var(--success); padding: 16px; background: #f0fdf4; border-radius: var(--radius); margin-bottom: 12px; }
  .auth-scripture { text-align: center; font-style: italic; color: var(--muted); font-size: 0.8rem; margin-top: 20px; }

  /* App Shell */
  .app-shell { display: flex; flex-direction: column; min-height: 100vh; }
  .top-nav { background: linear-gradient(135deg, var(--deep), var(--navy)); padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 60px; box-shadow: 0 2px 12px rgba(0,0,0,0.2); position: sticky; top: 0; z-index: 100; }
  .nav-brand { color: var(--gold); font-family: 'Playfair Display', serif; font-size: 1.3rem; }
  .nav-right { display: flex; align-items: center; gap: 12px; }
  .nav-user { color: var(--off-white); font-size: 0.85rem; }
  .nav-btn { background: none; border: 1px solid var(--gold); color: var(--gold); padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
  .nav-btn:hover { background: var(--gold); color: var(--deep); }
  .nav-admin { background: var(--gold); color: var(--deep); border: none; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 0.8rem; font-weight: 600; }

  /* Pages */
  .page { flex: 1; padding: 24px; max-width: 800px; margin: 0 auto; width: 100%; }

  /* Dashboard */
  .dashboard-hero { text-align: center; padding: 40px 20px 30px; }
  .dashboard-welcome { font-size: 2rem; color: var(--deep); margin-bottom: 8px; }
  .dashboard-verse { color: var(--muted); font-style: italic; font-size: 0.9rem; }
  .menu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 24px; }
  .menu-card { background: white; border-radius: var(--radius); padding: 24px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.06); text-align: center; }
  .menu-card:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: var(--shadow); }
  .menu-icon { font-size: 2.2rem; margin-bottom: 10px; }
  .menu-label { font-weight: 600; color: var(--deep); font-size: 0.95rem; margin-bottom: 4px; }
  .menu-desc { color: var(--muted); font-size: 0.8rem; }

  /* Section header */
  .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .back-btn { background: none; border: none; cursor: pointer; color: var(--gold); font-size: 1.2rem; padding: 4px; }
  .section-title { font-size: 1.6rem; color: var(--deep); }

  /* Cards */
  .card { background: white; border-radius: var(--radius); padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 16px; }

  /* Forms */
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-weight: 500; margin-bottom: 6px; font-size: 0.9rem; color: var(--text); }
  .form-input, .form-textarea, .form-select { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.95rem; font-family: inherit; outline: none; transition: border-color 0.2s; background: white; }
  .form-input:focus, .form-textarea:focus, .form-select:focus { border-color: var(--gold); }
  .form-textarea { resize: vertical; min-height: 100px; }
  .btn-primary { background: linear-gradient(135deg, var(--gold), var(--gold-light)); color: var(--deep); border: none; padding: 12px 24px; border-radius: var(--radius); font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
  .btn-primary:hover { opacity: 0.9; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-outline { background: none; border: 2px solid var(--gold); color: var(--gold); padding: 10px 22px; border-radius: var(--radius); font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-outline:hover { background: var(--gold); color: var(--deep); }

  /* Assessment */
  .question-card { background: white; border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow); }
  .question-text { font-size: 1.1rem; font-weight: 600; color: var(--deep); margin-bottom: 20px; line-height: 1.5; }
  .options-list { display: flex; flex-direction: column; gap: 10px; }
  .option-btn { padding: 14px 18px; border: 1.5px solid var(--border); border-radius: 10px; background: white; cursor: pointer; text-align: left; font-size: 0.9rem; font-family: inherit; transition: all 0.2s; }
  .option-btn:hover { border-color: var(--gold); background: #FFF9EC; }
  .option-btn.selected { border-color: var(--gold); background: #FFF9EC; font-weight: 500; }
  .progress-bar { height: 6px; background: var(--border); border-radius: 99px; margin-bottom: 24px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-light)); border-radius: 99px; transition: width 0.4s; }

  /* Result */
  .result-hero { text-align: center; padding: 32px 20px; background: linear-gradient(135deg, var(--deep), var(--purple)); border-radius: var(--radius); color: white; margin-bottom: 20px; }
  .result-gift { font-size: 2.5rem; margin-bottom: 8px; }
  .result-title { font-size: 1.8rem; margin-bottom: 4px; }
  .result-sub { opacity: 0.8; font-size: 0.9rem; }
  .gift-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 16px 0; }
  .gift-chip { background: var(--off-white); border-radius: 8px; padding: 12px; text-align: center; font-size: 0.85rem; font-weight: 500; }
  .gift-chip-icon { font-size: 1.4rem; margin-bottom: 4px; }

  /* Prayer */
  .prayer-item { background: white; border-radius: var(--radius); padding: 18px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-left: 3px solid var(--gold); }
  .prayer-name { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
  .prayer-text { color: var(--text); font-size: 0.9rem; line-height: 1.5; }
  .prayer-date { color: var(--muted); font-size: 0.75rem; margin-top: 6px; }

  /* Scripture */
  .scripture-card { background: linear-gradient(135deg, var(--deep), var(--purple)); color: white; border-radius: var(--radius); padding: 28px; margin-bottom: 16px; }
  .scripture-ref { color: var(--gold-light); font-size: 0.8rem; font-weight: 600; margin-bottom: 10px; letter-spacing: 1px; text-transform: uppercase; }
  .scripture-text { font-size: 1.05rem; line-height: 1.7; font-style: italic; }
  .scripture-tag { display: inline-block; background: rgba(255,255,255,0.15); border-radius: 20px; padding: 4px 12px; font-size: 0.75rem; margin-top: 12px; }

  /* Chat */
  .chat-box { background: white; border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; display: flex; flex-direction: column; height: 480px; }
  .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .msg { max-width: 80%; padding: 12px 16px; border-radius: 16px; font-size: 0.9rem; line-height: 1.5; }
  .msg.user { background: linear-gradient(135deg, var(--gold), var(--gold-light)); color: var(--deep); align-self: flex-end; border-bottom-right-radius: 4px; }
  .msg.ai { background: var(--off-white); color: var(--text); align-self: flex-start; border-bottom-left-radius: 4px; }
  .chat-input-row { display: flex; gap: 8px; padding: 12px; border-top: 1px solid var(--border); }
  .chat-input { flex: 1; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 20px; font-size: 0.9rem; font-family: inherit; outline: none; }
  .chat-input:focus { border-color: var(--gold); }
  .chat-send { background: var(--gold); border: none; color: var(--deep); border-radius: 50%; width: 38px; height: 38px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
  .premade-btns { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 12px; }
  .premade-btn { background: var(--off-white); border: 1px solid var(--border); border-radius: 20px; padding: 6px 14px; font-size: 0.78rem; cursor: pointer; color: var(--text); transition: all 0.2s; }
  .premade-btn:hover { border-color: var(--gold); background: #FFF9EC; }

  /* Testimony */
  .testimony-item { background: white; border-radius: var(--radius); padding: 20px; margin-bottom: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .testimony-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .testimony-name { font-weight: 600; }
  .testimony-badge { background: var(--gold); color: var(--deep); font-size: 0.7rem; padding: 2px 10px; border-radius: 20px; font-weight: 600; }
  .testimony-text { color: var(--text); font-size: 0.9rem; line-height: 1.6; }

  /* Pathways */
  .pathway-card { background: white; border-radius: var(--radius); padding: 20px; margin-bottom: 14px; border-left: 4px solid var(--gold); box-shadow: 0 2px 8px rgba(0,0,0,0.06); cursor: pointer; transition: all 0.2s; }
  .pathway-card:hover { transform: translateX(4px); }
  .pathway-title { font-weight: 600; font-size: 1rem; color: var(--deep); margin-bottom: 4px; }
  .pathway-desc { color: var(--muted); font-size: 0.85rem; }
  .pathway-steps { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
  .pathway-step { display: flex; gap: 12px; padding: 12px; background: var(--off-white); border-radius: 8px; font-size: 0.9rem; }
  .step-num { background: var(--gold); color: var(--deep); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }

  /* Admin */
  .admin-shell { min-height: 100vh; background: var(--deep); color: white; }
  .admin-header { background: rgba(0,0,0,0.3); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
  .admin-title { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: var(--gold); }
  .admin-tabs { display: flex; gap: 4px; padding: 16px 24px 0; }
  .admin-tab { padding: 10px 20px; border: none; background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.6); border-radius: 8px 8px 0 0; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
  .admin-tab.active { background: white; color: var(--deep); font-weight: 600; }
  .admin-body { background: var(--off-white); min-height: calc(100vh - 120px); padding: 24px; }
  .admin-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .admin-stat { background: white; border-radius: var(--radius); padding: 20px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .admin-stat-num { font-size: 2rem; font-weight: 700; color: var(--deep); font-family: 'Playfair Display', serif; }
  .admin-stat-label { color: var(--muted); font-size: 0.8rem; margin-top: 4px; }
  .admin-table { width: 100%; background: white; border-radius: var(--radius); box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden; }
  .admin-table th { background: var(--deep); color: white; padding: 12px 16px; text-align: left; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px; }
  .admin-table td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
  .admin-table tr:last-child td { border-bottom: none; }
  .admin-table tr:hover td { background: var(--off-white); }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
  .badge-gold { background: var(--gold); color: var(--deep); }
  .badge-green { background: #D1FAE5; color: #065F46; }
  .badge-gray { background: var(--border); color: var(--muted); }
  .del-btn { background: none; border: 1px solid #FCA5A5; color: #EF4444; border-radius: 6px; padding: 3px 10px; cursor: pointer; font-size: 0.75rem; }
  .del-btn:hover { background: #FEE2E2; }
  .search-bar { width: 100%; max-width: 340px; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: var(--radius); font-size: 0.9rem; font-family: inherit; outline: none; margin-bottom: 16px; }
  .search-bar:focus { border-color: var(--gold); }
  .csv-btn { background: var(--success); color: white; border: none; padding: 9px 18px; border-radius: var(--radius); cursor: pointer; font-size: 0.85rem; font-weight: 600; float: right; }
  .loading { text-align: center; padding: 40px; color: var(--muted); }
  .empty { text-align: center; padding: 40px; color: var(--muted); }

  /* Toast */
  .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--deep); color: white; padding: 12px 24px; border-radius: 30px; font-size: 0.9rem; z-index: 9999; box-shadow: var(--shadow); animation: slideUp 0.3s ease; }
  @keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

  @media (max-width: 600px) {
    .page { padding: 16px; }
    .menu-grid { grid-template-columns: 1fr 1fr; }
    .admin-tabs { overflow-x: auto; }
  }
`;

// ─── Data ──────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 1, text: "When you're in a group, you naturally...", options: ["Lead and organize", "Encourage and support", "Teach and explain", "Serve behind the scenes", "Pray and intercede"] },
  { id: 2, text: "You feel most alive spiritually when...", options: ["Sharing your faith with strangers", "Comforting someone in pain", "Digging deep into Scripture", "Managing resources for God's work", "Seeing God heal or move supernaturally"] },
  { id: 3, text: "Others often come to you for...", options: ["Direction and vision", "A listening ear", "Biblical answers", "Practical help", "Spiritual insight"] },
  { id: 4, text: "Your biggest passion is...", options: ["Building God's Kingdom broadly", "Caring for the hurting", "Equipping believers", "Making things run smoothly", "Praying and seeking God"] },
  { id: 5, text: "When you see a need in your church, you...", options: ["Step up to lead a solution", "Immediately encourage those affected", "Research and teach on it", "Roll up your sleeves and help", "Pray specifically over it"] },
];

const GIFTS = [
  { key: "leadership", label: "Leadership", icon: "👑", desc: "You carry a God-given ability to cast vision and guide others toward purpose." },
  { key: "mercy", label: "Mercy", icon: "💛", desc: "Your heart breaks for the hurting. You are God's hands extended." },
  { key: "teaching", label: "Teaching", icon: "📖", desc: "You have a gift for illuminating truth and equipping others in the Word." },
  { key: "serving", label: "Serving", icon: "🤲", desc: "You see needs others miss. Your faithfulness behind the scenes moves mountains." },
  { key: "intercession", label: "Intercession", icon: "🙏", desc: "You carry a special authority in prayer. Heaven moves when you pray." },
];

const SCRIPTURES = [
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.", tag: "Purpose" },
  { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path.", tag: "Guidance" },
  { ref: "Isaiah 40:31", text: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary.", tag: "Strength" },
  { ref: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", tag: "Faith" },
  { ref: "Philippians 4:13", text: "I can do all this through him who gives me strength.", tag: "Courage" },
  { ref: "John 11:44", text: "The dead man came out, his hands and feet wrapped with strips of linen, and a cloth around his face. Jesus said to them, 'Take off the grave clothes and let him go.'", tag: "Freedom" },
];

const PATHWAYS = [
  { id: "fear", title: "Breaking Free from Fear", icon: "🦁", color: "#7C3AED", desc: "A 7-step journey from paralysis to fearless faith.", steps: ["Identify the root fear by name", "Find the Scripture that counters it", "Pray the opposite of what fear says", "Take one small act of courage this week", "Share your fear with a trusted believer", "Fast from the media that feeds the fear", "Declare daily: God has not given me a spirit of fear"] },
  { id: "identity", title: "Walking in Your Identity", icon: "🌟", color: "#D97706", desc: "Discover who God says you are beyond your past.", steps: ["Write down 5 lies you believe about yourself", "Find a Scripture that refutes each lie", "Speak truth out loud for 21 days", "Identify one gift God placed in you", "Use that gift in service this month", "Journal what God reveals about your purpose", "Build an identity statement rooted in Scripture"] },
  { id: "healing", title: "Inner Healing Journey", icon: "💜", color: "#DB2777", desc: "Allow God to heal what hurt has hidden.", steps: ["Create a safe space to be honest with God", "Name the wound without minimizing it", "Forgive the person who caused the pain", "Renounce any vows you made in response to pain", "Ask God to fill the empty space with His truth", "Find community to walk with you", "Celebrate each milestone of healing"] },
];

const TESTIMONIES_SEED = [
  { id: 1, name: "Sister Maya", text: "After completing the spiritual assessment, I discovered my gift of intercession. I had always felt called to prayer but never understood why. This platform helped me step into my calling with confidence.", date: "May 2026" },
  { id: 2, name: "Brother David", text: "The Freedom Pathways helped me break a 10-year cycle of fear. I am now leading a men's group at my church. God is faithful!", date: "April 2026" },
];

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message }) {
  return <div className="toast">{message}</div>;
}

// ─── Auth Gate ─────────────────────────────────────────────────────────────────
function AuthGate({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setErr(""); setLoading(true);
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, form.email);
        setResetSent(true);
      } else if (mode === "signup") {
        if (!form.name.trim()) { setErr("Please enter your name."); setLoading(false); return; }
        if (form.password.length < 6) { setErr("Password must be at least 6 characters."); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name.trim() });
        // ✅ Save user to Firestore
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          signupDate: serverTimestamp(),
          lastActive: serverTimestamp(),
          createdAt: new Date().toISOString(),
        });
        onLogin();
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        onLogin();
      }
    } catch (e) {
      setErr(e.message?.replace("Firebase: ", "").replace(/\(auth\/[^)]+\)/, "").trim() || "Something went wrong.");
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
            {mode === "signup" && <input className="auth-input" placeholder="Full Name" value={form.name} onChange={set("name")} />}
            <input className="auth-input" placeholder="Email" type="email" value={form.email} onChange={set("email")} />
            {mode !== "reset" && <input className="auth-input" placeholder="Password" type="password" value={form.password} onChange={set("password")} onKeyDown={e => e.key === "Enter" && submit()} />}
            {err && <p className="auth-err">{err}</p>}
            <button className="auth-submit" onClick={submit} disabled={loading}>
              {loading ? "Please wait…" : mode === "reset" ? "Send Reset Email" : mode === "signup" ? "Create Account" : "Sign In"}
            </button>
            {mode === "login" && <button className="auth-link" onClick={() => setMode("reset")}>Forgot password?</button>}
            {mode === "reset" && <button className="auth-link" onClick={() => setMode("login")}>Back to Sign In</button>}
          </>
        )}
        <p className="auth-scripture">"Loose him, and let him go." — John 11:44</p>
      </div>
    </div>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ user, onNav, showAdmin }) {
  async function logout() {
    await signOut(auth);
  }
  return (
    <nav className="top-nav">
      <div className="nav-brand" onClick={() => onNav("home")} style={{ cursor: "pointer" }}>🔓 Unlocked By God</div>
      <div className="nav-right">
        <span className="nav-user">{user?.displayName?.split(" ")[0] || user?.email}</span>
        {showAdmin && <button className="nav-admin" onClick={() => onNav("admin")}>⚙️ Admin</button>}
        <button className="nav-btn" onClick={logout}>Sign Out</button>
      </div>
    </nav>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, onNav }) {
  const items = [
    { id: "assessment", icon: "📋", label: "Spiritual Assessment", desc: "Discover your God-given gifts" },
    { id: "prayer", icon: "🙏", label: "Prayer Center", desc: "Submit and receive prayer" },
    { id: "testimony", icon: "✍️", label: "Testimony Center", desc: "Share what God has done" },
    { id: "scripture", icon: "📖", label: "Scripture Library", desc: "Prescriptions for your soul" },
    { id: "pathways", icon: "🛤️", label: "Freedom Pathways", desc: "Guided journeys to breakthrough" },
    { id: "chat", icon: "💬", label: "Biblical Guidance", desc: "AI-powered scripture guidance" },
  ];
  return (
    <div className="page">
      <div className="dashboard-hero">
        <h1 className="dashboard-welcome">Welcome{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}! 👋</h1>
        <p className="dashboard-verse">"Loose him, and let him go." — John 11:44</p>
      </div>
      <div className="menu-grid">
        {items.map(i => (
          <div key={i.id} className="menu-card" onClick={() => onNav(i.id)}>
            <div className="menu-icon">{i.icon}</div>
            <div className="menu-label">{i.label}</div>
            <div className="menu-desc">{i.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Assessment ───────────────────────────────────────────────────────────────
function Assessment({ user, onBack, onToast }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  function pick(opt) {
    setAnswers(a => ({ ...a, [QUESTIONS[idx].id]: opt }));
    if (idx < QUESTIONS.length - 1) {
      setTimeout(() => setIdx(i => i + 1), 300);
    } else {
      finish({ ...answers, [QUESTIONS[idx].id]: opt });
    }
  }

  async function finish(finalAnswers) {
    setSaving(true);
    try {
      // ✅ Save assessment to Firestore
      await addDoc(collection(db, "assessments"), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        answers: finalAnswers,
        completedAt: serverTimestamp(),
        completedDate: new Date().toISOString(),
      });
      // Update lastActive
      await setDoc(doc(db, "users", user.uid), { lastActive: serverTimestamp() }, { merge: true });
      onToast("✅ Assessment saved!");
    } catch (e) {
      console.error("Assessment save error:", e);
    }
    setSaving(false);
    setDone(true);
  }

  if (done) {
    const counts = {};
    Object.values(answers).forEach((v, i) => {
      const key = GIFTS[i % GIFTS.length].key;
      counts[key] = (counts[key] || 0) + 1;
    });
    const top = GIFTS.reduce((a, b) => (counts[a.key] || 0) >= (counts[b.key] || 0) ? a : b);
    return (
      <div className="page">
        <div className="section-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2 className="section-title">Your Results</h2>
        </div>
        <div className="result-hero">
          <div className="result-gift">{top.icon}</div>
          <h2 className="result-title">Gift of {top.label}</h2>
          <p className="result-sub">{top.desc}</p>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 14, color: "var(--deep)" }}>Your Full Gift Profile</h3>
          <div className="gift-grid">
            {GIFTS.map(g => (
              <div key={g.key} className="gift-chip" style={{ background: g.key === top.key ? "#FFF9EC" : undefined, border: g.key === top.key ? "2px solid var(--gold)" : "2px solid transparent" }}>
                <div className="gift-chip-icon">{g.icon}</div>
                <div>{g.label}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="btn-primary" onClick={onBack}>Return to Dashboard</button>
      </div>
    );
  }

  const q = QUESTIONS[idx];
  const progress = (idx / QUESTIONS.length) * 100;

  return (
    <div className="page">
      <div className="section-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2 className="section-title">Spiritual Assessment</h2>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 16 }}>Question {idx + 1} of {QUESTIONS.length}</p>
      <div className="question-card">
        <p className="question-text">{q.text}</p>
        <div className="options-list">
          {q.options.map(o => (
            <button key={o} className={`option-btn ${answers[q.id] === o ? "selected" : ""}`} onClick={() => pick(o)}>{o}</button>
          ))}
        </div>
      </div>
      {saving && <p style={{ textAlign: "center", marginTop: 16, color: "var(--muted)" }}>Saving your results…</p>}
    </div>
  );
}

// ─── Prayer Center ────────────────────────────────────────────────────────────
function PrayerCenter({ user, onBack, onToast }) {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ name: user?.displayName || "", request: "" });
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!form.request.trim()) return;
    try {
      await addDoc(collection(db, "prayerRequests"), {
        userId: user.uid,
        name: form.name || user.displayName,
        email: user.email,
        request: form.request.trim(),
        submittedAt: serverTimestamp(),
        date: new Date().toLocaleDateString(),
        answered: false,
      });
      onToast("🙏 Prayer request submitted!");
    } catch (e) { console.error(e); }
    setSubmitted(true);
    setForm({ name: user?.displayName || "", request: "" });
  }

  return (
    <div className="page">
      <div className="section-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2 className="section-title">Prayer Center</h2>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 16, color: "var(--deep)" }}>Submit a Prayer Request</h3>
        {submitted && <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: 12, marginBottom: 16, color: "#166534", fontSize: "0.9rem" }}>✅ Your prayer request has been submitted. We are standing with you!</div>}
        <div className="form-group">
          <label className="form-label">Your Name</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
        </div>
        <div className="form-group">
          <label className="form-label">Prayer Request</label>
          <textarea className="form-textarea" value={form.request} onChange={e => setForm(f => ({ ...f, request: e.target.value }))} placeholder="Share what is on your heart…" rows={4} />
        </div>
        <button className="btn-primary" onClick={submit} disabled={!form.request.trim()}>Submit Prayer Request</button>
      </div>
      <div style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 16, color: "var(--deep)" }}>Community Prayers</h3>
        <div className="prayer-item">
          <div className="prayer-name">Sister Angela</div>
          <div className="prayer-text">Praying for healing in my family and restoration of broken relationships.</div>
          <div className="prayer-date">June 2026</div>
        </div>
        <div className="prayer-item">
          <div className="prayer-name">Brother James</div>
          <div className="prayer-text">God's direction for a career change. I know He has a plan.</div>
          <div className="prayer-date">May 2026</div>
        </div>
      </div>
    </div>
  );
}

// ─── Testimony Center ─────────────────────────────────────────────────────────
function TestimonyCenter({ user, onBack, onToast }) {
  const [form, setForm] = useState({ text: "" });
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!form.text.trim()) return;
    try {
      await addDoc(collection(db, "testimonies"), {
        userId: user.uid,
        name: user.displayName || user.email,
        email: user.email,
        text: form.text.trim(),
        submittedAt: serverTimestamp(),
        status: "pending",
      });
      onToast("🙌 Testimony submitted for review!");
    } catch (e) { console.error(e); }
    setSubmitted(true);
    setForm({ text: "" });
  }

  return (
    <div className="page">
      <div className="section-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2 className="section-title">Testimony Center</h2>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 8, color: "var(--deep)" }}>Share Your Testimony</h3>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: 16 }}>Your story could unlock someone else's breakthrough.</p>
        {submitted && <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: 8, padding: 12, marginBottom: 16, color: "#166534", fontSize: "0.9rem" }}>✅ Thank you! Your testimony will be reviewed and shared with the community.</div>}
        <textarea className="form-textarea" value={form.text} onChange={e => setForm({ text: e.target.value })} placeholder="Tell us what God has done…" rows={5} style={{ marginBottom: 12 }} />
        <button className="btn-primary" onClick={submit} disabled={!form.text.trim()}>Share Testimony</button>
      </div>
      <h3 style={{ margin: "24px 0 14px", color: "var(--deep)" }}>Community Testimonies</h3>
      {TESTIMONIES_SEED.map(t => (
        <div key={t.id} className="testimony-item">
          <div className="testimony-header">
            <span className="testimony-name">{t.name}</span>
            <span className="testimony-badge">✨ Testimony</span>
          </div>
          <p className="testimony-text">{t.text}</p>
          <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: 6 }}>{t.date}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Scripture Library ────────────────────────────────────────────────────────
function ScriptureLibrary({ onBack }) {
  return (
    <div className="page">
      <div className="section-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2 className="section-title">Scripture Library</h2>
      </div>
      {SCRIPTURES.map(s => (
        <div key={s.ref} className="scripture-card">
          <div className="scripture-ref">{s.ref}</div>
          <p className="scripture-text">"{s.text}"</p>
          <span className="scripture-tag">{s.tag}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Freedom Pathways ─────────────────────────────────────────────────────────
function FreedomPathways({ onBack }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="page">
      <div className="section-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2 className="section-title">Freedom Pathways</h2>
      </div>
      {PATHWAYS.map(p => (
        <div key={p.id}>
          <div className="pathway-card" style={{ borderLeftColor: p.color }} onClick={() => setOpen(open === p.id ? null : p.id)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="pathway-title">{p.icon} {p.title}</div>
                <div className="pathway-desc">{p.desc}</div>
              </div>
              <span style={{ color: "var(--gold)", fontSize: "1.2rem" }}>{open === p.id ? "▲" : "▼"}</span>
            </div>
            {open === p.id && (
              <div className="pathway-steps">
                {p.steps.map((s, i) => (
                  <div key={i} className="pathway-step">
                    <div className="step-num">{i + 1}</div>
                    <div>{s}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Biblical Guidance Chat ───────────────────────────────────────────────────
function BiblicalChat({ onBack }) {
  const [messages, setMessages] = useState([{ role: "ai", text: "Peace and grace to you! 🙏 I am here to offer biblical guidance. What is on your heart today?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const premade = ["What does the Bible say about fear?", "How do I find my purpose?", "Scriptures for healing", "How do I pray effectively?"];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(text) {
    const q = text || input.trim();
    if (!q) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: "You are a compassionate biblical counselor for Unlocked By God, a Christian coaching platform. Answer questions using Scripture (KJV preferred). Be warm, encouraging, and spiritually grounded. Keep answers concise (3-5 sentences). Always reference at least one Bible verse.",
          messages: [{ role: "user", content: q }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm here with you. Let us seek God's Word together.";
      setMessages(m => [...m, { role: "ai", text: reply }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "Connection issue. Please try again. Remember: God's Word is always available to you. 🙏" }]);
    }
    setLoading(false);
  }

  return (
    <div className="page">
      <div className="section-header">
        <button className="back-btn" onClick={onBack}>←</button>
        <h2 className="section-title">Biblical Guidance</h2>
      </div>
      <div className="chat-box">
        <div className="chat-messages">
          {messages.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
          {loading && <div className="msg ai">Seeking the Word… 🕊️</div>}
          <div ref={bottomRef} />
        </div>
        <div className="premade-btns">
          {premade.map(p => <button key={p} className="premade-btn" onClick={() => send(p)}>{p}</button>)}
        </div>
        <div className="chat-input-row">
          <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask a biblical question…" />
          <button className="chat-send" onClick={() => send()}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ onBack }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [u, a, p, t] = await Promise.all([
        getDocs(query(collection(db, "users"), orderBy("signupDate", "desc"))),
        getDocs(query(collection(db, "assessments"), orderBy("completedAt", "desc"))),
        getDocs(query(collection(db, "prayerRequests"), orderBy("submittedAt", "desc"))),
        getDocs(query(collection(db, "testimonies"), orderBy("submittedAt", "desc"))),
      ]);
      setUsers(u.docs.map(d => ({ id: d.id, ...d.data() })));
      setAssessments(a.docs.map(d => ({ id: d.id, ...d.data() })));
      setPrayers(p.docs.map(d => ({ id: d.id, ...d.data() })));
      setTestimonies(t.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Admin load error:", e); }
    setLoading(false);
  }

  async function deleteRecord(col, id, setter) {
    if (!confirm("Delete this record?")) return;
    await deleteDoc(doc(db, col, id));
    setter(prev => prev.filter(r => r.id !== id));
  }

  async function markAnswered(id) {
    await updateDoc(doc(db, "prayerRequests", id), { answered: true });
    setPrayers(prev => prev.map(p => p.id === id ? { ...p, answered: true } : p));
  }

  async function approveTestimony(id) {
    await updateDoc(doc(db, "testimonies", id), { status: "approved" });
    setTestimonies(prev => prev.map(t => t.id === id ? { ...t, status: "approved" } : t));
  }

  function exportCSV(data, name) {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => k !== "id");
    const csv = [keys.join(","), ...data.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${name}-${Date.now()}.csv`;
    a.click();
  }

  const fmt = (ts) => {
    if (!ts) return "—";
    if (ts.toDate) return ts.toDate().toLocaleDateString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
    return String(ts).slice(0, 10);
  };

  const filteredUsers = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { id: "users", label: `👤 Users (${users.length})` },
    { id: "assessments", label: `📋 Assessments (${assessments.length})` },
    { id: "prayers", label: `🙏 Prayers (${prayers.length})` },
    { id: "testimonies", label: `✍️ Testimonies (${testimonies.length})` },
  ];

  return (
    <div className="admin-shell">
      <div className="admin-header">
        <div className="admin-title">⚙️ Admin Dashboard — Unlocked By God</div>
        <button className="nav-btn" onClick={onBack} style={{ color: "var(--gold)", borderColor: "var(--gold)" }}>← Back to App</button>
      </div>
      <div className="admin-tabs">
        {tabs.map(t => <button key={t.id} className={`admin-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      <div className="admin-body">
        {loading ? <div className="loading">Loading data…</div> : (
          <>
            {tab === "users" && (
              <>
                <div className="admin-stat-grid">
                  <div className="admin-stat"><div className="admin-stat-num">{users.length}</div><div className="admin-stat-label">Total Users</div></div>
                  <div className="admin-stat"><div className="admin-stat-num">{assessments.length}</div><div className="admin-stat-label">Assessments</div></div>
                  <div className="admin-stat"><div className="admin-stat-num">{prayers.length}</div><div className="admin-stat-label">Prayer Requests</div></div>
                  <div className="admin-stat"><div className="admin-stat-num">{testimonies.length}</div><div className="admin-stat-label">Testimonies</div></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
                  <input className="search-bar" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
                  <button className="csv-btn" onClick={() => exportCSV(users, "users")}>⬇ Export CSV</button>
                </div>
                {filteredUsers.length === 0 ? <div className="empty">No users found yet. Users will appear here after they sign up.</div> : (
                  <table className="admin-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Signed Up</th><th>Last Active</th><th>Action</th></tr></thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td><strong>{u.name || "—"}</strong></td>
                          <td>{u.email}</td>
                          <td>{fmt(u.signupDate)}</td>
                          <td>{fmt(u.lastActive)}</td>
                          <td><button className="del-btn" onClick={() => deleteRecord("users", u.id, setUsers)}>Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {tab === "assessments" && (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <button className="csv-btn" onClick={() => exportCSV(assessments, "assessments")}>⬇ Export CSV</button>
                </div>
                {assessments.length === 0 ? <div className="empty">No assessments completed yet.</div> : (
                  <table className="admin-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Completed</th><th>Answers</th><th>Action</th></tr></thead>
                    <tbody>
                      {assessments.map(a => (
                        <tr key={a.id}>
                          <td><strong>{a.userName || "—"}</strong></td>
                          <td>{a.userEmail}</td>
                          <td>{fmt(a.completedAt)}</td>
                          <td><span className="badge badge-gold">{Object.keys(a.answers || {}).length} answers</span></td>
                          <td><button className="del-btn" onClick={() => deleteRecord("assessments", a.id, setAssessments)}>Delete</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {tab === "prayers" && (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <button className="csv-btn" onClick={() => exportCSV(prayers, "prayers")}>⬇ Export CSV</button>
                </div>
                {prayers.length === 0 ? <div className="empty">No prayer requests submitted yet.</div> : (
                  <table className="admin-table">
                    <thead><tr><th>Name</th><th>Request</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {prayers.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name || "—"}</strong></td>
                          <td style={{ maxWidth: 280 }}>{p.request?.slice(0, 80)}{p.request?.length > 80 ? "…" : ""}</td>
                          <td>{fmt(p.submittedAt)}</td>
                          <td><span className={`badge ${p.answered ? "badge-green" : "badge-gray"}`}>{p.answered ? "Answered" : "Active"}</span></td>
                          <td style={{ display: "flex", gap: 6 }}>
                            {!p.answered && <button className="nav-btn" style={{ fontSize: "0.72rem", padding: "3px 8px", color: "var(--success)", borderColor: "var(--success)" }} onClick={() => markAnswered(p.id)}>✓ Answered</button>}
                            <button className="del-btn" onClick={() => deleteRecord("prayerRequests", p.id, setPrayers)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {tab === "testimonies" && (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <button className="csv-btn" onClick={() => exportCSV(testimonies, "testimonies")}>⬇ Export CSV</button>
                </div>
                {testimonies.length === 0 ? <div className="empty">No testimonies submitted yet.</div> : (
                  <table className="admin-table">
                    <thead><tr><th>Name</th><th>Testimony</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {testimonies.map(t => (
                        <tr key={t.id}>
                          <td><strong>{t.name || "—"}</strong></td>
                          <td style={{ maxWidth: 280 }}>{t.text?.slice(0, 80)}{t.text?.length > 80 ? "…" : ""}</td>
                          <td>{fmt(t.submittedAt)}</td>
                          <td><span className={`badge ${t.status === "approved" ? "badge-green" : "badge-gold"}`}>{t.status === "approved" ? "Approved" : "Pending"}</span></td>
                          <td style={{ display: "flex", gap: 6 }}>
                            {t.status !== "approved" && <button className="nav-btn" style={{ fontSize: "0.72rem", padding: "3px 8px", color: "var(--success)", borderColor: "var(--success)" }} onClick={() => approveTestimony(t.id)}>✓ Approve</button>}
                            <button className="del-btn" onClick={() => deleteRecord("testimonies", t.id, setTestimonies)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage] = useState("home");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  if (!authChecked) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "serif", fontSize: "1.5rem", color: "#1A1A2E" }}>🔓</div>;
  if (!user) return <><style>{styles}</style><AuthGate onLogin={() => setPage("home")} /></>;

  const isAdmin = user.email === ADMIN_EMAIL;

  if (page === "admin" && isAdmin) {
    return <><style>{styles}</style><AdminDashboard onBack={() => setPage("home")} /></>;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app-shell">
        <Nav user={user} onNav={setPage} showAdmin={isAdmin} />
        {page === "home" && <Dashboard user={user} onNav={setPage} />}
        {page === "assessment" && <Assessment user={user} onBack={() => setPage("home")} onToast={showToast} />}
        {page === "prayer" && <PrayerCenter user={user} onBack={() => setPage("home")} onToast={showToast} />}
        {page === "testimony" && <TestimonyCenter user={user} onBack={() => setPage("home")} onToast={showToast} />}
        {page === "scripture" && <ScriptureLibrary onBack={() => setPage("home")} />}
        {page === "pathways" && <FreedomPathways onBack={() => setPage("home")} />}
        {page === "chat" && <BiblicalChat onBack={() => setPage("home")} />}
      </div>
      {toast && <Toast message={toast} />}
    </>
  );
}
