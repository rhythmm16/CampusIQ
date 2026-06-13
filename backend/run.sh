#!/usr/bin/env bash
# Start the CampusIQ FastAPI backend (Groq-powered agent).
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Creating backend/.env from .env.example — add your GROQ_API_KEY there."
  cp .env.example .env
fi

# macOS: Homebrew Python needs brew's libexpat (fixes pyexpat ImportError).
if [[ "$(uname)" == "Darwin" ]] && [[ -d /opt/homebrew/opt/expat/lib ]]; then
  export DYLD_LIBRARY_PATH="/opt/homebrew/opt/expat/lib${DYLD_LIBRARY_PATH:+:$DYLD_LIBRARY_PATH}"
fi

PYTHON=""
for candidate in python3.12 python3.11 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PYTHON="$candidate"
    break
  fi
done

if [[ -z "$PYTHON" ]]; then
  echo "Error: python3 not found. Install with: brew install python@3.12 expat"
  exit 1
fi

if [[ ! -d .venv ]]; then
  echo "Creating virtualenv with $PYTHON ..."
  "$PYTHON" -m venv --without-pip .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  curl -sS https://bootstrap.pypa.io/get-pip.py | python
else
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

pip install -q -r requirements.txt

echo ""
echo "CampusIQ backend → http://localhost:8000"
echo "Health check     → http://localhost:8000/health"
echo "Docs             → http://localhost:8000/docs"
echo ""
if [[ -z "${GROQ_API_KEY:-}" ]] && ! grep -q '^GROQ_API_KEY=.\+' .env 2>/dev/null; then
  echo "⚠️  Add GROQ_API_KEY to backend/.env for the Groq LLM agent."
  echo "   Get a free key at https://console.groq.com"
  echo ""
fi

exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
