import { useState, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const getLS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const todayStr = () => new Date().toISOString().split("T")[0];
const weekDates = () => {
  const d = new Date(), day = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return Array.from({ length: 7 }, (_, i) => { const dt = new Date(d); dt.setDate(d.getDate() - day + i); return dt.toISOString().split("T")[0]; });
};
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const weekStart = dateStr => {
  const d = new Date(dateStr + "T12:00:00");
  const off = d.getDay() === 0 ? 6 : d.getDay() - 1;
  const mon = new Date(d); mon.setDate(d.getDate() - off);
  return mon.toISOString().split("T")[0];
};
const MONTH_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const monthDates = (y, m) => Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => new Date(y, m, i + 1).toISOString().split("T")[0]);
const fmtDate = s => new Date(s + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);
const pct = (start, cur, target) => {
  if (target === start) return cur >= target ? 100 : 0;
  return Math.round(clamp((cur - start) / (target - start) * 100, 0, 100));
};
const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? String(m % 60).padStart(2, "0") : ""}` : m > 0 ? `${m}min` : "—";
const calcStreak = habits => {
  if (!habits.length) return 0;
  const t = todayStr(); let streak = 0;
  const d = new Date();
  if (!habits.every(h => (h.logs || []).includes(t))) d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const ds = d.toISOString().split("T")[0];
    if (!habits.every(h => (h.logs || []).includes(ds))) break;
    streak++; d.setDate(d.getDate() - 1);
  }
  return streak;
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d0d1a", surface: "#12112a", surface2: "#1a1830", surface3: "#201e38",
  border: "rgba(139,92,246,0.15)", borderMid: "rgba(139,92,246,0.4)",
  accent: "#8b5cf6", accent2: "#6366f1", accentBg: "rgba(139,92,246,0.12)",
  text: "#f1f0ff", muted: "#9391b5", faint: "#524f72",
  green: "#10b981", greenBg: "rgba(16,185,129,0.12)",
  red: "#ef4444", redBg: "rgba(239,68,68,0.12)",
  blue: "#6366f1", blueBg: "rgba(99,102,241,0.12)",
  purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.12)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.12)",
  orange: "#f97316", pink: "#f472b6",
};
const GRAD = "linear-gradient(135deg, #8b5cf6, #6366f1)";
const GLOW = "0 0 24px rgba(139,92,246,0.35)";
const GLOW_SM = "0 0 12px rgba(139,92,246,0.2)";
const TR = "0.18s cubic-bezier(0.4,0,0.2,1)";

const SPACES = {
  "Sport & Santé": { c: C.green,  icon: "⚡" },
  "Business":      { c: C.blue,   icon: "💼" },
  "Etudes et Pro": { c: C.orange, icon: "📚" },
  "Relations":     { c: C.purple, icon: "🤝" },
};
const STATUTS = {
  "Dans les blocs": { c: C.faint,  label: "À planifier" },
  "Pas commencé":   { c: C.faint,  label: "Pas commencé" },
  "En cours":       { c: C.blue,   label: "En cours" },
  "On-track":       { c: C.green,  label: "On track" },
  "On track":       { c: C.green,  label: "On track" },
  "Off-track":      { c: C.amber,  label: "Off track" },
  "Off track":      { c: C.amber,  label: "Off track" },
  "At-risk":        { c: C.orange, label: "At risk" },
  "At risk":        { c: C.orange, label: "At risk" },
  "Partiel":        { c: C.purple, label: "Partiel" },
  "Terminé":        { c: C.green,  label: "Terminé" },
  "Échoué":         { c: C.red,    label: "Échoué" },
  "Echoué":         { c: C.red,    label: "Échoué" },
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const NOTION_GOALS = {
  lt: [
    { id: "n_lt1", titre: "Bâtir une esthétique inspirante et des capacités impressionnantes", statut: "En cours", spaces: ["Sport & Santé"], krs: [] },
    { id: "n_lt2", titre: "Construire ma réalité grâce à une liberté financière", statut: "En cours", spaces: ["Business"], krs: [] },
    { id: "n_lt3", titre: "Un des meilleurs PP de France", statut: "En cours", spaces: ["Etudes et Pro"], krs: [] },
  ],
  annuel: [
    { id: "n_a1", titre: "Prêt pour l'été avec shape et cardio de fou", statut: "En cours", spaces: ["Sport & Santé"], krs: [] },
    { id: "n_a2", titre: "Avoir construit les 2èmes fondations de mon Business", statut: "En cours", spaces: ["Business"], krs: [] },
    { id: "n_a3", titre: "Etre prêt à intégrer un projet club (structure amateur reconnue)", statut: "En cours", spaces: ["Etudes et Pro"], krs: [] },
  ],
  trimestriel: [
    { id: "n_t1", titre: "Sécuriser mes emplois (PP + Coach)", statut: "On-track", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_t2", titre: "Valider le Master", statut: "On-track", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_t3", titre: "Le prime avant juillet", statut: "On-track", spaces: ["Sport & Santé"], krs: [] },
    { id: "n_t4", titre: "Créer et diffuser l'offre Pré-Saison Football", statut: "On-track", spaces: ["Business"], krs: [] },
  ],
  mensuel: [
    { id: "n_m1", titre: "2 rendus + Stats mémoire finies", statut: "On-track", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_m2", titre: "Décision géographique + prospection clubs lancée", statut: "On-track", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_m3", titre: "20 pages mémoire rédigées", statut: "Dans les blocs", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_m4", titre: "Matières du Master validées à 100%", statut: "Dans les blocs", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_m5", titre: "Logement post-22 juin trouvé", statut: "Dans les blocs", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_m6", titre: "Réponse positive d'un club", statut: "Dans les blocs", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_m7", titre: "Club rémunéré signé et confirmé", statut: "Dans les blocs", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_m8", titre: "Déménagement organisé et logistique réglée", statut: "Dans les blocs", spaces: ["Etudes et Pro"], krs: [] },
    { id: "n_m9", titre: "Premier client joueur payant", statut: "Dans les blocs", spaces: ["Business"], krs: [] },
    { id: "n_m10", titre: "Acquisition de 3 joueurs individuel lancée", statut: "Dans les blocs", spaces: ["Business"], krs: [] },
  ],
  hebdo: [
    { id: "n_h1", titre: "Prog Max et Harris", statut: "On track", spaces: [], krs: [], avec: "Solo" },
    { id: "n_h2", titre: "Décision Géographique - Prospection", statut: "On track", spaces: [], krs: [], avec: "Solo" },
    { id: "n_h3", titre: "Finir Prog Annuelle + Etude de cas L.MARIN", statut: "On track", spaces: [], krs: [], avec: "Solo" },
    { id: "n_h4", titre: "4 salles - 2 courses - Surplus moyen entre 5 et 10%", statut: "On track", spaces: [], krs: [], avec: "Solo" },
  ],
};
(function seedGoals() {
  const stored = getLS("lp_goals", null);
  const hasLT = stored && Array.isArray(stored.lt) && stored.lt.length > 0;
  if (!stored || !hasLT) setLS("lp_goals", NOTION_GOALS);
})();

const LEVELS = [
  { id: "lt",          label: "Long Terme",   icon: "👁️", c: C.purple },
  { id: "annuel",      label: "Annuel",       icon: "🌌", c: C.blue },
  { id: "trimestriel", label: "Trimestriel",  icon: "🌍", c: C.green },
  { id: "mensuel",     label: "Mensuel",      icon: "🗻", c: C.amber },
  { id: "hebdo",       label: "Hebdomadaire", icon: "🌁", c: C.orange },
];
const STATUS_OPTIONS_BASE  = ["Dans les blocs","En cours","On-track","Off-track","At-risk","Terminé","Échoué"];
const STATUS_OPTIONS_HEBDO = ["Pas commencé","On track","Off track","At risk","Partiel","Terminé","Echoué"];
const AVEC_OPTIONS = ["Solo","Groupe","Laurine","Hugo","Famille","MHSC"];

const WP_TYPES     = ["DEEP","SHALLOW","COURS","GROUPE"];
const WP_DOMAINES  = ["BUSINESS","MASTER","PRÉPA","STAGE","MÉMOIRE","FORMATIONS PP","PROJET PERSO","PERSO","CLIENT","OPTIMISATION","AUTRE"];
const WP_EFFICIENCE= ["💡","💡💡","💡💡💡","💡💡💡💡","💡💡💡💡💡"];
const WP_TYPE_C    = { DEEP: C.purple, SHALLOW: C.blue, COURS: C.amber, GROUPE: C.green };

const DJ_ENERGY  = ["⚡","⚡⚡","⚡⚡⚡","⚡⚡⚡⚡","⚡⚡⚡⚡⚡"];
const DJ_FOCUS   = ["❖","❖❖","❖❖❖","❖❖❖❖","❖❖❖❖❖"];
const DJ_STRESS  = ["✶","✶✶","✶✶✶","✶✶✶✶","✶✶✶✶✶"];
const DJ_TYPES   = ["Journée classique","Journée libre","Weekend","Voyage","Jour off","Jour spécial"];
const DJ_EMPTY   = () => ({ morning:"",noon:"",evening:"",focus:"",stress:"",type:"Journée classique",remark:"",trucs_faits:"",lotd:"",gratitude:"",reflexions:"" });
const djEntry    = raw => !raw ? DJ_EMPTY() : typeof raw === "string" ? { ...DJ_EMPTY(), reflexions: raw } : { ...DJ_EMPTY(), ...raw };

const QUICK_ADDS = [
  { label: "💼 Business", prefix: "Business — " },
  { label: "📚 Master",   prefix: "Master — " },
  { label: "⚽ Prépa",    prefix: "Prépa — " },
  { label: "🏋️ Sport",   prefix: "Sport — " },
  { label: "🧘 Perso",   prefix: "Perso — " },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function CircularProgress({ value, max, size = 52, strokeWidth = 4, color = C.accent }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const filled = max === 0 ? 0 : clamp(value / max, 0, 1);
  const offset = circ * (1 - filled);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color }}>
        {value}/{max}
      </div>
    </div>
  );
}

const Pill = ({ label, color }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", padding: "3px 10px",
    borderRadius: 999, fontSize: 11, fontWeight: 500, letterSpacing: "0.04em",
    background: color + "20", color, border: `1px solid ${color}35`,
  }}>{label}</span>
);
const StatusPill = ({ statut }) => { const s = STATUTS[statut] || { c: C.muted, label: statut }; return <Pill label={s.label} color={s.c} />; };
const SpacePill  = ({ space })  => { const sp = SPACES[space] || { c: C.muted, icon: "•" }; return <Pill label={`${sp.icon} ${space}`} color={sp.c} />; };

const ProgressBar = ({ value, color, height = 6 }) => (
  <div style={{ height, background: "rgba(139,92,246,0.1)", borderRadius: height }}>
    <div style={{
      height: "100%", width: `${clamp(value, 0, 100)}%`,
      background: color ? `linear-gradient(90deg, ${color}99, ${color})` : GRAD,
      borderRadius: height, transition: "width 0.5s ease",
    }} />
  </div>
);

const Select = ({ value, options, onChange, style }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    background: C.surface2, border: `1px solid ${C.border}`, color: C.text,
    padding: "8px 10px", borderRadius: 10, fontSize: 13, fontFamily: "inherit",
    outline: "none", cursor: "pointer", ...style,
  }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const Input = ({ value, onChange, onKeyDown, placeholder, style, type = "text", autoFocus }) => (
  <input type={type} autoFocus={autoFocus}
    value={value} onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown}
    placeholder={placeholder}
    style={{
      background: C.surface2, border: `1px solid ${C.border}`, color: C.text,
      padding: "10px 14px", borderRadius: 12, fontSize: 14, fontFamily: "inherit",
      outline: "none", width: "100%", boxSizing: "border-box",
      minHeight: 44, transition: TR, ...style,
    }}
  />
);

const Btn = ({ children, onClick, variant = "default", style, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: "10px 18px", borderRadius: 12, fontSize: 13, fontFamily: "inherit",
    fontWeight: 600, transition: TR, border: "none", minHeight: 44,
    opacity: disabled ? 0.5 : 1, cursor: disabled ? "default" : "pointer",
    ...(variant === "accent"
      ? { background: GRAD, color: "#fff", boxShadow: GLOW_SM }
      : variant === "ghost"
      ? { background: "transparent", color: C.accent, border: `1px solid ${C.borderMid}` }
      : { background: C.surface2, color: C.text, border: `1px solid ${C.border}` }),
    ...style,
  }}>{children}</button>
);

const Card = ({ children, style, onClick, className }) => (
  <div onClick={onClick} className={className} style={{
    background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 18,
    padding: 16, ...(onClick ? { cursor: "pointer" } : {}), ...style,
  }}>{children}</div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE HEADER (non-dashboard pages)
// ─────────────────────────────────────────────────────────────────────────────
function PageHeader({ title, onBack, action }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 20,
      background: "rgba(13,13,26,0.95)", backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${C.border}`, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      {onBack && (
        <span onClick={onBack} style={{ cursor: "pointer", color: C.muted, fontSize: 22, lineHeight: 1 }}>←</span>
      )}
      <span style={{ fontSize: 17, fontWeight: 700, color: C.text, flex: 1 }}>{title}</span>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────────────────────────────────────
const BOTTOM_NAV = [
  { id: "dashboard", icon: "🏠", label: "Home" },
  { id: "todo",      icon: "✅", label: "Todo" },
  { id: "habitudes", icon: "🔥", label: "Habitudes" },
  { id: "workperf",  icon: "⏱️", label: "WorkPerf" },
  { id: "daily",     icon: "📓", label: "Daily" },
  { id: "objectifs", icon: "⭐", label: "Objectifs" },
];

function BottomNav({ current, onNav }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 64, background: "rgba(13,13,26,0.96)", backdropFilter: "blur(24px)",
      borderTop: `1px solid ${C.border}`,
      display: "flex", alignItems: "stretch",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {BOTTOM_NAV.map(n => {
        const active = current === n.id;
        return (
          <div key={n.id} onClick={() => onNav(n.id)} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 2,
            cursor: "pointer", position: "relative", transition: TR,
            userSelect: "none",
          }}>
            {active && (
              <div style={{
                position: "absolute", top: 6, width: 20, height: 3,
                background: GRAD, borderRadius: 2,
                boxShadow: GLOW_SM,
              }} />
            )}
            <span style={{ fontSize: 18, lineHeight: 1, marginTop: 10 }}>{n.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: active ? 600 : 400,
              color: active ? C.accent : C.faint,
              letterSpacing: "0.02em",
            }}>{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function HabitChip({ habit, done, onToggle, animating }) {
  return (
    <div onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 16px", borderRadius: 16, marginBottom: 8,
      background: done ? "rgba(16,185,129,0.07)" : C.surface2,
      border: `1px solid ${done ? "rgba(16,185,129,0.25)" : C.border}`,
      cursor: "pointer", transition: TR, minHeight: 56,
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{habit.emoji}</span>
      <span style={{
        flex: 1, fontSize: 15, fontWeight: 500,
        color: done ? C.muted : C.text,
        textDecoration: done ? "line-through" : "none",
        transition: TR,
      }}>{habit.name}</span>
      <div className={animating ? "habit-pop" : ""} style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: done ? "linear-gradient(135deg,#10b981,#059669)" : "transparent",
        border: `2px solid ${done ? "#10b981" : C.borderMid}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: done ? "0 0 12px rgba(16,185,129,0.4)" : "none",
        transition: TR,
      }}>
        {done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1 }}>✓</span>}
      </div>
    </div>
  );
}

// ── MonthCalendar ──
function MonthCalendar() {
  const {todos, getProjectsForCalendar, getMemosForDate} = useTodos();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [showMemos, setShowMemos]     = useState(true);
  const [showWaiting, setShowWaiting] = useState(true);
  const [showProjets, setShowProjets] = useState(true);

  const today = todayStr();
  const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const DAY_LABELS  = ["L","M","M","J","V","S","D"];

  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month+1, 0).getDate();
  const startDow = (firstDay.getDay()+6)%7; // Mon=0

  const pad = n => String(n).padStart(2,"0");
  const dateStr = d => `${year}-${pad(month+1)}-${pad(d)}`;

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };
  const goToday   = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const projetsThisMonth = getProjectsForCalendar(month, year);

  const projBars = projetsThisMonth.map(p => {
    const s = new Date(p.dateDebut+"T12:00:00");
    const e = new Date(p.dateFin+"T12:00:00");
    const startD = s.getFullYear()===year&&s.getMonth()===month ? s.getDate() : 1;
    const endD   = e.getFullYear()===year&&e.getMonth()===month ? e.getDate() : totalDays;
    return {...p, startD, endD};
  });

  const cells = [];
  for(let i=0;i<startDow;i++) cells.push(null);
  for(let d=1;d<=totalDays;d++) cells.push(d);

  return (
    <div style={{background:C.surface2,borderRadius:18,border:`1px solid ${C.border}`,padding:16,marginTop:8}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={prevMonth} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",padding:"4px 8px"}}>‹</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14,fontWeight:700,color:C.text}}>{MONTH_NAMES[month]} {year}</span>
          {(year!==now.getFullYear()||month!==now.getMonth())&&(
            <button onClick={goToday} style={{fontSize:10,color:C.accent,background:C.accentBg,border:`1px solid ${C.accent}44`,borderRadius:999,padding:"2px 8px",fontFamily:"inherit",cursor:"pointer"}}>Aujourd'hui</button>
          )}
        </div>
        <button onClick={nextMonth} style={{background:"none",border:"none",color:C.muted,fontSize:18,cursor:"pointer",padding:"4px 8px"}}>›</button>
      </div>

      {/* Filter toggles */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {[
          [showMemos,    setShowMemos,    "📅 Mémos",   "#6366f1"],
          [showWaiting,  setShowWaiting,  "⏳ Waiting", "#f59e0b"],
          [showProjets,  setShowProjets,  "🔴 Projets", C.red   ],
        ].map(([on,set,label,c])=>(
          <button key={label} onClick={()=>set(v=>!v)} style={{padding:"4px 10px",borderRadius:999,border:`1px solid ${on?c:C.border}`,background:on?c+"22":"transparent",color:on?c:C.muted,fontSize:11,fontFamily:"inherit",cursor:"pointer"}}>{label}</button>
        ))}
      </div>

      {/* Day-of-week header */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
        {DAY_LABELS.map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontSize:10,color:C.faint,padding:"2px 0"}}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d,i)=>{
          if(!d) return <div key={`e${i}`}/>;
          const ds = dateStr(d);
          const isToday = ds===today;
          const memos    = showMemos   ? getMemosForDate(ds) : [];
          const waiting  = showWaiting ? todos.filter(t=>t.gtd==="waiting"&&t.dateAssignee===ds&&!t.done) : [];
          const myProjets= showProjets ? projBars.filter(p=>p.startD<=d&&p.endD>=d) : [];
          const hasItems = memos.length||waiting.length||myProjets.length;

          return (
            <div key={ds} style={{minHeight:36,borderRadius:8,padding:"3px 2px",background:isToday?"rgba(139,92,246,0.15)":hasItems?"rgba(255,255,255,0.03)":"transparent",border:isToday?`1px solid ${C.accent}55`:"1px solid transparent",position:"relative",textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:isToday?700:400,color:isToday?C.accent:C.muted,marginBottom:2}}>{d}</div>
              {myProjets.map(p=>{
                const sc=SPHERES[p.sphere]?.c||C.accent;
                return <div key={p.id} style={{fontSize:8,background:sc+"33",color:sc,borderRadius:3,padding:"1px 3px",marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>;
              })}
              {memos.map(m=>(
                <div key={m.id} style={{fontSize:8,background:"#6366f133",color:"#6366f1",borderRadius:3,padding:"1px 3px",marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>📝</div>
              ))}
              {waiting.map(w=>(
                <div key={w.id} style={{fontSize:8,background:"#f59e0b33",color:"#f59e0b",borderRadius:3,padding:"1px 3px",marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>⏳</div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BiWeeklyPlanning() {
  const { todos } = useTodos();
  const today = todayStr();
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - dow);

  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const getItemsForDay = ds => {
    const d = new Date(ds + "T12:00:00");
    const items = [];
    todos.forEach(t => {
      if (t.done) return;
      if (t.gtd === "projet" && t.dateDebut && t.dateFin) {
        const s = new Date(t.dateDebut + "T12:00:00");
        const e = new Date(t.dateFin + "T12:00:00");
        if (s <= d && e >= d) items.push({ ...t, _type: "projet" });
      } else if (t.dateAssignee === ds) {
        items.push({ ...t, _type: t.gtd === "memo" ? "memo" : "todo" });
      }
    });
    return items;
  };

  const DAY_SHORT = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

  const renderDay = ds => {
    const d = new Date(ds + "T12:00:00");
    const dayNum = d.getDate();
    const dayLabel = DAY_SHORT[(d.getDay() + 6) % 7];
    const isToday = ds === today;
    const items = getItemsForDay(ds);
    return (
      <div key={ds} style={{
        display: "flex", gap: 8, padding: "5px 0",
        borderBottom: `1px solid ${C.border}22`, minHeight: 30,
      }}>
        <div style={{ width: 32, flexShrink: 0, paddingTop: 2 }}>
          <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? C.accent : C.muted, lineHeight: 1.2 }}>{dayNum}</div>
          <div style={{ fontSize: 9, color: C.faint }}>{dayLabel}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, paddingTop: 2 }}>
          {items.length === 0
            ? <span style={{ fontSize: 11, color: C.faint, lineHeight: 1.8 }}>—</span>
            : items.map(item => {
                const col = SPHERES[item.sphere]?.c || (item._type === "memo" ? C.blue : C.accent);
                return (
                  <div key={item.id} style={{
                    fontSize: 11, color: col, background: col + "22",
                    borderLeft: `2px solid ${col}`, borderRadius: 4,
                    padding: "2px 7px", overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{item.name}</div>
                );
              })
          }
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
        📅 Planning 2 semaines
      </div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, color: C.faint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>CETTE SEMAINE</div>
        {days14.slice(0, 7).map(renderDay)}
      </div>
      <div>
        <div style={{ fontSize: 9, color: C.faint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, marginTop: 10 }}>SEMAINE PROCHAINE</div>
        {days14.slice(7).map(renderDay)}
      </div>
    </div>
  );
}

function Dashboard({ onNav }) {
  const t = todayStr();
  const [habits, setHabits]     = useState(() => getLS("lp_habits", []));
  const [sessions, setSessions]  = useState(() => getLS("lp_workperf", []));
  const [todos, setTodos]        = useState(loadTodos);
  const [goals, setGoals]        = useState(() => getLS("lp_goals", NOTION_GOALS));
  const [highlight, setHighlight]= useState(() => getLS("lp_highlight", {}));
  const [editingHL, setEditingHL]= useState(false);
  const [qAction, setQAction]    = useState(null);
  const [animating, setAnimating]= useState(new Set());
  const [wpForm, setWpForm]      = useState({ tache: "", temps: "", type: "DEEP", domaine: "BUSINESS", efficience: "💡💡💡" });
  const [todoText, setTodoText]  = useState("");
  const [objText, setObjText]    = useState("");

  const hlText = highlight[t] || "";
  const saveHL = text => { const u = { ...highlight, [t]: text }; setHighlight(u); setLS("lp_highlight", u); };

  const toggleHabit = id => {
    setAnimating(s => new Set([...s, id]));
    setTimeout(() => setAnimating(s => { const n = new Set(s); n.delete(id); return n; }), 300);
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const logs = h.logs || [];
      return { ...h, logs: logs.includes(t) ? logs.filter(x => x !== t) : [...logs, t] };
    });
    setHabits(updated); setLS("lp_habits", updated);
  };

  const addSession = () => {
    if (!wpForm.tache.trim() || !wpForm.temps) return;
    const s = { id: uid(), tache: wpForm.tache.trim(), date: t, temps: parseInt(wpForm.temps), type: wpForm.type, domaine: wpForm.domaine, efficience: wpForm.efficience };
    const u = [...sessions, s]; setSessions(u); setLS("lp_workperf", u);
    setWpForm(f => ({ ...f, tache: "", temps: "" })); setQAction(null);
  };

  const addTodo = () => {
    if (!todoText.trim()) return;
    const item = { id: uid(), name: todoText.trim(), gtd: "inbox", done: false, createdAt: new Date().toISOString() };
    const u = [...todos, item];
    setTodos(u); setLS("leplan_todos", u); setTodoText(""); setQAction(null);
  };

  const addObj = () => {
    if (!objText.trim()) return;
    const obj = { id: uid(), titre: objText.trim(), statut: "Pas commencé", spaces: [], krs: [], avec: "Solo" };
    const updated = { ...goals, hebdo: [...(goals.hebdo || []), obj] };
    setGoals(updated); setLS("lp_goals", updated); setObjText(""); setQAction(null);
  };

  const doneH = habits.filter(h => (h.logs || []).includes(t)).length;
  const todaySessions = sessions.filter(s => s.date === t);
  const deepToday = todaySessions.filter(s => s.type === "DEEP").reduce((a, s) => a + s.temps, 0);
  const pulseObjs = [
    ...(goals.trimestriel || []).map(o => ({ ...o, _level: "Trimestriel", _c: C.green })),
    ...(goals.mensuel || []).map(o => ({ ...o, _level: "Mensuel", _c: C.amber })),
    ...(goals.hebdo || []).map(o => ({ ...o, _level: "Hebdo", _c: C.orange })),
  ].filter(o => o.statut !== "Terminé" && o.statut !== "Échoué" && o.statut !== "Echoué").slice(0, 3);

  const objPct = obj => {
    const krs = obj.krs || [];
    if (krs.length === 0) {
      const map = { "On-track": 60, "On track": 60, "En cours": 30, "Partiel": 50, "Off-track": 20, "Off track": 20, "At-risk": 10, "At risk": 10, "Terminé": 100 };
      return map[obj.statut] || 5;
    }
    return Math.round(krs.reduce((s, k) => s + pct(k.depart ?? 0, k.actuelle ?? 0, k.cible ?? 0), 0) / krs.length);
  };

  const now = new Date();
  const headerDate = now.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

  const QUICK_BTNS = [
    { key: "session", icon: "⏱", label: "Session" },
    { key: "journal", icon: "✦",  label: "Journal" },
    { key: "todo",    icon: "+",  label: "Todo" },
  ];

  const handleQuick = key => {
    if (key === "journal") { onNav("daily"); return; }
    if (key === "habit") { document.getElementById("dash-habits")?.scrollIntoView({ behavior: "smooth" }); return; }
    setQAction(qAction === key ? null : key);
  };

  return (
    <div>
      {/* STICKY HEADER */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(13,13,26,0.96)", backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`, padding: "14px 16px 10px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.14em", color: C.accent, textTransform: "uppercase" }}>LE PLAN</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: C.muted }}>{headerDate}</span>
            <span onClick={() => onNav("logs")} style={{ fontSize: 14, color: C.faint, cursor: "pointer" }}>◈</span>
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, color: C.accent, border: `1px solid ${C.borderMid}`, borderRadius: 999, padding: "3px 12px" }}>
            ✦ Per Aspera Ad Astra
          </span>
        </div>
      </div>

      <div style={{ padding: "16px 16px 100px" }}>

        {/* HERO CARD */}
        <div style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(99,102,241,0.06))",
          border: `1px solid rgba(139,92,246,0.3)`, borderLeft: `4px solid ${C.accent}`,
          borderRadius: 18, padding: "18px 16px", marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
            🎯 Highlight du jour
          </div>
          {editingHL ? (
            <textarea
              autoFocus
              value={hlText}
              onChange={e => saveHL(e.target.value)}
              onBlur={() => setEditingHL(false)}
              placeholder="Quelle est ta victoire du jour ?"
              style={{
                width: "100%", background: "transparent", border: "none",
                color: C.text, fontSize: 16, fontWeight: 600, fontFamily: "inherit",
                resize: "none", outline: "none", lineHeight: 1.45, minHeight: 56,
                boxSizing: "border-box",
              }}
            />
          ) : (
            <div onClick={() => setEditingHL(true)} style={{ cursor: "text", minHeight: 40 }}>
              {hlText
                ? <p style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.45 }}>{hlText}</p>
                : <p style={{ fontSize: 14, color: C.faint, fontStyle: "italic" }}>Quelle est ta victoire du jour ?</p>
              }
            </div>
          )}
          <div style={{ fontSize: 11, color: C.faint, marginTop: 8 }}>La seule chose qui compte aujourd'hui</div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Action rapide</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {QUICK_BTNS.map(({ key, icon, label }) => (
              <button key={key} onClick={() => handleQuick(key)} style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 999,
                background: qAction === key ? GRAD : C.surface2,
                border: `1px solid ${qAction === key ? "transparent" : C.borderMid}`,
                color: qAction === key ? "#fff" : C.accent,
                fontSize: 13, fontWeight: 500, transition: TR,
                boxShadow: qAction === key ? GLOW_SM : "none",
              }}>
                <span>{icon}</span><span>{label}</span>
              </button>
            ))}
          </div>

          {/* Inline quick forms */}
          {qAction === "session" && (
            <div className="slide-up" style={{ marginTop: 10, background: C.surface2, border: `1px solid ${C.borderMid}`, borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <Input value={wpForm.tache} onChange={v => setWpForm(f => ({...f, tache:v}))} placeholder="Tâche..." style={{ flex: 1 }} />
                <input type="number" min="1" placeholder="min" value={wpForm.temps} onChange={e => setWpForm(f => ({...f, temps:e.target.value}))}
                  style={{ width: 68, background: C.surface3, border: `1px solid ${C.border}`, color: C.text, padding: "10px 8px", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {WP_TYPES.map(tp => (
                  <button key={tp} onClick={() => setWpForm(f=>({...f,type:tp}))} style={{
                    padding: "5px 12px", borderRadius: 999, fontSize: 12, border: `1px solid ${wpForm.type===tp ? WP_TYPE_C[tp] : C.border}`,
                    background: wpForm.type===tp ? WP_TYPE_C[tp]+"20" : "transparent", color: wpForm.type===tp ? WP_TYPE_C[tp] : C.muted,
                  }}>{tp}</button>
                ))}
                <Select value={wpForm.domaine} options={WP_DOMAINES} onChange={v => setWpForm(f=>({...f,domaine:v}))} style={{ fontSize: 12 }} />
              </div>
              <Btn onClick={addSession} variant="accent" style={{ width: "100%" }}>+ Enregistrer la session</Btn>
            </div>
          )}
          {qAction === "todo" && (
            <div className="slide-up" style={{ marginTop: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Input value={todoText} onChange={setTodoText} onKeyDown={e => e.key==="Enter" && addTodo()} placeholder="Nouvelle tâche..." />
                <Btn onClick={addTodo} variant="accent" style={{ whiteSpace: "nowrap" }}>Ajouter</Btn>
              </div>
            </div>
          )}
          {qAction === "objectif" && (
            <div className="slide-up" style={{ marginTop: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Input value={objText} onChange={setObjText} onKeyDown={e => e.key==="Enter" && addObj()} placeholder="Objectif hebdo..." />
                <Btn onClick={addObj} variant="accent" style={{ whiteSpace: "nowrap" }}>Ajouter</Btn>
              </div>
            </div>
          )}
        </div>

        {/* STATS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <CircularProgress value={doneH} max={habits.length || 1} size={52} color={doneH === habits.length && habits.length > 0 ? C.green : C.accent} />
            <span style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Habitudes</span>
          </div>
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.purple, lineHeight: 1 }}>{fmtMin(deepToday)}</div>
            <span style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>Travail Deep</span>
          </div>
        </div>

        {/* MAIN SPLIT: Planning | Habitudes */}
        <div className="dashboard-split">
          <BiWeeklyPlanning />
          <div id="dash-habits" style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 18, padding: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              ○ Habitudes — {fmtDate(t)}
            </div>
            {habits.length === 0
              ? <p style={{ fontSize: 13, color: C.faint }}>Aucune habitude. <span onClick={() => onNav("habitudes")} style={{ color: C.accent, cursor: "pointer" }}>→ Configurer</span></p>
              : habits.map(h => {
                  const done = (h.logs || []).includes(t);
                  return <HabitChip key={h.id} habit={h} done={done} onToggle={() => toggleHabit(h.id)} animating={animating.has(h.id)} />;
                })
            }
          </div>
        </div>

        {/* SESSIONS DU JOUR */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>⏱ Sessions du jour</span>
            <span onClick={() => onNav("workperf")} style={{ fontSize: 12, color: C.accent, cursor: "pointer" }}>Voir tout →</span>
          </div>
          {todaySessions.length === 0
            ? <p style={{ fontSize: 13, color: C.faint }}>Aucune session. <span onClick={() => setQAction("session")} style={{ color: C.accent, cursor: "pointer" }}>+ Ajouter</span></p>
            : todaySessions.map(s => {
                const tc = WP_TYPE_C[s.type] || C.muted;
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12, marginBottom: 6, background: C.surface2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${tc}` }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.tache}</div>
                      <span style={{ fontSize: 11, color: tc, fontWeight: 600 }}>{s.type}</span>
                      {" · "}
                      <span style={{ fontSize: 11, color: C.muted }}>{s.domaine}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{fmtMin(s.temps)}</span>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OBJECTIFS
// ─────────────────────────────────────────────────────────────────────────────
function KRCard({ kr, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(kr.actuelle ?? kr.depart ?? 0));
  const p = pct(kr.depart ?? 0, kr.actuelle ?? 0, kr.cible ?? 0);
  const lc = p >= 100 ? C.green : p >= 60 ? C.accent : p >= 30 ? C.amber : C.red;
  const save = () => { const n = parseFloat(val); if (!isNaN(n)) onUpdate({ ...kr, actuelle: n }); setEditing(false); };
  return (
    <div style={{ background: C.surface3, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{kr.nom}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: lc, fontWeight: 700 }}>{p}%</span>
          <span onClick={() => setEditing(!editing)} style={{ fontSize: 12, color: C.muted, cursor: "pointer" }}>✎</span>
          <span onClick={() => onDelete(kr.id)} style={{ fontSize: 12, color: C.muted, cursor: "pointer" }}>✕</span>
        </div>
      </div>
      <ProgressBar value={p} color={lc} height={5} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 11, color: C.muted }}>Départ : {kr.depart ?? 0}</span>
        {editing ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key==="Enter" && save()}
              style={{ width: 70, background: C.surface2, border: `1px solid ${C.borderMid}`, color: C.text, padding: "3px 8px", borderRadius: 8, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
            <button onClick={save} style={{ background: GRAD, color: "#fff", border: "none", padding: "3px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>OK</button>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>{kr.actuelle ?? kr.depart ?? 0} / {kr.cible ?? 0}</span>
        )}
      </div>
    </div>
  );
}

function ObjectifCard({ obj, levelColor, levelId, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [newKR, setNewKR] = useState({ nom: "", depart: "", actuelle: "", cible: "" });
  const [addingKR, setAddingKR] = useState(false);
  const krs = obj.krs || [];
  const avgPct = krs.length ? Math.round(krs.reduce((s,k) => s + pct(k.depart??0, k.actuelle??0, k.cible??0), 0) / krs.length) : null;
  const st = STATUTS[obj.statut] || { c: C.muted };
  const isDone = obj.statut === "Terminé";
  const addKR = () => {
    if (!newKR.nom.trim()) return;
    const kr = { id: uid(), nom: newKR.nom.trim(), depart: parseFloat(newKR.depart)||0, actuelle: parseFloat(newKR.actuelle)||parseFloat(newKR.depart)||0, cible: parseFloat(newKR.cible)||0 };
    onUpdate({ ...obj, krs: [...krs, kr] });
    setNewKR({ nom:"",depart:"",actuelle:"",cible:"" }); setAddingKR(false);
  };
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 10, overflow: "hidden", opacity: isDone ? 0.5 : 1, borderLeft: `4px solid ${st.c}` }}>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: isDone ? C.muted : C.text, textDecoration: isDone?"line-through":"none", marginBottom: 8, lineHeight: 1.4 }}>{obj.titre}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusPill statut={obj.statut} />
              {(obj.spaces||[]).map(sp => <SpacePill key={sp} space={sp} />)}
              {levelId === "hebdo" && obj.avec && <Pill label={`👤 ${obj.avec}`} color={C.muted} />}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
            {avgPct !== null && <span style={{ fontSize: 13, fontWeight: 700, color: levelColor }}>{avgPct}%</span>}
            <Select value={obj.statut} options={levelId==="hebdo"?STATUS_OPTIONS_HEBDO:STATUS_OPTIONS_BASE} onChange={v => onUpdate({...obj,statut:v})} style={{ fontSize: 11, padding: "4px 8px" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <span onClick={() => setOpen(!open)} style={{ fontSize: 11, color: levelColor, cursor: "pointer", userSelect: "none" }}>KR {open?"▲":"▼"}</span>
              <span onClick={() => onDelete(obj.id)} style={{ fontSize: 12, color: C.muted, cursor: "pointer" }}>✕</span>
            </div>
          </div>
        </div>
        {krs.length > 0 && avgPct !== null && <div style={{ marginTop: 10 }}><ProgressBar value={avgPct} color={levelColor} height={5} /></div>}
      </div>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ paddingTop: 12 }}>
            {krs.length === 0 && !addingKR && <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Aucun Key Result.</div>}
            {krs.map(kr => <KRCard key={kr.id} kr={kr} onUpdate={u => onUpdate({...obj,krs:krs.map(k=>k.id===u.id?u:k)})} onDelete={id => onUpdate({...obj,krs:krs.filter(k=>k.id!==id)})} />)}
            {addingKR ? (
              <div style={{ background: C.surface3, borderRadius: 12, padding: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 500 }}>Nouveau Key Result</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input placeholder="Nom du KR..." value={newKR.nom} onChange={e => setNewKR(p => ({...p,nom:e.target.value}))}
                    style={{ background: C.surface2, border:`1px solid ${C.border}`, color:C.text, padding:"8px 12px", borderRadius:10, fontSize:13, fontFamily:"inherit", outline:"none" }} />
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {[["depart","Départ"],["actuelle","Actuelle"],["cible","Cible"]].map(([k,l]) => (
                      <div key={k}>
                        <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{l}</div>
                        <input type="number" placeholder="0" value={newKR[k]} onChange={e => setNewKR(p=>({...p,[k]:e.target.value}))}
                          style={{width:"100%",boxSizing:"border-box",background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:"7px 8px",borderRadius:8,fontSize:12,fontFamily:"inherit",outline:"none"}} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:4 }}>
                    <Btn onClick={addKR} variant="accent">Ajouter</Btn>
                    <Btn onClick={() => setAddingKR(false)} variant="ghost">Annuler</Btn>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingKR(true)} style={{ background:"transparent", border:`1px dashed ${C.borderMid}`, color:C.muted, padding:"8px 14px", borderRadius:10, fontSize:12, cursor:"pointer", fontFamily:"inherit", width:"100%", marginTop:4 }}>+ Key Result</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectifsModule() {
  const [goals, setGoals] = useState(() => getLS("lp_goals", NOTION_GOALS));
  const [tab, setTab]     = useState("lt");
  const [newTitre, setNewTitre] = useState("");
  const [newSpaces, setNewSpaces] = useState([]);
  const [newAvec, setNewAvec]   = useState("Solo");
  const save = d => { setGoals(d); setLS("lp_goals", d); };
  const level = LEVELS.find(l => l.id === tab);
  const items = goals[tab] || [];
  const add = () => {
    if (!newTitre.trim()) return;
    const obj = { id:uid(), titre:newTitre.trim(), statut:tab==="hebdo"?"Pas commencé":"Dans les blocs", spaces:newSpaces, krs:[], ...(tab==="hebdo"?{avec:newAvec}:{}) };
    save({ ...goals, [tab]: [...items, obj] }); setNewTitre(""); setNewSpaces([]);
  };
  const activeCount = items.filter(o => o.statut!=="Terminé"&&o.statut!=="Échoué"&&o.statut!=="Echoué").length;
  const doneCount   = items.filter(o => o.statut==="Terminé").length;
  return (
    <div>
      <PageHeader title="▲ Objectifs" />
      <div style={{ padding: "16px 16px 100px" }}>
        {/* Level tabs */}
        <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:20, paddingBottom:4 }}>
          {LEVELS.map(l => {
            const cnt = (goals[l.id]||[]).filter(o=>o.statut!=="Terminé"&&o.statut!=="Échoué"&&o.statut!=="Echoué").length;
            const active = tab===l.id;
            return (
              <button key={l.id} onClick={() => setTab(l.id)} style={{
                flexShrink:0, padding:"8px 16px", borderRadius:999, fontSize:12, fontFamily:"inherit",
                border:`1px solid ${active?l.c:C.border}`, background:active?l.c+"18":C.surface2,
                color:active?l.c:C.muted, fontWeight:active?600:400, display:"flex", alignItems:"center", gap:6,
              }}>
                <span>{l.icon}</span><span>{l.label}</span>
                {cnt>0 && <span style={{background:l.c+"30",color:l.c,padding:"1px 7px",borderRadius:999,fontSize:10,fontWeight:700}}>{cnt}</span>}
              </button>
            );
          })}
        </div>

        {/* Add form */}
        <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:18, padding:16, marginBottom:20 }}>
          <div style={{ fontSize:10,color:C.muted,marginBottom:10,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em" }}>{level.icon} Nouvel objectif {level.label.toLowerCase()}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <Input value={newTitre} onChange={setNewTitre} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Titre de l'objectif..." />
            {tab==="hebdo" && <Select value={newAvec} options={AVEC_OPTIONS} onChange={setNewAvec} />}
            {tab!=="hebdo" && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {Object.entries(SPACES).map(([sp,{c,icon}]) => {
                  const sel = newSpaces.includes(sp);
                  return (
                    <button key={sp} onClick={() => setNewSpaces(s=>s.includes(sp)?s.filter(x=>x!==sp):[...s,sp])} style={{
                      padding:"6px 12px", borderRadius:999, border:`1px solid ${sel?c:C.border}`,
                      background:sel?c+"20":"transparent", color:sel?c:C.muted, cursor:"pointer", fontSize:12, fontFamily:"inherit",
                    }}>{icon} {sp}</button>
                  );
                })}
              </div>
            )}
            <Btn onClick={add} variant="accent" style={{ width:"100%" }}>+ Ajouter</Btn>
          </div>
        </div>

        {items.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <span style={{ fontSize:12,color:C.muted }}>{doneCount}/{items.length} terminés · {activeCount} actifs</span>
            <div style={{ flex:1, maxWidth:160 }}><ProgressBar value={items.length?doneCount/items.length*100:0} color={level.c} /></div>
          </div>
        )}
        {items.length===0
          ? <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"48px 0"}}>Aucun objectif {level.label.toLowerCase()}.</div>
          : items.map(obj => <ObjectifCard key={obj.id} obj={obj} levelColor={level.c} levelId={tab} onUpdate={u=>save({...goals,[tab]:items.map(o=>o.id===u.id?u:o)})} onDelete={id=>save({...goals,[tab]:items.filter(o=>o.id!==id)})} />)
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TODO — GTD v2 + CALENDAR
// ─────────────────────────────────────────────────────────────────────────────
const SPHERES = {
  business: { label: "💸 Business", c: "#8b5cf6" },
  master:   { label: "📚 Master",   c: "#3b82f6" },
  sport:    { label: "⚡ Sport",    c: "#10b981" },
  perso:    { label: "👁 Perso",    c: "#f59e0b" },
  pro:      { label: "🧑‍💻 Pro",    c: "#ec4899" },
};
const MATRICES = {
  ui:   { label: "🔴 Urgent · Important",     short: "UI" },
  uni:  { label: "🟡 Urgent · Secondaire",    short: "U·S" },
  nui:  { label: "🔵 Important · Pas urgent", short: "I·PU" },
  nuni: { label: "⚫ Ni urgent ni important",  short: "—" },
};
const PROJ_STATUTS = {
  a_planifier: { label: "À planifier", c: C.muted },
  en_cours:    { label: "En cours",    c: C.accent },
  termine:     { label: "Terminé",     c: C.green },
};
const migrateOneTodo = raw => {
  if (!raw) return null;
  // already new format
  if (raw.gtd && ("createdAt" in raw) && !("text" in raw) && !("domaine" in raw)) return raw;
  // old format
  const gtdMap = { projet:"projet", memo:"memo", someday:"someday", waiting:"waiting", highlight:"inbox", inbox:"inbox" };
  return {
    id: raw.id || uid(),
    name: raw.name || raw.text || "",
    gtd: gtdMap[raw.gtd || raw.type] || "inbox",
    sphere: raw.sphere || raw.domaine || undefined,
    matrice: raw.matrice || undefined,
    statut: raw.statut === "termine" || raw.status === "done" ? "termine" : raw.statut === "en_cours" || raw.status === "doing" ? "en_cours" : "a_planifier",
    sousTaches: raw.sousTaches || [],
    done: raw.done || raw.status === "done" || false,
    createdAt: raw.createdAt || (raw.date ? raw.date + "T00:00:00.000Z" : new Date().toISOString()),
  };
};
const loadTodos = () => {
  const stored = getLS("leplan_todos", null) || getLS("lp_todos", []);
  return (stored || []).map(migrateOneTodo).filter(Boolean);
};

// ── useTodos hook ──
function useTodos() {
  const [todos, setTodosState] = useState(loadTodos);
  const save = d => { setTodosState(d); setLS("leplan_todos", d); };
  const addTodo      = o => { const t={id:uid(),name:"",gtd:"inbox",done:false,createdAt:new Date().toISOString(),...o}; save([...todos,t]); return t; };
  const updateTodo   = (id,p) => save(todos.map(t=>t.id===id?{...t,...p}:t));
  const deleteTodo   = id => save(todos.filter(t=>t.id!==id));
  const toggleDone   = id => save(todos.map(t=>t.id===id?{...t,done:!t.done,doneAt:!t.done?new Date().toISOString():undefined}:t));
  const restoreTodo  = id => save(todos.map(t=>t.id===id?{...t,done:false,doneAt:undefined}:t));
  const classifyInbox= (id,p) => updateTodo(id,p);
  const addSousTache = (todoId,name) => { const todo=todos.find(t=>t.id===todoId); if(!todo) return; updateTodo(todoId,{sousTaches:[...(todo.sousTaches||[]),{id:uid(),name,done:false}]}); };
  const toggleSousTache = (todoId,stId) => { const todo=todos.find(t=>t.id===todoId); if(!todo) return; updateTodo(todoId,{sousTaches:(todo.sousTaches||[]).map(s=>s.id===stId?{...s,done:!s.done}:s)}); };
  const getByGTD     = g => todos.filter(t=>t.gtd===g);
  const getByMatrice = m => todos.filter(t=>t.matrice===m&&!t.done);
  const getBySphere  = s => todos.filter(t=>t.sphere===s);
  const getDoneItems = ({period='week',gtd='all',sphere='all'}={}) => {
    const now=new Date();
    const weekAgo=new Date(now); weekAgo.setDate(now.getDate()-7);
    const mStart=new Date(now.getFullYear(),now.getMonth(),1);
    const pmStart=new Date(now.getFullYear(),now.getMonth()-1,1);
    const pmEnd=new Date(now.getFullYear(),now.getMonth(),0);
    return todos.filter(item=>{
      if(!item.done) return false;
      if(gtd!=='all'&&item.gtd!==gtd) return false;
      if(sphere!=='all'&&item.sphere!==sphere) return false;
      const d=new Date(item.doneAt||item.createdAt);
      if(period==='week') return d>=weekAgo;
      if(period==='month') return d>=mStart;
      if(period==='prev_month') return d>=pmStart&&d<=pmEnd;
      return true;
    }).sort((a,b)=>(b.doneAt||b.createdAt)>(a.doneAt||a.createdAt)?1:-1);
  };
  const getProjectsForCalendar = (month,year) => todos.filter(t=>{
    if(t.gtd!=="projet"||!t.dateDebut||!t.dateFin) return false;
    const s=new Date(t.dateDebut+"T12:00:00"), e=new Date(t.dateFin+"T12:00:00");
    return s<=new Date(year,month+1,0) && e>=new Date(year,month,1);
  });
  const getMemosForDate = date => todos.filter(t=>t.gtd==="memo"&&t.dateAssignee===date&&!t.done);
  return {todos,addTodo,updateTodo,deleteTodo,toggleDone,restoreTodo,classifyInbox,addSousTache,toggleSousTache,getByGTD,getByMatrice,getBySphere,getDoneItems,getProjectsForCalendar,getMemosForDate};
}

// ── ProjectCard ──
function ProjectCard({item, todos, onUpdate, onDelete, onToggleDone, onEdit}) {
  const [expanded, setExpanded] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const sc = SPHERES[item.sphere]?.c || C.border;
  const st = PROJ_STATUTS[item.statut] || PROJ_STATUTS.a_planifier;
  const mat = MATRICES[item.matrice];
  const subs = item.sousTaches || [];
  const doneSubs = subs.filter(s=>s.done);
  const today = todayStr();
  const over = item.dateFin && item.dateFin < today && !item.done;
  const dateFinBadge = item.dateFin
    ? (item.dateFinType==="deadline"
        ? <span style={{fontSize:11,color:over?C.red:C.muted}}>🔴 Deadline · {item.dateFin}</span>
        : <span style={{fontSize:11,color:"#3b82f6"}}>🔵 Due · {item.dateFin}</span>)
    : null;
  const addSub = () => {
    if(!newSubName.trim()) return;
    onUpdate(item.id, {sousTaches:[...subs,{id:uid(),name:newSubName.trim(),done:false}]});
    setNewSubName("");
  };
  return (
    <div style={{marginBottom:10,background:C.surface2,border:`1px solid ${C.border}`,borderLeft:`4px solid ${sc}`,borderRadius:16,overflow:"hidden",opacity:item.done?0.45:1}}>
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{flex:1}}>
            <div onClick={()=>onEdit&&onEdit()} style={{fontSize:15,fontWeight:600,color:item.done?C.muted:C.text,textDecoration:item.done?"line-through":"none",marginBottom:6,lineHeight:1.35,cursor:onEdit?"pointer":"default"}}>{item.name}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
              {mat&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:999,background:C.surface3,color:C.muted,border:`1px solid ${C.border}`}}>{mat.label}</span>}
              {item.sphere&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:999,background:sc+"22",color:sc}}>{SPHERES[item.sphere]?.label}</span>}
              <span style={{fontSize:10,padding:"2px 7px",borderRadius:999,background:st.c+"22",color:st.c}}>{st.label}</span>
            </div>
            {item.dateDebut&&item.dateFin
              ? <div style={{fontSize:11,color:C.muted}}>Du {item.dateDebut} au {item.dateFin}</div>
              : dateFinBadge&&<div style={{marginTop:2}}>{dateFinBadge}</div>
            }
          </div>
          <span onClick={()=>onToggleDone(item.id)} style={{fontSize:20,cursor:"pointer",color:item.done?C.green:C.borderMid,flexShrink:0,marginTop:2}}>{item.done?"●":"○"}</span>
          <span onClick={()=>onDelete(item.id)} style={{fontSize:13,cursor:"pointer",color:C.faint,flexShrink:0,marginTop:4}}>✕</span>
        </div>
        {subs.length>0&&(
          <div style={{marginTop:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{flex:1,height:3,borderRadius:2,background:"rgba(139,92,246,0.1)"}}>
                <div style={{height:"100%",width:`${doneSubs.length/subs.length*100}%`,background:sc,borderRadius:2,transition:"width 0.4s ease"}}/>
              </div>
              <span style={{fontSize:11,color:C.muted,flexShrink:0}}>{doneSubs.length}/{subs.length}</span>
              <span onClick={()=>setExpanded(x=>!x)} style={{fontSize:11,color:C.accent,cursor:"pointer",flexShrink:0}}>{expanded?"▲":"▼"}</span>
            </div>
          </div>
        )}
        {subs.length===0&&<div onClick={()=>setExpanded(x=>!x)} style={{marginTop:8,fontSize:12,color:C.faint,cursor:"pointer"}}>+ Sous-tâche</div>}
      </div>
      {expanded&&(
        <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 16px"}}>
          {subs.map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid rgba(139,92,246,0.08)`,opacity:s.done?0.5:1}}>
              <span onClick={()=>onUpdate(item.id,{sousTaches:subs.map(x=>x.id===s.id?{...x,done:!x.done}:x)})} style={{fontSize:16,cursor:"pointer",color:s.done?C.green:C.borderMid}}>{s.done?"●":"○"}</span>
              <span style={{fontSize:13,color:C.text,flex:1,textDecoration:s.done?"line-through":"none"}}>{s.name}</span>
              <span onClick={()=>onUpdate(item.id,{sousTaches:subs.filter(x=>x.id!==s.id)})} style={{fontSize:12,cursor:"pointer",color:C.faint}}>✕</span>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <Input value={newSubName} onChange={setNewSubName} onKeyDown={e=>e.key==="Enter"&&addSub()} placeholder="Nouvelle sous-tâche..." style={{flex:1,minHeight:36,padding:"6px 12px",fontSize:13}}/>
            <Btn onClick={addSub} variant="ghost" style={{padding:"6px 14px",fontSize:12,minHeight:36}}>+</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ClarifyModal ──
function ClarifyModal({item, onSave, onClose}) {
  const [form, setForm] = useState({
    gtd: item.gtd==="inbox"?"":item.gtd, name:item.name,
    sphere:item.sphere||null, matrice:item.matrice||null,
    dateDebut:item.dateDebut||"", dateFin:item.dateFin||"",
    dateFinType:item.dateFinType||"duedate", statut:item.statut||"a_planifier",
    dateAssignee:item.dateAssignee||"", waitingFor:item.waitingFor||"", waitingNote:item.waitingNote||"",
  });
  const set = p => setForm(f=>({...f,...p}));
  const canConfirm = form.gtd && form.name.trim() &&
    (form.gtd!=="projet" || (form.sphere&&form.matrice&&form.dateFin)) &&
    (form.gtd!=="memo"   || form.dateAssignee) &&
    (form.gtd!=="waiting"|| form.waitingFor.trim());
  const handleSave = () => {
    if(!canConfirm) return;
    const u={gtd:form.gtd,name:form.name,sphere:form.sphere||undefined};
    if(form.gtd==="projet") Object.assign(u,{matrice:form.matrice,dateDebut:form.dateDebut||undefined,dateFin:form.dateFin,dateFinType:form.dateFinType,statut:form.statut,sousTaches:item.sousTaches||[]});
    else if(form.gtd==="memo") Object.assign(u,{dateAssignee:form.dateAssignee});
    else if(form.gtd==="waiting") Object.assign(u,{waitingFor:form.waitingFor,waitingNote:form.waitingNote||undefined});
    onSave(u); onClose();
  };
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:100,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} className="slide-up" style={{width:"100%",maxWidth:480,margin:"0 auto",background:C.surface,borderRadius:"24px 24px 0 0",border:`1px solid ${C.border}`,padding:20,paddingBottom:"calc(20px + env(safe-area-inset-bottom))",maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:4}}>Classifier cette tâche</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:20}}>{item.name}</div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Quel type ?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          {[["projet","🔴 Projet",C.red],["memo","📝 Mémo","#6366f1"],["waiting","⏳ Waiting For",C.amber],["someday","💭 Someday-Maybe",C.faint]].map(([k,l,c])=>(
            <button key={k} onClick={()=>set({gtd:k})} style={{padding:14,borderRadius:14,border:`1px solid ${form.gtd===k?c:C.border}`,background:form.gtd===k?c+"22":C.surface2,color:form.gtd===k?c:C.muted,fontSize:14,fontFamily:"inherit",textAlign:"center",cursor:"pointer",transition:TR}}>{l}</button>
          ))}
        </div>
        {form.gtd&&(<>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Nom</div>
            <Input value={form.name} onChange={v=>set({name:v})} placeholder="Nom de la tâche..."/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Sphère{form.gtd==="projet"?" *":""}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {Object.entries(SPHERES).map(([k,v])=>(
                <button key={k} onClick={()=>set({sphere:form.sphere===k?null:k})} style={{padding:"6px 12px",borderRadius:999,border:`1px solid ${form.sphere===k?v.c:C.border}`,background:form.sphere===k?v.c+"22":"transparent",color:form.sphere===k?v.c:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{v.label}</button>
              ))}
            </div>
          </div>
          {form.gtd==="projet"&&(<>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Matrice *</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {Object.entries(MATRICES).map(([k,v])=>(
                  <button key={k} onClick={()=>set({matrice:form.matrice===k?null:k})} style={{padding:"10px",borderRadius:12,border:`1px solid ${form.matrice===k?C.accent:C.border}`,background:form.matrice===k?C.accentBg:C.surface2,color:form.matrice===k?C.accent:C.muted,fontSize:11,fontFamily:"inherit",cursor:"pointer",textAlign:"center"}}>{v.label}</button>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Date début</div>
                <input type="date" value={form.dateDebut} onChange={e=>set({dateDebut:e.target.value})} style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:9,borderRadius:10,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Date fin *</div>
                <input type="date" value={form.dateFin} onChange={e=>set({dateFin:e.target.value})} style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:9,borderRadius:10,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[["deadline","🔴 Deadline"],["duedate","🔵 Due Date"]].map(([k,l])=>(
                <button key={k} onClick={()=>set({dateFinType:k})} style={{flex:1,padding:9,borderRadius:10,border:`1px solid ${form.dateFinType===k?C.accent:C.border}`,background:form.dateFinType===k?C.accentBg:"transparent",color:form.dateFinType===k?C.accent:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:8}}>Statut</div>
              <div style={{display:"flex",gap:6}}>
                {Object.entries(PROJ_STATUTS).map(([k,v])=>(
                  <button key={k} onClick={()=>set({statut:k})} style={{flex:1,padding:8,borderRadius:10,border:`1px solid ${form.statut===k?v.c:C.border}`,background:form.statut===k?v.c+"22":"transparent",color:form.statut===k?v.c:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{v.label}</button>
                ))}
              </div>
            </div>
          </>)}
          {form.gtd==="memo"&&(
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Date assignée *</div>
              <input type="date" value={form.dateAssignee} onChange={e=>set({dateAssignee:e.target.value})} style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:9,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
            </div>
          )}
          {form.gtd==="waiting"&&(<>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Qui ? *</div>
              <Input value={form.waitingFor} onChange={v=>set({waitingFor:v})} placeholder="Nom de la personne ou entité..."/>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Note (optionnel)</div>
              <Input value={form.waitingNote} onChange={v=>set({waitingNote:v})} placeholder="Contexte..."/>
            </div>
          </>)}
          <Btn onClick={handleSave} variant="accent" disabled={!canConfirm} style={{width:"100%",marginTop:8}}>Confirmer</Btn>
        </>)}
      </div>
    </div>
  );
}

// ── EditModal ──
function EditModal({item, onSave, onDelete, onToggleDone, onClose}) {
  const [form, setForm] = useState({
    name:item.name, gtd:item.gtd, sphere:item.sphere||null, matrice:item.matrice||null,
    dateDebut:item.dateDebut||"", dateFin:item.dateFin||"", dateFinType:item.dateFinType||"duedate",
    statut:item.statut||"a_planifier", dateAssignee:item.dateAssignee||"",
    waitingFor:item.waitingFor||"", waitingNote:item.waitingNote||"", sousTaches:item.sousTaches||[],
  });
  const [newSubName, setNewSubName] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const set = p => setForm(f=>({...f,...p}));

  const handleSave = () => {
    const u={name:form.name,gtd:form.gtd,sphere:form.sphere||undefined};
    if(form.gtd==="projet") Object.assign(u,{matrice:form.matrice,dateDebut:form.dateDebut||undefined,dateFin:form.dateFin||undefined,dateFinType:form.dateFinType,statut:form.statut,sousTaches:form.sousTaches});
    else if(form.gtd==="memo") u.dateAssignee=form.dateAssignee||undefined;
    else if(form.gtd==="waiting") Object.assign(u,{waitingFor:form.waitingFor,waitingNote:form.waitingNote||undefined});
    onSave(u); onClose();
  };
  const addSub = () => {
    if(!newSubName.trim()) return;
    set({sousTaches:[...form.sousTaches,{id:uid(),name:newSubName.trim(),done:false}]});
    setNewSubName("");
  };
  const GTD_TYPES=[["inbox","📥 Inbox"],["projet","🔴 Projet"],["memo","📝 Mémo"],["waiting","⏳ Waiting For"],["someday","💭 Someday"]];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div onClick={e=>e.stopPropagation()} className="slide-up" style={{width:"100%",maxWidth:520,background:C.surface,borderRadius:20,border:`1px solid ${C.border}`,padding:20,maxHeight:"85vh",overflowY:"auto"}}>
        <input autoFocus value={form.name} onChange={e=>set({name:e.target.value})}
          style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${C.borderMid}`,color:C.text,fontSize:17,fontWeight:600,fontFamily:"inherit",outline:"none",padding:"4px 0",boxSizing:"border-box",marginBottom:16}}/>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Type</div>
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
            {GTD_TYPES.map(([k,l])=>(
              <button key={k} onClick={()=>set({gtd:k})} style={{flexShrink:0,padding:"6px 12px",borderRadius:999,border:`1px solid ${form.gtd===k?C.accent:C.border}`,background:form.gtd===k?C.accentBg:"transparent",color:form.gtd===k?C.accent:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Sphère</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {Object.entries(SPHERES).map(([k,v])=>(
              <button key={k} onClick={()=>set({sphere:form.sphere===k?null:k})} style={{padding:"6px 12px",borderRadius:999,border:`1px solid ${form.sphere===k?v.c:C.border}`,background:form.sphere===k?v.c+"22":"transparent",color:form.sphere===k?v.c:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{v.label}</button>
            ))}
          </div>
        </div>

        {form.gtd==="projet"&&(<>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Matrice</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {Object.entries(MATRICES).map(([k,v])=>(
                <button key={k} onClick={()=>set({matrice:form.matrice===k?null:k})} style={{padding:"10px",borderRadius:12,border:`1px solid ${form.matrice===k?C.accent:C.border}`,background:form.matrice===k?C.accentBg:C.surface2,color:form.matrice===k?C.accent:C.muted,fontSize:11,fontFamily:"inherit",cursor:"pointer",textAlign:"center"}}>{v.label}</button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {[["dateDebut","Date début"],["dateFin","Date fin"]].map(([k,l])=>(
              <div key={k}>
                <div style={{fontSize:10,color:C.muted,marginBottom:6}}>{l}</div>
                <input type="date" value={form[k]} onChange={e=>set({[k]:e.target.value})} style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:9,borderRadius:10,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {[["deadline","🔴 Deadline"],["duedate","🔵 Due Date"]].map(([k,l])=>(
              <button key={k} onClick={()=>set({dateFinType:k})} style={{flex:1,padding:9,borderRadius:10,border:`1px solid ${form.dateFinType===k?C.accent:C.border}`,background:form.dateFinType===k?C.accentBg:"transparent",color:form.dateFinType===k?C.accent:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
            ))}
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:8}}>Statut</div>
            <div style={{display:"flex",gap:6}}>
              {Object.entries(PROJ_STATUTS).map(([k,v])=>(
                <button key={k} onClick={()=>set({statut:k})} style={{flex:1,padding:8,borderRadius:10,border:`1px solid ${form.statut===k?v.c:C.border}`,background:form.statut===k?v.c+"22":"transparent",color:form.statut===k?v.c:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{v.label}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Sous-tâches</div>
            {form.sousTaches.map(s=>(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}22`}}>
                <span onClick={()=>set({sousTaches:form.sousTaches.map(x=>x.id===s.id?{...x,done:!x.done}:x)})} style={{fontSize:16,cursor:"pointer",color:s.done?C.green:C.borderMid}}>{s.done?"●":"○"}</span>
                <span style={{flex:1,fontSize:13,color:s.done?C.muted:C.text,textDecoration:s.done?"line-through":"none"}}>{s.name}</span>
                <span onClick={()=>set({sousTaches:form.sousTaches.filter(x=>x.id!==s.id)})} style={{fontSize:12,color:C.faint,cursor:"pointer"}}>✕</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <Input value={newSubName} onChange={setNewSubName} onKeyDown={e=>e.key==="Enter"&&addSub()} placeholder="Nouvelle sous-tâche..." style={{flex:1,minHeight:36,padding:"6px 12px",fontSize:13}}/>
              <Btn onClick={addSub} variant="ghost" style={{padding:"6px 14px",fontSize:12,minHeight:36}}>+</Btn>
            </div>
          </div>
        </>)}

        {form.gtd==="memo"&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Date assignée</div>
            <input type="date" value={form.dateAssignee} onChange={e=>set({dateAssignee:e.target.value})} style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:9,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
        )}

        {form.gtd==="waiting"&&(<>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Qui ?</div>
            <Input value={form.waitingFor} onChange={v=>set({waitingFor:v})} placeholder="Nom de la personne ou entité..."/>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Note</div>
            <Input value={form.waitingNote} onChange={v=>set({waitingNote:v})} placeholder="Contexte..."/>
          </div>
        </>)}

        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
          <Btn onClick={handleSave} variant="accent" style={{width:"100%"}}>Enregistrer</Btn>
          <div style={{display:"flex",gap:8}}>
            <Btn onClick={()=>{onToggleDone(item.id);onClose();}} variant="ghost" style={{flex:1,color:item.done?C.accent:C.green}}>{item.done?"↩ Restaurer":"✓ Marquer fait"}</Btn>
            {confirmDel
              ? <Btn onClick={()=>{onDelete(item.id);onClose();}} style={{flex:1,color:C.red,border:`1px solid ${C.red}44`}}>Confirmer ✕</Btn>
              : <Btn onClick={()=>setConfirmDel(true)} style={{flex:1,color:C.red,border:`1px solid ${C.red}44`}}>Supprimer</Btn>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TodoModule ──
function TodoModule() {
  const {todos,addTodo,updateTodo,deleteTodo,toggleDone,restoreTodo,classifyInbox,getDoneItems,getByGTD} = useTodos();
  const [tab, setTab]               = useState("inbox");
  const [showCapture, setShowCapture]= useState(false);
  const [captureMode, setCaptureMode]= useState("fast");
  const [capForm, setCapForm]       = useState({name:"",gtd:"inbox",sphere:null,matrice:null,dateDebut:"",dateFin:"",dateFinType:"duedate",statut:"a_planifier",dateAssignee:"",waitingFor:"",waitingNote:""});
  const [clarifyId, setClarifyId]   = useState(null);
  const [editId, setEditId]         = useState(null);
  const [sphereFilter, setSphereFilter] = useState("all");
  const [sortMode, setSortMode]     = useState("dateFin");
  const [somedayQ, setSomedayQ]     = useState("");
  const [inboxText, setInboxText]   = useState("");
  const [donePeriod, setDonePeriod] = useState("week");
  const [doneGTD, setDoneGTD]       = useState("all");
  const [doneSphere, setDoneSphere] = useState("all");
  const [toast, setToast]           = useState(null);

  const today = todayStr();

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(null),2000); };
  const resetCap = () => setCapForm({name:"",gtd:"inbox",sphere:null,matrice:null,dateDebut:"",dateFin:"",dateFinType:"duedate",statut:"a_planifier",dateAssignee:"",waitingFor:"",waitingNote:""});

  const handleCapture = () => {
    if(!capForm.name.trim()) return;
    const o={name:capForm.name.trim()};
    if(captureMode==="fast") { o.gtd="inbox"; }
    else {
      o.gtd=capForm.gtd||"inbox"; o.sphere=capForm.sphere||undefined;
      if(capForm.gtd==="projet") Object.assign(o,{matrice:capForm.matrice,dateDebut:capForm.dateDebut||undefined,dateFin:capForm.dateFin||undefined,dateFinType:capForm.dateFinType,statut:capForm.statut,sousTaches:[]});
      else if(capForm.gtd==="memo") o.dateAssignee=capForm.dateAssignee||undefined;
      else if(capForm.gtd==="waiting") Object.assign(o,{waitingFor:capForm.waitingFor,waitingNote:capForm.waitingNote||undefined});
    }
    addTodo(o); resetCap(); setShowCapture(false); showToast("Capturé.");
  };

  const handleInboxAdd = () => {
    if(!inboxText.trim()) return;
    addTodo({name:inboxText.trim(),gtd:"inbox"}); setInboxText(""); showToast("Capturé.");
  };

  const inboxItems   = getByGTD("inbox").filter(t=>!t.done);
  const projets      = todos.filter(t=>t.gtd==="projet"&&!t.done);
  const waitingItems = getByGTD("waiting").filter(t=>!t.done);
  const memos        = todos.filter(t=>t.gtd==="memo"&&!t.done).sort((a,b)=>(a.dateAssignee||"9999")>(b.dateAssignee||"9999")?1:-1);
  const somedayItems = getByGTD("someday").filter(t=>!t.done);
  const memosUrgentCnt = memos.filter(t=>t.dateAssignee===today).length;
  const filteredP    = (sphereFilter==="all"?projets:projets.filter(t=>t.sphere===sphereFilter)).sort((a,b)=>{
    if(sortMode==="matrice") return (a.matrice||"z")>(b.matrice||"z")?1:-1;
    if(sortMode==="sphere") return (a.sphere||"z")>(b.sphere||"z")?1:-1;
    return (a.dateFin||"9999")>(b.dateFin||"9999")?1:-1;
  });
  const doneItems = getDoneItems({period:donePeriod,gtd:doneGTD,sphere:doneSphere});
  const clarifyItem = todos.find(t=>t.id===clarifyId);
  const editItem    = todos.find(t=>t.id===editId);

  const memoGroups = (() => {
    const g={};
    memos.forEach(m=>{const d=m.dateAssignee||"zzz";if(!g[d])g[d]=[];g[d].push(m);});
    return Object.entries(g).sort(([a],[b])=>a>b?1:-1);
  })();
  const groupLabel = ds => {
    if(ds==="zzz") return "Sans date";
    if(ds===today) return "Aujourd'hui";
    const tom=new Date(); tom.setDate(tom.getDate()+1);
    if(ds===tom.toISOString().split("T")[0]) return "Demain";
    return fmtDate(ds);
  };

  const TABS=[
    {id:"inbox",   label:"Inbox",   cnt:inboxItems.length},
    {id:"projets", label:"Projets", cnt:projets.length},
    {id:"waiting", label:"Waiting", cnt:waitingItems.length},
    {id:"memo",    label:"Mémo",    cnt:memos.length, urgent:memosUrgentCnt>0},
    {id:"someday", label:"Someday", cnt:somedayItems.length},
    {id:"fait",    label:"Fait",    cnt:null},
  ];

  return (
    <div>
      <PageHeader title="□ Todo" />

      {/* Tab bar */}
      <div style={{position:"sticky",top:57,zIndex:10,background:"rgba(13,13,26,0.96)",backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,padding:"10px 16px"}}>
        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:2}}>
          {TABS.map(({id,label,cnt,urgent})=>{
            const isActive=tab===id;
            return (
              <button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,padding:"7px 12px",borderRadius:999,border:"none",background:isActive?GRAD:"transparent",color:isActive?"#fff":C.muted,fontSize:12,fontFamily:"inherit",fontWeight:isActive?600:400,boxShadow:isActive?GLOW_SM:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
                {label}
                {cnt!=null&&cnt>0&&<span style={{fontSize:10,background:isActive?"rgba(255,255,255,0.25)":urgent?C.red+"30":C.accentBg,color:isActive?"#fff":urgent?C.red:C.accent,borderRadius:999,padding:"1px 6px"}}>{cnt}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{padding:"16px 16px 120px"}}>

        {/* ── INBOX ── */}
        {tab==="inbox"&&(
          <div>
            <div style={{background:C.surface2,border:`1px solid ${C.borderMid}`,borderRadius:18,padding:16,marginBottom:20}}>
              <div style={{fontSize:11,color:C.accent,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>📥 Capture rapide</div>
              <div style={{display:"flex",gap:8}}>
                <Input value={inboxText} onChange={setInboxText} onKeyDown={e=>{if(e.key==="Enter")handleInboxAdd();}} placeholder="Capture une idée ou tâche..." style={{flex:1}}/>
                <Btn onClick={handleInboxAdd} variant="accent" style={{whiteSpace:"nowrap"}}>+ Ajouter</Btn>
              </div>
            </div>
            {inboxItems.length===0
              ? <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"48px 0"}}>Inbox zéro.</div>
              : inboxItems.map(item=>(
                <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,marginBottom:8,background:C.surface2,border:`1px solid ${C.border}`}}>
                  <div style={{flex:1,cursor:"pointer"}} onClick={()=>setEditId(item.id)}>
                    <div style={{fontSize:14,color:C.text}}>{item.name}</div>
                    <span style={{fontSize:11,fontWeight:600,color:C.amber}}>À clarifier</span>
                  </div>
                  <Btn onClick={()=>setClarifyId(item.id)} variant="ghost" style={{fontSize:12,padding:"6px 12px",whiteSpace:"nowrap"}}>Clarifier →</Btn>
                  <span onClick={()=>deleteTodo(item.id)} style={{fontSize:14,color:C.faint,cursor:"pointer"}}>✕</span>
                </div>
              ))
            }
          </div>
        )}

        {/* ── PROJETS ── */}
        {tab==="projets"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8}}>
              <div style={{display:"flex",gap:6,overflowX:"auto",flex:1,paddingBottom:4}}>
                {[["all","Tous",C.accent],...Object.entries(SPHERES).map(([k,v])=>[k,v.label,v.c])].map(([k,l,c])=>(
                  <button key={k} onClick={()=>setSphereFilter(k)} style={{flexShrink:0,padding:"6px 12px",borderRadius:999,border:`1px solid ${sphereFilter===k?c:C.border}`,background:sphereFilter===k?c+"22":C.surface2,color:sphereFilter===k?c:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
                ))}
              </div>
              <select value={sortMode} onChange={e=>setSortMode(e.target.value)} style={{flexShrink:0,background:C.surface2,border:`1px solid ${C.border}`,color:C.muted,padding:"6px 8px",borderRadius:8,fontSize:11,fontFamily:"inherit",outline:"none"}}>
                <option value="dateFin">Date ↑</option>
                <option value="matrice">Matrice</option>
                <option value="sphere">Sphère</option>
              </select>
            </div>

            {filteredP.length===0&&(
              <div style={{textAlign:"center",padding:"60px 0",fontSize:13,color:C.faint}}>
                Aucun projet. <span onClick={()=>setShowCapture(true)} style={{color:C.accent,cursor:"pointer"}}>+ Créer</span>
              </div>
            )}

            {filteredP.map(item=>(
              <ProjectCard key={item.id} item={item} todos={todos} onUpdate={updateTodo} onDelete={deleteTodo} onToggleDone={id=>{toggleDone(id);showToast("Terminé.");}} onEdit={()=>setEditId(item.id)}/>
            ))}
          </div>
        )}

        {/* ── WAITING FOR ── */}
        {tab==="waiting"&&(
          <div>
            {waitingItems.length===0
              ? <div style={{fontSize:13,color:C.faint,textAlign:"center",padding:"48px 0"}}>Rien en attente.</div>
              : waitingItems.map(item=>{
                  const sc=SPHERES[item.sphere]?.c||C.border;
                  return (
                    <div key={item.id} onClick={()=>setEditId(item.id)} style={{padding:"14px 16px",borderRadius:14,marginBottom:8,background:C.surface2,border:`1px solid ${C.border}`,borderLeft:"3px solid #f59e0b",cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,color:C.text,marginBottom:4}}>⏳ {item.name}</div>
                          {item.waitingFor&&<div style={{fontSize:12,color:C.amber}}>Attend : {item.waitingFor}</div>}
                          {item.waitingNote&&<div style={{fontSize:11,color:C.faint,marginTop:2}}>{item.waitingNote}</div>}
                          {item.sphere&&<span style={{fontSize:10,color:sc,marginTop:4,display:"block"}}>{SPHERES[item.sphere]?.label}</span>}
                        </div>
                        <span onClick={e=>{e.stopPropagation();toggleDone(item.id);showToast("Reçu.");}} style={{fontSize:16,cursor:"pointer",color:C.borderMid}}>○</span>
                        <span onClick={e=>{e.stopPropagation();deleteTodo(item.id);}} style={{fontSize:13,color:C.faint,cursor:"pointer"}}>✕</span>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── MÉMO ── */}
        {tab==="memo"&&(
          <div>
            {memos.length===0
              ? <div style={{fontSize:13,color:C.faint,textAlign:"center",padding:"48px 0"}}>Aucun mémo planifié.</div>
              : memoGroups.map(([date,items])=>(
                  <div key={date} style={{marginBottom:16}}>
                    <div style={{fontSize:10,color:date===today?C.red:C.faint,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8,fontWeight:date===today?700:400}}>── {groupLabel(date)} ──</div>
                    {items.map(item=>{
                      const sc=SPHERES[item.sphere]?.c||C.accent;
                      return (
                        <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,marginBottom:6,background:C.surface2,border:`1px solid ${C.border}`,borderLeft:"3px solid #6366f1"}}>
                          <div style={{flex:1,cursor:"pointer"}} onClick={()=>setEditId(item.id)}>
                            <div style={{fontSize:14,color:C.text}}>📝 {item.name}</div>
                            {item.sphere&&<span style={{fontSize:11,color:sc}}>{SPHERES[item.sphere]?.label}</span>}
                          </div>
                          <div onClick={()=>{toggleDone(item.id);showToast("Mémo fait.");}} style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${C.borderMid}`,cursor:"pointer",flexShrink:0}}/>
                        </div>
                      );
                    })}
                  </div>
                ))
            }
          </div>
        )}

        {/* ── SOMEDAY-MAYBE ── */}
        {tab==="someday"&&(
          <div>
            <div style={{marginBottom:16}}><Input value={somedayQ} onChange={setSomedayQ} placeholder="Rechercher..."/></div>
            <div style={{fontSize:13,color:C.muted,marginBottom:16}}>💭 Un jour, peut-être... <span style={{color:C.faint}}>({somedayItems.length})</span></div>
            {somedayItems.filter(t=>!somedayQ||t.name.toLowerCase().includes(somedayQ.toLowerCase())).length===0
              ? <div style={{fontSize:13,color:C.faint,textAlign:"center",padding:"32px 0"}}>Aucune idée capturée.</div>
              : somedayItems.filter(t=>!somedayQ||t.name.toLowerCase().includes(somedayQ.toLowerCase())).map(item=>(
                <div key={item.id} onClick={()=>setEditId(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,marginBottom:8,background:C.surface2,border:`1px solid ${C.border}`,opacity:0.8,cursor:"pointer"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,color:C.muted}}>{item.name}</div>
                    <div style={{display:"flex",gap:8,marginTop:4}}>
                      {item.sphere&&<span style={{fontSize:11,color:SPHERES[item.sphere]?.c}}>{SPHERES[item.sphere]?.label}</span>}
                      <span style={{fontSize:11,color:C.faint}}>{item.createdAt?.slice(0,10)}</span>
                    </div>
                  </div>
                  <Btn onClick={e=>{e.stopPropagation();updateTodo(item.id,{gtd:"inbox"});showToast("Déplacé vers Inbox.");}} variant="ghost" style={{fontSize:11,padding:"5px 10px"}}>→ Inbox</Btn>
                  <span onClick={e=>{e.stopPropagation();deleteTodo(item.id);}} style={{fontSize:14,color:C.faint,cursor:"pointer"}}>✕</span>
                </div>
              ))
            }
          </div>
        )}

        {/* ── FAIT ── */}
        {tab==="fait"&&(
          <div>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:8,paddingBottom:4}}>
              {[["week","Cette semaine"],["month","Ce mois"],["prev_month","Mois préc."],["all","Tout"]].map(([k,l])=>(
                <button key={k} onClick={()=>setDonePeriod(k)} style={{flexShrink:0,padding:"6px 12px",borderRadius:999,border:`1px solid ${donePeriod===k?C.accent:C.border}`,background:donePeriod===k?C.accentBg:"transparent",color:donePeriod===k?C.accent:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:8,paddingBottom:4}}>
              {[["all","Tous"],["projet","Projets"],["memo","Mémos"],["waiting","Waiting"],["someday","Someday"]].map(([k,l])=>(
                <button key={k} onClick={()=>setDoneGTD(k)} style={{flexShrink:0,padding:"5px 10px",borderRadius:999,border:`1px solid ${doneGTD===k?C.accent:C.border}`,background:doneGTD===k?C.accentBg:"transparent",color:doneGTD===k?C.accent:C.muted,fontSize:11,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:4}}>
              {[["all","Toutes",C.accent],...Object.entries(SPHERES).map(([k,v])=>[k,v.label,v.c])].map(([k,l,c])=>(
                <button key={k} onClick={()=>setDoneSphere(k)} style={{flexShrink:0,padding:"5px 10px",borderRadius:999,border:`1px solid ${doneSphere===k?c:C.border}`,background:doneSphere===k?c+"22":"transparent",color:doneSphere===k?c:C.muted,fontSize:11,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            <div style={{fontSize:12,color:C.faint,marginBottom:12}}>{doneItems.length} tâche{doneItems.length!==1?"s":""} accomplie{doneItems.length!==1?"s":""}</div>
            {doneItems.length===0
              ? <div style={{fontSize:13,color:C.faint,textAlign:"center",padding:"32px 0"}}>Aucune tâche accomplie sur cette période.</div>
              : doneItems.map(item=>{
                  const sc=SPHERES[item.sphere]?.c||C.border;
                  return (
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:14,marginBottom:6,background:C.surface2,border:`1px solid ${C.border}`,borderLeft:`3px solid ${sc}`,opacity:0.65}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:C.muted,textDecoration:"line-through"}}>{item.name}</div>
                        <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
                          <span style={{fontSize:10,color:C.green,fontWeight:600}}>✓ Fait</span>
                          {item.doneAt&&<span style={{fontSize:10,color:C.faint}}>{item.doneAt.slice(0,10)}</span>}
                          {item.sphere&&<span style={{fontSize:10,color:sc}}>{SPHERES[item.sphere]?.label}</span>}
                        </div>
                      </div>
                      <Btn onClick={()=>{restoreTodo(item.id);showToast("Tâche restaurée.");}} variant="ghost" style={{fontSize:11,padding:"5px 10px",color:C.muted,flexShrink:0}}>↩</Btn>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>


      {/* TOAST */}
      {toast&&<div style={{position:"fixed",top:72,left:"50%",transform:"translateX(-50%)",zIndex:200,background:C.surface3,border:`1px solid ${C.borderMid}`,borderRadius:999,padding:"8px 20px",fontSize:13,color:C.text,boxShadow:"0 4px 24px rgba(0,0,0,0.4)",whiteSpace:"nowrap",pointerEvents:"none"}}>{toast}</div>}

      {/* QUICK CAPTURE MODAL */}
      {showCapture&&(
        <div onClick={()=>setShowCapture(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:100,display:"flex",alignItems:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} className="slide-up" style={{width:"100%",maxWidth:480,margin:"0 auto",background:C.surface,borderRadius:"24px 24px 0 0",border:`1px solid ${C.border}`,padding:20,paddingBottom:"calc(20px + env(safe-area-inset-bottom))"}}>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:16}}>
              {[["fast","⚡ Capture"],["full","Complet"]].map(([m,l])=>(
                <button key={m} onClick={()=>setCaptureMode(m)} style={{padding:"7px 16px",borderRadius:999,border:`1px solid ${captureMode===m?C.accent:C.border}`,background:captureMode===m?C.accentBg:"transparent",color:captureMode===m?C.accent:C.muted,fontSize:13,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
              ))}
            </div>
            <Input autoFocus value={capForm.name} onChange={v=>setCapForm(f=>({...f,name:v}))} onKeyDown={e=>e.key==="Enter"&&captureMode==="fast"&&handleCapture()} placeholder={captureMode==="fast"?"Capture une idée ou tâche...":"Nom de la tâche..."}/>
            {captureMode==="full"&&(
              <div className="slide-up">
                <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",margin:"14px 0 8px"}}>Type GTD</div>
                <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
                  {[["inbox","📥 Inbox"],["projet","🔴 Projet"],["memo","📝 Mémo"],["waiting","⏳ Waiting"],["someday","💭 Someday"]].map(([k,l])=>(
                    <button key={k} onClick={()=>setCapForm(f=>({...f,gtd:k}))} style={{flexShrink:0,padding:"6px 12px",borderRadius:999,border:`1px solid ${capForm.gtd===k?C.accent:C.border}`,background:capForm.gtd===k?C.accentBg:"transparent",color:capForm.gtd===k?C.accent:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{l}</button>
                  ))}
                </div>
                <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",margin:"14px 0 8px"}}>Sphère</div>
                <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
                  {Object.entries(SPHERES).map(([k,v])=>(
                    <button key={k} onClick={()=>setCapForm(f=>({...f,sphere:f.sphere===k?null:k}))} style={{flexShrink:0,padding:"6px 12px",borderRadius:999,border:`1px solid ${capForm.sphere===k?v.c:C.border}`,background:capForm.sphere===k?v.c+"22":"transparent",color:capForm.sphere===k?v.c:C.muted,fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>{v.label}</button>
                  ))}
                </div>
                {capForm.gtd==="projet"&&(
                  <div className="slide-up">
                    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",margin:"14px 0 8px"}}>Matrice</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                      {Object.entries(MATRICES).map(([k,v])=>(
                        <button key={k} onClick={()=>setCapForm(f=>({...f,matrice:f.matrice===k?null:k}))} style={{padding:"8px",borderRadius:12,border:`1px solid ${capForm.matrice===k?C.accent:C.border}`,background:capForm.matrice===k?C.accentBg:"transparent",color:capForm.matrice===k?C.accent:C.muted,fontSize:11,fontFamily:"inherit",cursor:"pointer",textAlign:"center"}}>{v.label}</button>
                      ))}
                    </div>
                  </div>
                )}
                {capForm.gtd==="memo"&&(
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Date assignée</div>
                    <input type="date" value={capForm.dateAssignee} onChange={e=>setCapForm(f=>({...f,dateAssignee:e.target.value}))} style={{width:"100%",background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:9,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                  </div>
                )}
                {capForm.gtd==="waiting"&&(
                  <div style={{marginTop:12}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:6}}>Attendu de</div>
                    <Input value={capForm.waitingFor} onChange={v=>setCapForm(f=>({...f,waitingFor:v}))} placeholder="Nom de la personne..."/>
                  </div>
                )}
              </div>
            )}
            <div style={{marginTop:16}}>
              <Btn onClick={handleCapture} variant="accent" style={{width:"100%"}}>{captureMode==="fast"?"Capturer →":"Ajouter"}</Btn>
            </div>
          </div>
        </div>
      )}

      {/* CLARIFY MODAL */}
      {clarifyItem&&(
        <ClarifyModal item={clarifyItem} onSave={p=>{updateTodo(clarifyId,p);setClarifyId(null);showToast("Classifié.");}} onClose={()=>setClarifyId(null)}/>
      )}

      {/* EDIT MODAL */}
      {editItem&&(
        <EditModal item={editItem} onSave={p=>updateTodo(editId,p)} onDelete={id=>{deleteTodo(id);showToast("Supprimé.");}} onToggleDone={id=>{toggleDone(id);showToast(editItem.done?"Restauré.":"Fait.");}} onClose={()=>setEditId(null)}/>
      )}
    </div>
  );
}

function EmojiInput({ value, onSave }) {
  const [local, setLocal] = useState(value);
  return (
    <input value={local} onChange={e=>setLocal(e.target.value)} onBlur={() => { const v=local.trim(); if(v) onSave(v); else setLocal(value); }}
      style={{ width:48,textAlign:"center",background:C.surface3,border:`1px solid ${C.border}`,color:C.text,padding:"6px",borderRadius:10,fontSize:22,fontFamily:"inherit",outline:"none",cursor:"text" }} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HABITUDES
// ─────────────────────────────────────────────────────────────────────────────
function HabitudesModule() {
  const [habits, setHabits] = useState(() => getLS("lp_habits", []));
  const [view, setView]     = useState("today");
  const [newName, setNewName]  = useState("");
  const [newEmoji, setNewEmoji]= useState("⭐");
  const [mYear, setMYear]   = useState(new Date().getFullYear());
  const [mMonth, setMMonth] = useState(new Date().getMonth());
  const [animating, setAnimating] = useState(new Set());

  const save = d => { setHabits(d); setLS("lp_habits", d); };
  const add  = () => { if(!newName.trim()) return; save([...habits,{id:uid(),name:newName.trim(),emoji:newEmoji||"⭐",logs:[]}]); setNewName(""); setNewEmoji("⭐"); };
  const toggle = (id, date) => {
    const d = date || todayStr();
    if (!date) {
      setAnimating(s => new Set([...s, id]));
      setTimeout(() => setAnimating(s => { const n=new Set(s); n.delete(id); return n; }), 280);
    }
    save(habits.map(h => {
      if(h.id!==id) return h;
      const logs=h.logs||[];
      return {...h, logs:logs.includes(d)?logs.filter(x=>x!==d):[...logs,d]};
    }));
  };
  const del    = id => save(habits.filter(h=>h.id!==id));
  const update = (id,patch) => save(habits.map(h=>h.id===id?{...h,...patch}:h));
  const streak = h => {
    let n=0; const logs=new Set(h.logs||[]); const d=new Date();
    if(!logs.has(todayStr())) d.setDate(d.getDate()-1);
    while(true) { const k=d.toISOString().split("T")[0]; if(!logs.has(k)) break; n++; d.setDate(d.getDate()-1); }
    return n;
  };
  const prevMonth = () => { if(mMonth===0){setMYear(y=>y-1);setMMonth(11);}else setMMonth(m=>m-1); };
  const nextMonth = () => { if(mMonth===11){setMYear(y=>y+1);setMMonth(0);}else setMMonth(m=>m+1); };

  const t=todayStr(), week=weekDates();
  const done=habits.filter(h=>(h.logs||[]).includes(t)).length;
  const VIEWS=[["today","Aujourd'hui"],["week","Semaine"],["mois","Mois"],["manage","Gérer"]];

  return (
    <div>
      <PageHeader title="○ Habitudes" />
      <div style={{ padding:"16px 16px 100px" }}>
        {/* View tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
          {VIEWS.map(([id,label]) => {
            const active=view===id;
            return (
              <button key={id} onClick={() => setView(id)} style={{
                flexShrink:0,padding:"8px 18px",borderRadius:999,border:`1px solid ${active?C.accent:C.border}`,
                background:active?C.accentBg:C.surface2,color:active?C.accent:C.muted,
                cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:active?600:400,
              }}>{label}</button>
            );
          })}
        </div>

        {/* TODAY */}
        {view==="today" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ fontSize:12,color:C.muted }}>{fmtDate(t)}</span>
              {habits.length>0 && <span style={{ fontSize:13,fontWeight:700,color:done===habits.length?C.green:C.accent }}>{done}/{habits.length}</span>}
            </div>
            {habits.length>0 && <div style={{marginBottom:16}}><ProgressBar value={habits.length?done/habits.length*100:0} color={done===habits.length?C.green:C.accent} height={5} /></div>}
            {habits.length===0
              ? <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"48px 0"}}>Aucune habitude. <span onClick={()=>setView("manage")} style={{color:C.accent,cursor:"pointer"}}>→ Gérer</span></div>
              : habits.map(h => {
                  const isDone=(h.logs||[]).includes(t);
                  const s=streak(h);
                  return (
                    <div key={h.id} onClick={()=>toggle(h.id)} className={animating.has(h.id)?"habit-pop":""} style={{
                      display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:16,marginBottom:8,cursor:"pointer",
                      background:isDone?"rgba(16,185,129,0.07)":C.surface2,
                      border:`1px solid ${isDone?"rgba(16,185,129,0.25)":C.border}`,
                      transition:TR,
                    }}>
                      <span style={{fontSize:24,flexShrink:0}}>{h.emoji}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:500,color:isDone?C.muted:C.text,textDecoration:isDone?"line-through":"none"}}>{h.name}</div>
                        {s>0&&<div style={{fontSize:11,color:C.amber,marginTop:2}}>🔥 {s} jour{s>1?"s":""}</div>}
                      </div>
                      <div style={{
                        width:28,height:28,borderRadius:"50%",flexShrink:0,
                        background:isDone?"linear-gradient(135deg,#10b981,#059669)":"transparent",
                        border:`2px solid ${isDone?"#10b981":C.borderMid}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        boxShadow:isDone?"0 0 12px rgba(16,185,129,0.4)":"none",
                        transition:TR,
                      }}>
                        {isDone&&<span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span>}
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* WEEK — dot grid */}
        {view==="week" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr repeat(7,36px)", gap:6, alignItems:"center", marginBottom:10 }}>
              <div />
              {DAY_LABELS.map((d,i) => (
                <div key={i} style={{ fontSize:11,fontWeight:600,textAlign:"center",color:week[i]===t?C.accent:C.muted }}>{d}</div>
              ))}
            </div>
            {habits.length===0&&<div style={{fontSize:13,color:C.muted}}>Aucune habitude.</div>}
            {habits.map(h => (
              <div key={h.id} style={{ display:"grid", gridTemplateColumns:"1fr repeat(7,36px)", gap:6, alignItems:"center", marginBottom:8 }}>
                <div style={{ fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:8 }}>{h.emoji} {h.name}</div>
                {week.map((d,i) => {
                  const isDone=(h.logs||[]).includes(d);
                  const isToday=d===t;
                  const canClick=d<=t;
                  return (
                    <div key={i} onClick={() => canClick&&toggle(h.id,d)} style={{
                      width:32,height:32,borderRadius:"50%",margin:"0 auto",
                      background:isDone?"rgba(139,92,246,0.6)":isToday?"rgba(139,92,246,0.08)":"rgba(139,92,246,0.05)",
                      border:`2px solid ${isToday?C.accent:isDone?"rgba(139,92,246,0.5)":"transparent"}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:11,color:isDone?"#fff":C.faint,
                      cursor:canClick?"pointer":"default",transition:TR,
                      boxShadow:isDone?"0 0 8px rgba(139,92,246,0.3)":"none",
                    }}>
                      {isDone&&"✓"}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* MONTH — contribution grid */}
        {view==="mois" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, justifyContent:"center" }}>
              <button onClick={prevMonth} style={{background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:"7px 14px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>←</button>
              <span style={{fontSize:14,fontWeight:700,color:C.text,minWidth:140,textAlign:"center"}}>{MONTH_FR[mMonth]} {mYear}</span>
              <button onClick={nextMonth} style={{background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:"7px 14px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>→</button>
            </div>
            {habits.length===0&&<div style={{fontSize:13,color:C.muted}}>Aucune habitude.</div>}
            {habits.map(h => {
              const days = monthDates(mYear, mMonth);
              return (
                <div key={h.id} style={{marginBottom:20}}>
                  <div style={{fontSize:13,fontWeight:500,color:C.text,marginBottom:8}}>{h.emoji} {h.name}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                    {days.map(d => {
                      const isDone=(h.logs||[]).includes(d);
                      const isToday=d===t;
                      const canClick=d<=t;
                      const opacity = isDone ? 0.85 : 0.07;
                      return (
                        <div key={d} onClick={() => canClick&&toggle(h.id,d)} title={d.split("-")[2]} style={{
                          width:18,height:18,borderRadius:4,flexShrink:0,
                          background:isDone?`rgba(139,92,246,${opacity})`:`rgba(139,92,246,0.07)`,
                          border:`1px solid ${isToday?C.accent:isDone?"rgba(139,92,246,0.4)":"transparent"}`,
                          boxShadow:isDone?"0 0 6px rgba(139,92,246,0.25)":"none",
                          cursor:canClick?"pointer":"default",transition:TR,
                        }} />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MANAGE */}
        {view==="manage" && (
          <div>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              <input value={newEmoji} onChange={e=>setNewEmoji(e.target.value)}
                style={{width:54,textAlign:"center",background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:"10px 4px",borderRadius:12,fontSize:20,fontFamily:"inherit",outline:"none"}} />
              <Input value={newName} onChange={setNewName} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Nom de l'habitude..." />
              <Btn onClick={add} variant="accent" style={{whiteSpace:"nowrap"}}>+</Btn>
            </div>
            {habits.length===0&&<div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"48px 0"}}>Aucune habitude définie.</div>}
            {habits.map(h => (
              <div key={h.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:16,marginBottom:8,background:C.surface2,border:`1px solid ${C.border}`}}>
                <EmojiInput value={h.emoji} onSave={v=>update(h.id,{emoji:v})} />
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:500,color:C.text}}>{h.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>{(h.logs||[]).length} entrées · {streak(h)} j. série</div>
                </div>
                <Btn onClick={()=>del(h.id)} variant="ghost" style={{fontSize:12,color:C.red,borderColor:C.red+"40",padding:"6px 14px"}}>Suppr.</Btn>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKPERF
// ─────────────────────────────────────────────────────────────────────────────
function WorkPerfModule() {
  const [sessions, setSessions] = useState(() => getLS("lp_workperf", []));
  const [view, setView] = useState("today");
  const [form, setForm] = useState({ tache:"",temps:"",type:"DEEP",domaine:"BUSINESS",efficience:"💡💡💡" });
  const [showForm, setShowForm] = useState(false);
  const save = d => { setSessions(d); setLS("lp_workperf", d); };
  const add  = () => {
    if(!form.tache.trim()||!form.temps) return;
    save([...sessions,{id:uid(),tache:form.tache.trim(),date:todayStr(),temps:parseInt(form.temps),type:form.type,domaine:form.domaine,efficience:form.efficience}]);
    setForm(f=>({...f,tache:"",temps:""})); setShowForm(false);
  };
  const del = id => save(sessions.filter(s=>s.id!==id));
  const t=todayStr();
  const todaySessions=sessions.filter(s=>s.date===t);
  const totalToday=todaySessions.reduce((a,s)=>a+s.temps,0);
  const deepToday=todaySessions.filter(s=>s.type==="DEEP").reduce((a,s)=>a+s.temps,0);
  const weekTotal=sessions.filter(s=>weekDates().includes(s.date)).reduce((a,s)=>a+s.temps,0);
  const byDate=sessions.reduce((acc,s)=>{(acc[s.date]??=[]).push(s);return acc;},{});
  const sortedDates=Object.keys(byDate).sort((a,b)=>b.localeCompare(a));
  const byDomaine=sessions.reduce((acc,s)=>{acc[s.domaine]=(acc[s.domaine]||0)+s.temps;return acc;},{});
  const deepPct = totalToday>0 ? Math.round(deepToday/totalToday*100) : 0;
  return (
    <div>
      <PageHeader title="⏱ WorkPerf"
        action={<button onClick={()=>setShowForm(s=>!s)} style={{background:GRAD,color:"#fff",border:"none",padding:"7px 16px",borderRadius:12,fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:GLOW_SM}}>+ Session</button>}
      />
      <div style={{padding:"16px 16px 100px"}}>
        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
          {[
            {val:fmtMin(totalToday)||"—",label:"Total auj.",c:C.accent},
            {val:fmtMin(deepToday)||"—",label:"DEEP auj.",c:C.purple},
            {val:fmtMin(weekTotal)||"—",label:"Semaine",c:C.blue},
          ].map(({val,label,c})=>(
            <div key={label} style={{background:C.surface2,border:`1px solid ${C.border}`,borderTop:`2px solid ${c}`,borderRadius:16,padding:"14px 10px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:700,color:c,lineHeight:1}}>{val}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:5}}>{label}</div>
            </div>
          ))}
        </div>

        {/* Inline add form */}
        {showForm && (
          <div className="slide-up" style={{background:C.surface2,border:`1px solid ${C.borderMid}`,borderRadius:18,padding:16,marginBottom:16}}>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <Input value={form.tache} onChange={v=>setForm(f=>({...f,tache:v}))} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Tâche..." style={{flex:1}} />
              <input type="number" min="1" placeholder="min" value={form.temps} onChange={e=>setForm(f=>({...f,temps:e.target.value}))}
                style={{width:70,background:C.surface3,border:`1px solid ${C.border}`,color:C.text,padding:"10px 8px",borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none"}} />
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {WP_TYPES.map(tp=>(
                <button key={tp} onClick={()=>setForm(f=>({...f,type:tp}))} style={{
                  padding:"6px 14px",borderRadius:999,fontSize:12,border:`1px solid ${form.type===tp?WP_TYPE_C[tp]:C.border}`,
                  background:form.type===tp?WP_TYPE_C[tp]+"22":"transparent",color:form.type===tp?WP_TYPE_C[tp]:C.muted,
                  fontFamily:"inherit",fontWeight:form.type===tp?600:400,
                }}>{tp}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <Select value={form.domaine} options={WP_DOMAINES} onChange={v=>setForm(f=>({...f,domaine:v}))} style={{flex:1}} />
              <Select value={form.efficience} options={WP_EFFICIENCE} onChange={v=>setForm(f=>({...f,efficience:v}))} />
            </div>
            <Btn onClick={add} variant="accent" style={{width:"100%"}}>+ Enregistrer</Btn>
          </div>
        )}

        {/* View tabs */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[["today","Aujourd'hui"],["history","Historique"],["stats","Stats"]].map(([id,label])=>{
            const active=view===id;
            return <button key={id} onClick={()=>setView(id)} style={{padding:"8px 18px",borderRadius:999,border:`1px solid ${active?C.accent:C.border}`,background:active?C.accentBg:C.surface2,color:active?C.accent:C.muted,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:active?600:400}}>{label}</button>;
          })}
        </div>

        {view==="today" && (todaySessions.length===0
          ? <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"48px 0"}}>Aucune session aujourd'hui.</div>
          : todaySessions.map(s=><WPCard key={s.id} s={s} onDelete={del} />)
        )}

        {view==="history" && (sortedDates.length===0
          ? <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"48px 0"}}>Aucune session.</div>
          : sortedDates.map(date=>{
              const ds=byDate[date], dayTotal=ds.reduce((a,s)=>a+s.temps,0);
              return (
                <div key={date} style={{marginBottom:20}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <span style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em"}}>{fmtDate(date)}</span>
                    <span style={{fontSize:13,color:C.accent,fontWeight:700}}>{fmtMin(dayTotal)}</span>
                  </div>
                  {ds.map(s=><WPCard key={s.id} s={s} onDelete={del} />)}
                </div>
              );
            })
        )}

        {view==="stats" && (
          <div>
            <div style={{fontSize:11,color:C.muted,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.08em"}}>Temps total par domaine</div>
            {WP_DOMAINES.filter(d=>byDomaine[d]).sort((a,b)=>byDomaine[b]-byDomaine[a]).map(d=>{
              const total=byDomaine[d];
              const maxVal=Math.max(...Object.values(byDomaine));
              return (
                <div key={d} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,color:C.text}}>{d}</span>
                    <span style={{fontSize:13,color:C.accent,fontWeight:700}}>{fmtMin(total)}</span>
                  </div>
                  <ProgressBar value={total/maxVal*100} height={5} />
                </div>
              );
            })}
            {Object.keys(byDomaine).length===0&&<div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"48px 0"}}>Aucune donnée.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function WPCard({ s, onDelete }) {
  const tc = WP_TYPE_C[s.type] || C.muted;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,marginBottom:8,background:C.surface2,border:`1px solid ${C.border}`,borderLeft:`3px solid ${tc}`}}>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:500,color:C.text}}>{s.tache}</div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <span style={{fontSize:11,color:tc,fontWeight:600}}>{s.type}</span>
          <span style={{fontSize:11,color:C.muted}}>{s.domaine}</span>
          <span style={{fontSize:11,color:C.muted}}>{s.efficience}</span>
        </div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontSize:16,fontWeight:700,color:C.accent}}>{fmtMin(s.temps)}</div>
        <span onClick={()=>onDelete(s.id)} style={{fontSize:12,color:C.muted,cursor:"pointer"}}>✕</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY PAPER
// ─────────────────────────────────────────────────────────────────────────────
function DJRating({ label, options, value, onChange }) {
  const idx = options.indexOf(value);
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <span style={{fontSize:11,color:C.muted,minWidth:44}}>{label}</span>
      <div style={{display:"flex",gap:4}}>
        {options.map((o,i) => (
          <div key={i} onClick={()=>onChange(value===o?"":o)} style={{
            width:30,height:30,borderRadius:9,cursor:"pointer",
            background:idx>=i?GRAD:"transparent",
            border:`1px solid ${idx>=i?"transparent":C.border}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:12,fontWeight:700,
            color:idx>=i?"#fff":C.faint,
            boxShadow:idx>=i&&i===idx?GLOW_SM:"none",
            transition:TR,
          }}>{i+1}</div>
        ))}
      </div>
    </div>
  );
}

function DailyPaperModule() {
  const [daily, setDaily]     = useState(() => getLS("lp_daily", {}));
  const [selDate, setSelDate] = useState(todayStr());
  const save = d => { setDaily(d); setLS("lp_daily", d); };
  const setField = (field, val) => { const e=djEntry(daily[selDate]); save({...daily,[selDate]:{...e,[field]:val}}); };
  const entry = djEntry(daily[selDate]);
  const sortedDates = Object.keys(daily).filter(d=>{const e=djEntry(daily[d]);return e.morning||e.trucs_faits||e.lotd||e.gratitude||e.reflexions||e.remark;}).sort((a,b)=>b.localeCompare(a));
  const t=todayStr(); const isToday=selDate===t;
  const prevDay = () => { const d=new Date(selDate+"T12:00:00"); d.setDate(d.getDate()-1); setSelDate(d.toISOString().split("T")[0]); };
  const nextDay = () => { const d=new Date(selDate+"T12:00:00"); d.setDate(d.getDate()+1); const next=d.toISOString().split("T")[0]; if(next<=t) setSelDate(next); };
  const SECTIONS = [
    {key:"trucs_faits",label:"Les trucs faits",ph:"Liste les activités du jour..."},
    {key:"lotd",label:"LOTD",ph:"Qu'as-tu appris aujourd'hui ?"},
    {key:"gratitude",label:"Gratitude",ph:"Reconnaissant pour..."},
    {key:"reflexions",label:"Réflexions",ph:"Réflexions sur la journée..."},
  ];
  return (
    <div>
      <PageHeader title="✦ Daily Paper" />
      <div style={{padding:"16px 16px 100px"}}>
        {/* Date nav */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,justifyContent:"center"}}>
          <button onClick={prevDay} style={{background:C.surface2,border:`1px solid ${C.border}`,color:C.text,padding:"8px 16px",borderRadius:12,cursor:"pointer",fontFamily:"inherit",fontSize:16}}>←</button>
          <span style={{fontSize:14,fontWeight:600,color:isToday?C.accent:C.text,flex:1,textAlign:"center"}}>
            {fmtDate(selDate)}{isToday?" · Aujourd'hui":""}
          </span>
          <button onClick={nextDay} disabled={isToday} style={{background:C.surface2,border:`1px solid ${C.border}`,color:isToday?C.muted:C.text,padding:"8px 16px",borderRadius:12,cursor:isToday?"default":"pointer",fontFamily:"inherit",fontSize:16,opacity:isToday?0.35:1}}>→</button>
        </div>

        {/* Indicators */}
        <div style={{background:C.surface2,border:`1px solid ${C.border}`,borderRadius:18,padding:16,marginBottom:14}}>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <Select value={entry.type} options={DJ_TYPES} onChange={v=>setField("type",v)} style={{flex:1,minWidth:140}} />
            <Input value={entry.remark} onChange={v=>setField("remark",v)} placeholder="Remarque..." style={{flex:1}} />
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <DJRating label="Matin"  options={DJ_ENERGY} value={entry.morning} onChange={v=>setField("morning",v)} />
              <DJRating label="Midi"   options={DJ_ENERGY} value={entry.noon}    onChange={v=>setField("noon",v)} />
              <DJRating label="Soir"   options={DJ_ENERGY} value={entry.evening} onChange={v=>setField("evening",v)} />
            </div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <DJRating label="Focus"  options={DJ_FOCUS}  value={entry.focus}   onChange={v=>setField("focus",v)} />
              <DJRating label="Stress" options={DJ_STRESS} value={entry.stress}  onChange={v=>setField("stress",v)} />
            </div>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map(({key,label,ph})=>(
          <div key={key} style={{marginBottom:12}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>{label}</div>
            <textarea value={entry[key]||""} onChange={e=>setField(key,e.target.value)} placeholder={ph}
              style={{width:"100%",minHeight:110,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:14,color:C.text,padding:"12px 14px",fontSize:14,fontFamily:"inherit",lineHeight:1.65,resize:"vertical",outline:"none",boxSizing:"border-box"}} />
          </div>
        ))}

        {/* Recent sidebar condensed to a list */}
        {sortedDates.length>0 && (
          <div style={{marginTop:20}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Entrées récentes</div>
            <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
              {sortedDates.slice(0,15).map(d=>{
                const e=djEntry(daily[d]);
                const active=selDate===d;
                return (
                  <button key={d} onClick={()=>setSelDate(d)} style={{
                    flexShrink:0,padding:"6px 12px",borderRadius:999,border:`1px solid ${active?C.accent:C.border}`,
                    background:active?C.accentBg:C.surface2,color:active?C.accent:C.muted,
                    fontSize:12,fontFamily:"inherit",cursor:"pointer",
                  }}>
                    {new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}
                    {e.morning&&<span style={{marginLeft:4}}>⚡{e.morning.length}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGS
// ─────────────────────────────────────────────────────────────────────────────
function DayLogCard({ date, habits, daily, sessions=[], onToggleHabit, onDeleteDaily, onUpdateDaily }) {
  const [editing, setEditing] = useState(false);
  const t=todayStr(); const raw=daily[date]; const paperEntry=raw?djEntry(raw):null; const editEntry=djEntry(raw);
  const doneCount=habits.filter(h=>(h.logs||[]).includes(date)).length;
  return (
    <div style={{marginLeft:16,marginBottom:8,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:16,overflow:"hidden"}}>
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:13,fontWeight:600,color:C.text}}>{fmtDate(date)}</span>
        {date===t&&<Pill label="Aujourd'hui" color={C.accent} />}
      </div>
      <div style={{padding:"12px 14px"}}>
        {habits.length>0&&(
          <div style={{marginBottom:paperEntry||editing?10:0}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Habitudes · {doneCount}/{habits.length}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {habits.map(h=>{
                const done=(h.logs||[]).includes(date);
                return (
                  <span key={h.id} onClick={()=>onToggleHabit(h.id,date)} style={{
                    padding:"4px 12px",borderRadius:999,cursor:"pointer",fontSize:12,userSelect:"none",
                    border:`1px solid ${done?"rgba(16,185,129,0.4)":C.border}`,
                    background:done?"rgba(16,185,129,0.1)":"transparent",
                    color:done?C.green:C.muted,transition:TR,
                  }}>{h.emoji} {h.name}{done?" ✓":""}</span>
                );
              })}
            </div>
          </div>
        )}
        {paperEntry&&!editing&&(
          <div style={{borderTop:habits.length>0?`1px solid ${C.border}`:"none",paddingTop:habits.length>0?10:0}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Daily Paper</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:12,color:C.muted}}>{paperEntry.type}</span>
                  {paperEntry.morning&&<span style={{fontSize:12}}>⚡×{paperEntry.morning.length}</span>}
                  {paperEntry.focus&&<span style={{fontSize:12}}>❖×{paperEntry.focus.length}</span>}
                  {paperEntry.stress&&<span style={{fontSize:12}}>✶×{paperEntry.stress.length}</span>}
                  {paperEntry.remark&&<span style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>"{paperEntry.remark}"</span>}
                </div>
                {["trucs_faits","lotd","gratitude","reflexions"].some(k=>paperEntry[k])&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:6}}>
                    {[{key:"trucs_faits",label:"Les trucs faits"},{key:"lotd",label:"LOTD"},{key:"gratitude",label:"Gratitude"},{key:"reflexions",label:"Réflexions"}].filter(s=>paperEntry[s.key]).map(({key,label})=>(
                      <div key={key}>
                        <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{label}</div>
                        <div style={{fontSize:12,color:C.text,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{paperEntry[key]}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:5,flexShrink:0}}>
                <Btn onClick={()=>setEditing(true)} variant="ghost" style={{fontSize:11,padding:"4px 10px",minHeight:32}}>✎</Btn>
                <Btn onClick={()=>onDeleteDaily(date)} variant="ghost" style={{fontSize:11,padding:"4px 10px",color:C.red,borderColor:C.red+"40",minHeight:32}}>✕</Btn>
              </div>
            </div>
          </div>
        )}
        {editing&&(
          <div style={{borderTop:habits.length>0?`1px solid ${C.border}`:"none",paddingTop:habits.length>0?10:0}}>
            <div style={{fontSize:10,color:C.accent,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>✎ Daily Paper</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              <Select value={editEntry.type} options={DJ_TYPES} onChange={v=>onUpdateDaily(date,"type",v)} />
              <Input value={editEntry.remark} onChange={v=>onUpdateDaily(date,"remark",v)} placeholder="Remarque..." style={{flex:1}} />
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <DJRating label="Matin"  options={DJ_ENERGY} value={editEntry.morning} onChange={v=>onUpdateDaily(date,"morning",v)} />
                <DJRating label="Midi"   options={DJ_ENERGY} value={editEntry.noon}    onChange={v=>onUpdateDaily(date,"noon",v)} />
                <DJRating label="Soir"   options={DJ_ENERGY} value={editEntry.evening} onChange={v=>onUpdateDaily(date,"evening",v)} />
              </div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <DJRating label="Focus"  options={DJ_FOCUS}  value={editEntry.focus}   onChange={v=>onUpdateDaily(date,"focus",v)} />
                <DJRating label="Stress" options={DJ_STRESS} value={editEntry.stress}  onChange={v=>onUpdateDaily(date,"stress",v)} />
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {[{key:"trucs_faits",label:"Les trucs faits",ph:"Activités..."},{key:"lotd",label:"LOTD",ph:"Appris..."},{key:"gratitude",label:"Gratitude",ph:"Reconnaissant..."},{key:"reflexions",label:"Réflexions",ph:"Réflexions..."}].map(({key,label,ph})=>(
                <div key={key}>
                  <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
                  <textarea value={editEntry[key]||""} onChange={e=>onUpdateDaily(date,key,e.target.value)} placeholder={ph}
                    style={{width:"100%",minHeight:70,background:C.surface3,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"8px 10px",fontSize:12,fontFamily:"inherit",lineHeight:1.6,resize:"vertical",outline:"none",boxSizing:"border-box"}} />
                </div>
              ))}
            </div>
            <Btn onClick={()=>setEditing(false)} variant="accent" style={{fontSize:12,minHeight:36,padding:"6px 16px"}}>✓ Terminé</Btn>
          </div>
        )}
        {sessions.length>0&&(
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:(habits.length>0||paperEntry||editing)?10:0}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Sessions · {fmtMin(sessions.reduce((s,x)=>s+x.temps,0))}</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {sessions.map(s=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:8,background:s.type==="DEEP"?"rgba(139,92,246,0.08)":"rgba(255,255,255,0.02)",border:`1px solid ${s.type==="DEEP"?C.accent+"30":C.border}`}}>
                  <span style={{fontSize:10,color:s.type==="DEEP"?C.accent:C.muted,fontWeight:700,width:40,flexShrink:0}}>{s.type}</span>
                  <span style={{fontSize:12,color:C.text,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.tache}</span>
                  <span style={{fontSize:11,color:C.muted,flexShrink:0}}>{s.temps}min</span>
                  <span style={{fontSize:11,flexShrink:0}}>{s.efficience}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!paperEntry&&!editing&&habits.length===0&&sessions.length===0&&<div style={{fontSize:12,color:C.faint}}>—</div>}
      </div>
    </div>
  );
}

function LogsModule({ onBack }) {
  const [habits, setHabits] = useState(() => getLS("lp_habits", []));
  const [daily, setDaily]   = useState(() => getLS("lp_daily", {}));
  const [sessions]          = useState(() => getLS("lp_workperf", []));
  const [groupBy, setGroupBy] = useState("mois");
  const todayMk=todayStr().slice(0,7); const todayWk=weekStart(todayStr());
  const getQK = d => { const [y,m]=d.split("-").map(Number); return `${y}-T${Math.ceil(m/3)}`; };
  const [openMonths,   setOpenMonths]   = useState(()=>new Set([todayMk]));
  const [openWeeks,    setOpenWeeks]    = useState(()=>new Set([todayWk]));
  const [openQuarters, setOpenQuarters] = useState(()=>new Set([getQK(todayStr())]));
  const [openMonthsQ,  setOpenMonthsQ]  = useState(()=>new Set([todayMk]));
  const toggleMonth   = mk => setOpenMonths(s=>{const n=new Set(s);n.has(mk)?n.delete(mk):n.add(mk);return n;});
  const toggleWeek    = wk => setOpenWeeks(s=>{const n=new Set(s);n.has(wk)?n.delete(wk):n.add(wk);return n;});
  const toggleQuarter = qk => setOpenQuarters(s=>{const n=new Set(s);n.has(qk)?n.delete(qk):n.add(qk);return n;});
  const toggleMonthQ  = mk => setOpenMonthsQ(s=>{const n=new Set(s);n.has(mk)?n.delete(mk):n.add(mk);return n;});
  const saveHabits = h=>{setHabits(h);setLS("lp_habits",h);};
  const saveDaily  = d=>{setDaily(d);setLS("lp_daily",d);};
  const onToggleHabit = (hid,date) => saveHabits(habits.map(h=>{if(h.id!==hid)return h;const logs=h.logs||[];return{...h,logs:logs.includes(date)?logs.filter(x=>x!==date):[...logs,date]};}));
  const onDeleteDaily = date => { const {[date]:_,...rest}=daily; saveDaily(rest); };
  const onUpdateDaily = (date,field,val) => { const e=djEntry(daily[date]); saveDaily({...daily,[date]:{...e,[field]:val}}); };
  const sessByDate = {};
  sessions.forEach(s=>{(sessByDate[s.date]??=[]).push(s);});
  const dayCard = date => <DayLogCard key={date} date={date} habits={habits} daily={daily} sessions={sessByDate[date]||[]} onToggleHabit={onToggleHabit} onDeleteDaily={onDeleteDaily} onUpdateDaily={onUpdateDaily} />;
  const allDates=new Set();
  habits.forEach(h=>(h.logs||[]).forEach(d=>allDates.add(d)));
  Object.keys(daily).forEach(d=>{const e=djEntry(daily[d]);if(e.morning||e.trucs_faits||e.lotd||e.gratitude||e.reflexions||e.remark)allDates.add(d);});
  sessions.forEach(s=>allDates.add(s.date));
  const byWeek={};
  [...allDates].sort((a,b)=>b.localeCompare(a)).forEach(d=>{(byWeek[weekStart(d)]??=[]).push(d);});
  const byMonth={};
  [...allDates].sort((a,b)=>b.localeCompare(a)).forEach(d=>{const mk=d.slice(0,7);const wk=weekStart(d);(byMonth[mk]??={})[wk]??=[];byMonth[mk][wk].push(d);});
  const byQuarter={};
  [...allDates].sort((a,b)=>b.localeCompare(a)).forEach(d=>{const qk=getQK(d);const mk=d.slice(0,7);const wk=weekStart(d);((byQuarter[qk]??={})[mk]??={})[wk]??=[];byQuarter[qk][mk][wk].push(d);});
  const sortedWeeks    = Object.keys(byWeek).sort((a,b)=>b.localeCompare(a));
  const sortedMonths   = Object.keys(byMonth).sort((a,b)=>b.localeCompare(a));
  const sortedQuarters = Object.keys(byQuarter).sort((a,b)=>b.localeCompare(a));
  const wkRange = wk => { const e=new Date(wk+"T12:00:00"); e.setDate(e.getDate()+6); const end=e.toISOString().split("T")[0]; return `${new Date(wk+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} → ${new Date(end+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`; };
  const weekBlock = (wk,marginLeft,dates) => {
    const open=openWeeks.has(wk);
    return (
      <div key={wk} style={{marginLeft,marginBottom:6}}>
        <div onClick={()=>toggleWeek(wk)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:C.surface3,border:`1px solid ${C.border}`,borderRadius:12,cursor:"pointer",userSelect:"none",marginBottom:open?6:0}}>
          <span style={{fontSize:10,color:C.muted,width:10}}>{open?"▼":"▶"}</span>
          <span style={{fontSize:12,fontWeight:600,color:C.muted}}>Sem. {wkRange(wk)}</span>
          <span style={{fontSize:11,color:C.faint,marginLeft:"auto"}}>{dates.length} j.</span>
        </div>
        {open&&dates.map(d=>dayCard(d))}
      </div>
    );
  };
  const empty = <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"60px 0"}}>Aucun log pour l'instant.</div>;
  return (
    <div>
      <PageHeader title="◈ Logs" onBack={onBack} />
      <div style={{padding:"16px 16px 100px"}}>
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[["semaine","Semaine"],["mois","Mois"],["trimestre","Trimestre"]].map(([g,lbl])=>(
            <button key={g} onClick={()=>setGroupBy(g)} style={{
              padding:"5px 16px",borderRadius:999,fontSize:12,fontFamily:"inherit",cursor:"pointer",
              border:`1px solid ${groupBy===g?C.accent:C.border}`,
              background:groupBy===g?C.accentBg:"transparent",
              color:groupBy===g?C.accent:C.muted,
            }}>{lbl}</button>
          ))}
        </div>
        {groupBy==="semaine"&&(sortedWeeks.length===0?empty:sortedWeeks.map(wk=>{
          const open=openWeeks.has(wk); const dates=byWeek[wk].sort((a,b)=>b.localeCompare(a));
          return (
            <div key={wk} style={{marginBottom:10}}>
              <div onClick={()=>toggleWeek(wk)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:16,cursor:"pointer",userSelect:"none",marginBottom:open?8:0}}>
                <span style={{fontSize:10,color:C.muted,width:10}}>{open?"▼":"▶"}</span>
                <span style={{fontSize:15,fontWeight:700,color:C.text}}>Sem. {wkRange(wk)}</span>
                <span style={{fontSize:12,color:C.muted,marginLeft:"auto"}}>{dates.length} j.</span>
              </div>
              {open&&dates.map(d=>dayCard(d))}
            </div>
          );
        }))}
        {groupBy==="mois"&&(sortedMonths.length===0?empty:sortedMonths.map(mk=>{
          const [year,month]=mk.split("-").map(Number); const monthOpen=openMonths.has(mk);
          const sortedWks=Object.keys(byMonth[mk]).sort((a,b)=>b.localeCompare(a));
          const tot=sortedWks.reduce((s,wk)=>s+byMonth[mk][wk].length,0);
          return (
            <div key={mk} style={{marginBottom:10}}>
              <div onClick={()=>toggleMonth(mk)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:16,cursor:"pointer",userSelect:"none",marginBottom:monthOpen?8:0}}>
                <span style={{fontSize:10,color:C.muted,width:10}}>{monthOpen?"▼":"▶"}</span>
                <span style={{fontSize:15,fontWeight:700,color:C.text}}>{MONTH_FR[month-1]} {year}</span>
                <span style={{fontSize:12,color:C.muted,marginLeft:"auto"}}>{tot} j.</span>
              </div>
              {monthOpen&&sortedWks.map(wk=>{
                const dates=[...byMonth[mk][wk]].sort((a,b)=>b.localeCompare(a));
                return weekBlock(wk,12,dates);
              })}
            </div>
          );
        }))}
        {groupBy==="trimestre"&&(sortedQuarters.length===0?empty:sortedQuarters.map(qk=>{
          const [year,tq]=qk.split("-"); const qOpen=openQuarters.has(qk);
          const sortedMks=Object.keys(byQuarter[qk]).sort((a,b)=>b.localeCompare(a));
          const tot=sortedMks.reduce((s,mk)=>s+Object.values(byQuarter[qk][mk]).reduce((ss,arr)=>ss+arr.length,0),0);
          return (
            <div key={qk} style={{marginBottom:10}}>
              <div onClick={()=>toggleQuarter(qk)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:C.surface2,border:`1px solid ${C.border}`,borderRadius:16,cursor:"pointer",userSelect:"none",marginBottom:qOpen?8:0}}>
                <span style={{fontSize:10,color:C.muted,width:10}}>{qOpen?"▼":"▶"}</span>
                <span style={{fontSize:15,fontWeight:700,color:C.text}}>{tq} {year}</span>
                <span style={{fontSize:12,color:C.muted,marginLeft:"auto"}}>{tot} j.</span>
              </div>
              {qOpen&&sortedMks.map(mk=>{
                const [my,mm]=mk.split("-").map(Number); const mOpen=openMonthsQ.has(mk);
                const sortedWks=Object.keys(byQuarter[qk][mk]).sort((a,b)=>b.localeCompare(a));
                const mTot=sortedWks.reduce((s,wk)=>s+byQuarter[qk][mk][wk].length,0);
                return (
                  <div key={mk} style={{marginLeft:12,marginBottom:6}}>
                    <div onClick={()=>toggleMonthQ(mk)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.surface3,border:`1px solid ${C.border}`,borderRadius:14,cursor:"pointer",userSelect:"none",marginBottom:mOpen?6:0}}>
                      <span style={{fontSize:10,color:C.muted,width:10}}>{mOpen?"▼":"▶"}</span>
                      <span style={{fontSize:13,fontWeight:600,color:C.text}}>{MONTH_FR[mm-1]} {my}</span>
                      <span style={{fontSize:11,color:C.faint,marginLeft:"auto"}}>{mTot} j.</span>
                    </div>
                    {mOpen&&sortedWks.map(wk=>{
                      const dates=[...byQuarter[qk][mk][wk]].sort((a,b)=>b.localeCompare(a));
                      return weekBlock(wk,12,dates);
                    })}
                  </div>
                );
              })}
            </div>
          );
        }))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [module, setModule] = useState("dashboard");
  const [logsOpen, setLogsOpen] = useState(false);
  const touchRef = useRef(null);

  const onTouchStart = e => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = e => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    touchRef.current = null;
    if (!logsOpen && Math.abs(dx) > Math.abs(dy) && dx < -70) setLogsOpen(true);
  };

  return (
    <div
      style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter',system-ui,sans-serif" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div key={module} className="fade-in">
        {module === "dashboard" && <Dashboard onNav={setModule} />}
        {module === "objectifs" && <ObjectifsModule />}
        {module === "habitudes" && <HabitudesModule />}
        {module === "workperf"  && <WorkPerfModule />}
        {module === "daily"     && <DailyPaperModule />}
        {module === "todo"      && <TodoModule />}
      </div>
      <BottomNav current={module} onNav={setModule} />
      {/* Logs slide-over panel */}
      <div style={{ position:"fixed", inset:0, zIndex:200, pointerEvents:logsOpen?"all":"none" }}>
        <div
          onClick={()=>setLogsOpen(false)}
          style={{
            position:"absolute", inset:0,
            background:"rgba(0,0,0,0.5)",
            opacity:logsOpen?1:0,
            transition:"opacity 0.25s ease",
          }}
        />
        <div
          onTouchStart={e=>{ touchRef.current={ x:e.touches[0].clientX, y:e.touches[0].clientY }; e.stopPropagation(); }}
          onTouchEnd={e=>{
            if(!touchRef.current) return;
            const dx=e.changedTouches[0].clientX-touchRef.current.x;
            const dy=e.changedTouches[0].clientY-touchRef.current.y;
            touchRef.current=null;
            if(Math.abs(dx)>Math.abs(dy)&&dx>70) setLogsOpen(false);
            e.stopPropagation();
          }}
          style={{
            position:"absolute", top:0, right:0, bottom:0,
            width:"92%", maxWidth:500,
            background:C.bg,
            transform:logsOpen?"translateX(0)":"translateX(100%)",
            transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)",
            overflowY:"auto",
          }}
        >
          <LogsModule onBack={()=>setLogsOpen(false)} />
        </div>
      </div>
    </div>
  );
}
