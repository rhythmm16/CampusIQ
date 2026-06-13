# CampusIQ

An accessibility-first campus navigation assistant built with **Expo / React Native**
and a **Groq Cloud**-powered agent backend. Ask for directions, browse buildings,
view a live campus map, and get accessibility-aware routing.

## Tech stack

| Layer | Tech |
|---|---|
| Mobile / Web | Expo SDK 54, React Native, TypeScript, Zustand |
| AI agent | **Groq Cloud** (`llama-3.3-70b-versatile`) + tool calling |
| Backend | Python FastAPI, graph routing engine |
| Map | Cross-platform SVG map with route polylines |

## Prerequisites

- Node.js 18+
- Python 3.11+ (for the backend)
- A free **Groq API key** from [console.groq.com](https://console.groq.com)
- Expo Go app or simulator/emulator

## Full-stack setup (5 minutes)

### 1. Frontend

```bash
npm install
cp .env.example .env
# .env already sets EXPO_PUBLIC_USE_MOCK_API=false
npm run dev
```

### 2. Backend (Groq)

```bash
# Add your Groq key to backend/.env:
#   GROQ_API_KEY=gsk_your_key_here

npm run backend
```

Verify at [http://localhost:8000/health](http://localhost:8000/health) — you should see:

```json
{ "status": "ok", "llm": true, "provider": "groq", "model": "llama-3.3-70b-versatile" }
```

### 3. Connect app → backend

Root `.env` (already created from `.env.example`):

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_USE_MOCK_API=false
```

**On a physical phone**, use your computer's LAN IP instead of `localhost`
(e.g. `http://192.168.1.42:8000`). Restart Expo after env changes:

```bash
npx expo start --clear
```

The app calls the Groq agent when online. If the backend is unreachable, it
automatically falls back to the local routing agent (still real graph paths, no LLM).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Expo dev server |
| `npm run backend` | Start FastAPI + Groq agent on port 8000 |
| `npm run backend:export-data` | Sync campus graph JSON for the backend |
| `npm run typecheck` | TypeScript check |
| `npm run build:web` | Export static web build |

## Features

- **Groq-powered chat agent** — tool calling over real campus data (zero hallucination)
- **Graph-based routing** — Dijkstra with accessibility costs, event-blocked reroutes
- **SVG campus map** — live route polylines on web + iOS + Android
- **Multimodal** — voice input, spoken directions (EN/HI/PA), QR scan, emergency mode
- **Offline fallback** — local agent + cached routes when backend is down

## Project structure

```
app/                 Expo Router screens (chat, map, scan, emergency)
backend/             FastAPI + Groq agent → see backend/README.md
components/          UI (chat, map, buildings)
services/            API client, routing engine, speech, notifications
store/               Zustand state
```

## Troubleshooting

**Backend won't start (Python / libexpat error on macOS):**

```bash
brew install expat
brew reinstall python@3.12
cd backend && python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**App shows "Offline" in Profile → Backend Status:**  
Make sure `npm run backend` is running and `EXPO_PUBLIC_API_URL` points to the right host.

**Groq not active (`"llm": false` in /health):**  
Add `GROQ_API_KEY=gsk_...` to `backend/.env` and restart the backend.
