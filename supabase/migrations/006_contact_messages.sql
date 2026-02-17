-- Contact form submissions (inserted via API route only)
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  subject text,
  message text NOT NULL,
  source text DEFAULT 'website',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- No public access; insert via supabaseAdmin in API only
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON contact_messages FROM anon;
REVOKE ALL ON contact_messages FROM authenticated;

-- Service role (API) can do everything
-- (Supabase service role bypasses RLS by default)
