# Bookgate

A role-based digital library / controlled book download platform.
Built as a local-first monorepo ready for future migration to AWS (EKS + RDS + S3).

---

## Architecture

```
Browser
  │
  ├─► React + Vite (port 5173)
  │         │
  │         └─► FastAPI (port 8000)  ──► PostgreSQL (port 5432)
  │                   │
  │                   └─► MinIO / S3-compatible (port 9000)
  │
  └─► MinIO Console (port 9001)
```

All services run in Docker via a single `docker-compose.yml`.

---

## Roles

| Role  | Capabilities |
|-------|-------------|
| ADMIN | Login, manage books (upload/edit/delete), view all users, approve/decline download requests, view download history |
| USER  | Register, login, browse books, request download, download after approval, view own history |

### Download flow

```
User browses books
  → clicks "Request Download"
  → Request stored as PENDING
  → Admin reviews: APPROVE or DECLINE
  → If APPROVED: user can hit "Download Now"
  → Backend verifies approval, records DownloadHistory, returns presigned MinIO URL
```

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2

---

## Quick Start

```bash
# 1. Clone / enter the project
cd bookgate

# 2. Start the full stack
docker compose up --build

# Wait ~30s on first run (postgres init, migrations, seed, npm install)
```

That's it. All services start, migrations run, and seed data is inserted automatically.

---

## Service URLs

| Service         | URL                         |
|-----------------|-----------------------------|
| Frontend        | http://localhost:5173        |
| Backend API     | http://localhost:8000        |
| API Docs        | http://localhost:8000/docs   |
| MinIO Console   | http://localhost:9001        |
| Postgres        | localhost:5432               |

---

## Default Credentials

### Admin
| Field    | Value                 |
|----------|-----------------------|
| Email    | `admin@bookgate.com`  |
| Password | `admin123`            |

### Sample Users
| Email              | Password      |
|--------------------|---------------|
| alice@example.com  | password123   |
| bob@example.com    | password123   |
| carol@example.com  | password123   |

### MinIO Console
| Field    | Value          |
|----------|----------------|
| User     | `minioadmin`   |
| Password | `minioadmin123` |

> **Production**: Change all credentials via environment variables before deploying.

---

## Environment Variables

Copy and edit the example files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

All variables are already wired in `docker-compose.yml`. For local dev outside Docker:

**backend/.env.example** — database URL, JWT secret, MinIO config, admin seed credentials
**frontend/.env.example** — `VITE_API_URL=http://localhost:8000`

---

## Docker Compose Commands

```bash
# Start everything (foreground)
docker compose up --build

# Start in background
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop
docker compose down

# Stop and destroy volumes (wipes database + MinIO data)
docker compose down -v

# Rebuild one service
docker compose up --build backend
```

---

## Sample API Flow

### Register + Login
```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","password":"test1234"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
# → returns { "access_token": "...", "token_type": "bearer" }
```

### Browse books
```bash
TOKEN="<your token>"
curl http://localhost:8000/api/v1/books \
  -H "Authorization: Bearer $TOKEN"
```

### Request download
```bash
curl -X POST http://localhost:8000/api/v1/books/1/request-download \
  -H "Authorization: Bearer $TOKEN"
```

### Admin: approve request
```bash
ADMIN_TOKEN="<admin token>"
curl -X PATCH http://localhost:8000/api/v1/admin/download-requests/1/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"review_note":"Approved."}'
```

### Download (after approval)
```bash
curl http://localhost:8000/api/v1/books/1/download \
  -H "Authorization: Bearer $TOKEN"
# → returns { "download_url": "http://localhost:9000/bookgate/books/...?X-Amz-..." }
```

---

## Project Structure

```
bookgate/
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── start.sh                  # runs migrations + seed + uvicorn
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── scripts/
│   │   └── seed.py               # idempotent seed data
│   └── app/
│       ├── main.py               # FastAPI app + CORS + startup
│       ├── core/
│       │   ├── config.py         # pydantic-settings
│       │   ├── database.py       # SQLAlchemy engine + session
│       │   ├── security.py       # JWT + bcrypt
│       │   └── deps.py           # auth dependencies
│       ├── models/               # SQLAlchemy ORM models
│       ├── schemas/              # Pydantic request/response schemas
│       ├── services/
│       │   └── storage.py        # MinIO abstraction (swap for S3)
│       └── api/v1/endpoints/
│           ├── auth.py
│           ├── users.py
│           ├── books.py
│           └── admin.py
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx               # routing
        ├── main.jsx
        ├── index.css
        ├── api/                  # axios wrappers per domain
        ├── contexts/
        │   └── AuthContext.jsx   # JWT + user state
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Layout.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── auth/             # Login, Register
            ├── user/             # BookList, BookDetail, Profile, MyRequests, MyDownloadHistory
            └── admin/            # Dashboard, BookManagement, UploadBook, UserList, RequestReview, DownloadHistory
```

---

## Future Migration to AWS

| Local (current)     | AWS equivalent                        | Notes |
|---------------------|---------------------------------------|-------|
| Docker Compose       | EKS (Kubernetes)                     | Move each service to a Kubernetes Deployment |
| PostgreSQL container | Amazon RDS (PostgreSQL)              | Update `DATABASE_URL` env var only |
| MinIO               | Amazon S3                             | `storage.py` uses MinIO SDK — swap for boto3; API is nearly identical |
| Vite dev server     | S3 static site + CloudFront          | Run `npm run build`, upload `dist/` to S3 |
| Backend container   | EKS pod + ECR image                  | Build image, push to ECR, deploy to EKS |
| Presigned URLs       | S3 presigned URLs via boto3          | Same concept, different client |

### Migration steps (high level)

1. **Database**: Provision RDS PostgreSQL. Point `DATABASE_URL` to the RDS endpoint.
2. **Storage**: Create an S3 bucket. In `backend/app/services/storage.py`, replace `minio.Minio(...)` with `boto3.client("s3", ...)`. The `upload_file`, `get_presigned_url`, and `delete_file` method signatures stay the same.
3. **Backend**: Build the Docker image, push to ECR, deploy to EKS with the new env vars.
4. **Frontend**: `npm run build` produces a `dist/` folder. Upload to S3 static hosting or serve from a CDN.
5. **Secrets**: Use AWS Secrets Manager or SSM Parameter Store instead of plain env vars.

The storage abstraction in `storage.py` is intentionally isolated so step 2 is a single-file change.
