import { useState, useEffect } from "react";

// ── UTILS ──────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const getLS = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; } };
const setLS = (key, val) => localStorage.setItem(key, JSON.stringify(val));
const todayStr = () => new Date().toISOString().split("T")[0];
const weekDates = () => {
  const d = new Date();
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(d);
    dt.setDate(d.getDate() - day + i);
    return dt.toISOString().split("T")[0];
  });
};
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const fmtDate = (s) => {
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────
const T = {
  bg: "#080808", surface: "#111", surface2: "#181818",
  border: "#222", borderHover: "#333",
  accent: "#c9a227", accentDim: "#7a6218", accentBg: "#c9a22712",
  text: "#d8d8d8", muted: "#555", faint: "#333",
  green: "#2d9e5e", red: "#c0392b",
  lvlColors: { lt: "#7c3aed", annuel: "#2563eb", trimestriel: "#0891b2", mensuel: "#059669", hebdo: "#c9a227" },
};

const s = {
  app: { display: "flex", height: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Mono', 'Courier New', monospace", overflow: "hidden" },
  sidebar: { width: 200, minWidth: 200, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column" },
  main: { flex: 1, overflowY: "auto", padding: "36px 40px" },
  wrap: { maxWidth: 820, margin: "0 auto" },

  logo: { padding: "22px 20px 18px", borderBottom: `1px solid ${T.border}` },
  nav: (active) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "9px 20px",
    cursor: "pointer", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
    color: active ? T.accent : T.muted,
    background: active ? T.accentBg : "transparent",
    borderLeft: `2px solid ${active ? T.accent : "transparent"}`,
    transition: "all 0.12s", userSelect: "none",
  }),

  h1: { fontSize: 18, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: 4 },
  h2: { fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: 28 },
  sectionLabel: { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 8 },

  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 3, padding: 16, marginBottom: 8 },
  input: { background: T.surface2, border: `1px solid ${T.border}`, color: T.text, padding: "8px 12px", borderRadius: 2, fontSize: 12, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" },
  btn: (v = "default") => ({
    padding: "7px 14px", borderRadius: 2, cursor: "pointer", fontSize: 11, fontFamily: "inherit",
    letterSpacing: "0.08em", textTransform: "uppercase", transition: "opacity 0.12s",
    ...(v === "accent" ? { background: T.accent, color: "#080808", border: "none" } :
       v === "ghost"  ? { background: "transparent", color: T.muted, border: `1px solid ${T.border}` } :
                        { background: T.surface2, color: T.text, border: `1px solid ${T.border}` }),
  }),
  tabs: { display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 24, gap: 0 },
  tab: (a) => ({
    padding: "8px 18px", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
    cursor: "pointer", color: a ? T.accent : T.muted,
    borderBottom: `2px solid ${a ? T.accent : "transparent"}`, marginBottom: -1,
    background: "transparent", userSelect: "none",
  }),
  badge: (c) => ({
    display: "inline-block", padding: "1px 7px", borderRadius: 2, fontSize: 10,
    letterSpacing: "0.06em", background: `${c}18`, color: c, border: `1px solid ${c}35`,
  }),
  row: { display: "flex", alignItems: "center", gap: 10 },
  dot: (c) => ({ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }),
};

// ── SIDEBAR ────────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "◉", label: "Dashboard" },
  { id: "sens", icon: "▲", label: "Le Sens" },
  { id: "todo", icon: "◻", label: "Todo" },
  { id: "habitudes", icon: "⬡", label: "Habitudes" },
];

function Sidebar({ current, onNav }) {
  return (
    <div style={s.sidebar}>
      <div style={s.logo}>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: T.accent, textTransform: "uppercase" }}>LE PLAN</div>
        <div style={{ fontSize: 9, color: T.muted, letterSpacing: "0.1em", marginTop: 3 }}>Système personnel</div>
      </div>
      <div style={{ flex: 1, paddingTop: 12 }}>
        {NAV.map(n => (
          <div key={n.id} style={s.nav(current === n.id)} onClick={() => onNav(n.id)}>
            <span style={{ fontSize: 13, width: 16, textAlign: "center" }}>{n.icon}</span>
            <span>{n.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 20px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 9, color: T.faint, letterSpacing: "0.08em", lineHeight: 1.7 }}>
          Contendo recte<br />
          Per Aspera Ad Astra
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────
function Dashboard({ onNav }) {
  const habits = getLS("lp_habits", []);
  const todos = getLS("lp_todos", []);
  const goals = getLS("lp_goals", {});
  const t = todayStr();

  const doneTodayCount = habits.filter(h => (h.logs || []).includes(t)).length;
  const activeTodos = todos.filter(td => td.status !== "done" && td.type === "projet").length;
  const hebdoCount = (goals.hebdo || []).filter(g => !g.done).length;

  return (
    <div style={s.wrap}>
      <div style={{ marginBottom: 40 }}>
        <div style={s.h1}>🌌 LE PLAN</div>
        <div style={{ fontSize: 11, color: T.accentDim, letterSpacing: "0.06em", marginTop: 6, fontStyle: "italic" }}>
          Vivre une existence libérée — riche en bien-être, en relation et en transmission.
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 36 }}>
        {[
          { label: "Habitudes aujourd'hui", val: `${doneTodayCount}/${habits.length}`, sub: "complétées", nav: "habitudes", color: T.green },
          { label: "Tâches actives", val: activeTodos, sub: "en cours / à faire", nav: "todo", color: T.accent },
          { label: "Objectifs hebdo", val: hebdoCount, sub: "restants", nav: "sens", color: "#7c3aed" },
        ].map(({ label, val, sub, nav, color }) => (
          <div key={label} onClick={() => onNav(nav)} style={{
            ...s.card, cursor: "pointer", padding: "20px",
            borderTop: `2px solid ${color}`, marginBottom: 0,
          }}>
            <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 6, letterSpacing: "0.06em" }}>{label}</div>
            <div style={{ fontSize: 10, color: T.faint, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick habit check */}
      <div style={{ ...s.sectionLabel, marginBottom: 12 }}>
        Habitudes — {fmtDate(t)}
      </div>
      {habits.length === 0 ? (
        <div style={{ fontSize: 12, color: T.muted, padding: "12px 0" }}>
          Aucune habitude configurée.{" "}
          <span onClick={() => onNav("habitudes")} style={{ color: T.accent, cursor: "pointer" }}>→ Configurer</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {habits.map(h => {
            const done = (h.logs || []).includes(t);
            return (
              <div key={h.id} style={{
                ...s.card, padding: "10px 14px", marginBottom: 0,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderLeft: `2px solid ${done ? T.green : T.border}`,
                opacity: done ? 0.55 : 1,
              }}>
                <span style={{ fontSize: 13 }}>{h.emoji} {h.name}</span>
                <span style={{ color: done ? T.green : T.faint, fontSize: 16 }}>{done ? "✓" : "○"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── LE SENS ───────────────────────────────────────────────────────────────
const LEVELS = [
  { id: "lt", label: "Long Terme" },
  { id: "annuel", label: "Annuel" },
  { id: "trimestriel", label: "Trimestriel" },
  { id: "mensuel", label: "Mensuel" },
  { id: "hebdo", label: "Hebdomadaire" },
];

function SensModule() {
  const [goals, setGoals] = useState(() => getLS("lp_goals", {}));
  const [tab, setTab] = useState("lt");
  const [newGoal, setNewGoal] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const save = d => { setGoals(d); setLS("lp_goals", d); };
  const color = T.lvlColors[tab];
  const items = goals[tab] || [];

  const addGoal = () => {
    if (!newGoal.trim()) return;
    save({ ...goals, [tab]: [...items, { id: uid(), title: newGoal.trim(), done: false, kr: [] }] });
    setNewGoal("");
  };

  const toggleGoal = id => save({ ...goals, [tab]: items.map(g => g.id === id ? { ...g, done: !g.done } : g) });
  const deleteGoal = id => save({ ...goals, [tab]: items.filter(g => g.id !== id) });

  const addKR = (goalId, text) => {
    if (!text.trim()) return;
    save({ ...goals, [tab]: items.map(g => g.id === goalId ? { ...g, kr: [...(g.kr || []), { id: uid(), text, done: false }] } : g) });
  };
  const toggleKR = (goalId, krId) =>
    save({ ...goals, [tab]: items.map(g => g.id === goalId ? { ...g, kr: g.kr.map(k => k.id === krId ? { ...k, done: !k.done } : k) } : g) });

  const done = items.filter(g => g.done).length;

  return (
    <div style={s.wrap}>
      <div style={s.h1}>▲ LE SENS</div>
      <div style={s.h2}>Objectifs & Key Results</div>

      <div style={s.tabs}>
        {LEVELS.map(l => {
          const cnt = (goals[l.id] || []).filter(g => !g.done).length;
          return (
            <div key={l.id} style={s.tab(tab === l.id)} onClick={() => setTab(l.id)}>
              {l.label}
              {cnt > 0 && <span style={{ ...s.badge(T.lvlColors[l.id]), marginLeft: 6 }}>{cnt}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          style={s.input}
          placeholder="Nouvel objectif..."
          value={newGoal}
          onChange={e => setNewGoal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addGoal()}
        />
        <button style={{ ...s.btn("accent"), whiteSpace: "nowrap" }} onClick={addGoal}>+ Ajouter</button>
      </div>

      {items.length > 0 && (
        <div style={{ ...s.sectionLabel, display: "flex", justifyContent: "space-between" }}>
          <span>{done}/{items.length} objectifs atteints</span>
          <div style={{ height: 2, width: 120, background: T.border, borderRadius: 1, alignSelf: "center" }}>
            <div style={{ height: "100%", width: `${items.length ? done / items.length * 100 : 0}%`, background: color, borderRadius: 1, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: T.muted, padding: "20px 0" }}>Aucun objectif pour ce niveau. Ajoutez-en un ci-dessus.</div>
      ) : items.map(goal => (
        <GoalCard
          key={goal.id} goal={goal} color={color}
          onToggle={() => toggleGoal(goal.id)}
          onDelete={() => deleteGoal(goal.id)}
          onAddKR={t => addKR(goal.id, t)}
          onToggleKR={kId => toggleKR(goal.id, kId)}
          expanded={expandedId === goal.id}
          onExpand={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
        />
      ))}
    </div>
  );
}

function GoalCard({ goal, color, onToggle, onDelete, onAddKR, onToggleKR, expanded, onExpand }) {
  const [krInput, setKrInput] = useState("");
  const kr = goal.kr || [];
  const doneKR = kr.filter(k => k.done).length;
  const pct = kr.length ? doneKR / kr.length : 0;

  const submit = () => { if (krInput.trim()) { onAddKR(krInput); setKrInput(""); } };

  return (
    <div style={{
      ...s.card,
      borderLeft: `3px solid ${goal.done ? T.faint : color}`,
      opacity: goal.done ? 0.45 : 1,
      transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span onClick={onToggle} style={{ cursor: "pointer", color: goal.done ? T.green : T.muted, fontSize: 16, flexShrink: 0, marginTop: 2 }}>
          {goal.done ? "✓" : "○"}
        </span>
        <span style={{ flex: 1, fontSize: 13, lineHeight: 1.5, textDecoration: goal.done ? "line-through" : "none" }}>{goal.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {kr.length > 0 && <span style={{ fontSize: 10, color: T.muted }}>{doneKR}/{kr.length} KR</span>}
          <span onClick={onExpand} style={{ cursor: "pointer", fontSize: 10, color: color, letterSpacing: "0.08em", userSelect: "none" }}>
            KEY RESULTS {expanded ? "▲" : "▼"}
          </span>
          <span onClick={onDelete} style={{ cursor: "pointer", color: T.muted, fontSize: 12 }}>✕</span>
        </div>
      </div>

      {kr.length > 0 && (
        <div style={{ marginTop: 10, height: 2, background: T.border, borderRadius: 1 }}>
          <div style={{ height: "100%", width: `${pct * 100}%`, background: color, borderRadius: 1, transition: "width 0.3s" }} />
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          {kr.map(k => (
            <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
              <span onClick={() => onToggleKR(k.id)} style={{ cursor: "pointer", color: k.done ? T.green : T.muted, fontSize: 14, flexShrink: 0 }}>
                {k.done ? "✓" : "○"}
              </span>
              <span style={{ fontSize: 12, color: k.done ? T.muted : T.text, textDecoration: k.done ? "line-through" : "none" }}>{k.text}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input
              style={{ ...s.input, fontSize: 12 }}
              placeholder="Nouveau Key Result..."
              value={krInput}
              onChange={e => setKrInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
            <button style={s.btn()} onClick={submit}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TODO ──────────────────────────────────────────────────────────────────
const STATUSES = [
  { id: "todo", label: "À faire", color: T.muted },
  { id: "doing", label: "En cours", color: T.accent },
  { id: "done", label: "Fait", color: T.green },
];
const STATUS_CYCLE = { todo: "doing", doing: "done", done: "todo" };
const TAB_LABELS = { projet: "Projets", memo: "Mémos", someday: "Someday" };

function TodoModule() {
  const [todos, setTodos] = useState(() => getLS("lp_todos", []));
  const [tab, setTab] = useState("projet");
  const [newText, setNewText] = useState("");
  const [filter, setFilter] = useState("all");

  const save = d => { setTodos(d); setLS("lp_todos", d); };

  const add = () => {
    if (!newText.trim()) return;
    save([...todos, { id: uid(), text: newText.trim(), type: tab, status: "todo", date: todayStr() }]);
    setNewText("");
  };

  const cycleStatus = id => save(todos.map(t => t.id === id ? { ...t, status: STATUS_CYCLE[t.status] } : t));
  const remove = id => save(todos.filter(t => t.id !== id));

  const items = todos.filter(t => t.type === tab);
  const activeCount = t => todos.filter(td => td.type === t && td.status !== "done").length;

  return (
    <div style={s.wrap}>
      <div style={s.h1}>◻ TODO</div>
      <div style={s.h2}>Projets · Mémos · Someday</div>

      <div style={s.tabs}>
        {["projet", "memo", "someday"].map(t => (
          <div key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {TAB_LABELS[t]}
            {activeCount(t) > 0 && <span style={{ ...s.badge(T.accent), marginLeft: 6 }}>{activeCount(t)}</span>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          style={s.input}
          placeholder={`Nouvelle entrée ${TAB_LABELS[tab].toLowerCase()}...`}
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add()}
        />
        <button style={{ ...s.btn("accent"), whiteSpace: "nowrap" }} onClick={add}>+ Ajouter</button>
      </div>

      {tab === "projet" && (
        <div>
          {STATUSES.map(st => {
            const group = items.filter(t => t.status === st.id);
            return (
              <div key={st.id} style={{ marginBottom: 28 }}>
                <div style={{ ...s.sectionLabel, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={s.dot(st.color)} />
                  {st.label} — {group.length}
                </div>
                {group.length === 0 ? (
                  <div style={{ fontSize: 11, color: T.faint, paddingLeft: 16 }}>—</div>
                ) : group.map(t => (
                  <TodoItem key={t.id} item={t} onCycle={cycleStatus} onDelete={remove} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {tab !== "projet" && (
        <div>
          {items.length === 0
            ? <div style={{ fontSize: 12, color: T.muted }}>Aucune entrée.</div>
            : items.map(t => <TodoItem key={t.id} item={t} onCycle={cycleStatus} onDelete={remove} simple />)
          }
        </div>
      )}
    </div>
  );
}

function TodoItem({ item, onCycle, onDelete, simple }) {
  const st = STATUSES.find(s => s.id === item.status);
  const ICONS = { todo: "○", doing: "◐", done: "●" };
  return (
    <div style={{
      ...s.card, padding: "10px 14px", marginBottom: 6,
      display: "flex", alignItems: "center", gap: 12,
      opacity: item.status === "done" ? 0.4 : 1,
      borderLeft: `2px solid ${st?.color || T.border}`,
    }}>
      {!simple && (
        <span onClick={() => onCycle(item.id)} style={{ cursor: "pointer", color: st?.color, fontSize: 15, flexShrink: 0 }}>
          {ICONS[item.status]}
        </span>
      )}
      {simple && <span style={{ color: T.faint, fontSize: 12, flexShrink: 0 }}>—</span>}
      <span style={{ flex: 1, fontSize: 13, textDecoration: item.status === "done" ? "line-through" : "none", lineHeight: 1.4 }}>{item.text}</span>
      <span style={{ fontSize: 9, color: T.faint, flexShrink: 0 }}>{item.date}</span>
      <span onClick={() => onDelete(item.id)} style={{ cursor: "pointer", color: T.faint, fontSize: 12 }}>✕</span>
    </div>
  );
}

// ── HABITUDES ─────────────────────────────────────────────────────────────
function HabitudesModule() {
  const [habits, setHabits] = useState(() => getLS("lp_habits", []));
  const [view, setView] = useState("today");
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("⭐");

  const save = d => { setHabits(d); setLS("lp_habits", d); };

  const addHabit = () => {
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

  const deleteHabit = id => save(habits.filter(h => h.id !== id));

  const streak = (h) => {
    let n = 0;
    const logs = new Set(h.logs || []);
    const d = new Date();
    if (!logs.has(todayStr())) d.setDate(d.getDate() - 1);
    while (true) {
      const k = d.toISOString().split("T")[0];
      if (!logs.has(k)) break;
      n++; d.setDate(d.getDate() - 1);
    }
    return n;
  };

  const t = todayStr();
  const week = weekDates();
  const done = habits.filter(h => (h.logs || []).includes(t)).length;

  return (
    <div style={s.wrap}>
      <div style={s.h1}>⬡ HABITUDES</div>
      <div style={s.h2}>Tracker quotidien</div>

      <div style={s.tabs}>
        <div style={s.tab(view === "today")} onClick={() => setView("today")}>Aujourd'hui</div>
        <div style={s.tab(view === "week")} onClick={() => setView("week")}>Semaine</div>
        <div style={s.tab(view === "manage")} onClick={() => setView("manage")}>Gérer</div>
      </div>

      {/* TODAY */}
      {view === "today" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: T.muted }}>{fmtDate(t)}</div>
            {habits.length > 0 && (
              <div style={{ fontSize: 12, color: done === habits.length ? T.green : T.accent }}>
                {done}/{habits.length} complétées
              </div>
            )}
          </div>

          {habits.length > 0 && (
            <div style={{ height: 3, background: T.border, borderRadius: 2, marginBottom: 24 }}>
              <div style={{ height: "100%", width: `${habits.length ? done / habits.length * 100 : 0}%`, background: done === habits.length ? T.green : T.accent, borderRadius: 2, transition: "width 0.3s" }} />
            </div>
          )}

          {habits.length === 0 ? (
            <div style={{ fontSize: 12, color: T.muted }}>
              Aucune habitude configurée.{" "}
              <span onClick={() => setView("manage")} style={{ color: T.accent, cursor: "pointer" }}>→ Gérer</span>
            </div>
          ) : habits.map(h => {
            const isDone = (h.logs || []).includes(t);
            const s_ = streak(h);
            return (
              <div key={h.id} onClick={() => toggle(h.id)} style={{
                ...s.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginBottom: 8,
                borderLeft: `3px solid ${isDone ? T.green : T.border}`,
                opacity: isDone ? 0.5 : 1, transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 22 }}>{h.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, textDecoration: isDone ? "line-through" : "none" }}>{h.name}</div>
                  {s_ > 0 && <div style={{ fontSize: 10, color: T.accent, marginTop: 3 }}>🔥 {s_} jour{s_ > 1 ? "s" : ""} de suite</div>}
                </div>
                <span style={{ fontSize: 20, color: isDone ? T.green : T.border }}>{isDone ? "✓" : "○"}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEK */}
      {view === "week" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr repeat(7, 32px)", gap: 4, alignItems: "center", marginBottom: 10 }}>
            <div />
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ fontSize: 9, color: week[i] === t ? T.accent : T.muted, textAlign: "center", letterSpacing: "0.06em" }}>{d}</div>
            ))}
          </div>
          {habits.length === 0 && <div style={{ fontSize: 12, color: T.muted }}>Aucune habitude.</div>}
          {habits.map(h => (
            <div key={h.id} style={{ display: "grid", gridTemplateColumns: "1fr repeat(7, 32px)", gap: 4, alignItems: "center", marginBottom: 5 }}>
              <div style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                {h.emoji} {h.name}
              </div>
              {week.map((d, i) => {
                const isDone = (h.logs || []).includes(d);
                const isToday = d === t;
                const isPast = d < t;
                return (
                  <div key={i}
                    onClick={() => (isToday || isPast) && toggle(h.id, d)}
                    style={{
                      width: 28, height: 28, borderRadius: 3, margin: "0 auto",
                      background: isDone ? T.green : isToday ? T.surface2 : "#0c0c0c",
                      border: `1px solid ${isToday ? T.accent : isDone ? T.green : T.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: isDone ? "#fff" : T.faint,
                      cursor: (isToday || isPast) ? "pointer" : "default",
                      transition: "all 0.12s",
                    }}
                  >
                    {isDone ? "✓" : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* MANAGE */}
      {view === "manage" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <input style={{ ...s.input, width: 52, textAlign: "center", padding: "8px 4px" }} value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="🌟" />
            <input style={s.input} placeholder="Nom de l'habitude..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addHabit()} />
            <button style={{ ...s.btn("accent"), whiteSpace: "nowrap" }} onClick={addHabit}>+ Ajouter</button>
          </div>
          {habits.length === 0 && <div style={{ fontSize: 12, color: T.muted }}>Aucune habitude définie.</div>}
          {habits.map(h => (
            <div key={h.id} style={{ ...s.card, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
              <span style={{ fontSize: 20 }}>{h.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{h.name}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{(h.logs || []).length} entrées totales</div>
              </div>
              <button onClick={() => deleteHabit(h.id)} style={{ ...s.btn("ghost"), fontSize: 10, color: T.red, padding: "4px 10px" }}>Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── APP ROOT ───────────────────────────────────────────────────────────────
export default function App() {
  const [module, setModule] = useState("dashboard");

  return (
    <div style={s.app}>
      <Sidebar current={module} onNav={setModule} />
      <main style={s.main}>
        {module === "dashboard" && <Dashboard onNav={setModule} />}
        {module === "sens" && <SensModule />}
        {module === "todo" && <TodoModule />}
        {module === "habitudes" && <HabitudesModule />}
      </main>
    </div>
  );
}
