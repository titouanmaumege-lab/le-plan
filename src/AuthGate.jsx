import { useState, useEffect, useRef } from "react";
import { supabase, loadUserData, hydrateLocalStorage, syncToSupabase } from "./supabase";

const C = {
  bg: "#0d0d1a", surface: "#12112a", surface2: "#1a1830",
  border: "rgba(139,92,246,0.15)", borderMid: "rgba(139,92,246,0.4)",
  accent: "#8b5cf6", text: "#f1f0ff", muted: "#9391b5",
  green: "#10b981", red: "#ef4444",
};

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sessionRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleSession(session);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) handleSession(session);
      else { sessionRef.current = null; setSession(null); setLoading(false); }
    });

    // Re-sync from Supabase when tab becomes visible (cross-device sync)
    const onVisible = () => {
      if (document.visibilityState === "visible" && sessionRef.current) {
        loadUserData(sessionRef.current.user.id).then(data => {
          if (!data) return;
          const before = localStorage.getItem("lp_habits");
          hydrateLocalStorage(data);
          // If remote data differs from local, reload so React re-reads localStorage
          if (localStorage.getItem("lp_habits") !== before) window.location.reload();
        }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => { subscription.unsubscribe(); document.removeEventListener("visibilitychange", onVisible); };
  }, []);

  async function handleSession(session) {
    setLoading(true);
    sessionRef.current = session;
    try {
      const data = await loadUserData(session.user.id);
      if (data) {
        hydrateLocalStorage(data);
      } else {
        setMigrating(true);
        await syncToSupabase(session.user.id);
        setMigrating(false);
      }
    } catch (e) {
      console.error("Load error:", e);
    }
    setSession(session);
    setLoading(false);
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (cooldown > 0) return;
    setError("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const sec = error.message.match(/(\d+) seconds?/)?.[1];
        if (sec) setCooldown(parseInt(sec));
        else setError(error.message);
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        const sec = error.message.match(/(\d+) seconds?/)?.[1];
        if (sec) setCooldown(parseInt(sec));
        else setError(error.message);
      } else setError("Vérifie ton email pour confirmer le compte.");
    }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.muted, fontSize: 14 }}>
      {migrating ? "Migration des données en cours…" : "Chargement…"}
    </div>
  );

  if (!session) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg }}>
      <div style={{ width: 360, padding: 32, background: C.surface, borderRadius: 16, border: `1px solid ${C.borderMid}` }}>
        <h2 style={{ color: C.text, fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>Le Plan</h2>
        <p style={{ color: C.muted, fontSize: 13, textAlign: "center", marginBottom: 28 }}>
          {mode === "login" ? "Connecte-toi" : "Crée ton compte"}
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={inputStyle}
          />
          <input
            type="password" placeholder="Mot de passe" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={inputStyle}
          />
          {error && <p style={{ color: error.includes("Vérifie") ? C.green : C.red, fontSize: 12, margin: 0 }}>{error}</p>}
          {cooldown > 0 && <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>Patiente {cooldown}s…</p>}
          <button type="submit" disabled={cooldown > 0} style={{ ...btnStyle, opacity: cooldown > 0 ? 0.5 : 1, cursor: cooldown > 0 ? "not-allowed" : "pointer" }}>
            {cooldown > 0 ? `Patiente ${cooldown}s` : mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>
        </form>
        <p style={{ color: C.muted, fontSize: 12, textAlign: "center", marginTop: 16, cursor: "pointer" }}
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
          {mode === "login" ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
        </p>
      </div>
    </div>
  );

  return children({ session, signOut: () => supabase.auth.signOut() });
}

const inputStyle = {
  background: "#0d0d1a", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8,
  padding: "10px 14px", color: "#f1f0ff", fontSize: 14, outline: "none",
};
const btnStyle = {
  background: "linear-gradient(135deg, #8b5cf6, #6366f1)", border: "none",
  borderRadius: 8, padding: "11px 0", color: "#fff", fontSize: 14,
  fontWeight: 600, cursor: "pointer", marginTop: 4,
};
