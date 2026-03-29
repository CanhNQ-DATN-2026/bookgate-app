# Bookgate App — CLAUDE.md

## Repo overview
Repo này chứa đúng 3 services production:
- `api-service` — FastAPI, PostgreSQL, Alembic, JWT auth, S3 storage
- `chat-service` — FastAPI, OpenAI chat, gọi `api-service`
- `frontend` — React/Vite build static, serve bằng nginx

Không còn `docker-compose`, `gateway`, `backend` duplicate, hay local-only runtime path.

## Service map

### api-service
- Port: `8000`
- Entry: `app/main.py`
- Router: `app/api/v1/router.py`
- Auth/JWT: `app/core/security.py`, `app/core/deps.py`
- DB: `app/core/database.py`
- Storage: `app/services/storage.py` dùng `boto3` để làm việc với S3
- Migration script: `scripts/migrate.sh`
- Seed script: `scripts/seed.py` chỉ bootstrap admin account, không tạo sample data

### chat-service
- Port: `8001`
- Entry: `app/main.py`
- Auth strategy: không tự verify JWT local; forward Bearer token sang `api-service /api/v1/auth/me`
- Config chính: `OPENAI_API_KEY`, `API_SERVICE_URL`, `CORS_ORIGINS`

### frontend
- Port container: `80`
- Build: Vite build
- Runtime: nginx
- Health endpoint: `/health`
- SPA fallback trong `nginx.conf`

## Runtime contract

### api-service env
| Variable | Source |
|---|---|
| `DATABASE_URL` | K8s Secret `bookgate-secret` |
| `SECRET_KEY` | K8s Secret `bookgate-secret` |
| `ADMIN_PASSWORD` | K8s Secret `bookgate-secret` |
| `S3_BUCKET_NAME` | Helm values |
| `AWS_DEFAULT_REGION` | Helm values |
| `ADMIN_EMAIL` | Helm values |
| `ADMIN_FULL_NAME` | Helm values |
| `CORS_ORIGINS` | Helm values |

### chat-service env
| Variable | Source |
|---|---|
| `SECRET_KEY` | K8s Secret `bookgate-secret` |
| `OPENAI_API_KEY` | K8s Secret `bookgate-secret` |
| `API_SERVICE_URL` | Helm-generated ClusterIP URL |
| `CORS_ORIGINS` | Helm values |

### Secret flow
- Terraform tạo shell secret trong AWS Secrets Manager: `${project}/${environment}/app-secrets`
- Operator populate secret đó một lần với 4 keys:
  - `DATABASE_URL`
  - `SECRET_KEY`
  - `ADMIN_PASSWORD`
  - `OPENAI_API_KEY`
- ESO trong cluster sync sang K8s Secret `bookgate-secret`
- Pods đọc bằng `secretKeyRef`

App pods không gọi trực tiếp AWS Secrets Manager.

## S3 / IRSA
- `api-service` cần IRSA để gọi S3
- `chat-service` và `frontend` không cần IRSA
- `api-service` không dùng access key/secret key trong env; credential lấy từ IRSA

## Migration
- Migration là bước explicit, không phải Helm hook
- Chỉ chạy sau khi `bookgate-secret` đã sync xong
- `scripts/migrate.sh` chạy:
  - `alembic upgrade head`
  - bootstrap admin account idempotent

## CI/CD
- Pipeline file: `.gitlab-ci.yml`
- Chỉ có stage `build`
- Build song song 3 images:
  - `bookgate/api-service`
  - `bookgate/chat-service`
  - `bookgate/frontend`
- Auth AWS: GitLab OIDC → `AssumeRoleWithWebIdentity`
- Push lên ECR qua `ECR_REGISTRY`
- Repo này không tự deploy Helm và không trigger repo Helm

## CI variables
| Variable | Meaning |
|---|---|
| `AWS_ROLE_ARN` | IAM role cho app CI, dùng để push ECR |
| `AWS_REGION` | AWS region |
| `ECR_REGISTRY` | Registry prefix, ví dụ `392423995152.dkr.ecr.us-east-1.amazonaws.com` |

## Important notes
- Runner phải hỗ trợ Docker-in-Docker và `privileged = true`
- `SECRET_KEY` thực sự được dùng ở `api-service` để ký/verify JWT
- `chat-service` hiện nhận `SECRET_KEY` qua env nhưng không tự decode JWT; token được verify qua `api-service`
- Nếu frontend deploy cùng origin với API, `VITE_API_URL` có thể để rỗng để dùng relative path
