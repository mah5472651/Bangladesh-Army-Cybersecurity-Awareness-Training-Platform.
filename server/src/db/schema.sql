-- Bangladesh Army Cybersecurity Awareness Training Platform
-- PostgreSQL schema — NEVER stores real passwords from simulations.
-- Training account passwords are demo-only hashes.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(128) NOT NULL,
  rank          VARCHAR(32) NOT NULL,
  unit          VARCHAR(128) NOT NULL,
  department    VARCHAR(64),
  role          VARCHAR(20) NOT NULL CHECK (role IN ('trainee', 'instructor', 'admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(128) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address  VARCHAR(64),
  user_agent  VARCHAR(512)
);

CREATE TABLE IF NOT EXISTS module_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id    VARCHAR(64) NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  score        INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  attempts     INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_id)
);

-- Simulation analytics: COUNTS ONLY — never credentials or form field values
CREATE TABLE IF NOT EXISTS sim_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id  VARCHAR(64) NOT NULL,
  kind       VARCHAR(32) NOT NULL CHECK (kind IN ('click', 'form_attempt')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id   VARCHAR(64) NOT NULL,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  username   VARCHAR(64),
  action     VARCHAR(64) NOT NULL,
  detail     TEXT,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Issued training certificates (verification by cert_id only — no secrets)
CREATE TABLE IF NOT EXISTS certificates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id         VARCHAR(128) UNIQUE NOT NULL,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username        VARCHAR(64) NOT NULL,
  display_name    VARCHAR(128) NOT NULL,
  rank            VARCHAR(32),
  unit            VARCHAR(128),
  completed_count INTEGER NOT NULL DEFAULT 8,
  average_score   INTEGER NOT NULL DEFAULT 0,
  xp              INTEGER NOT NULL DEFAULT 0,
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Server-bound CSRF tokens for double-submit validation
CREATE TABLE IF NOT EXISTS csrf_tokens (
  token       VARCHAR(128) PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_progress_user ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_events_user ON sim_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_events_module ON sim_events(module_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_certificates_cert ON certificates(cert_id);
CREATE INDEX IF NOT EXISTS idx_csrf_expires ON csrf_tokens(expires_at);

COMMENT ON TABLE sim_events IS 'Count-only simulation analytics. NEVER store passwords or credential-like input.';
COMMENT ON TABLE users IS 'Training accounts only. Demo credentials for internal awareness exercises.';
COMMENT ON TABLE certificates IS 'Training completion certificates for verification. Not a clearance.';
