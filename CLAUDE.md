# Bookgate App — CLAUDE.md

## Repo overview
Monorepo chứa 3 services: `api-service` (FastAPI), `chat-service` (FastAPI), `frontend` (React/Vite + nginx).
Không có local dev Docker Compose — chạy production trên EKS qua helm-charts repo.

## Service map

### api-service (port 8000)
- **Stack**: FastAPI + SQLAlchemy + Alembic + PostgreSQL + boto3 (S3)
- **Entry**: `app/main.py` → router tại `app/api/v1/router.py`
- **Endpoints**: `auth`, `books`, `users`, `admin`, `upload_requests`
- **DB models**: `app/models/` — user, book, book_upload_request, download_request, download_history
- **Config**: `app/core/config.py` — đọc từ env vars
- **S3**: `app/services/storage.py` — upload/download/delete book files
- **Auth**: JWT tại `app/core/security.py`, deps tại `app/core/deps.py`
- **Migrations**: Alembic, chạy qua `scripts/migrate.sh` (Helm pre-upgrade Job)

### chat-service (port 8001)
- **Stack**: FastAPI + OpenAI + httpx (gọi api-service)
- **Entry**: `app/main.py`
- **Modules**: `app/chat.py` (OpenAI logic), `app/auth.py` (verify JWT), `app/config.py`
- **Gọi api-service** qua env `API_SERVICE_URL`

### frontend (port 80)
- **Stack**: React + Vite, serve bằng nginx
- **Build arg**: `VITE_API_URL` — mặc định empty (dùng relative URL qua Ingress)
- **nginx config**: `nginx.conf` — SPA routing, mọi path fallback về `index.html`

## Environment variables (runtime)

### api-service
| Var | Source |
|-----|--------|
| `DATABASE_URL` | K8s Secret `bookgate-secret` (ESO từ SM) |
| `SECRET_KEY` | K8s Secret `bookgate-secret` |
| `ADMIN_PASSWORD` | K8s Secret `bookgate-secret` |
| `S3_BUCKET_NAME` | Helm values |
| `AWS_DEFAULT_REGION` | Helm values |
| `ADMIN_EMAIL` | Helm values |
| `ADMIN_FULL_NAME` | Helm values |
| `CORS_ORIGINS` | Helm values |

### chat-service
| Var | Source |
|-----|--------|
| `SECRET_KEY` | K8s Secret `bookgate-secret` |
| `OPENAI_API_KEY` | K8s Secret `bookgate-secret` |
| `API_SERVICE_URL` | Helm (auto: `http://<release>-api-service:8000`) |
| `CORS_ORIGINS` | Helm values |

## CI/CD
- Pipeline: `.gitlab-ci.yml` — 3 jobs build song song (`build-api`, `build-chat`, `build-frontend`)
- Dùng Docker-in-Docker (`docker:26` + `docker:26-dind`)
- Auth ECR: OIDC → `AssumeRoleWithWebIdentity` → `aws ecr get-login-password`
- Image tag: `$CI_COMMIT_SHORT_SHA`
- Push tới ECR: `$ECR_REGISTRY/bookgate/{api-service,chat-service,frontend}:<tag>`
- **Không tự trigger helm** — deploy helm riêng biệt

## CI variables (GitLab repo settings)
| Variable | Mô tả |
|----------|-------|
| `AWS_ROLE_ARN` | IAM role cho CI (cần `ecr:*` permissions) |
| `AWS_REGION` | `us-east-1` |
| `ECR_REGISTRY` | `392423995152.dkr.ecr.us-east-1.amazonaws.com` (terraform output `ecr_registry_url`) |

## Quan trọng
- Runner phải có `privileged = true` trong config.toml để chạy Docker-in-Docker
- Không có unit test hiện tại — không cần chạy test trước khi build
- Health check endpoint: `GET /health` (cả api-service và chat-service)
