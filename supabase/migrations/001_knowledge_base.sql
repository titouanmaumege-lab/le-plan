-- ============================================================
-- MODULE BASE — Second Cerveau
-- À exécuter dans Supabase Dashboard > SQL Editor
-- ============================================================

-- BASES (workspaces thématiques)
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📚',
  color TEXT DEFAULT '#3b82f6',
  position INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PAGES (hiérarchisées)
CREATE TABLE IF NOT EXISTS knowledge_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES knowledge_pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Sans titre',
  emoji TEXT DEFAULT '📄',
  page_type TEXT NOT NULL DEFAULT 'note',
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_metadata JSONB,
  position INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  search_vector tsvector,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pages_base ON knowledge_pages(base_id) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_pages_parent ON knowledge_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_owner ON knowledge_pages(owner_id);
CREATE INDEX IF NOT EXISTS idx_pages_search ON knowledge_pages USING GIN(search_vector);

CREATE OR REPLACE FUNCTION update_page_search_vector() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('french', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(NEW.content::text, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pages_search_vector ON knowledge_pages;
CREATE TRIGGER trg_pages_search_vector
BEFORE INSERT OR UPDATE ON knowledge_pages
FOR EACH ROW EXECUTE FUNCTION update_page_search_vector();

-- TAGS
CREATE TABLE IF NOT EXISTS knowledge_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, name, base_id)
);

CREATE TABLE IF NOT EXISTS knowledge_page_tags (
  page_id UUID REFERENCES knowledge_pages(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES knowledge_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);

-- WIKILINKS
CREATE TABLE IF NOT EXISTS knowledge_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_page_id UUID REFERENCES knowledge_pages(id) ON DELETE CASCADE NOT NULL,
  target_page_id UUID REFERENCES knowledge_pages(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_page_id, target_page_id)
);

CREATE INDEX IF NOT EXISTS idx_links_source ON knowledge_links(source_page_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON knowledge_links(target_page_id);

-- RLS
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_page_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all_bases" ON knowledge_bases;
DROP POLICY IF EXISTS "owner_all_pages" ON knowledge_pages;
DROP POLICY IF EXISTS "owner_all_tags" ON knowledge_tags;
DROP POLICY IF EXISTS "owner_all_page_tags" ON knowledge_page_tags;
DROP POLICY IF EXISTS "owner_all_links" ON knowledge_links;

CREATE POLICY "owner_all_bases" ON knowledge_bases FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "owner_all_pages" ON knowledge_pages FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "owner_all_tags" ON knowledge_tags FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "owner_all_page_tags" ON knowledge_page_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM knowledge_pages WHERE id = page_id AND owner_id = auth.uid()));
CREATE POLICY "owner_all_links" ON knowledge_links FOR ALL USING (owner_id = auth.uid());

-- STORAGE BUCKET (à créer via Dashboard ou décommenter si SQL storage activé)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-images', 'knowledge-images', false)
-- ON CONFLICT DO NOTHING;
