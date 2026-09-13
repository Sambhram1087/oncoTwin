#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if [[ ! -x .venv/bin/python ]]; then
  python3 -m venv .venv
fi

.venv/bin/python -m pip install -r backend/requirements.txt

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
fi
if [[ ! -f frontend/.env.local ]]; then
  cp frontend/.env.example frontend/.env.local
fi

(cd backend && ../.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000) &
backend_pid=$!
(cd frontend && npm install && npm run dev -- --hostname 0.0.0.0 --port 3000) &
frontend_pid=$!

cleanup() {
  kill "$backend_pid" "$frontend_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "OncoTwin frontend: http://localhost:3000"
echo "OncoTwin backend:  http://localhost:8000/docs"
wait