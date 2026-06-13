# CampusIQ Backend (FastAPI + Groq LLM Agent)

Conversational campus-navigation API powered by **Groq Cloud** (OpenAI-compatible).
Provides tool-calling over a graph routing engine so the agent never hallucinates
buildings or directions.

## Quick start

```bash
# 1. Get a free API key from https://console.groq.com
# 2. Add it to backend/.env:
#    GROQ_API_KEY=gsk_...

cd backend
cp .env.example .env   # if you haven't already
./run.sh
```

Or from the project root:

```bash
npm run backend
```

Server runs at **http://localhost:8000**. Check **http://localhost:8000/health** — you
should see `"provider": "groq"` and `"llm": true` once your key is set.

## Groq configuration

| Variable | Default | Purpose |
|---|---|---|
| `GROQ_API_KEY` | — | Required. From [console.groq.com](https://console.groq.com) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Chat + tool calling |
| `GROQ_VISION_MODEL` | `llama-3.2-90b-vision-preview` | Snap & Navigate (photo → building) |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Usually leave as-is |

Without `GROQ_API_KEY`, the backend still runs using a deterministic local agent
(same routing logic, no LLM).

## Connect the Expo app

In the project root `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_USE_MOCK_API=false
```

On a **physical phone**, replace `localhost` with your computer's LAN IP
(e.g. `http://192.168.1.42:8000`).

Restart Expo after changing env vars: `npx expo start --clear`

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Status + Groq provider info |
| GET | `/api/buildings` | All buildings |
| POST | `/api/chat` | Groq agent with tool calling |
| POST | `/api/routes/calculate` | Direct route computation |
| POST | `/api/vision/locate` | Snap & Navigate (Groq vision) |

## Data sync

Campus graph data is exported from the TypeScript constants:

```bash
npm run backend:export-data
```

## Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```
