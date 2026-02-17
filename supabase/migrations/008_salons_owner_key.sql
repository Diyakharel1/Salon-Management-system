-- Owner access: map ?key=<owner_key> to salon (no auth MVP)
ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_key text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_salons_owner_key ON salons (owner_key) WHERE owner_key IS NOT NULL;

COMMENT ON COLUMN salons.owner_key IS 'Secret key for owner portal access at /owner?key=<owner_key>';
