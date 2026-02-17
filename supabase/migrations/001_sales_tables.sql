-- Sales tables for Bill OCR (Step 8.1)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  total integer,
  raw_text text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  name text NOT NULL,
  price integer
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- For MVP: no public access (insert via supabaseAdmin server routes only)
REVOKE ALL ON sales FROM anon;
REVOKE ALL ON sales_items FROM anon;
