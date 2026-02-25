import { useState, useEffect, useRef } from "react";

// ============================================================
// MOCK DATABASE (localStorage-backed, simulates MongoDB)
// ============================================================
const DB = {
  init() {
    if (!localStorage.getItem("ppm_users")) {
      localStorage.setItem("ppm_users", JSON.stringify([
        { id: "a1", role: "admin", name: "Admin User", email: "admin@college.edu", password: "admin123", avatar: "AU" },
        { id: "f1", role: "faculty", name: "Dr. Sarah Johnson", email: "sarah@college.edu", password: "faculty123", avatar: "SJ", department: "Computer Science" },
        { id: "f2", role: "faculty", name: "Prof. Mark Lee", email: "mark@college.edu", password: "faculty123", avatar: "ML", department: "Software Engineering" },
        { id: "s1", role: "student", name: "Arjun Sharma", email: "arjun@student.edu", password: "student123", avatar: "AS", rollNo: "CS2021001" },
        { id: "s2", role: "student", name: "Priya Patel", email: "priya@student.edu", password: "student123", avatar: "PP", rollNo: "CS2021002" },
        { id: "s3", role: "student", name: "Ravi Kumar", email: "ravi@student.edu", password: "student123", avatar: "RK", rollNo: "CS2021003" },
      ]));
    }
    if (!localStorage.getItem("ppm_projects")) {
      localStorage.setItem("ppm_projects", JSON.stringify([
        {
          id: "p1", studentId: "s1", title: "AI Chatbot System", description: "A conversational AI using NLP to handle customer queries automatically.", tech: "Python, TensorFlow, Flask", status: "evaluated",
          submittedAt: "2024-12-10T10:00:00Z", fileUrl: null, fileName: "chatbot_report.pdf",
          milestones: [{ title: "Proposal", done: true }, { title: "Design", done: true }, { title: "Development", done: true }, { title: "Testing", done: true }],
          evaluation: { marks: 88, feedback: "Excellent implementation of NLP concepts. The UI could be improved.", rubric: { innovation: 18, technical: 22, presentation: 16, documentation: 15, teamwork: 17 }, evaluatedBy: "f1", evaluatedAt: "2024-12-15T09:00:00Z" }
        },
        {
          id: "p2", studentId: "s2", title: "E-Commerce Platform", description: "Full-stack online store with cart, payment integration, and admin panel.", tech: "React, Node.js, MongoDB", status: "submitted",
          submittedAt: "2024-12-12T14:00:00Z", fileUrl: null, fileName: "ecommerce_docs.zip",
          milestones: [{ title: "Proposal", done: true }, { title: "Design", done: true }, { title: "Development", done: true }, { title: "Testing", done: false }],
          evaluation: null
        },
        {
          id: "p3", studentId: "s3", title: "IoT Smart Home Dashboard", description: "Real-time IoT sensor monitoring dashboard with alert notifications.", tech: "React, MQTT, Raspberry Pi", status: "draft",
          submittedAt: null, fileUrl: null, fileName: null,
          milestones: [{ title: "Proposal", done: true }, { title: "Design", done: false }, { title: "Development", done: false }, { title: "Testing", done: false }],
          evaluation: null
        },
      ]));
    }
    if (!localStorage.getItem("ppm_errors")) {
      localStorage.setItem("ppm_errors", JSON.stringify([]));
    }
  },
  getUsers: () => JSON.parse(localStorage.getItem("ppm_users") || "[]"),
  getProjects: () => JSON.parse(localStorage.getItem("ppm_projects") || "[]"),
  getErrors: () => JSON.parse(localStorage.getItem("ppm_errors") || "[]"),
  saveUsers: (u) => localStorage.setItem("ppm_users", JSON.stringify(u)),
  saveProjects: (p) => localStorage.setItem("ppm_projects", JSON.stringify(p)),
  saveErrors: (e) => localStorage.setItem("ppm_errors", JSON.stringify(e)),
  logError: (msg) => {
    const errors = DB.getErrors();
    errors.unshift({ id: Date.now().toString(), message: msg, timestamp: new Date().toISOString(), resolved: false });
    DB.saveErrors(errors);
  },
  resolveError: (id) => {
    const errors = DB.getErrors().map(e => e.id === id ? { ...e, resolved: true } : e);
    DB.saveErrors(errors);
  },
  login: (email, password) => {
    const users = DB.getUsers();
    return users.find(u => u.email === email && u.password === password) || null;
  },
  getUser: (id) => DB.getUsers().find(u => u.id === id),
  upsertProject: (proj) => {
    const projects = DB.getProjects();
    const idx = projects.findIndex(p => p.id === proj.id);
    if (idx >= 0) projects[idx] = proj; else projects.push(proj);
    DB.saveProjects(projects);
  },
};

// ============================================================
// STYLES
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0d1b2a;
    --navy-light: #1b2d45;
    --navy-mid: #162236;
    --gold: #e8b84b;
    --gold-light: #f5d06e;
    --teal: #2dd4bf;
    --red: #ef4444;
    --green: #22c55e;
    --text: #e2e8f0;
    --text-muted: #94a3b8;
    --border: rgba(232,184,75,0.15);
    --card-bg: rgba(27,45,69,0.8);
    --glass: rgba(255,255,255,0.04);
    --shadow: 0 8px 32px rgba(0,0,0,0.4);
    --radius: 16px;
    --radius-sm: 8px;
  }

  body { font-family: 'DM Sans', sans-serif; background: var(--navy); color: var(--text); min-height: 100vh; overflow-x: hidden; }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--navy); }
  ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 3px; }

  /* ANIMATIONS */
  @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes shimmer { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
  @keyframes pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
  @keyframes slideIn { from { transform:translateX(-100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
  @keyframes slideDown { from { transform:translateY(-100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
  @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-18px); } }
  @keyframes rotateSlow { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes particle { 0% { transform:translateY(0) translateX(0) scale(1); opacity:0.8; } 100% { transform:translateY(-120px) translateX(40px) scale(0); opacity:0; } }
  @keyframes typewriter { from { width:0; } to { width:100%; } }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
  @keyframes gradientShift { 0% { background-position:0% 50%; } 50% { background-position:100% 50%; } 100% { background-position:0% 50%; } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
  @keyframes ripple { 0% { transform:scale(0); opacity:1; } 100% { transform:scale(4); opacity:0; } }

  .fade-up { animation: fadeUp 0.6s ease forwards; }
  .fade-up-2 { animation: fadeUp 0.6s 0.12s ease both; }
  .fade-up-3 { animation: fadeUp 0.6s 0.24s ease both; }
  .fade-up-4 { animation: fadeUp 0.6s 0.36s ease both; }

  /* ── NAVBAR ── */
  .landing-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 56px; height: 72px;
    background: rgba(13,27,42,0.6); backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(232,184,75,0.1);
    animation: slideDown 0.5s ease;
    transition: background 0.3s;
  }
  .landing-nav.scrolled { background: rgba(13,27,42,0.95); box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
  .nav-brand { font-family: 'Playfair Display', serif; font-size: 1.35rem; font-weight: 900; color: var(--gold); cursor: pointer; letter-spacing: -0.02em; }
  .nav-brand span { color: var(--teal); }
  .nav-links { display: flex; align-items: center; gap: 8px; }
  .nav-link { padding: 8px 18px; color: var(--text-muted); font-size: 0.88rem; font-weight: 500; cursor: pointer; border-radius: 8px; transition: all 0.2s; border: 1px solid transparent; }
  .nav-link:hover { color: var(--text); background: var(--glass); }
  .nav-btn-login { padding: 9px 22px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--gold); font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .nav-btn-login:hover { background: rgba(232,184,75,0.1); border-color: var(--gold); }
  .nav-btn-signup { padding: 9px 22px; background: linear-gradient(135deg, var(--gold), var(--gold-light)); border: none; border-radius: 8px; color: var(--navy); font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .nav-btn-signup:hover { box-shadow: 0 4px 20px rgba(232,184,75,0.45); transform: translateY(-1px); }

  /* ── HERO SECTION ── */
  .hero-section {
    min-height: 100vh; position: relative; display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .hero-bg {
    position: absolute; inset: 0; z-index: 0;
    background:
      linear-gradient(180deg, rgba(13,27,42,0.3) 0%, rgba(13,27,42,0.7) 60%, rgba(13,27,42,1) 100%),
      url('https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1800&q=80') center/cover no-repeat;
  }
  .hero-bg::before {
    content:''; position:absolute; inset:0;
    background: radial-gradient(ellipse at 20% 40%, rgba(232,184,75,0.12) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 60%, rgba(45,212,191,0.08) 0%, transparent 55%);
  }
  .hero-particles { position:absolute; inset:0; z-index:1; pointer-events:none; }
  .particle {
    position:absolute; width:4px; height:4px; border-radius:50%;
    background:var(--gold); animation: particle 4s ease-out infinite;
  }
  .hero-content { position:relative; z-index:2; text-align:center; max-width:860px; padding:0 24px; margin-top:72px; }
  .hero-eyebrow {
    display:inline-flex; align-items:center; gap:8px; padding:7px 18px;
    background:rgba(232,184,75,0.1); border:1px solid rgba(232,184,75,0.25); border-radius:30px;
    font-size:0.78rem; font-weight:700; color:var(--gold); text-transform:uppercase; letter-spacing:0.12em;
    margin-bottom:28px;
  }
  .hero-eyebrow-dot { width:6px; height:6px; background:var(--gold); border-radius:50%; animation:pulse 2s infinite; }
  .hero-title {
    font-family:'Playfair Display', serif; font-size:clamp(2.8rem, 6vw, 5rem);
    font-weight:900; line-height:1.08; color:var(--text); margin-bottom:24px; letter-spacing:-0.02em;
  }
  .hero-title .gold { color:var(--gold); }
  .hero-title .italic { font-style:italic; color:var(--teal); }
  .hero-sub { font-size:1.1rem; color:var(--text-muted); line-height:1.8; max-width:580px; margin:0 auto 44px; }
  .hero-cta { display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }
  .btn-hero-primary {
    padding:16px 40px; background:linear-gradient(135deg, var(--gold), var(--gold-light));
    border:none; border-radius:10px; color:var(--navy); font-family:'DM Sans',sans-serif;
    font-size:1rem; font-weight:700; cursor:pointer; transition:all 0.25s; letter-spacing:0.02em;
    position:relative; overflow:hidden;
  }
  .btn-hero-primary:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(232,184,75,0.45); }
  .btn-hero-secondary {
    padding:16px 40px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15);
    border-radius:10px; color:var(--text); font-family:'DM Sans',sans-serif;
    font-size:1rem; font-weight:600; cursor:pointer; transition:all 0.25s; backdrop-filter:blur(8px);
  }
  .btn-hero-secondary:hover { background:rgba(255,255,255,0.1); border-color:var(--gold); color:var(--gold); }
  .hero-scroll { position:absolute; bottom:36px; left:50%; transform:translateX(-50%); z-index:2; display:flex; flex-direction:column; align-items:center; gap:8px; color:var(--text-muted); font-size:0.75rem; animation:float 2.5s ease-in-out infinite; }
  .scroll-line { width:1px; height:40px; background:linear-gradient(to bottom, var(--gold), transparent); }

  /* ── FEATURES SECTION ── */
  .features-section { padding:100px 56px; position:relative; }
  .features-section::before { content:''; position:absolute; top:0; left:0; right:0; height:1px; background:linear-gradient(90deg, transparent, var(--gold), transparent); }
  .section-label { font-size:0.75rem; font-weight:700; color:var(--gold); text-transform:uppercase; letter-spacing:0.15em; margin-bottom:12px; }
  .section-title { font-family:'Playfair Display',serif; font-size:clamp(1.8rem,3.5vw,2.8rem); font-weight:900; color:var(--text); margin-bottom:16px; }
  .section-sub { color:var(--text-muted); font-size:0.95rem; max-width:500px; line-height:1.7; margin-bottom:60px; }
  .features-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:24px; }
  .feature-card {
    padding:32px; background:var(--card-bg); border:1px solid var(--border); border-radius:var(--radius);
    backdrop-filter:blur(10px); transition:all 0.3s; position:relative; overflow:hidden; cursor:default;
  }
  .feature-card:hover { transform:translateY(-4px); border-color:rgba(232,184,75,0.35); box-shadow:0 20px 40px rgba(0,0,0,0.3); }
  .feature-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:linear-gradient(90deg, var(--gold), var(--teal)); transform:scaleX(0); transition:transform 0.3s; transform-origin:left; }
  .feature-card:hover::before { transform:scaleX(1); }
  .feature-icon { font-size:2.2rem; margin-bottom:20px; display:block; }
  .feature-title { font-family:'Playfair Display',serif; font-size:1.15rem; font-weight:700; color:var(--text); margin-bottom:10px; }
  .feature-desc { color:var(--text-muted); font-size:0.875rem; line-height:1.7; }

  /* ── STATS BANNER ── */
  .stats-banner { padding:60px 56px; background:linear-gradient(135deg, rgba(232,184,75,0.06), rgba(45,212,191,0.04)); border-top:1px solid var(--border); border-bottom:1px solid var(--border); }
  .stats-banner-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:40px; text-align:center; }
  .banner-stat-value { font-family:'Playfair Display',serif; font-size:3rem; font-weight:900; color:var(--gold); line-height:1; }
  .banner-stat-label { color:var(--text-muted); font-size:0.82rem; text-transform:uppercase; letter-spacing:0.1em; margin-top:8px; }

  /* ── ROLE CARDS ── */
  .roles-section { padding:100px 56px; }
  .roles-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:28px; margin-top:60px; }
  .role-card {
    padding:40px 32px; border-radius:var(--radius); border:1px solid var(--border);
    background:var(--card-bg); text-align:center; transition:all 0.3s; cursor:pointer; position:relative; overflow:hidden;
  }
  .role-card::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg, rgba(232,184,75,0.05), transparent); opacity:0; transition:opacity 0.3s; }
  .role-card:hover { transform:translateY(-6px); box-shadow:0 24px 48px rgba(0,0,0,0.35); border-color:rgba(232,184,75,0.3); }
  .role-card:hover::after { opacity:1; }
  .role-card-icon { font-size:3rem; margin-bottom:20px; display:block; }
  .role-card-name { font-family:'Playfair Display',serif; font-size:1.3rem; font-weight:900; color:var(--text); margin-bottom:12px; }
  .role-card-desc { color:var(--text-muted); font-size:0.875rem; line-height:1.7; }
  .role-card-cta { margin-top:24px; padding:10px 24px; background:transparent; border:1px solid var(--border); border-radius:8px; color:var(--gold); font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
  .role-card:hover .role-card-cta { background:rgba(232,184,75,0.12); border-color:var(--gold); }

  /* ── AUTH MODAL ── */
  .auth-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:500; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(6px); animation:fadeIn 0.2s ease; }
  .auth-modal { background:var(--navy-light); border:1px solid var(--border); border-radius:24px; width:100%; max-width:520px; overflow:hidden; animation:scaleIn 0.3s ease; position:relative; }
  .auth-modal-header { padding:36px 40px 0; }
  .auth-modal-tabs { display:flex; background:rgba(255,255,255,0.04); border-radius:10px; padding:4px; margin-bottom:32px; }
  .auth-tab { flex:1; padding:10px; text-align:center; border:none; background:transparent; color:var(--text-muted); font-family:'DM Sans',sans-serif; font-size:0.88rem; font-weight:600; cursor:pointer; border-radius:8px; transition:all 0.2s; }
  .auth-tab.active { background:linear-gradient(135deg, var(--gold), var(--gold-light)); color:var(--navy); }
  .auth-modal-body { padding:0 40px 36px; }
  .auth-close { position:absolute; top:16px; right:20px; background:none; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer; padding:4px 8px; border-radius:6px; transition:all 0.2s; line-height:1; }
  .auth-close:hover { color:var(--text); background:var(--glass); }
  .auth-title { font-family:'Playfair Display',serif; font-size:1.6rem; font-weight:900; color:var(--text); margin-bottom:6px; }
  .auth-subtitle { color:var(--text-muted); font-size:0.85rem; margin-bottom:28px; }
  .role-tabs { display: flex; gap: 8px; margin-bottom: 24px; }
  .role-tab {
    flex: 1; padding: 9px; border: 1px solid var(--border); background: transparent;
    color: var(--text-muted); border-radius: var(--radius-sm); cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 0.82rem; font-weight: 500; transition: all 0.2s;
  }
  .role-tab.active { background: var(--gold); color: var(--navy); border-color: var(--gold); font-weight: 600; }
  .role-tab:hover:not(.active) { border-color: var(--gold); color: var(--gold); }
  /* SHARED FORM STYLES */
  .form-label { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; display: block; }
  .form-input {
    width: 100%; padding: 13px 16px; background: rgba(255,255,255,0.05);
    border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text);
    font-family: 'DM Sans', sans-serif; font-size: 0.92rem; outline: none; transition: all 0.2s; margin-bottom: 16px;
  }
  .form-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(232,184,75,0.12); }
  .form-input::placeholder { color: var(--text-muted); }
  .btn-primary {
    width: 100%; padding: 14px; background: linear-gradient(135deg, var(--gold), var(--gold-light));
    border: none; border-radius: var(--radius-sm); color: var(--navy); font-family: 'DM Sans', sans-serif;
    font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; letter-spacing: 0.03em; margin-top: 4px;
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(232,184,75,0.4); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .error-msg { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; padding: 11px 15px; border-radius: var(--radius-sm); margin-bottom: 14px; font-size: 0.875rem; }
  .hint-box { margin-top: 20px; padding: 14px 16px; background: rgba(232,184,75,0.07); border-radius: var(--radius-sm); border: 1px dashed rgba(232,184,75,0.2); }
  .hint-box p { font-size: 0.76rem; color: var(--text-muted); margin-bottom: 3px; }

  /* FOOTER */
  .landing-footer { padding:48px 56px; border-top:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .footer-brand { font-family:'Playfair Display',serif; font-size:1.1rem; font-weight:900; color:var(--gold); }
  .footer-copy { color:var(--text-muted); font-size:0.8rem; }

  @media (max-width:900px) {
    .landing-nav { padding:0 24px; }
    .features-section, .roles-section, .stats-banner { padding-left:24px; padding-right:24px; }
    .roles-grid { grid-template-columns:1fr; }
    .stats-banner-grid { grid-template-columns:repeat(2,1fr); gap:24px; }
    .auth-modal-body, .auth-modal-header { padding-left:24px; padding-right:24px; }
  }

  /* APP SHELL */
  .app-shell { display: flex; min-height: 100vh; }
  .sidebar {
    width: 260px; min-height: 100vh; background: var(--navy-mid);
    border-right: 1px solid var(--border); display: flex; flex-direction: column;
    position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
    animation: slideIn 0.4s ease;
  }
  .sidebar-logo { padding: 28px 24px 20px; border-bottom: 1px solid var(--border); }
  .sidebar-logo-text { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 900; color: var(--gold); }
  .sidebar-logo-sub { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
  .sidebar-nav { flex: 1; padding: 20px 12px; overflow-y: auto; }
  .nav-section-label { font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; padding: 0 12px; margin-bottom: 8px; margin-top: 20px; }
  .nav-item {
    display: flex; align-items: center; gap: 12px; padding: 11px 14px;
    border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s;
    color: var(--text-muted); font-size: 0.9rem; font-weight: 500; margin-bottom: 2px; border: 1px solid transparent;
  }
  .nav-item:hover { background: var(--glass); color: var(--text); }
  .nav-item.active { background: linear-gradient(135deg, rgba(232,184,75,0.18), rgba(232,184,75,0.08)); color: var(--gold); border-color: rgba(232,184,75,0.2); }
  .nav-icon { font-size: 1.1rem; width: 20px; text-align: center; }
  .sidebar-user { padding: 20px 16px; border-top: 1px solid var(--border); }
  .user-card { display: flex; align-items: center; gap: 12px; }
  .user-avatar {
    width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--gold), var(--teal));
    display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; color: var(--navy); flex-shrink: 0;
  }
  .user-name { font-size: 0.9rem; font-weight: 600; color: var(--text); }
  .user-role { font-size: 0.72rem; color: var(--text-muted); text-transform: capitalize; }
  .logout-btn { margin-top: 10px; width: 100%; padding: 8px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: var(--radius-sm); color: #fca5a5; font-size: 0.82rem; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .logout-btn:hover { background: rgba(239,68,68,0.2); }

  /* MAIN CONTENT */
  .main-content { margin-left: 260px; flex: 1; padding: 36px 40px; min-height: 100vh; background: var(--navy); }
  .page-header { margin-bottom: 32px; }
  .page-title { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 900; color: var(--text); }
  .page-subtitle { color: var(--text-muted); margin-top: 6px; font-size: 0.95rem; }

  /* CARDS & GRID */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
  .stat-card {
    padding: 24px; background: var(--card-bg); border: 1px solid var(--border);
    border-radius: var(--radius); backdrop-filter: blur(10px); position: relative; overflow: hidden; transition: transform 0.2s;
  }
  .stat-card:hover { transform: translateY(-2px); }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), var(--teal)); }
  .stat-value { font-family: 'Playfair Display', serif; font-size: 2.4rem; font-weight: 900; color: var(--gold); }
  .stat-label { color: var(--text-muted); font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 4px; }
  .stat-icon { position: absolute; right: 20px; top: 20px; font-size: 2rem; opacity: 0.15; }

  .card { background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; backdrop-filter: blur(10px); margin-bottom: 24px; }
  .card-title { font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; color: var(--text); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }

  /* BADGES */
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
  .badge-draft { background: rgba(148,163,184,0.15); color: var(--text-muted); border: 1px solid rgba(148,163,184,0.2); }
  .badge-submitted { background: rgba(45,212,191,0.15); color: var(--teal); border: 1px solid rgba(45,212,191,0.2); }
  .badge-evaluated { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
  .badge-student { background: rgba(96,165,250,0.15); color: #93c5fd; border: 1px solid rgba(96,165,250,0.2); }
  .badge-faculty { background: rgba(167,139,250,0.15); color: #c4b5fd; border: 1px solid rgba(167,139,250,0.2); }
  .badge-admin { background: rgba(232,184,75,0.15); color: var(--gold); border: 1px solid rgba(232,184,75,0.2); }

  /* TABLES */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { border-bottom: 1px solid var(--border); }
  th { padding: 12px 16px; text-align: left; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
  td { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.9rem; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--glass); }

  /* BUTTONS */
  .btn { padding: 9px 18px; border-radius: var(--radius-sm); cursor: pointer; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; border: 1px solid transparent; display: inline-flex; align-items: center; gap: 6px; }
  .btn-gold { background: linear-gradient(135deg, var(--gold), var(--gold-light)); color: var(--navy); }
  .btn-gold:hover { box-shadow: 0 4px 16px rgba(232,184,75,0.4); transform: translateY(-1px); }
  .btn-outline { background: transparent; border-color: var(--border); color: var(--text-muted); }
  .btn-outline:hover { border-color: var(--gold); color: var(--gold); }
  .btn-teal { background: rgba(45,212,191,0.15); border-color: rgba(45,212,191,0.3); color: var(--teal); }
  .btn-teal:hover { background: rgba(45,212,191,0.25); }
  .btn-danger { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #fca5a5; }
  .btn-danger:hover { background: rgba(239,68,68,0.25); }
  .btn-sm { padding: 6px 12px; font-size: 0.78rem; }

  /* MODAL */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px); }
  .modal { background: var(--navy-light); border: 1px solid var(--border); border-radius: 20px; padding: 36px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; animation: fadeUp 0.3s ease; }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 900; color: var(--gold); margin-bottom: 24px; }
  .modal-footer { display: flex; gap: 12px; justify-content: flex-end; margin-top: 28px; }

  /* FORM */
  .form-group { margin-bottom: 20px; }
  .select-input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.95rem; outline: none; appearance: none; }
  .select-input:focus { border-color: var(--gold); }
  .select-input option { background: var(--navy-light); }
  .textarea-input { width: 100%; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; resize: vertical; min-height: 100px; }
  .textarea-input:focus { border-color: var(--gold); }

  /* MILESTONE */
  .milestone-bar { display: flex; gap: 0; margin-top: 12px; }
  .milestone-step { flex: 1; text-align: center; position: relative; }
  .milestone-dot { width: 24px; height: 24px; border-radius: 50%; margin: 0 auto 6px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; position: relative; z-index: 1; }
  .milestone-dot.done { background: var(--green); color: white; }
  .milestone-dot.pending { background: var(--border); color: var(--text-muted); border: 2px solid var(--border); }
  .milestone-step::before { content: ''; position: absolute; top: 11px; left: 50%; right: -50%; height: 2px; background: var(--border); z-index: 0; }
  .milestone-step:last-child::before { display: none; }
  .milestone-step.done::before { background: var(--green); }
  .milestone-label { font-size: 0.68rem; color: var(--text-muted); }

  /* RUBRIC */
  .rubric-item { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .rubric-label { width: 130px; font-size: 0.85rem; color: var(--text-muted); flex-shrink: 0; }
  .rubric-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
  .rubric-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, var(--gold), var(--teal)); }
  .rubric-score { width: 40px; text-align: right; font-size: 0.85rem; font-weight: 600; color: var(--gold); }
  .rubric-input-wrap { width: 60px; }
  .rubric-input { width: 60px; padding: 6px 8px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 6px; color: var(--text); text-align: center; font-size: 0.85rem; font-family: 'DM Sans', sans-serif; outline: none; }
  .rubric-input:focus { border-color: var(--gold); }

  /* SCORE RING */
  .score-ring { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: conic-gradient(var(--gold) 0deg, rgba(255,255,255,0.06) 0deg); font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 900; color: var(--gold); border: 3px solid rgba(232,184,75,0.2); }

  /* SEARCH */
  .search-input { padding: 10px 16px 10px 40px; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none; transition: all 0.2s; width: 260px; }
  .search-input:focus { border-color: var(--gold); width: 300px; }
  .search-wrap { position: relative; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem; }

  /* ALERT */
  .alert { padding: 16px 20px; border-radius: var(--radius-sm); margin-bottom: 16px; display: flex; align-items: flex-start; gap: 12px; }
  .alert-success { background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25); color: #4ade80; }
  .alert-error { background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; }
  .alert-warn { background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.25); color: #fcd34d; }

  /* MISC */
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-3 { gap: 12px; }
  .gap-2 { gap: 8px; }
  .mt-2 { margin-top: 8px; }
  .mt-4 { margin-top: 16px; }
  .text-muted { color: var(--text-muted); font-size: 0.85rem; }
  .text-gold { color: var(--gold); }
  .text-teal { color: var(--teal); }
  .font-bold { font-weight: 700; }
  .hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
  .empty-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.4; }
  .chip { display: inline-block; padding: 3px 10px; background: rgba(255,255,255,0.06); border-radius: 20px; font-size: 0.75rem; color: var(--text-muted); margin: 3px; }
  .error-resolved { opacity: 0.5; text-decoration: line-through; }

  @media (max-width: 900px) {
    .login-grid { grid-template-columns: 1fr; }
    .login-hero { display: none; }
    .sidebar { width: 220px; }
    .main-content { margin-left: 220px; padding: 24px; }
    .two-col { grid-template-columns: 1fr; }
  }
`;

// ============================================================
// HELPERS
// ============================================================
const getBadge = (status) => {
  if (status === "draft") return <span className="badge badge-draft">⬜ Draft</span>;
  if (status === "submitted") return <span className="badge badge-submitted">✅ Submitted</span>;
  if (status === "evaluated") return <span className="badge badge-evaluated">⭐ Evaluated</span>;
  return null;
};

const getRoleBadge = (role) => {
  if (role === "student") return <span className="badge badge-student">🎓 Student</span>;
  if (role === "faculty") return <span className="badge badge-faculty">📚 Faculty</span>;
  if (role === "admin") return <span className="badge badge-admin">⚙ Admin</span>;
  return null;
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ============================================================
// COMPONENTS
// ============================================================
function StyleInjector() {
  useEffect(() => {
    const tag = document.createElement("style");
    tag.innerHTML = styles;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);
  return null;
}

// ============================================================
// AUTH MODAL
// ============================================================
function AuthModal({ defaultTab = "login", onLogin, onClose }) {
  const [tab, setTab] = useState(defaultTab);
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hints = {
    student: ["arjun@student.edu", "priya@student.edu"],
    faculty: ["sarah@college.edu", "mark@college.edu"],
    admin: ["admin@college.edu"],
  };

  const handleLogin = () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    const user = DB.login(email, password);
    if (!user) { setError("Invalid credentials. Please try again."); return; }
    if (user.role !== role) { setError(`This account is not a ${role}.`); return; }
    onLogin(user);
  };

  const handleSignup = () => {
    if (!name || !email || !password) { setError("Please fill all required fields."); return; }
    const existing = DB.getUsers().find(u => u.email === email);
    if (existing) { setError("Email already registered."); return; }
    const newUser = {
      id: "u" + Date.now(), role, name, email, password,
      avatar: name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      rollNo: role === "student" ? rollNo : undefined,
    };
    DB.saveUsers([...DB.getUsers(), newUser]);
    setSuccess("Account created! You can now log in.");
    setTab("login"); setName(""); setRollNo(""); setError("");
  };

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>×</button>
        <div className="auth-modal-header">
          <div className="auth-modal-tabs">
            <button className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); setSuccess(""); }}>Sign In</button>
            <button className={`auth-tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setError(""); setSuccess(""); }}>Sign Up</button>
          </div>
        </div>
        <div className="auth-modal-body">
          {tab === "login" ? (
            <>
              <div className="auth-title">Welcome back</div>
              <div className="auth-subtitle">Sign in to your account to continue</div>
              <div className="role-tabs">
                {["student", "faculty", "admin"].map(r => (
                  <button key={r} className={`role-tab ${role === r ? "active" : ""}`} onClick={() => { setRole(r); setEmail(""); setPassword(""); setError(""); }}>
                    {r === "student" ? "🎓" : r === "faculty" ? "📚" : "⚙"} {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              {error && <div className="error-msg">⚠ {error}</div>}
              {success && <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80", padding: "11px 15px", borderRadius: "var(--radius-sm)", marginBottom: 14, fontSize: "0.875rem" }}>✅ {success}</div>}
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder={`${role}@institution.edu`} value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
              <button className="btn-primary" onClick={handleLogin}>Sign In →</button>
              <div className="hint-box">
                <p style={{ fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 }}>Demo · password: <strong style={{ color: "var(--gold)" }}>{role === "admin" ? "admin123" : role === "faculty" ? "faculty123" : "student123"}</strong></p>
                {hints[role].map(h => <p key={h}>• {h}</p>)}
              </div>
            </>
          ) : (
            <>
              <div className="auth-title">Create account</div>
              <div className="auth-subtitle">Join the platform as a student today</div>
              <div className="role-tabs" style={{ marginBottom: 20 }}>
                {["student", "faculty"].map(r => (
                  <button key={r} className={`role-tab ${role === r ? "active" : ""}`} onClick={() => setRole(r)}>
                    {r === "student" ? "🎓" : "📚"} {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
              {error && <div className="error-msg">⚠ {error}</div>}
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="e.g. Arjun Sharma" value={name} onChange={e => setName(e.target.value)} />
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" placeholder="you@institution.edu" value={email} onChange={e => setEmail(e.target.value)} />
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} />
              {role === "student" && (<><label className="form-label">Roll Number</label><input className="form-input" placeholder="e.g. CS2024010" value={rollNo} onChange={e => setRollNo(e.target.value)} /></>)}
              <button className="btn-primary" onClick={handleSignup}>Create Account →</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LANDING PAGE
// ============================================================
function LandingPage({ onLogin }) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openLogin = () => { setAuthTab("login"); setAuthOpen(true); };
  const openSignup = () => { setAuthTab("signup"); setAuthOpen(true); };

  const particles = Array.from({ length: 12 }, (_, i) => ({
    left: `${8 + i * 7.5}%`, top: `${20 + (i % 5) * 14}%`,
    delay: `${i * 0.4}s`, duration: `${3 + (i % 3)}s`,
    opacity: 0.3 + (i % 4) * 0.15,
  }));

  const features = [
    { icon: "🎓", title: "Student Portfolios", desc: "Students showcase their best work with rich project descriptions, tech stacks, and milestone tracking." },
    { icon: "📐", title: "Rubric-Based Evaluation", desc: "Faculty evaluate submissions across Innovation, Technical depth, Presentation, Documentation, and Teamwork." },
    { icon: "📊", title: "Real-Time Results", desc: "Students instantly see their scores, visual breakdowns, and personalized faculty feedback after evaluation." },
    { icon: "⬇", title: "Download & Review", desc: "Faculty can browse, filter, and download all student submissions for offline review and assessment." },
    { icon: "🔧", title: "Admin Control Panel", desc: "Admins monitor platform health, manage all users, resolve errors, and maintain system integrity." },
    { icon: "🔐", title: "Role-Based Access", desc: "Secure authentication with three distinct roles — each with tailored dashboards and permissions." },
  ];

  return (
    <>
      {/* NAVBAR */}
      <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-brand">Portfolio<span>Proof</span></div>
        <div className="nav-links">
          <span className="nav-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Features</span>
          <span className="nav-link" onClick={() => document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" })}>Roles</span>
          <button className="nav-btn-login" onClick={openLogin}>Log In</button>
          <button className="nav-btn-signup" onClick={openSignup}>Sign Up Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-particles">
          {particles.map((p, i) => (
            <div key={i} className="particle" style={{ left: p.left, top: p.top, animationDelay: p.delay, animationDuration: p.duration, opacity: p.opacity }} />
          ))}
        </div>
        <div className="hero-content">
          <div className="hero-eyebrow fade-up">
            <span className="hero-eyebrow-dot" />
            Academic Project Management Platform
          </div>
          <h1 className="hero-title fade-up-2">
            Student Portfolio<br />
            <span className="italic">Website</span>
          </h1>
          <p className="hero-sub fade-up-3">
            A unified platform where students showcase their work, faculty evaluate with precision rubrics, and admins keep everything running smoothly.
          </p>
          <div className="hero-cta fade-up-4">
            <button className="btn-hero-primary" onClick={openSignup}>Get Started Free →</button>
            <button className="btn-hero-secondary" onClick={openLogin}>Sign In to Dashboard</button>
          </div>
        </div>
        <div className="hero-scroll">
          <span>Scroll to explore</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* STATS BANNER */}
      <div className="stats-banner">
        <div className="stats-banner-grid">
          {[["500+", "Students"], ["120+", "Projects Submitted"], ["98%", "Satisfaction Rate"], ["3", "User Roles"]].map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div className="banner-stat-value">{v}</div>
              <div className="banner-stat-label">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="section-label">Platform Features</div>
        <div className="section-title">Everything you need,<br />built in.</div>
        <div className="section-sub">From submission to evaluation, PortfolioProof covers the entire academic project lifecycle.</div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i}>
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ROLES */}
      <section className="roles-section" id="roles">
        <div className="section-label">Who is it for?</div>
        <div className="section-title">Three roles,<br />one platform.</div>
        <div className="roles-grid">
          {[
            { icon: "🎓", name: "Students", desc: "Submit projects, track milestones, and instantly receive marks and feedback from faculty after evaluation.", tab: "signup" },
            { icon: "📚", name: "Faculty", desc: "Review all student submissions, evaluate using structured rubrics, provide feedback, and download project files.", tab: "login" },
            { icon: "⚙", name: "Admins", desc: "Manage users, monitor the full project ecosystem, view error logs, and ensure the platform runs without issues.", tab: "login" },
          ].map(r => (
            <div className="role-card" key={r.name} onClick={() => { setAuthTab(r.tab); setAuthOpen(true); }}>
              <span className="role-card-icon">{r.icon}</span>
              <div className="role-card-name">{r.name}</div>
              <div className="role-card-desc">{r.desc}</div>
              <button className="role-card-cta">{r.tab === "signup" ? "Sign Up →" : "Log In →"}</button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-brand">PortfolioProof</div>
        <div className="footer-copy">© 2025 Academic Portfolio Platform. FSAD-PS39.</div>
      </footer>

      {authOpen && <AuthModal defaultTab={authTab} onLogin={(u) => { setAuthOpen(false); onLogin(u); }} onClose={() => setAuthOpen(false)} />}
    </>
  );
}

function Sidebar({ user, page, setPage, onLogout }) {
  const navItems = {
    student: [
      { key: "dashboard", icon: "🏠", label: "Dashboard" },
      { key: "my-projects", icon: "📁", label: "My Projects" },
      { key: "submit", icon: "📤", label: "Submit Project" },
      { key: "results", icon: "📊", label: "Results & Feedback" },
    ],
    faculty: [
      { key: "dashboard", icon: "🏠", label: "Dashboard" },
      { key: "submissions", icon: "📋", label: "All Submissions" },
      { key: "evaluate", icon: "✏", label: "Evaluate Projects" },
    ],
    admin: [
      { key: "dashboard", icon: "🏠", label: "Dashboard" },
      { key: "users", icon: "👥", label: "Manage Users" },
      { key: "projects", icon: "📁", label: "All Projects" },
      { key: "errors", icon: "🔧", label: "Error Logs" },
    ],
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">PortfolioProof</div>
        <div className="sidebar-logo-sub">Academic Platform</div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems[user.role].map(item => (
          <div key={item.key} className={`nav-item ${page === item.key ? "active" : ""}`} onClick={() => setPage(item.key)}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="user-card">
          <div className="user-avatar">{user.avatar}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>⬅ Sign Out</button>
      </div>
    </aside>
  );
}

// ============================================================
// STUDENT PAGES
// ============================================================
function StudentDashboard({ user }) {
  const projects = DB.getProjects().filter(p => p.studentId === user.id);
  const evaluated = projects.filter(p => p.status === "evaluated");
  const submitted = projects.filter(p => p.status === "submitted");
  const avgMarks = evaluated.length ? Math.round(evaluated.reduce((s, p) => s + (p.evaluation?.marks || 0), 0) / evaluated.length) : 0;

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-title">Welcome back, {user.name.split(" ")[0]}! 👋</div>
        <div className="page-subtitle">Here's your academic overview for this semester.</div>
      </div>
      <div className="stats-grid">
        <div className="stat-card fade-up">
          <div className="stat-icon">📁</div>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card fade-up-2">
          <div className="stat-icon">📤</div>
          <div className="stat-value">{submitted.length}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card fade-up-3">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{avgMarks || "—"}</div>
          <div className="stat-label">Avg. Score / 100</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{evaluated.length}</div>
          <div className="stat-label">Evaluated</div>
        </div>
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-title">📋 Recent Projects</div>
          {projects.length === 0 ? <div className="empty-state"><div className="empty-icon">📂</div><p>No projects yet</p></div> :
            projects.slice(0, 4).map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{p.title}</div>
                  <div className="text-muted">{fmtDate(p.submittedAt || p.submittedAt)}</div>
                </div>
                {getBadge(p.status)}
              </div>
            ))
          }
        </div>
        <div className="card">
          <div className="card-title">📊 Performance</div>
          {evaluated.length === 0 ? <div className="empty-state"><div className="empty-icon">📈</div><p>No evaluations yet</p></div> :
            evaluated.map(p => (
              <div key={p.id} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600 }}>{p.title}</span>
                  <span className="text-gold font-bold">{p.evaluation.marks}/100</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${p.evaluation.marks}%`, background: "linear-gradient(90deg, var(--gold), var(--teal))", borderRadius: 4, transition: "width 0.8s ease" }} />
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

function MyProjects({ user }) {
  const projects = DB.getProjects().filter(p => p.studentId === user.id);
  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-title">My Projects 📁</div>
        <div className="page-subtitle">Track and manage all your submitted projects</div>
      </div>
      {projects.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">📂</div><p>No projects yet. Submit your first project!</p></div></div>
      ) : projects.map(p => (
        <div className="card" key={p.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>{p.title}</div>
              <p className="text-muted">{p.description}</p>
            </div>
            {getBadge(p.status)}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {(p.tech || "").split(", ").map(t => <span className="chip" key={t}>{t}</span>)}
          </div>
          <div className="card-title" style={{ fontSize: "0.9rem", marginBottom: 12 }}>Progress Milestones</div>
          <div className="milestone-bar">
            {p.milestones.map((m, i) => (
              <div key={i} className={`milestone-step ${m.done ? "done" : ""}`}>
                <div className={`milestone-dot ${m.done ? "done" : "pending"}`}>{m.done ? "✓" : i + 1}</div>
                <div className="milestone-label">{m.title}</div>
              </div>
            ))}
          </div>
          {p.submittedAt && <div className="text-muted mt-2">Submitted: {fmtDate(p.submittedAt)}</div>}
        </div>
      ))}
    </div>
  );
}

function SubmitProject({ user }) {
  const [form, setForm] = useState({ title: "", description: "", tech: "" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!form.title || !form.description || !form.tech) { setError("Please fill all fields."); return; }
    const proj = {
      id: "p" + Date.now(), studentId: user.id, title: form.title, description: form.description,
      tech: form.tech, status: "submitted", submittedAt: new Date().toISOString(), fileUrl: null, fileName: null,
      milestones: [{ title: "Proposal", done: true }, { title: "Design", done: true }, { title: "Development", done: true }, { title: "Testing", done: false }],
      evaluation: null
    };
    DB.upsertProject(proj);
    setSuccess(true);
    setForm({ title: "", description: "", tech: "" });
    setError("");
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-title">Submit Project 📤</div>
        <div className="page-subtitle">Fill in details to submit your project for evaluation</div>
      </div>
      <div className="card" style={{ maxWidth: 640 }}>
        {success && <div className="alert alert-success">✅ Project submitted successfully! Faculty will review it soon.</div>}
        {error && <div className="alert alert-error">⚠ {error}</div>}
        <div className="form-group">
          <label className="form-label">Project Title *</label>
          <input className="form-input" placeholder="e.g. AI-based Recommendation System" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Description *</label>
          <textarea className="textarea-input" placeholder="Describe your project, its goals, and outcomes..." rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Technologies Used *</label>
          <input className="form-input" placeholder="e.g. React, Node.js, MongoDB" value={form.tech} onChange={e => setForm({ ...form, tech: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Upload File (Demo)</label>
          <div style={{ padding: "24px", border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>📎</div>
            <p>Drag & drop or click to upload (PDF, ZIP, DOCX)</p>
            <p style={{ fontSize: "0.75rem", marginTop: 6 }}>(Demo: file storage simulated)</p>
          </div>
        </div>
        <button className="btn btn-gold" style={{ width: "100%", padding: "14px", fontSize: "1rem" }} onClick={handleSubmit}>
          📤 Submit Project
        </button>
      </div>
    </div>
  );
}

function StudentResults({ user }) {
  const projects = DB.getProjects().filter(p => p.studentId === user.id && p.status === "evaluated");
  const rubricMax = { innovation: 20, technical: 25, presentation: 20, documentation: 20, teamwork: 15 };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-title">Results & Feedback 📊</div>
        <div className="page-subtitle">View marks and feedback from faculty evaluations</div>
      </div>
      {projects.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">⏳</div><p>No evaluations received yet. Submit a project first!</p></div></div>
      ) : projects.map(p => {
        const ev = p.evaluation;
        const fac = DB.getUser(ev.evaluatedBy);
        return (
          <div className="card" key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>{p.title}</div>
                <div className="text-muted mt-2">Evaluated by: <strong style={{ color: "var(--text)" }}>{fac?.name || "Faculty"}</strong> · {fmtDate(ev.evaluatedAt)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="score-ring" style={{ background: `conic-gradient(var(--gold) ${ev.marks * 3.6}deg, rgba(255,255,255,0.06) 0deg)` }}>{ev.marks}</div>
                <div className="text-muted" style={{ fontSize: "0.72rem", marginTop: 4 }}>Out of 100</div>
              </div>
            </div>
            <div className="hr" />
            <div className="card-title" style={{ fontSize: "0.95rem", marginBottom: 16 }}>📐 Rubric Breakdown</div>
            {Object.entries(ev.rubric).map(([k, v]) => (
              <div className="rubric-item" key={k}>
                <div className="rubric-label" style={{ textTransform: "capitalize" }}>{k}</div>
                <div className="rubric-bar"><div className="rubric-fill" style={{ width: `${(v / rubricMax[k]) * 100}%` }} /></div>
                <div className="rubric-score">{v}/{rubricMax[k]}</div>
              </div>
            ))}
            <div className="hr" />
            <div className="card-title" style={{ fontSize: "0.95rem", marginBottom: 10 }}>💬 Faculty Feedback</div>
            <div style={{ padding: "16px 20px", background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)", borderRadius: "var(--radius-sm)", color: "var(--text)", lineHeight: 1.7 }}>
              "{ev.feedback}"
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// FACULTY PAGES
// ============================================================
function FacultyDashboard({ user }) {
  const all = DB.getProjects();
  const submitted = all.filter(p => p.status === "submitted").length;
  const evaluated = all.filter(p => p.status === "evaluated").length;
  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-title">Faculty Dashboard 📚</div>
        <div className="page-subtitle">Welcome, {user.name}. Review pending submissions below.</div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{all.length}</div><div className="stat-label">Total Submissions</div></div>
        <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-value">{submitted}</div><div className="stat-label">Pending Review</div></div>
        <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{evaluated}</div><div className="stat-label">Evaluated</div></div>
      </div>
      <div className="card">
        <div className="card-title">⚡ Quick Summary</div>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
          You have <strong style={{ color: "var(--gold)" }}>{submitted}</strong> project{submitted !== 1 ? "s" : ""} awaiting evaluation.
          Navigate to <strong style={{ color: "var(--teal)" }}>Evaluate Projects</strong> to review them using the rubric system.
        </p>
      </div>
    </div>
  );
}

function AllSubmissions({ user }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const projects = DB.getProjects();
  const users = DB.getUsers();

  const filtered = projects.filter(p => {
    const s = users.find(u => u.id === p.studentId);
    const txt = (p.title + " " + (s?.name || "")).toLowerCase();
    return (filter === "all" || p.status === filter) && txt.includes(search.toLowerCase());
  });

  const downloadSim = (p) => {
    DB.logError(`Download attempted for project "${p.title}" (ID: ${p.id}) — no file attached yet.`);
    alert(`Demo: In production, "${p.fileName || p.title}" would download here.`);
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-title">All Submissions 📋</div>
        <div className="page-subtitle">Browse, search, and download student project submissions</div>
      </div>
      <div className="card">
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by title or student..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select-input" style={{ width: "auto", padding: "10px 16px" }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="evaluated">Evaluated</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Project</th><th>Technologies</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(p => {
                const s = users.find(u => u.id === p.studentId);
                return (
                  <tr key={p.id}>
                    <td><div style={{ fontWeight: 600 }}>{s?.name || "Unknown"}</div><div className="text-muted">{s?.rollNo}</div></td>
                    <td><div style={{ fontWeight: 500, maxWidth: 200 }}>{p.title}</div></td>
                    <td><div style={{ display: "flex", flexWrap: "wrap" }}>{(p.tech || "").split(", ").map(t => <span className="chip" key={t}>{t}</span>)}</div></td>
                    <td>{fmtDate(p.submittedAt)}</td>
                    <td>{getBadge(p.status)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => downloadSim(p)}>⬇ Download</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: "32px" }}>No submissions found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const RUBRIC_MAX = { innovation: 20, technical: 25, presentation: 20, documentation: 20, teamwork: 15 };

function EvaluateProjects({ user }) {
  const [projects, setProjects] = useState(DB.getProjects());
  const [selected, setSelected] = useState(null);
  const [rubric, setRubric] = useState({ innovation: 15, technical: 20, presentation: 15, documentation: 15, teamwork: 12 });
  const [feedback, setFeedback] = useState("");
  const [success, setSuccess] = useState(false);
  const users = DB.getUsers();

  const pending = projects.filter(p => p.status === "submitted");

  const openEval = (p) => {
    setSelected(p);
    setRubric({ innovation: 15, technical: 20, presentation: 15, documentation: 15, teamwork: 12 });
    setFeedback("");
    setSuccess(false);
  };

  const totalMarks = Object.entries(rubric).reduce((s, [k, v]) => s + Math.min(Number(v), RUBRIC_MAX[k]), 0);

  const handleSubmit = () => {
    if (!feedback.trim()) { alert("Please add feedback."); return; }
    const updated = { ...selected, status: "evaluated", evaluation: { marks: totalMarks, feedback, rubric, evaluatedBy: user.id, evaluatedAt: new Date().toISOString() } };
    DB.upsertProject(updated);
    const refreshed = DB.getProjects();
    setProjects(refreshed);
    setSelected(null);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-title">Evaluate Projects ✏</div>
        <div className="page-subtitle">Use the rubric system to evaluate and provide feedback</div>
      </div>
      {success && <div className="alert alert-success">✅ Evaluation submitted successfully!</div>}
      {pending.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">🎉</div><p>All submissions have been evaluated!</p></div></div>
      ) : pending.map(p => {
        const s = users.find(u => u.id === p.studentId);
        return (
          <div className="card" key={p.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}>{p.title}</div>
                <div className="text-muted">By {s?.name} ({s?.rollNo}) · {fmtDate(p.submittedAt)}</div>
                <p className="text-muted mt-2">{p.description}</p>
              </div>
              <button className="btn btn-gold" onClick={() => openEval(p)}>✏ Evaluate</button>
            </div>
          </div>
        );
      })}

      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div className="modal-title">Evaluate: {selected.title}</div>
            <div style={{ marginBottom: 20 }}>
              <p className="text-muted" style={{ marginBottom: 12 }}>Assign marks per rubric category (total: <strong style={{ color: "var(--gold)" }}>{totalMarks}/100</strong>):</p>
              {Object.entries(RUBRIC_MAX).map(([k, max]) => (
                <div className="rubric-item" key={k}>
                  <div className="rubric-label" style={{ textTransform: "capitalize" }}>{k} <span style={{ fontSize: "0.7rem" }}>/{max}</span></div>
                  <div className="rubric-bar"><div className="rubric-fill" style={{ width: `${(Math.min(rubric[k], max) / max) * 100}%`, transition: "width 0.3s" }} /></div>
                  <div className="rubric-input-wrap">
                    <input type="number" min={0} max={max} className="rubric-input" value={rubric[k]} onChange={e => setRubric({ ...rubric, [k]: Math.min(Number(e.target.value), max) })} />
                  </div>
                </div>
              ))}
            </div>
            <div className="hr" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, padding: "12px 16px", background: "rgba(232,184,75,0.08)", borderRadius: "var(--radius-sm)" }}>
              <span style={{ fontWeight: 600 }}>Total Score</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 900, color: "var(--gold)" }}>{totalMarks}/100</span>
            </div>
            <div className="form-group">
              <label className="form-label">Feedback for Student *</label>
              <textarea className="textarea-input" rows={4} placeholder="Write detailed feedback about strengths, improvements, and suggestions..." value={feedback} onChange={e => setFeedback(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleSubmit}>✅ Submit Evaluation</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN PAGES
// ============================================================
function AdminDashboard() {
  const users = DB.getUsers();
  const projects = DB.getProjects();
  const errors = DB.getErrors().filter(e => !e.resolved);
  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-title">Admin Dashboard ⚙</div>
        <div className="page-subtitle">Platform-wide overview and health monitoring</div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{users.length}</div><div className="stat-label">Total Users</div></div>
        <div className="stat-card"><div className="stat-icon">📁</div><div className="stat-value">{projects.length}</div><div className="stat-label">Total Projects</div></div>
        <div className="stat-card"><div className="stat-icon">⭐</div><div className="stat-value">{projects.filter(p => p.status === "evaluated").length}</div><div className="stat-label">Evaluated</div></div>
        <div className="stat-card"><div className="stat-icon">🔴</div><div className="stat-value" style={{ color: errors.length > 0 ? "var(--red)" : "var(--green)" }}>{errors.length}</div><div className="stat-label">Active Errors</div></div>
      </div>
      {errors.length > 0 && (
        <div className="alert alert-warn">⚠ There are {errors.length} unresolved error(s). Check the Error Logs tab.</div>
      )}
      <div className="two-col">
        <div className="card">
          <div className="card-title">👥 Users by Role</div>
          {["student", "faculty", "admin"].map(role => {
            const count = users.filter(u => u.role === role).length;
            return (
              <div key={role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                <div>{getRoleBadge(role)}</div>
                <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--gold)" }}>{count}</span>
              </div>
            );
          })}
        </div>
        <div className="card">
          <div className="card-title">📋 Project Status</div>
          {["draft", "submitted", "evaluated"].map(s => {
            const count = projects.filter(p => p.status === s).length;
            return (
              <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
                {getBadge(s)}
                <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--gold)" }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ManageUsers() {
  const [users, setUsers] = useState(DB.getUsers());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student", rollNo: "", department: "" });
  const [search, setSearch] = useState("");

  const filtered = users.filter(u => (u.name + u.email).toLowerCase().includes(search.toLowerCase()));

  const addUser = () => {
    if (!form.name || !form.email || !form.password) { alert("Fill all required fields."); return; }
    const newUser = { id: "u" + Date.now(), avatar: form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(), ...form };
    const updated = [...users, newUser];
    DB.saveUsers(updated);
    setUsers(updated);
    setShowAdd(false);
    setForm({ name: "", email: "", password: "", role: "student", rollNo: "", department: "" });
  };

  const deleteUser = (id) => {
    if (!window.confirm("Remove this user?")) return;
    const updated = users.filter(u => u.id !== id);
    DB.saveUsers(updated);
    setUsers(updated);
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="page-title">Manage Users 👥</div>
            <div className="page-subtitle">Add, view, and manage platform users</div>
          </div>
          <button className="btn btn-gold" onClick={() => setShowAdd(true)}>+ Add User</button>
        </div>
      </div>
      <div className="card">
        <div style={{ marginBottom: 20 }}>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Details</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div className="user-avatar" style={{ width: 34, height: 34, fontSize: "0.75rem" }}>{u.avatar}</div><span style={{ fontWeight: 600 }}>{u.name}</span></div></td>
                  <td className="text-muted">{u.email}</td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td className="text-muted">{u.rollNo || u.department || "—"}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>🗑 Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-title">Add New User</div>
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-input" placeholder="john@college.edu" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" placeholder="••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div className="form-group">
              <label className="form-label">Role *</label>
              <select className="select-input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {form.role === "student" && <div className="form-group"><label className="form-label">Roll Number</label><input className="form-input" placeholder="CS2021010" value={form.rollNo} onChange={e => setForm({ ...form, rollNo: e.target.value })} /></div>}
            {form.role === "faculty" && <div className="form-group"><label className="form-label">Department</label><input className="form-input" placeholder="Computer Science" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>}
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={addUser}>+ Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminProjects() {
  const projects = DB.getProjects();
  const users = DB.getUsers();
  return (
    <div className="fade-up">
      <div className="page-header">
        <div className="page-title">All Projects 📁</div>
        <div className="page-subtitle">Monitor all project submissions across the platform</div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Student</th><th>Project Title</th><th>Tech Stack</th><th>Submitted</th><th>Status</th><th>Score</th></tr></thead>
            <tbody>
              {projects.map(p => {
                const s = users.find(u => u.id === p.studentId);
                return (
                  <tr key={p.id}>
                    <td><div style={{ fontWeight: 600 }}>{s?.name}</div><div className="text-muted">{s?.rollNo}</div></td>
                    <td style={{ fontWeight: 500, maxWidth: 200 }}>{p.title}</td>
                    <td><div style={{ display: "flex", flexWrap: "wrap" }}>{(p.tech || "").split(", ").slice(0, 2).map(t => <span className="chip" key={t}>{t}</span>)}</div></td>
                    <td className="text-muted">{fmtDate(p.submittedAt)}</td>
                    <td>{getBadge(p.status)}</td>
                    <td style={{ fontWeight: 700, color: p.evaluation ? "var(--gold)" : "var(--text-muted)" }}>{p.evaluation ? `${p.evaluation.marks}/100` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ErrorLogs() {
  const [errors, setErrors] = useState(DB.getErrors());

  const resolve = (id) => {
    DB.resolveError(id);
    setErrors(DB.getErrors());
  };

  const clearAll = () => {
    if (!window.confirm("Clear all resolved errors?")) return;
    DB.saveErrors(DB.getErrors().filter(e => !e.resolved));
    setErrors(DB.getErrors());
  };

  const simulate = () => {
    DB.logError(`Simulated error: Null pointer in SubmissionController at ${new Date().toLocaleTimeString()}`);
    setErrors(DB.getErrors());
  };

  return (
    <div className="fade-up">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div className="page-title">Error Logs 🔧</div>
            <div className="page-subtitle">Monitor and resolve platform errors in real time</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={simulate}>⚡ Simulate Error</button>
            <button className="btn btn-danger btn-sm" onClick={clearAll}>🗑 Clear Resolved</button>
          </div>
        </div>
      </div>
      {errors.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">✅</div><p>No errors logged. Platform is healthy!</p></div></div>
      ) : errors.map(e => (
        <div key={e.id} className="card" style={{ borderLeft: `3px solid ${e.resolved ? "var(--green)" : "var(--red)"}`, opacity: e.resolved ? 0.7 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: "1rem" }}>{e.resolved ? "✅" : "🔴"}</span>
                <span style={{ fontWeight: 600, textDecoration: e.resolved ? "line-through" : "none", color: e.resolved ? "var(--text-muted)" : "var(--text)" }}>{e.message}</span>
              </div>
              <div className="text-muted">{fmtDate(e.timestamp)} · {new Date(e.timestamp).toLocaleTimeString()}</div>
            </div>
            {!e.resolved && (
              <button className="btn btn-teal btn-sm" onClick={() => resolve(e.id)}>✓ Resolve</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => { DB.init(); }, []);

  const handleLogin = (u) => { setUser(u); setPage("dashboard"); };
  const handleLogout = () => { setUser(null); setPage("dashboard"); };

  const renderPage = () => {
    if (user.role === "student") {
      if (page === "dashboard") return <StudentDashboard user={user} />;
      if (page === "my-projects") return <MyProjects user={user} />;
      if (page === "submit") return <SubmitProject user={user} />;
      if (page === "results") return <StudentResults user={user} />;
    }
    if (user.role === "faculty") {
      if (page === "dashboard") return <FacultyDashboard user={user} />;
      if (page === "submissions") return <AllSubmissions user={user} />;
      if (page === "evaluate") return <EvaluateProjects user={user} />;
    }
    if (user.role === "admin") {
      if (page === "dashboard") return <AdminDashboard />;
      if (page === "users") return <ManageUsers />;
      if (page === "projects") return <AdminProjects />;
      if (page === "errors") return <ErrorLogs />;
    }
    return <div>Page not found</div>;
  };

  return (
    <>
      <StyleInjector />
      {!user ? (
        <LandingPage onLogin={handleLogin} />
      ) : (
        <div className="app-shell">
          <Sidebar user={user} page={page} setPage={setPage} onLogout={handleLogout} />
          <main className="main-content">{renderPage()}</main>
        </div>
      )}
    </>
  );
}
