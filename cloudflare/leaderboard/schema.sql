CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  install_id_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  player_tag TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_version TEXT,
  country_hint TEXT,
  user_agent_hash TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_install_hash ON players(install_id_hash);
CREATE INDEX IF NOT EXISTS idx_players_tag ON players(player_tag);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id),
  display_name TEXT NOT NULL,
  player_tag TEXT NOT NULL,
  mode TEXT NOT NULL,
  variant TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  elapsed_ms INTEGER,
  attempts INTEGER,
  makes INTEGER,
  accuracy REAL,
  best_streak INTEGER,
  won INTEGER NOT NULL DEFAULT 0,
  completed INTEGER NOT NULL DEFAULT 0,
  eligible INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT,
  control TEXT,
  star_id TEXT,
  star_name TEXT,
  opponent_id TEXT,
  opponent_name TEXT,
  scene TEXT,
  weather TEXT,
  seed TEXT,
  game_version TEXT,
  rule_version TEXT NOT NULL DEFAULT '2026-07-04-v1',
  validation_status TEXT NOT NULL DEFAULT 'valid',
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  client_created_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_player_created ON runs(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_leaderboard_speed ON runs(mode, variant, difficulty, control, validation_status, eligible, elapsed_ms ASC, score DESC, accuracy DESC);
CREATE INDEX IF NOT EXISTS idx_runs_leaderboard_score ON runs(mode, variant, difficulty, control, validation_status, eligible, score DESC, elapsed_ms ASC, accuracy DESC);
CREATE INDEX IF NOT EXISTS idx_runs_seed ON runs(mode, variant, seed, difficulty, control, validation_status, eligible);
CREATE INDEX IF NOT EXISTS idx_runs_created ON runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_leaderboard_created ON runs(mode, variant, difficulty, control, validation_status, eligible, created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at INTEGER NOT NULL
);
