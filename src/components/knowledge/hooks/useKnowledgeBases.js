import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../supabase";

export function useKnowledgeBases(userId) {
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const [{ data: basesData }, { data: memberships }] = await Promise.all([
      supabase.from("knowledge_bases").select("*").eq("is_archived", false).order("position"),
      supabase.from("knowledge_base_members").select("base_id, role").eq("user_id", userId),
    ]);
    const memberMap = {};
    (memberships || []).forEach(m => { memberMap[m.base_id] = m.role; });
    const annotated = (basesData || []).map(b => ({
      ...b,
      _isOwner: b.owner_id === userId,
      _role: b.owner_id === userId ? "owner" : (memberMap[b.id] || "viewer"),
    }));
    setBases(annotated);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const createBase = async ({ name, emoji = "📚", color = "#3b82f6", parent_id = null }) => {
    const siblings = bases.filter(b => b.parent_id === parent_id);
    const { data, error } = await supabase.from("knowledge_bases").insert({
      owner_id: userId, name, emoji, color,
      parent_id, position: siblings.length,
    }).select().single();
    if (error) { console.error("createBase error:", error); return null; }
    if (data) setBases(b => [...b, data]);
    return data;
  };

  const updateBase = async (id, patch) => {
    const { data } = await supabase.from("knowledge_bases")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (data) setBases(b => b.map(x => x.id === id ? data : x));
    return data;
  };

  const archiveBase = async (id) => {
    await supabase.from("knowledge_bases").update({ is_archived: true }).eq("id", id);
    setBases(b => b.filter(x => x.id !== id));
  };

  // Helpers dérivés
  const rootBases = bases.filter(b => !b.parent_id);
  const childrenOf = (parentId) => bases.filter(b => b.parent_id === parentId);

  return { bases, rootBases, childrenOf, loading, createBase, updateBase, archiveBase, refetch: fetch };
}
