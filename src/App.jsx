import { useState } from "react";

// ── UTILS ──────────────────────────────────────────────────────────────────
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
  const mon = new Date(d);
  mon.setDate(d.getDate() - off);
  return mon.toISOString().split("T")[0];
};
const MONTH_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const monthDates = (y, m) => Array.from({ length: new Date(y, m + 1, 0).getDate() }, (_, i) => new Date(y, m, i + 1).toISOString().split("T")[0]);
const fmtDate = s => new Date(s + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const pct = (start, cur, target) => {
  if (target === start) return cur >= target ? 100 : 0;
  return Math.round(clamp((cur - start) / (target - start) * 100, 0, 100));
};

// ── DESIGN ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#0b0b0e", surface: "#111118", surface2: "#18181f", surface3: "#1f1f2a",
  border: "#1e1e2a", borderMid: "#28283a",
  accent: "#e9a020", accentDim: "#8a5f12", accentBg: "#e9a02012",
  text: "#dddde8", muted: "#55556a", faint: "#22222f",
  green: "#22c55e", greenBg: "#22c55e14",
  red: "#ef4444", redBg: "#ef444414",
  blue: "#60a5fa", blueBg: "#60a5fa14",
  purple: "#a78bfa", purpleBg: "#a78bfa14",
  amber: "#fbbf24", amberBg: "#fbbf2414",
  pink: "#f472b6",
};

const SPACES = {
  "Sport & Santé": { c: C.green, icon: "⚡" },
  "Business":      { c: C.blue,   icon: "💼" },
  "Etudes et Pro": { c: C.red,    icon: "📚" },
  "Relations":     { c: C.purple, icon: "🤝" },
};

const STATUTS = {
  "Dans les blocs": { c: C.muted,  label: "À planifier" },
  "Pas commencé":   { c: C.muted,  label: "Pas commencé" },
  "En cours":       { c: C.blue,   label: "En cours" },
  "On-track":       { c: C.green,  label: "On track" },
  "On track":       { c: C.green,  label: "On track" },
  "Off-track":      { c: C.amber,  label: "Off track" },
  "Off track":      { c: C.amber,  label: "Off track" },
  "At-risk":        { c: C.pink,   label: "At risk" },
  "At risk":        { c: C.pink,   label: "At risk" },
  "Partiel":        { c: C.purple, label: "Partiel" },
  "Terminé":        { c: C.green,  label: "Terminé" },
  "Échoué":         { c: C.red,    label: "Échoué" },
  "Echoué":         { c: C.red,    label: "Échoué" },
};

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

// Seed Notion goals if missing or outdated (no LT data)
(function seedGoals() {
  const stored = getLS("lp_goals", null);
  const hasLT = stored && Array.isArray(stored.lt) && stored.lt.length > 0;
  if (!stored || !hasLT) {
    setLS("lp_goals", NOTION_GOALS);
  }
})();

const LEVELS = [
  { id: "lt",          label: "Long Terme",    icon: "👁️",  c: C.purple },
  { id: "annuel",      label: "Annuel",        icon: "🌌",  c: C.blue },
  { id: "trimestriel", label: "Trimestriel",   icon: "🌍",  c: C.green },
  { id: "mensuel",     label: "Mensuel",       icon: "🗻",  c: C.accent },
  { id: "hebdo",       label: "Hebdomadaire",  icon: "🌁",  c: "#f87171" },
];

const STATUS_OPTIONS_BASE = ["Dans les blocs", "En cours", "On-track", "Off-track", "At-risk", "Terminé", "Échoué"];
const STATUS_OPTIONS_HEBDO = ["Pas commencé", "On track", "Off track", "At risk", "Partiel", "Terminé", "Echoué"];
const AVEC_OPTIONS = ["Solo", "Groupe", "Laurine", "Hugo", "Famille", "MHSC"];

const WP_TYPES    = ["DEEP", "SHALLOW", "COURS", "GROUPE"];
const WP_DOMAINES = ["BUSINESS", "MASTER", "PRÉPA", "STAGE", "MÉMOIRE", "FORMATIONS PP", "PROJET PERSO", "PERSO", "CLIENT", "OPTIMISATION", "AUTRE"];
const WP_EFFICIENCE = ["💡", "💡💡", "💡💡💡", "💡💡💡💡", "💡💡💡💡💡"];
const WP_TYPE_C   = { DEEP: C.purple, SHALLOW: C.blue, COURS: C.amber, GROUPE: C.green };

const DJ_ENERGY = ["⚡", "⚡⚡", "⚡⚡⚡", "⚡⚡⚡⚡", "⚡⚡⚡⚡⚡"];
const DJ_FOCUS  = ["❖", "❖❖", "❖❖❖", "❖❖❖❖", "❖❖❖❖❖"];
const DJ_STRESS = ["✶", "✶✶", "✶✶✶", "✶✶✶✶", "✶✶✶✶✶"];
const DJ_TYPES  = ["Journée classique", "Journée libre", "Weekend", "Voyage", "Jour off", "Jour spécial"];
const DJ_EMPTY  = () => ({ morning: "", noon: "", evening: "", focus: "", stress: "", type: "Journée classique", remark: "", trucs_faits: "", lotd: "", gratitude: "", reflexions: "" });
const djEntry   = raw => !raw ? DJ_EMPTY() : typeof raw === "string" ? { ...DJ_EMPTY(), reflexions: raw } : { ...DJ_EMPTY(), ...raw };

const QUICK_ADDS = [
  { label: "💼 Business", prefix: "Business — " },
  { label: "📚 Master",   prefix: "Master — " },
  { label: "⚽ Prépa",    prefix: "Prépa — " },
  { label: "🏋️ Sport",   prefix: "Sport — " },
  { label: "🧘 Perso",   prefix: "Perso — " },
];

// ── PRIMITIVES ─────────────────────────────────────────────────────────────
const Pill = ({ label, color }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", padding: "2px 9px",
    borderRadius: 20, fontSize: 11, fontWeight: 500, letterSpacing: "0.04em",
    background: color + "20", color, border: `1px solid ${color}30`,
  }}>{label}</span>
);

const StatusPill = ({ statut }) => {
  const s = STATUTS[statut] || { c: C.muted, label: statut };
  return <Pill label={s.label} color={s.c} />;
};

const SpacePill = ({ space }) => {
  const sp = SPACES[space] || { c: C.muted, icon: "•" };
  return <Pill label={`${sp.icon} ${space}`} color={sp.c} />;
};

const ProgressBar = ({ value, color = C.accent, height = 3 }) => (
  <div style={{ height, background: C.border, borderRadius: height }}>
    <div style={{ height: "100%", width: `${clamp(value, 0, 100)}%`, background: color, borderRadius: height, transition: "width 0.4s" }} />
  </div>
);

const Select = ({ value, options, onChange, style }) => (
  <select value={value} onChange={e => onChange(e.target.value)} style={{
    background: C.surface2, border: `1px solid ${C.border}`, color: C.text,
    padding: "6px 10px", borderRadius: 6, fontSize: 12, fontFamily: "inherit",
    outline: "none", cursor: "pointer", ...style,
  }}>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

const Input = ({ value, onChange, onKeyDown, placeholder, style }) => (
  <input
    value={value} onChange={e => onChange(e.target.value)} onKeyDown={onKeyDown}
    placeholder={placeholder}
    style={{
      background: C.surface2, border: `1px solid ${C.border}`, color: C.text,
      padding: "9px 14px", borderRadius: 8, fontSize: 13, fontFamily: "inherit",
      outline: "none", width: "100%", boxSizing: "border-box",
      "::placeholder": { color: C.muted }, ...style,
    }}
  />
);

const Btn = ({ children, onClick, variant = "default", style }) => (
  <button onClick={onClick} style={{
    padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12,
    fontFamily: "inherit", fontWeight: 500, border: "none", transition: "opacity 0.1s",
    ...(variant === "accent" ? { background: C.accent, color: "#0b0b0e" } :
        variant === "ghost"  ? { background: "transparent", color: C.muted, border: `1px solid ${C.border}` } :
                               { background: C.surface3, color: C.text, border: `1px solid ${C.border}` }),
    ...style,
  }}>{children}</button>
);

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: 16, marginBottom: 8, ...(onClick ? { cursor: "pointer" } : {}), ...style,
  }}>{children}</div>
);

// ── SIDEBAR ────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "◉", label: "Dashboard" },
  { id: "objectifs", icon: "▲", label: "Objectifs" },
  { id: "todo",      icon: "◻", label: "Todo" },
  { id: "habitudes", icon: "⬡", label: "Habitudes" },
  { id: "workperf",  icon: "⏱", label: "WorkPerf" },
  { id: "daily",     icon: "✦", label: "Daily Paper" },
  { id: "logs",      icon: "◈", label: "Logs" },
];

function Sidebar({ current, onNav }) {
  return (
    <div style={{
      width: 210, minWidth: 210, background: C.surface, borderRight: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", height: "100vh",
    }}>
      <div style={{ padding: "24px 20px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: C.accent, textTransform: "uppercase" }}>LE PLAN</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4, letterSpacing: "0.08em" }}>Système personnel</div>
      </div>

      <div style={{ flex: 1, padding: "0 10px" }}>
        {NAV.map(n => {
          const active = current === n.id;
          return (
            <div key={n.id} onClick={() => onNav(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 400,
              color: active ? C.accent : C.muted,
              background: active ? C.accentBg : "transparent",
              marginBottom: 2, transition: "all 0.1s", userSelect: "none",
            }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{n.icon}</span>
              <span>{n.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 9, color: C.faint, letterSpacing: "0.08em", lineHeight: 1.8, textTransform: "uppercase" }}>
          Contendo recte<br />Per Aspera Ad Astra
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────
function Dashboard({ onNav }) {
  const [habits, setHabits] = useState(() => getLS("lp_habits", []));
  const todos   = getLS("lp_todos", []);
  const goals   = getLS("lp_goals", NOTION_GOALS);
  const t       = todayStr();
  const doneH   = habits.filter(h => (h.logs || []).includes(t)).length;

  const toggleHabit = id => {
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const logs = h.logs || [];
      return { ...h, logs: logs.includes(t) ? logs.filter(x => x !== t) : [...logs, t] };
    });
    setHabits(updated);
    setLS("lp_habits", updated);
  };
  const activeTodos = todos.filter(td => td.status !== "done" && td.type === "projet").length;
  const activeObjs  = (goals.hebdo || []).filter(g => g.statut !== "Terminé" && g.statut !== "Échoué" && g.statut !== "Echoué").length;

  const kpis = [
    { val: `${doneH}/${habits.length}`, label: "Habitudes aujourd'hui", sub: "complétées", nav: "habitudes", c: C.green },
    { val: activeTodos, label: "Tâches actives", sub: "projets en cours", nav: "todo", c: C.accent },
    { val: activeObjs, label: "Objectifs hebdo", sub: "restants cette semaine", nav: "objectifs", c: C.purple },
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 44 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Bonjour 👋</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 6, fontStyle: "italic" }}>
          Vivre une existence libérée — riche en bien-être, en relation et en transmission.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 40 }}>
        {kpis.map(({ val, label, sub, nav, c }) => (
          <Card key={label} onClick={() => onNav(nav)} style={{
            padding: 20, borderTop: `2px solid ${c}`, marginBottom: 0,
            transition: "border-color 0.15s",
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: c, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 12, color: C.text, marginTop: 8, fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
        Habitudes — {fmtDate(t)}
      </div>

      {habits.length === 0 ? (
        <div style={{ fontSize: 13, color: C.muted }}>
          Aucune habitude.{" "}
          <span onClick={() => onNav("habitudes")} style={{ color: C.accent, cursor: "pointer" }}>→ Configurer</span>
        </div>
      ) : (
        <>
          <ProgressBar value={habits.length ? doneH / habits.length * 100 : 0} color={doneH === habits.length ? C.green : C.accent} height={3} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 }}>
            {habits.map(h => {
              const done = (h.logs || []).includes(t);
              return (
                <Card key={h.id} onClick={() => toggleHabit(h.id)} style={{
                  padding: "10px 14px", marginBottom: 0, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderLeft: `3px solid ${done ? C.green : C.border}`,
                  opacity: done ? 0.5 : 1, transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 13 }}>{h.emoji} {h.name}</span>
                  <span style={{ color: done ? C.green : C.muted, fontSize: 16 }}>{done ? "✓" : "○"}</span>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── KEY RESULT CARD ───────────────────────────────────────────────────────
function KRCard({ kr, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(kr.actuelle ?? kr.depart ?? 0));
  const p = pct(kr.depart ?? 0, kr.actuelle ?? 0, kr.cible ?? 0);
  const levelColor = p >= 100 ? C.green : p >= 60 ? C.accent : p >= 30 ? C.amber : C.red;

  const save = () => {
    const n = parseFloat(val);
    if (!isNaN(n)) onUpdate({ ...kr, actuelle: n });
    setEditing(false);
  };

  return (
    <div style={{
      background: C.surface2, borderRadius: 8, padding: "12px 14px", marginBottom: 6,
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: C.text, flex: 1 }}>{kr.nom}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: levelColor, fontWeight: 600 }}>{p}%</span>
          <span onClick={() => setEditing(!editing)} style={{ fontSize: 10, color: C.muted, cursor: "pointer" }}>✎</span>
          <span onClick={() => onDelete(kr.id)} style={{ fontSize: 11, color: C.muted, cursor: "pointer" }}>✕</span>
        </div>
      </div>

      <ProgressBar value={p} color={levelColor} height={4} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: C.muted }}>Départ : {kr.depart ?? 0}</span>
        {editing ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              value={val} onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()}
              style={{
                width: 70, background: C.surface3, border: `1px solid ${C.borderMid}`,
                color: C.text, padding: "3px 8px", borderRadius: 6, fontSize: 11,
                fontFamily: "inherit", outline: "none",
              }}
            />
            <button onClick={save} style={{
              background: C.accent, color: "#0b0b0e", border: "none",
              padding: "3px 8px", borderRadius: 6, fontSize: 10, cursor: "pointer",
            }}>OK</button>
          </div>
        ) : (
          <span style={{ fontSize: 10, color: C.text, fontWeight: 600 }}>{kr.actuelle ?? kr.depart ?? 0} / {kr.cible ?? 0}</span>
        )}
      </div>
    </div>
  );
}

// ── OBJECTIF CARD ─────────────────────────────────────────────────────────
function ObjectifCard({ obj, levelColor, levelId, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [newKR, setNewKR] = useState({ nom: "", depart: "", actuelle: "", cible: "" });
  const [addingKR, setAddingKR] = useState(false);

  const krs = obj.krs || [];
  const avgPct = krs.length ? Math.round(krs.reduce((s, k) => s + pct(k.depart ?? 0, k.actuelle ?? 0, k.cible ?? 0), 0) / krs.length) : null;
  const st = STATUTS[obj.statut] || { c: C.muted };

  const addKR = () => {
    if (!newKR.nom.trim()) return;
    const kr = {
      id: uid(), nom: newKR.nom.trim(),
      depart: parseFloat(newKR.depart) || 0,
      actuelle: parseFloat(newKR.actuelle) || parseFloat(newKR.depart) || 0,
      cible: parseFloat(newKR.cible) || 0,
    };
    onUpdate({ ...obj, krs: [...krs, kr] });
    setNewKR({ nom: "", depart: "", actuelle: "", cible: "" });
    setAddingKR(false);
  };

  const updateKR = (updated) => onUpdate({ ...obj, krs: krs.map(k => k.id === updated.id ? updated : k) });
  const deleteKR = (id) => onUpdate({ ...obj, krs: krs.filter(k => k.id !== id) });

  const isDone = obj.statut === "Terminé";

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
      marginBottom: 8, overflow: "hidden", opacity: isDone ? 0.5 : 1,
      borderLeft: `3px solid ${st.c}`,
    }}>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: isDone ? C.muted : C.text, textDecoration: isDone ? "line-through" : "none" }}>
                {obj.titre}
              </span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <StatusPill statut={obj.statut} />
              {(obj.spaces || []).map(sp => <SpacePill key={sp} space={sp} />)}
              {levelId === "hebdo" && obj.avec && (
                <Pill label={`👤 ${obj.avec}`} color={C.muted} />
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {avgPct !== null && (
              <span style={{ fontSize: 12, fontWeight: 700, color: levelColor }}>{avgPct}%</span>
            )}
            <Select
              value={obj.statut}
              options={levelId === "hebdo" ? STATUS_OPTIONS_HEBDO : STATUS_OPTIONS_BASE}
              onChange={v => onUpdate({ ...obj, statut: v })}
              style={{ fontSize: 11, padding: "4px 8px" }}
            />
            <span onClick={() => setOpen(!open)} style={{ fontSize: 11, color: levelColor, cursor: "pointer", userSelect: "none" }}>
              KR {open ? "▲" : "▼"}
            </span>
            <span onClick={() => onDelete(obj.id)} style={{ fontSize: 12, color: C.muted, cursor: "pointer" }}>✕</span>
          </div>
        </div>

        {krs.length > 0 && avgPct !== null && (
          <div style={{ marginTop: 10 }}>
            <ProgressBar value={avgPct} color={levelColor} height={3} />
          </div>
        )}
      </div>

      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ paddingTop: 12 }}>
            {krs.length === 0 && !addingKR && (
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Aucun Key Result.</div>
            )}
            {krs.map(kr => <KRCard key={kr.id} kr={kr} onUpdate={updateKR} onDelete={deleteKR} />)}

            {addingKR ? (
              <div style={{ background: C.surface2, borderRadius: 8, padding: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 500 }}>Nouveau Key Result</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <input
                    placeholder="Nom du KR..."
                    value={newKR.nom} onChange={e => setNewKR(p => ({ ...p, nom: e.target.value }))}
                    style={{ background: C.surface3, border: `1px solid ${C.border}`, color: C.text, padding: "7px 10px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {[["depart", "Départ"], ["actuelle", "Actuelle"], ["cible", "Cible"]].map(([k, l]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{l}</div>
                        <input
                          type="number" placeholder="0"
                          value={newKR[k]} onChange={e => setNewKR(p => ({ ...p, [k]: e.target.value }))}
                          style={{ width: "100%", boxSizing: "border-box", background: C.surface3, border: `1px solid ${C.border}`, color: C.text, padding: "6px 8px", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none" }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                    <Btn onClick={addKR} variant="accent">Ajouter</Btn>
                    <Btn onClick={() => setAddingKR(false)} variant="ghost">Annuler</Btn>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingKR(true)} style={{
                background: "transparent", border: `1px dashed ${C.borderMid}`, color: C.muted,
                padding: "7px 14px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                fontFamily: "inherit", width: "100%", marginTop: 4,
              }}>+ Key Result</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── OBJECTIFS MODULE ───────────────────────────────────────────────────────
function ObjectifsModule() {
  const [goals, setGoals] = useState(() => getLS("lp_goals", NOTION_GOALS));
  const [tab, setTab] = useState("lt");
  const [newTitre, setNewTitre] = useState("");
  const [newSpaces, setNewSpaces] = useState([]);
  const [newAvec, setNewAvec] = useState("Solo");

  const save = d => { setGoals(d); setLS("lp_goals", d); };
  const level = LEVELS.find(l => l.id === tab);
  const items = goals[tab] || [];

  const add = () => {
    if (!newTitre.trim()) return;
    const obj = {
      id: uid(), titre: newTitre.trim(),
      statut: tab === "hebdo" ? "Pas commencé" : "Dans les blocs",
      spaces: newSpaces, krs: [],
      ...(tab === "hebdo" ? { avec: newAvec } : {}),
    };
    save({ ...goals, [tab]: [...items, obj] });
    setNewTitre(""); setNewSpaces([]);
  };

  const updateObj = (updated) => save({ ...goals, [tab]: items.map(o => o.id === updated.id ? updated : o) });
  const deleteObj = (id) => save({ ...goals, [tab]: items.filter(o => o.id !== id) });

  const activeCount = items.filter(o => o.statut !== "Terminé" && o.statut !== "Échoué" && o.statut !== "Echoué").length;
  const doneCount   = items.filter(o => o.statut === "Terminé").length;

  const toggleSpace = (sp) => setNewSpaces(s => s.includes(sp) ? s.filter(x => x !== sp) : [...s, sp]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>▲ Objectifs</h1>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Déclinaison temporelle · Key Results quantitatifs</p>
      </div>

      {/* Tabs niveaux */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, overflowX: "auto" }}>
        {LEVELS.map(l => {
          const cnt = (goals[l.id] || []).filter(o => o.statut !== "Terminé" && o.statut !== "Échoué" && o.statut !== "Echoué").length;
          const active = tab === l.id;
          return (
            <button key={l.id} onClick={() => setTab(l.id)} style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${active ? l.c : C.border}`,
              background: active ? l.c + "18" : C.surface2, color: active ? l.c : C.muted,
              cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: active ? 600 : 400,
              whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>{l.icon}</span>
              <span>{l.label}</span>
              {cnt > 0 && (
                <span style={{
                  background: l.c + "30", color: l.c, padding: "1px 6px",
                  borderRadius: 10, fontSize: 10, fontWeight: 700,
                }}>{cnt}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Formulaire ajout */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {level.icon} Nouvel objectif {level.label.toLowerCase()}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: tab !== "hebdo" ? 10 : 0 }}>
          <Input
            value={newTitre} onChange={setNewTitre}
            onKeyDown={e => e.key === "Enter" && add()}
            placeholder={`Titre de l'objectif...`}
          />
          {tab === "hebdo" && (
            <Select value={newAvec} options={AVEC_OPTIONS} onChange={setNewAvec} style={{ whiteSpace: "nowrap" }} />
          )}
          <Btn onClick={add} variant="accent" style={{ whiteSpace: "nowrap" }}>+ Ajouter</Btn>
        </div>
        {tab !== "hebdo" && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.entries(SPACES).map(([sp, { c, icon }]) => {
              const sel = newSpaces.includes(sp);
              return (
                <button key={sp} onClick={() => toggleSpace(sp)} style={{
                  padding: "4px 10px", borderRadius: 20, border: `1px solid ${sel ? c : C.border}`,
                  background: sel ? c + "20" : "transparent", color: sel ? c : C.muted,
                  cursor: "pointer", fontSize: 11, fontFamily: "inherit",
                }}>{icon} {sp}</button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Stats */}
      {items.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: C.muted }}>
            {doneCount}/{items.length} terminés · {activeCount} actifs
          </span>
          <div style={{ flex: 1, maxWidth: 160 }}>
            <ProgressBar value={items.length ? doneCount / items.length * 100 : 0} color={level.c} height={3} />
          </div>
        </div>
      )}

      {/* Liste */}
      {items.length === 0 ? (
        <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "40px 0" }}>
          Aucun objectif {level.label.toLowerCase()}.<br />
          <span style={{ fontSize: 11 }}>Ajoutez-en un ci-dessus.</span>
        </div>
      ) : items.map(obj => (
        <ObjectifCard key={obj.id} obj={obj} levelColor={level.c} levelId={tab} onUpdate={updateObj} onDelete={deleteObj} />
      ))}
    </div>
  );
}

// ── TODO ──────────────────────────────────────────────────────────────────
const TODO_STATUSES = [
  { id: "todo",  label: "À faire",  c: C.muted },
  { id: "doing", label: "En cours", c: C.accent },
  { id: "done",  label: "Fait",     c: C.green },
];
const STATUS_CYCLE = { todo: "doing", doing: "done", done: "todo" };
const TODO_TABS = { projet: "Projets", memo: "Mémos", someday: "Someday" };
const STATUS_ICONS = { todo: "○", doing: "◐", done: "●" };

function TodoModule() {
  const [todos, setTodos] = useState(() => getLS("lp_todos", []));
  const [tab, setTab] = useState("projet");
  const [newText, setNewText] = useState("");

  const save = d => { setTodos(d); setLS("lp_todos", d); };
  const add = () => {
    if (!newText.trim()) return;
    save([...todos, { id: uid(), text: newText.trim(), type: tab, status: "todo", date: todayStr() }]);
    setNewText("");
  };
  const cycle = id => save(todos.map(t => t.id === id ? { ...t, status: STATUS_CYCLE[t.status] } : t));
  const remove = id => save(todos.filter(t => t.id !== id));
  const items = todos.filter(t => t.type === tab);
  const activeCnt = tp => todos.filter(t => t.type === tp && t.status !== "done").length;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>◻ Todo</h1>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Projets · Mémos · Someday</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {Object.entries(TODO_TABS).map(([id, label]) => {
          const cnt = activeCnt(id);
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${active ? C.accent : C.border}`,
              background: active ? C.accentBg : C.surface2, color: active ? C.accent : C.muted,
              cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: active ? 600 : 400,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {label}
              {cnt > 0 && <span style={{ background: C.accentBg, color: C.accent, padding: "1px 6px", borderRadius: 10, fontSize: 10 }}>{cnt}</span>}
            </button>
          );
        })}
      </div>

      {tab === "projet" && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {QUICK_ADDS.map(({ label, prefix }) => (
            <button key={label} onClick={() => setNewText(prefix)} style={{
              padding: "5px 12px", borderRadius: 20, border: `1px solid ${C.border}`,
              background: C.surface2, color: C.muted, cursor: "pointer",
              fontSize: 11, fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <Input value={newText} onChange={setNewText} onKeyDown={e => e.key === "Enter" && add()} placeholder={`Nouvelle entrée...`} />
        <Btn onClick={add} variant="accent" style={{ whiteSpace: "nowrap" }}>+ Ajouter</Btn>
      </div>

      {tab === "projet" ? (
        TODO_STATUSES.map(st => {
          const group = items.filter(t => t.status === st.id);
          return (
            <div key={st.id} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: st.c }} />
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {st.label} — {group.length}
                </span>
              </div>
              {group.length === 0
                ? <div style={{ fontSize: 12, color: C.faint, paddingLeft: 14 }}>—</div>
                : group.map(t => <TodoItem key={t.id} item={t} onCycle={cycle} onDelete={remove} />)}
            </div>
          );
        })
      ) : (
        items.length === 0
          ? <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "40px 0" }}>Aucune entrée.</div>
          : items.map(t => <TodoItem key={t.id} item={t} onCycle={cycle} onDelete={remove} simple />)
      )}
    </div>
  );
}

function TodoItem({ item, onCycle, onDelete, simple }) {
  const st = TODO_STATUSES.find(s => s.id === item.status);
  return (
    <Card style={{
      padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12,
      opacity: item.status === "done" ? 0.4 : 1,
      borderLeft: `3px solid ${st?.c || C.border}`,
    }}>
      {simple
        ? <span style={{ color: C.faint, fontSize: 12 }}>—</span>
        : <span onClick={() => onCycle(item.id)} style={{ cursor: "pointer", color: st?.c, fontSize: 16 }}>
            {STATUS_ICONS[item.status]}
          </span>
      }
      <span style={{ flex: 1, fontSize: 13, textDecoration: item.status === "done" ? "line-through" : "none", color: C.text }}>
        {item.text}
      </span>
      <span style={{ fontSize: 10, color: C.muted }}>{item.date}</span>
      <span onClick={() => onDelete(item.id)} style={{ cursor: "pointer", color: C.muted, fontSize: 12 }}>✕</span>
    </Card>
  );
}

function EmojiInput({ value, onSave }) {
  const [local, setLocal] = useState(value);
  return (
    <input
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { const v = local.trim(); if (v) onSave(v); else setLocal(value); }}
      style={{ width: 44, textAlign: "center", background: C.surface3, border: `1px solid ${C.border}`, color: C.text, padding: "4px", borderRadius: 6, fontSize: 20, fontFamily: "inherit", outline: "none", cursor: "text" }}
    />
  );
}

// ── HABITUDES ─────────────────────────────────────────────────────────────
function HabitudesModule() {
  const [habits, setHabits] = useState(() => getLS("lp_habits", []));
  const [view, setView] = useState("today");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("⭐");

  const save = d => { setHabits(d); setLS("lp_habits", d); };
  const add = () => {
    if (!newName.trim()) return;
    save([...habits, { id: uid(), name: newName.trim(), emoji: newEmoji || "⭐", logs: [] }]);
    setNewName(""); setNewEmoji("⭐");
  };
  const toggle = (id, date) => {
    const d = date || todayStr();
    save(habits.map(h => {
      if (h.id !== id) return h;
      const logs = h.logs || [];
      return { ...h, logs: logs.includes(d) ? logs.filter(x => x !== d) : [...logs, d] };
    }));
  };
  const del = id => save(habits.filter(h => h.id !== id));
  const update = (id, patch) => save(habits.map(h => h.id === id ? { ...h, ...patch } : h));
  const streak = h => {
    let n = 0; const logs = new Set(h.logs || []); const d = new Date();
    if (!logs.has(todayStr())) d.setDate(d.getDate() - 1);
    while (true) {
      const k = d.toISOString().split("T")[0];
      if (!logs.has(k)) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  };

  const now = new Date();
  const [mYear, setMYear] = useState(now.getFullYear());
  const [mMonth, setMMonth] = useState(now.getMonth());

  const t = todayStr(), week = weekDates();
  const done = habits.filter(h => (h.logs || []).includes(t)).length;

  const prevMonth = () => { if (mMonth === 0) { setMYear(y => y - 1); setMMonth(11); } else setMMonth(m => m - 1); };
  const nextMonth = () => { if (mMonth === 11) { setMYear(y => y + 1); setMMonth(0); } else setMMonth(m => m + 1); };

  const VIEWS = [["today", "Aujourd'hui"], ["week", "Semaine"], ["mois", "Mois"], ["manage", "Gérer"]];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>⬡ Habitudes</h1>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Tracker quotidien</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {VIEWS.map(([id, label]) => {
          const active = view === id;
          return (
            <button key={id} onClick={() => setView(id)} style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${active ? C.accent : C.border}`,
              background: active ? C.accentBg : C.surface2, color: active ? C.accent : C.muted,
              cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: active ? 600 : 400,
            }}>{label}</button>
          );
        })}
      </div>

      {view === "today" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: C.muted }}>{fmtDate(t)}</span>
            {habits.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 600, color: done === habits.length ? C.green : C.accent }}>
                {done}/{habits.length} complétées
              </span>
            )}
          </div>
          {habits.length > 0 && <div style={{ marginBottom: 20 }}><ProgressBar value={habits.length ? done / habits.length * 100 : 0} color={done === habits.length ? C.green : C.accent} height={4} /></div>}
          {habits.length === 0
            ? <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "40px 0" }}>Aucune habitude. <span onClick={() => setView("manage")} style={{ color: C.accent, cursor: "pointer" }}>→ Gérer</span></div>
            : habits.map(h => {
                const isDone = (h.logs || []).includes(t);
                const s = streak(h);
                return (
                  <Card key={h.id} onClick={() => toggle(h.id)} style={{
                    display: "flex", alignItems: "center", gap: 14, marginBottom: 8, padding: "14px 16px",
                    borderLeft: `3px solid ${isDone ? C.green : C.border}`,
                    opacity: isDone ? 0.5 : 1, transition: "all 0.15s",
                  }}>
                    <span style={{ fontSize: 22 }}>{h.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, textDecoration: isDone ? "line-through" : "none" }}>{h.name}</div>
                      {s > 0 && <div style={{ fontSize: 11, color: C.accent, marginTop: 2 }}>🔥 {s} jour{s > 1 ? "s" : ""} de suite</div>}
                    </div>
                    <span style={{ fontSize: 20, color: isDone ? C.green : C.muted }}>{isDone ? "✓" : "○"}</span>
                  </Card>
                );
              })
          }
        </div>
      )}

      {view === "week" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(7, 34px)", gap: 4, alignItems: "center", marginBottom: 10 }}>
            <div />
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ fontSize: 10, color: week[i] === t ? C.accent : C.muted, textAlign: "center", fontWeight: 600 }}>{d}</div>
            ))}
          </div>
          {habits.length === 0 && <div style={{ fontSize: 13, color: C.muted }}>Aucune habitude.</div>}
          {habits.map(h => (
            <div key={h.id} style={{ display: "grid", gridTemplateColumns: "1fr repeat(7, 34px)", gap: 4, alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                {h.emoji} {h.name}
              </div>
              {week.map((d, i) => {
                const isDone = (h.logs || []).includes(d);
                const isToday = d === t;
                const canClick = d <= t;
                return (
                  <div key={i} onClick={() => canClick && toggle(h.id, d)} style={{
                    width: 30, height: 30, borderRadius: 6, margin: "0 auto",
                    background: isDone ? C.green + "30" : isToday ? C.surface3 : C.surface2,
                    border: `1px solid ${isToday ? C.accent : isDone ? C.green : C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: isDone ? C.green : C.muted,
                    cursor: canClick ? "pointer" : "default", transition: "all 0.1s",
                  }}>
                    {isDone ? "✓" : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {view === "mois" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>←</button>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text, minWidth: 140, textAlign: "center" }}>{MONTH_FR[mMonth]} {mYear}</span>
            <button onClick={nextMonth} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>→</button>
          </div>
          {habits.length === 0 && <div style={{ fontSize: 13, color: C.muted }}>Aucune habitude.</div>}
          {(() => {
            const days = monthDates(mYear, mMonth);
            return (
              <>
                <div style={{ display: "flex", gap: 0, marginBottom: 4, paddingLeft: 130 }}>
                  {days.map(d => (
                    <div key={d} style={{ width: 20, textAlign: "center", fontSize: 8, color: d === t ? C.accent : C.muted, flexShrink: 0 }}>
                      {parseInt(d.split("-")[2])}
                    </div>
                  ))}
                </div>
                {habits.map(h => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 4 }}>
                    <div style={{ width: 130, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8, flexShrink: 0 }}>
                      {h.emoji} {h.name}
                    </div>
                    {days.map(d => {
                      const isDone = (h.logs || []).includes(d);
                      const isToday = d === t;
                      const canClick = d <= t;
                      return (
                        <div key={d} onClick={() => canClick && toggle(h.id, d)} style={{
                          width: 20, height: 20, borderRadius: 3, flexShrink: 0,
                          background: isDone ? C.green + "40" : isToday ? C.surface3 : C.surface2,
                          border: `1px solid ${isToday ? C.accent : isDone ? C.green : C.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 8, color: isDone ? C.green : "transparent",
                          cursor: canClick ? "pointer" : "default",
                        }}>✓</div>
                      );
                    })}
                  </div>
                ))}
              </>
            );
          })()}
        </div>
      )}

      {view === "manage" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <input
              value={newEmoji} onChange={e => setNewEmoji(e.target.value)}
              style={{ width: 52, textAlign: "center", background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: "9px 4px", borderRadius: 8, fontSize: 18, fontFamily: "inherit", outline: "none" }}
            />
            <Input value={newName} onChange={setNewName} onKeyDown={e => e.key === "Enter" && add()} placeholder="Nom de l'habitude..." />
            <Btn onClick={add} variant="accent" style={{ whiteSpace: "nowrap" }}>+ Ajouter</Btn>
          </div>
          {habits.length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "40px 0" }}>Aucune habitude définie.</div>}
          {habits.map(h => (
            <Card key={h.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
              <EmojiInput value={h.emoji} onSave={v => update(h.id, { emoji: v })} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{h.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{(h.logs || []).length} entrées · {streak(h)} jours en cours</div>
              </div>
              <Btn onClick={() => del(h.id)} variant="ghost" style={{ fontSize: 11, color: C.red, borderColor: C.red + "40", padding: "4px 12px" }}>
                Supprimer
              </Btn>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── WORKPERF ──────────────────────────────────────────────────────────────
function WPSessionCard({ session: s, onDelete, fmtMin }) {
  const tc = WP_TYPE_C[s.type] || C.muted;
  return (
    <Card style={{ padding: "12px 16px", marginBottom: 6, display: "flex", alignItems: "center", gap: 12, borderLeft: `3px solid ${tc}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{s.tache}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: tc, fontWeight: 600 }}>{s.type}</span>
          <span style={{ fontSize: 11, color: C.muted }}>{s.domaine}</span>
          <span style={{ fontSize: 11, color: C.muted }}>{s.efficience}</span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{fmtMin(s.temps)}</div>
        <span onClick={() => onDelete(s.id)} style={{ fontSize: 11, color: C.muted, cursor: "pointer" }}>✕</span>
      </div>
    </Card>
  );
}

function WorkPerfModule() {
  const [sessions, setSessions] = useState(() => getLS("lp_workperf", []));
  const [view, setView] = useState("today");
  const [form, setForm] = useState({ tache: "", temps: "", type: "DEEP", domaine: "BUSINESS", efficience: "💡💡💡" });

  const save = d => { setSessions(d); setLS("lp_workperf", d); };
  const add = () => {
    if (!form.tache.trim() || !form.temps) return;
    save([...sessions, { id: uid(), tache: form.tache.trim(), date: todayStr(), temps: parseInt(form.temps), type: form.type, domaine: form.domaine, efficience: form.efficience }]);
    setForm(f => ({ ...f, tache: "", temps: "" }));
  };
  const del = id => save(sessions.filter(s => s.id !== id));

  const t = todayStr();
  const todaySessions = sessions.filter(s => s.date === t);
  const totalToday = todaySessions.reduce((a, s) => a + s.temps, 0);
  const deepToday  = todaySessions.filter(s => s.type === "DEEP").reduce((a, s) => a + s.temps, 0);
  const weekTotal  = sessions.filter(s => weekDates().includes(s.date)).reduce((a, s) => a + s.temps, 0);

  const byDate = sessions.reduce((acc, s) => { (acc[s.date] ??= []).push(s); return acc; }, {});
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  const byDomaine = sessions.reduce((acc, s) => { acc[s.domaine] = (acc[s.domaine] || 0) + s.temps; return acc; }, {});

  const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? String(m % 60).padStart(2, "0") : ""}` : `${m}min`;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>⏱ WorkPerf</h1>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Tracker de sessions de travail</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
        {[
          { val: fmtMin(totalToday), label: "Total aujourd'hui", c: C.accent },
          { val: fmtMin(deepToday),  label: "DEEP aujourd'hui",  c: C.purple },
          { val: fmtMin(weekTotal),  label: "Total semaine",     c: C.blue },
        ].map(({ val, label, c }) => (
          <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `2px solid ${c}`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{val || "0min"}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      <Card style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>+ Nouvelle session</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Input value={form.tache} onChange={v => setForm(f => ({ ...f, tache: v }))} onKeyDown={e => e.key === "Enter" && add()} placeholder="Tâche..." style={{ flex: 2 }} />
          <input
            type="number" min="1" placeholder="min" value={form.temps}
            onChange={e => setForm(f => ({ ...f, temps: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && add()}
            style={{ width: 72, background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: "9px 10px", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Select value={form.type} options={WP_TYPES} onChange={v => setForm(f => ({ ...f, type: v }))} />
          <Select value={form.domaine} options={WP_DOMAINES} onChange={v => setForm(f => ({ ...f, domaine: v }))} />
          <Select value={form.efficience} options={WP_EFFICIENCE} onChange={v => setForm(f => ({ ...f, efficience: v }))} />
          <Btn onClick={add} variant="accent">+ Ajouter</Btn>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {[["today", "Aujourd'hui"], ["history", "Historique"], ["stats", "Stats"]].map(([id, label]) => {
          const active = view === id;
          return (
            <button key={id} onClick={() => setView(id)} style={{
              padding: "8px 16px", borderRadius: 8, border: `1px solid ${active ? C.accent : C.border}`,
              background: active ? C.accentBg : C.surface2, color: active ? C.accent : C.muted,
              cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: active ? 600 : 400,
            }}>{label}</button>
          );
        })}
      </div>

      {view === "today" && (
        <div>
          {todaySessions.length === 0
            ? <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "40px 0" }}>Aucune session aujourd'hui.</div>
            : todaySessions.map(s => <WPSessionCard key={s.id} session={s} onDelete={del} fmtMin={fmtMin} />)
          }
        </div>
      )}

      {view === "history" && (
        <div>
          {sortedDates.length === 0
            ? <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "40px 0" }}>Aucune session enregistrée.</div>
            : sortedDates.map(date => {
                const daySessions = byDate[date];
                const dayTotal = daySessions.reduce((a, s) => a + s.temps, 0);
                return (
                  <div key={date} style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>{fmtDate(date)}</span>
                      <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>{fmtMin(dayTotal)}</span>
                    </div>
                    {daySessions.map(s => <WPSessionCard key={s.id} session={s} onDelete={del} fmtMin={fmtMin} />)}
                  </div>
                );
              })
          }
        </div>
      )}

      {view === "stats" && (
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Temps total par domaine</div>
          {WP_DOMAINES.filter(d => byDomaine[d]).sort((a, b) => byDomaine[b] - byDomaine[a]).map(d => {
            const total = byDomaine[d];
            const maxVal = Math.max(...Object.values(byDomaine));
            return (
              <div key={d} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: C.text }}>{d}</span>
                  <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>{fmtMin(total)}</span>
                </div>
                <ProgressBar value={total / maxVal * 100} color={C.accent} height={4} />
              </div>
            );
          })}
          {Object.keys(byDomaine).length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "40px 0" }}>Aucune donnée.</div>}
        </div>
      )}
    </div>
  );
}

// ── DAILY PAPER ────────────────────────────────────────────────────────────
function DJRating({ label, baseIcon, options, value, onChange }) {
  const idx = options.indexOf(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 10, color: C.muted, minWidth: 46 }}>{label}</span>
      {options.map((o, i) => (
        <span key={i} onClick={() => onChange(value === o ? "" : o)} style={{
          cursor: "pointer", fontSize: 13, userSelect: "none",
          opacity: idx >= i ? 1 : 0.18, transition: "opacity 0.1s",
        }}>{baseIcon}</span>
      ))}
    </div>
  );
}

function DailyPaperModule() {
  const [daily, setDaily] = useState(() => getLS("lp_daily", {}));
  const [selDate, setSelDate] = useState(todayStr());

  const save = d => { setDaily(d); setLS("lp_daily", d); };
  const setField = (field, val) => {
    const e = djEntry(daily[selDate]);
    save({ ...daily, [selDate]: { ...e, [field]: val } });
  };

  const entry = djEntry(daily[selDate]);

  const hasContent = e => {
    const d = djEntry(e);
    return d.trucs_faits || d.lotd || d.gratitude || d.reflexions || d.remark || d.morning;
  };
  const sortedDates = Object.keys(daily).filter(d => hasContent(daily[d])).sort((a, b) => b.localeCompare(a));

  const t = todayStr();
  const isToday = selDate === t;

  const prevDay = () => {
    const d = new Date(selDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setSelDate(d.toISOString().split("T")[0]);
  };
  const nextDay = () => {
    const d = new Date(selDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split("T")[0];
    if (next <= t) setSelDate(next);
  };

  const SECTIONS = [
    { key: "trucs_faits", label: "Les trucs faits",  placeholder: "Liste les événements et activités du jour..." },
    { key: "lotd",        label: "LOTD",              placeholder: "Qu'as-tu appris ou compris aujourd'hui ?" },
    { key: "gratitude",   label: "Gratitude",          placeholder: "Pour quoi es-tu reconnaissant aujourd'hui ?" },
    { key: "reflexions",  label: "Réflexions",         placeholder: "Réflexions sur les événements ou émotions du jour..." },
  ];

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>✦ Daily Paper</h1>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Journal quotidien structuré</p>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Date navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <button onClick={prevDay} style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>←</button>
            <span style={{ fontSize: 13, fontWeight: 600, color: isToday ? C.accent : C.text, flex: 1, textAlign: "center" }}>
              {fmtDate(selDate)}{isToday ? " · Aujourd'hui" : ""}
            </span>
            <button onClick={nextDay} disabled={isToday} style={{
              background: C.surface2, border: `1px solid ${C.border}`, color: isToday ? C.muted : C.text,
              padding: "5px 12px", borderRadius: 6, cursor: isToday ? "default" : "pointer",
              fontFamily: "inherit", fontSize: 14, opacity: isToday ? 0.35 : 1,
            }}>→</button>
          </div>

          {/* Indicators card */}
          <Card style={{ padding: 16, marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <Select value={entry.type} options={DJ_TYPES} onChange={v => setField("type", v)} />
              <Input value={entry.remark} onChange={v => setField("remark", v)} placeholder="Remarque courte..." style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <DJRating label="Matin"  baseIcon="⚡" options={DJ_ENERGY} value={entry.morning} onChange={v => setField("morning", v)} />
                <DJRating label="Midi"   baseIcon="⚡" options={DJ_ENERGY} value={entry.noon}    onChange={v => setField("noon",    v)} />
                <DJRating label="Soir"   baseIcon="⚡" options={DJ_ENERGY} value={entry.evening} onChange={v => setField("evening", v)} />
              </div>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <DJRating label="Focus"  baseIcon="❖" options={DJ_FOCUS}  value={entry.focus}   onChange={v => setField("focus",   v)} />
                <DJRating label="Stress" baseIcon="✶" options={DJ_STRESS} value={entry.stress}  onChange={v => setField("stress",  v)} />
              </div>
            </div>
          </Card>

          {/* 4 writing sections */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {SECTIONS.map(({ key, label, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{label}</div>
                <textarea
                  value={entry[key] || ""}
                  onChange={e => setField(key, e.target.value)}
                  placeholder={placeholder}
                  style={{
                    minHeight: 160, background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 8, color: C.text, padding: "12px 14px", fontSize: 12,
                    fontFamily: "inherit", lineHeight: 1.65, resize: "vertical",
                    outline: "none", boxSizing: "border-box", width: "100%",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Entrées récentes</div>
          {sortedDates.length === 0
            ? <div style={{ fontSize: 12, color: C.faint }}>—</div>
            : sortedDates.slice(0, 30).map(d => {
                const e = djEntry(daily[d]);
                const preview = e.trucs_faits || e.reflexions || e.lotd || e.remark || "";
                const active = selDate === d;
                return (
                  <div key={d} onClick={() => setSelDate(d)} style={{
                    padding: "8px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 4,
                    background: active ? C.accentBg : C.surface,
                    border: `1px solid ${active ? C.accent : C.border}`,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? C.accent : C.text }}>
                      {new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </div>
                    {e.morning && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>⚡{e.morning.length}{e.focus ? ` ❖${e.focus.length}` : ""}</div>}
                    {preview && <div style={{ fontSize: 10, color: C.faint, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview.slice(0, 32)}</div>}
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}

// ── LOGS ──────────────────────────────────────────────────────────────────
function DayLogCard({ date, habits, daily, onToggleHabit, onDeleteDaily, onUpdateDaily }) {
  const [editing, setEditing] = useState(false);
  const t = todayStr();
  const raw = daily[date];
  const paperEntry = raw ? djEntry(raw) : null;
  const editEntry  = djEntry(raw);
  const doneCount  = habits.filter(h => (h.logs || []).includes(date)).length;

  return (
    <div style={{ marginLeft: 20, marginBottom: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{fmtDate(date)}</span>
        {date === t && <Pill label="Aujourd'hui" color={C.accent} />}
      </div>

      <div style={{ padding: "10px 14px" }}>
        {/* Habits */}
        {habits.length > 0 && (
          <div style={{ marginBottom: (paperEntry || editing) ? 10 : 0 }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              Habitudes · {doneCount}/{habits.length}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {habits.map(h => {
                const done = (h.logs || []).includes(date);
                return (
                  <span key={h.id} onClick={() => onToggleHabit(h.id, date)} style={{
                    padding: "3px 10px", borderRadius: 20, cursor: "pointer", fontSize: 11, userSelect: "none",
                    border: `1px solid ${done ? C.green : C.border}`,
                    background: done ? C.greenBg : "transparent",
                    color: done ? C.green : C.muted, transition: "all 0.1s",
                  }}>
                    {h.emoji} {h.name}{done ? " ✓" : ""}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Paper — view */}
        {paperEntry && !editing && (
          <div style={{ borderTop: habits.length > 0 ? `1px solid ${C.border}` : "none", paddingTop: habits.length > 0 ? 10 : 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Daily Paper</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{paperEntry.type}</span>
                  {paperEntry.morning && <span style={{ fontSize: 11, color: C.text }}>⚡×{paperEntry.morning.length}</span>}
                  {paperEntry.focus   && <span style={{ fontSize: 11, color: C.text }}>❖×{paperEntry.focus.length}</span>}
                  {paperEntry.stress  && <span style={{ fontSize: 11, color: C.text }}>✶×{paperEntry.stress.length}</span>}
                  {paperEntry.remark  && <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>"{paperEntry.remark}"</span>}
                </div>
                {["trucs_faits","lotd","gratitude","reflexions"].some(k => paperEntry[k]) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
                    {[
                      { key: "trucs_faits", label: "Les trucs faits" },
                      { key: "lotd",        label: "LOTD" },
                      { key: "gratitude",   label: "Gratitude" },
                      { key: "reflexions",  label: "Réflexions" },
                    ].filter(s => paperEntry[s.key]).map(({ key, label }) => (
                      <div key={key}>
                        <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {paperEntry[key]}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                <Btn onClick={() => setEditing(true)} variant="ghost" style={{ fontSize: 11, padding: "4px 10px" }}>✎</Btn>
                <Btn onClick={() => onDeleteDaily(date)} variant="ghost" style={{ fontSize: 11, padding: "4px 10px", color: C.red, borderColor: C.red + "40" }}>✕</Btn>
              </div>
            </div>
          </div>
        )}

        {/* Daily Paper — inline edit */}
        {editing && (
          <div style={{ borderTop: habits.length > 0 ? `1px solid ${C.border}` : "none", paddingTop: habits.length > 0 ? 10 : 0 }}>
            <div style={{ fontSize: 10, color: C.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>✎ Daily Paper</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <Select value={editEntry.type} options={DJ_TYPES} onChange={v => onUpdateDaily(date, "type", v)} />
              <Input value={editEntry.remark} onChange={v => onUpdateDaily(date, "remark", v)} placeholder="Remarque..." style={{ flex: 1 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <DJRating label="Matin"  baseIcon="⚡" options={DJ_ENERGY} value={editEntry.morning} onChange={v => onUpdateDaily(date, "morning", v)} />
                <DJRating label="Midi"   baseIcon="⚡" options={DJ_ENERGY} value={editEntry.noon}    onChange={v => onUpdateDaily(date, "noon",    v)} />
                <DJRating label="Soir"   baseIcon="⚡" options={DJ_ENERGY} value={editEntry.evening} onChange={v => onUpdateDaily(date, "evening", v)} />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <DJRating label="Focus"  baseIcon="❖" options={DJ_FOCUS}  value={editEntry.focus}   onChange={v => onUpdateDaily(date, "focus",   v)} />
                <DJRating label="Stress" baseIcon="✶" options={DJ_STRESS} value={editEntry.stress}  onChange={v => onUpdateDaily(date, "stress",  v)} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              {[
                { key: "trucs_faits", label: "Les trucs faits", ph: "Activités du jour..." },
                { key: "lotd",        label: "LOTD",            ph: "Ce que tu as appris..." },
                { key: "gratitude",   label: "Gratitude",       ph: "Reconnaissant pour..." },
                { key: "reflexions",  label: "Réflexions",      ph: "Réflexions..." },
              ].map(({ key, label, ph }) => (
                <div key={key}>
                  <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                  <textarea
                    value={editEntry[key] || ""}
                    onChange={e => onUpdateDaily(date, key, e.target.value)}
                    placeholder={ph}
                    style={{ width: "100%", minHeight: 80, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, padding: "8px 10px", fontSize: 11, fontFamily: "inherit", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
            <Btn onClick={() => setEditing(false)} variant="accent" style={{ fontSize: 11 }}>✓ Terminé</Btn>
          </div>
        )}

        {!paperEntry && !editing && habits.length === 0 && (
          <div style={{ fontSize: 11, color: C.faint }}>—</div>
        )}
      </div>
    </div>
  );
}

function LogsModule() {
  const [habits, setHabits] = useState(() => getLS("lp_habits", []));
  const [daily,  setDaily]  = useState(() => getLS("lp_daily",  {}));

  const todayMk = todayStr().slice(0, 7);
  const todayWk = weekStart(todayStr());
  const [openMonths, setOpenMonths] = useState(() => new Set([todayMk]));
  const [openWeeks,  setOpenWeeks]  = useState(() => new Set([todayWk]));

  const toggleMonth = mk => setOpenMonths(s => { const n = new Set(s); n.has(mk) ? n.delete(mk) : n.add(mk); return n; });
  const toggleWeek  = wk => setOpenWeeks(s  => { const n = new Set(s); n.has(wk) ? n.delete(wk) : n.add(wk); return n; });

  const saveHabits = h => { setHabits(h); setLS("lp_habits", h); };
  const saveDaily  = d => { setDaily(d);  setLS("lp_daily",  d); };

  const onToggleHabit = (habitId, date) => {
    saveHabits(habits.map(h => {
      if (h.id !== habitId) return h;
      const logs = h.logs || [];
      return { ...h, logs: logs.includes(date) ? logs.filter(x => x !== date) : [...logs, date] };
    }));
  };

  const onDeleteDaily = date => {
    const { [date]: _, ...rest } = daily;
    saveDaily(rest);
  };

  const onUpdateDaily = (date, field, val) => {
    const e = djEntry(daily[date]);
    saveDaily({ ...daily, [date]: { ...e, [field]: val } });
  };

  // Gather all dates with any activity
  const allDates = new Set();
  habits.forEach(h => (h.logs || []).forEach(d => allDates.add(d)));
  Object.keys(daily).forEach(d => {
    const e = djEntry(daily[d]);
    if (e.morning || e.trucs_faits || e.lotd || e.gratitude || e.reflexions || e.remark) allDates.add(d);
  });

  // Group: monthKey → weekKey → [dates]
  const byMonth = {};
  [...allDates].sort((a, b) => b.localeCompare(a)).forEach(d => {
    const mk = d.slice(0, 7);
    const wk = weekStart(d);
    (byMonth[mk] ??= {})[wk] ??= [];
    byMonth[mk][wk].push(d);
  });

  const sortedMonths = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>◈ Logs</h1>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Historique journalier · Habitudes · Daily Paper</p>
      </div>

      {sortedMonths.length === 0 && (
        <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "60px 0" }}>
          Aucun log pour l'instant. Commence à remplir tes habitudes et ton Daily Paper !
        </div>
      )}

      {sortedMonths.map(mk => {
        const [year, month] = mk.split("-").map(Number);
        const monthOpen = openMonths.has(mk);
        const sortedWeeks = Object.keys(byMonth[mk]).sort((a, b) => b.localeCompare(a));
        const totalDays = sortedWeeks.reduce((s, wk) => s + byMonth[mk][wk].length, 0);

        return (
          <div key={mk} style={{ marginBottom: 10 }}>
            {/* Month header */}
            <div onClick={() => toggleMonth(mk)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              cursor: "pointer", userSelect: "none",
              marginBottom: monthOpen ? 8 : 0,
            }}>
              <span style={{ fontSize: 10, color: C.muted, width: 10 }}>{monthOpen ? "▼" : "▶"}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{MONTH_FR[month - 1]} {year}</span>
              <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>{totalDays} jour{totalDays > 1 ? "s" : ""}</span>
            </div>

            {monthOpen && sortedWeeks.map(wk => {
              const weekOpen = openWeeks.has(wk);
              const dates = [...byMonth[mk][wk]].sort((a, b) => b.localeCompare(a));
              const wkEndD = new Date(wk + "T12:00:00");
              wkEndD.setDate(wkEndD.getDate() + 6);
              const wkEnd = wkEndD.toISOString().split("T")[0];
              const wkLabel = `${new Date(wk + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} → ${new Date(wkEnd + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;

              return (
                <div key={wk} style={{ marginLeft: 16, marginBottom: 6 }}>
                  {/* Week header */}
                  <div onClick={() => toggleWeek(wk)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "8px 14px",
                    background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8,
                    cursor: "pointer", userSelect: "none",
                    marginBottom: weekOpen ? 6 : 0,
                  }}>
                    <span style={{ fontSize: 10, color: C.muted, width: 10 }}>{weekOpen ? "▼" : "▶"}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Semaine du {wkLabel}</span>
                    <span style={{ fontSize: 10, color: C.faint, marginLeft: "auto" }}>{dates.length} j.</span>
                  </div>

                  {weekOpen && dates.map(date => (
                    <DayLogCard
                      key={date}
                      date={date}
                      habits={habits}
                      daily={daily}
                      onToggleHabit={onToggleHabit}
                      onDeleteDaily={onDeleteDaily}
                      onUpdateDaily={onUpdateDaily}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── APP ROOT ───────────────────────────────────────────────────────────────
export default function App() {
  const [module, setModule] = useState("dashboard");

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, system-ui, -apple-system, sans-serif", overflow: "hidden" }}>
      <Sidebar current={module} onNav={setModule} />
      <main style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
        {module === "dashboard"  && <Dashboard  onNav={setModule} />}
        {module === "objectifs"  && <ObjectifsModule />}
        {module === "todo"       && <TodoModule />}
        {module === "habitudes"  && <HabitudesModule />}
        {module === "workperf"   && <WorkPerfModule />}
        {module === "daily"      && <DailyPaperModule />}
        {module === "logs"       && <LogsModule />}
      </main>
    </div>
  );
}
