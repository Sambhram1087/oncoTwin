# OncoTwin – AI Neuro-Oncology Digital Twin

A working, end-to-end slice of a neuro-oncology digital twin platform:
**sign up → create a patient → upload an MRI → background AI processing
with realtime progress → segmentation results, radiomics, growth
prediction, and a 3D-style tumor visualization.**

This is a real, runnable full-stack app, not a mockup: every button
calls a real API endpoint, the database is real (SQLite locally,
swappable to Postgres/Supabase), and the "AI pipeline" is a fully
functional deterministic mock model that returns data in the *exact*
shape a real MONAI model would — see "Swapping in real AI" below.

## What's implemented vs. what's scaffolded for later

This repo intentionally ships **one thin, fully working vertical slice**
across the whole stack rather than every feature in the original brief
half-built. Implemented and tested end-to-end:

- Auth (signup / login / JWT / protected routes)
- Patient CRUD + search
- MRI upload (`.nii`, `.nii.gz`, `.zip`) with validation
- Background job processing with realtime WebSocket progress
- Mock AI segmentation pipeline (volume, confidence, radiomics, mesh stats)
- Digital twin timeline (one entry per uploaded scan/visit)
- Growth prediction slider (30/60/90 day projection)
- 3D-style tumor visualization (CSS-based placeholder, see below)
- Dark/light mode, responsive layout, loading skeletons, animations
- Pytest suite for the backend (auth + patient flows), all passing
- Docker Compose for one-command local run

**Not built in this pass** (structured as clear extension points instead
of fake UI): the surgical simulator, PDF report export, admin panel,
Supabase Auth/Storage/Postgres wiring, Celery+Redis workers, and the
full Cornerstone3D/React-Three-Fiber viewer. Each has a documented swap
path below so it can be added without touching the rest of the app.

## Architecture

```
oncotwin/
├── backend/          FastAPI + SQLAlchemy + JWT auth
│   ├── app/
│   │   ├── api/routes/     auth, patients, upload, predict
│   │   ├── core/           config, security
│   │   ├── db/             SQLAlchemy session/engine
│   │   ├── models/         User, Patient, Scan, Job
│   │   ├── schemas/        Pydantic request/response models
│   │   ├── services/       ai_pipeline (modular model interface), storage, ws_manager
│   │   ├── workers/        background job runner (BackgroundTasks now, Celery-ready)
│   │   ├── tests/          pytest suite
│   │   └── seed.py         demo user + patients + sample genomic JSON
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/          Next.js 15 + React 19 + TypeScript + Tailwind
│   ├── app/
│   │   ├── (auth)/login, (auth)/signup
│   │   ├── dashboard/
│   │   ├── patients/, patients/[id]/
│   │   ├── upload/
│   │   └── results/[jobId]/
│   ├── components/    Button, Card, Input, Skeleton, AppShell, TumorVisualization
│   ├── lib/            typed API client, zustand auth store, websocket hook
│   └── Dockerfile
└── docker-compose.yml
```

## Running it locally

### Option A — Docker Compose (recommended, one command)

```bash
docker compose up --build
```

Frontend: http://localhost:3000
Backend docs (OpenAPI/Swagger): http://localhost:8000/docs

### Option B — Run each side manually

**Backend:**
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed          # optional: creates demo@oncotwin.ai / demopassword123
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000, sign up (or log in with the seeded
demo account `demo@oncotwin.ai` / `demopassword123`), create a patient,
and upload any `.nii` file (even a dummy text file renamed to `.nii`
works for the demo, since the mock model doesn't actually parse voxel
data yet — see below).

### Running the backend tests

```bash
cd backend
pytest app/tests/ -v
```

## Swapping in real infrastructure

Every "local default" below was chosen so the whole app runs on free
tiers with zero external accounts. Each has a one-file swap path:

| Concern | Local default | Production swap | File to change |
|---|---|---|---|
| Database | SQLite | Supabase Postgres | `backend/app/core/config.py` (`DATABASE_URL`) |
| Auth | Self-issued JWT | Supabase Auth | `backend/app/core/security.py` |
| File storage | Local disk | Supabase Storage bucket | `backend/app/services/storage.py` |
| Background jobs | FastAPI `BackgroundTasks` | Celery + Upstash Redis | `backend/app/workers/tasks.py` |
| AI segmentation | `MockSegmentationModel` | Real MONAI model | `backend/app/services/ai_pipeline.py` (implement `SegmentationModel`, same return contract) |
| 3D viewer | CSS placeholder | Cornerstone3D / React-Three-Fiber | `frontend/components/tumor-visualization.tsx` |

Because routes/schemas/frontend all depend on the *interfaces* (not the
implementations), swapping any one of these doesn't require touching
anything else.

## Deployment (free tiers)

- **Frontend → Vercel**: connect the repo, set root directory to
  `frontend`, add `NEXT_PUBLIC_API_URL`/`NEXT_PUBLIC_WS_URL` env vars
  pointing at your deployed backend.
- **Backend → Render**: new Web Service from `backend/Dockerfile`, add
  the env vars from `.env.example`.
- **Database/Auth/Storage → Supabase**: create a project, copy the
  Postgres connection string into `DATABASE_URL`, and follow the swap
  paths above to move auth/storage over.
- **Redis → Upstash**: create a free Redis instance, use its URL as
  `CELERY_BROKER_URL` once you've wired up Celery per the table above.

## Known limitations of this slice

- The mock AI model derives its "results" from a hash of the file path,
  not from actual NIfTI voxel data — it doesn't parse `.nii` headers at
  all yet. Wiring in `nibabel` to read real voxel data is a small,
  isolated addition to `ai_pipeline.py`.
- The 3D visualization is a CSS placeholder, not a real volumetric
  renderer — it exists so the results page isn't empty, and to keep the
  data contract (`volumeMl`, `meshVertices`) that a real Three.js/
  Cornerstone3D viewer would also consume.
- SQLite is used for zero-setup local development; under concurrent
  writes you'll want Postgres (a one-line `DATABASE_URL` change).
