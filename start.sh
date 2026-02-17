#!/usr/bin/env bash
# Run frontend only (Next.js on port 3000).
# Usage: ./start.sh   (from this frontend/ folder)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -f ".env.local" ]; then
  echo "WARNING: .env.local not found. Copy .env.example to .env.local and set Supabase keys."
fi
npm install --no-audit --no-fund
echo ">>> Frontend running at http://localhost:3000"
npm run dev
