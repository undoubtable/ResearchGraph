CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, authors TEXT NOT NULL DEFAULT '[]',
  year INTEGER, venue TEXT, doi TEXT, arxiv_id TEXT, url TEXT, pdf_path TEXT, abstract TEXT,
  research_question TEXT, method_summary TEXT, data_summary TEXT, main_contributions TEXT,
  main_results TEXT, limitations TEXT, future_work TEXT, reading_status TEXT NOT NULL DEFAULT 'to_read',
  rating INTEGER, my_summary TEXT, inspiration TEXT, is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL UNIQUE, color TEXT);
CREATE TABLE IF NOT EXISTS paper_tags (paper_id TEXT NOT NULL REFERENCES papers(id) ON DELETE CASCADE, tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE, PRIMARY KEY(paper_id,tag_id));
CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY NOT NULL, paper_id TEXT REFERENCES papers(id) ON DELETE CASCADE, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'note', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS graph_nodes (id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, label TEXT NOT NULL, description TEXT, paper_id TEXT REFERENCES papers(id) ON DELETE CASCADE, created_by TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS graph_edges (id TEXT PRIMARY KEY NOT NULL, source_id TEXT NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE, target_id TEXT NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE, relation_type TEXT NOT NULL, confidence REAL NOT NULL DEFAULT 1, evidence TEXT NOT NULL, created_by TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS research_directions (id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', keywords TEXT NOT NULL DEFAULT '[]', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(year);
CREATE INDEX IF NOT EXISTS idx_papers_reading_status ON papers(reading_status);
CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_notes_paper_id ON notes(paper_id);
