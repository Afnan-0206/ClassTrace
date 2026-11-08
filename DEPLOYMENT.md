# ClassTrace — Production Deployment & Model Suite Guide

ClassTrace is powered by Gnani AI's Frontier Trio Model Suite:
1. **Prisma v2.5** (Speech to Text): 14M+ hours dataset, sub-200ms streaming latency, 10+ Indic languages + Hinglish, Tanglish, Benglish.
2. **Timbre v2.5** (Text to Speech, Beta): Context-aware Indic prosody with authentic Indian names, numerals, and lakh and crore cadence.
3. **Evon v3.3** (Reasoning, Open Weight): 30B-parameter Mixture-of-Experts with 128K context window and native support for 11 Indian languages.

---

## 1. Quick Start with Docker (Single Command)

To run both the Next.js frontend and FastAPI backend with persistent storage:

```bash
docker-compose up --build
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

---

## 2. Environment Variables (.env)

The project includes pre-configured `.env` and `.env.example` files in both root, `backend/`, and `frontend/`:

### Backend (`backend/.env`)
```ini
# Gnani AI Trio Model Suite
GNANI_API_KEY=your_gnani_api_key_here
GNANI_BASE_URL=https://api.vachana.ai

GNANI_STT_MODEL=prisma-v2.5
GNANI_TTS_MODEL=timbre-v2.5
GNANI_REASONING_MODEL=evon-v3.3
GNANI_LANGUAGE_CODE=indic-auto

# Hugging Face Weights (Optional for Evon v3.3)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
EVON_HUGGINGFACE_REPO=gnani-ai/evon-v3.3

# Cloud Database & Storage (Optional: defaults to local SQLite 17-Q engine)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Network Settings
PORT=8000
HOST=0.0.0.0
DEBUG=False
APP_ENV=production
```

### Frontend (`frontend/.env.local`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENABLE_PRISMA_STT=true
NEXT_PUBLIC_ENABLE_TIMBRE_TTS=false
NEXT_PUBLIC_ENABLE_EVON_REASONING=false
```

---

## 3. Cloud Deployment Options

### Option A: Vercel (Frontend) + Railway/Render (Backend)
1. **Deploy Backend on Railway / Render:**
   - Source: `backend/` directory or root Dockerfile (`Dockerfile.backend`).
   - Set environment variables from `backend/.env`.
   - Copy the deployed backend URL (e.g., `https://classtrace-backend.up.railway.app`).

2. **Deploy Frontend on Vercel:**
   - Root Directory: `frontend`
   - Framework Preset: `Next.js`
   - Environment Variable: `NEXT_PUBLIC_API_URL=https://classtrace-backend.up.railway.app`

---

## 4. Local Development

### Run Backend
```bash
python backend/run.py
```

### Run Frontend
```bash
cd frontend
npm run start -- -p 3001
# or for live editing:
npm run dev
```

---

## 5. Offline & Fallback Engine
Even when deploying without active `GNANI_API_KEY` credentials:
- **Local SQLite Engine:** Retains all lectures, embeddings, and chapters.
- **Synthesizer Fallback:** Timbre v2.5 synthesis routes to the local Indic audio engine.
- **Evon v3.3 MoE Engine:** Operates the local zero-hallucinations reasoning pipeline with verified timestamp citations.

