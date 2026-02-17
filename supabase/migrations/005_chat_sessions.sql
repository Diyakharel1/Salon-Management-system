-- Chat session context for assistant booking flow (persist across refreshes)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  context jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_sessions_session_id_idx ON chat_sessions (session_id);
CREATE INDEX IF NOT EXISTS chat_sessions_updated_at_idx ON chat_sessions (updated_at);

-- Allow server (service role) to read/write; no RLS needed for server-only usage
COMMENT ON TABLE chat_sessions IS 'Stores in-progress booking context for chat assistant';
