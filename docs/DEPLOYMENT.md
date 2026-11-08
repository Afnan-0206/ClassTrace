# ClassTrace — Production Deployment Guide

This guide details deploying ClassTrace to production across:
* **Frontend:** Vercel / Cloudflare Pages
* **Backend:** Render / Railway (Docker / Native Python)
* **Database & Vector Search:** Supabase PostgreSQL

---

## 1. Supabase Database & Storage Setup

1. Create a new project on [Supabase](https://supabase.com).
2. Navigate to the **SQL Editor** tab.
3. Open `backend/supabase_schema.sql` from this repository, paste the contents into the editor, and click **Run**.
   * Enables the `vector` extension (pgvector).
   * Creates the `lectures`, `transcript_segments`, `lecture_embeddings`, and `processing_jobs` tables.
   * Generates HNSW cosine vector index for fast similarity lookup.
   * Creates the `match_transcript_segments` stored procedure.
4. Navigate to **Project Settings -> API**:
   * Copy the **Project URL** (`https://<project-ref>.supabase.co`).
   * Copy the **anon public key**.
   * Copy the **service_role secret key**.

---

## 2. Backend Deployment (Render)

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the service settings:
   * **Runtime:** Python 3
   * **Root Directory:** `backend`
   * **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   * **Start Command:**
     ```bash
     uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
     ```
4. Set Environment Variables:
   * `GNANI_API_KEY`: Your official Gnani AI developer key (`X-API-Key-ID`).
   * `GNANI_BASE_URL`: `https://api.vachana.ai`
   * `GNANI_STT_MODEL`: `prisma-v2.5`
   * `GNANI_LANGUAGE_CODE`: `indic-auto`
   * `SUPABASE_URL`: `https://<your-project>.supabase.co`
   * `SUPABASE_ANON_KEY`: `<your_anon_key>`
   * `SUPABASE_SERVICE_ROLE_KEY`: `<your_service_role_key>`
5. Click **Deploy**. Note the assigned URL: `https://classtrace-backend.onrender.com`.

---

## 3. Frontend Deployment (Vercel)

1. Import the repository into [Vercel](https://vercel.com).
2. In the project settings:
   * **Framework Preset:** Next.js
   * **Root Directory:** `frontend`
3. Configure Environment Variables:
   * `NEXT_PUBLIC_API_URL`: The deployed backend URL (e.g., `https://classtrace-backend.onrender.com`).
4. Click **Deploy**.
5. Once complete, your ClassTrace web app is live.

---

## 4. Local Development Quickstart

### Backend:
```bash
# In repository root
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
# (Optional) add your GNANI_API_KEY and SUPABASE credentials to backend/.env
python backend/run.py
```
Backend runs at `http://localhost:8000`.

### Frontend:
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
Frontend runs at `http://localhost:3000`.

