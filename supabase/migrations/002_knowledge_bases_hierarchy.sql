-- Ajouter hiérarchie aux bases
ALTER TABLE knowledge_bases ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_bases_parent ON knowledge_bases(parent_id);
