import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../supabase";

export function useBasePages(baseId, userId) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!baseId || !userId) return;
    const { data } = await supabase
      .from("knowledge_pages")
      .select("id, title, emoji, page_type, parent_id, position, created_at, updated_at")
      .eq("base_id", baseId)
      .eq("is_archived", false)
      .order("position");
    setPages(data || []);
    setLoading(false);
  }, [baseId, userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const createPage = async ({ title = "Sans titre", emoji = "📄", page_type = "note", parent_id = null }) => {
    const siblings = pages.filter(p => p.parent_id === parent_id);
    const { data } = await supabase.from("knowledge_pages").insert({
      owner_id: userId, base_id: baseId,
      title, emoji, page_type, parent_id,
      content: [], position: siblings.length,
    }).select().single();
    if (data) setPages(p => [...p, data]);
    return data;
  };

  const updatePage = async (id, patch) => {
    const { data } = await supabase.from("knowledge_pages")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (data) setPages(p => p.map(x => x.id === id ? { ...x, ...data } : x));
    return data;
  };

  const archivePage = async (id) => {
    await supabase.from("knowledge_pages").update({ is_archived: true }).eq("id", id);
    setPages(p => p.filter(x => x.id !== id));
  };

  return { pages, loading, createPage, updatePage, archivePage, refetch: fetch };
}

export function useKnowledgePage(pageId) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = { current: null };

  const fetch = useCallback(async () => {
    if (!pageId) return;
    const { data } = await supabase
      .from("knowledge_pages")
      .select("*, knowledge_page_tags(tag_id, knowledge_tags(*))")
      .eq("id", pageId)
      .single();
    setPage(data || null);
    setLoading(false);
  }, [pageId]);

  useEffect(() => { fetch(); }, [fetch]);

  const saveContent = useCallback((content) => {
    setPage(p => p ? { ...p, content } : p);
    setSaving(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from("knowledge_pages")
        .update({ content, updated_at: new Date().toISOString() })
        .eq("id", pageId);
      setSaving(false);
    }, 800);
  }, [pageId]);

  const saveMeta = useCallback(async (patch) => {
    setPage(p => p ? { ...p, ...patch } : p);
    await supabase.from("knowledge_pages")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", pageId);
  }, [pageId]);

  return { page, loading, saving, saveContent, saveMeta, refetch: fetch };
}

export function useBacklinks(pageId, userId) {
  const [backlinks, setBacklinks] = useState([]);

  useEffect(() => {
    if (!pageId || !userId) return;
    supabase
      .from("knowledge_links")
      .select("source_page_id, knowledge_pages!source_page_id(id, title, emoji, base_id, knowledge_bases(name, emoji))")
      .eq("target_page_id", pageId)
      .then(({ data }) => setBacklinks(data || []));
  }, [pageId, userId]);

  return backlinks;
}

export async function syncWikilinks(pageId, content, userId) {
  const regex = /\{\{link:([^:]+):([^}]+)\}\}/g;
  const found = new Set();
  let m;
  const text = JSON.stringify(content);
  while ((m = regex.exec(text)) !== null) found.add(m[1]);

  const { data: existing } = await supabase
    .from("knowledge_links")
    .select("target_page_id")
    .eq("source_page_id", pageId);

  const existingSet = new Set((existing || []).map(l => l.target_page_id));
  const toAdd = [...found].filter(id => !existingSet.has(id));
  const toRemove = [...existingSet].filter(id => !found.has(id));

  if (toAdd.length) {
    await supabase.from("knowledge_links").insert(
      toAdd.map(tid => ({ owner_id: userId, source_page_id: pageId, target_page_id: tid }))
    );
  }
  if (toRemove.length) {
    await supabase.from("knowledge_links")
      .delete()
      .eq("source_page_id", pageId)
      .in("target_page_id", toRemove);
  }
}

export function usePageSearch(userId) {
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");

  const search = useCallback(async (q, baseId) => {
    setQuery(q);
    if (!q.trim() || !userId) { setResults([]); return; }
    let req = supabase
      .from("knowledge_pages")
      .select("id, title, emoji, base_id, knowledge_bases(name, emoji)")
      .eq("is_archived", false)
      .eq("owner_id", userId)
      .limit(20);

    if (q.length >= 3) {
      req = req.textSearch("search_vector", q, { type: "websearch", config: "french" });
    } else {
      req = req.ilike("title", `%${q}%`);
    }
    if (baseId) req = req.eq("base_id", baseId);
    const { data } = await req;
    setResults(data || []);
  }, [userId]);

  const clear = () => { setResults([]); setQuery(""); };

  return { results, query, search, clear };
}

export function useGraphData(userId) {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      supabase.from("knowledge_pages")
        .select("id, title, emoji, base_id, knowledge_bases(color, name)")
        .eq("is_archived", false)
        .eq("owner_id", userId),
      supabase.from("knowledge_links")
        .select("source_page_id, target_page_id")
        .eq("owner_id", userId),
    ]).then(([pagesRes, linksRes]) => {
      setNodes((pagesRes.data || []).map(p => ({
        id: p.id, label: p.emoji + " " + p.title,
        color: p.knowledge_bases?.color || "#6b7280",
        base: p.knowledge_bases?.name || "",
        base_id: p.base_id,
      })));
      setLinks((linksRes.data || []).map(l => ({
        source: l.source_page_id, target: l.target_page_id,
      })));
    });
  }, [userId]);

  return { nodes, links };
}
