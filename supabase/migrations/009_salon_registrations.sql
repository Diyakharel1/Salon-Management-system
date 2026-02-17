-- Salon registration requests (owner self-register, admin reviews)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS salon_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Salon info
  salon_name text NOT NULL,
  slug text NOT NULL,
  city text NOT NULL,
  address text,
  phone text NOT NULL,
  -- Owner/contact info
  owner_name text NOT NULL,
  owner_email text NOT NULL,
  owner_phone text NOT NULL,
  notes text,
  -- Status workflow
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_salon_registrations_status ON salon_registrations(status);
CREATE INDEX IF NOT EXISTS idx_salon_registrations_created ON salon_registrations(created_at DESC);

-- RLS: no public access; admin uses service role
ALTER TABLE salon_registrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON salon_registrations FROM anon;
REVOKE ALL ON salon_registrations FROM authenticated;

COMMENT ON TABLE salon_registrations IS 'Pending salon sign-ups; admin approves to create salon + owner_key';
