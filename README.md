# Bookgate — App Repo

Application repo for Bookgate. This repo owns exactly 3 production services:
- `api-service`
- `chat-service`
- `frontend`

It does not provision AWS infrastructure and does not contain local runtime orchestration.

## Repo layout

```text
bookgate/
├── api-service/
├── chat-service/
├── frontend/
└── .gitlab-ci.yml
```

## Service summary

### `api-service`
- FastAPI + SQLAlchemy + Alembic
- Connects to PostgreSQL via `DATABASE_URL`
- Uses S3 via `boto3`
- Uses `SECRET_KEY` to sign and verify JWTs
- Migration entrypoint: `scripts/migrate.sh`
- Seed script only bootstraps the admin account

### `chat-service`
- FastAPI + OpenAI + httpx
- Calls `api-service` for token validation and catalog reads
- Uses `OPENAI_API_KEY`

### `frontend`
- React + Vite
- Built as static assets
- Served by nginx on port `80`

## Runtime configuration

### `api-service`
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

### `chat-service`
| Variable | Source |
|---|---|
| `SECRET_KEY` | K8s Secret `bookgate-secret` |
| `OPENAI_API_KEY` | K8s Secret `bookgate-secret` |
| `API_SERVICE_URL` | Helm-generated service URL |
| `CORS_ORIGINS` | Helm values |

### Secrets flow
```text
Terraform
  -> creates AWS Secrets Manager shell secret: bookgate/<env>/app-secrets
Operator
  -> populates DATABASE_URL, SECRET_KEY, ADMIN_PASSWORD, OPENAI_API_KEY
ESO in cluster
  -> syncs to K8s Secret: bookgate-secret
Pods
  -> read env via secretKeyRef
```

`api-service` does not call Secrets Manager directly. It only needs IRSA for S3.

## Build and release flow

This repo only builds and pushes images.

```text
terraform repo -> provisions infra
app repo       -> builds and pushes ECR images
helm repo      -> deploys to EKS
```

Images built by this repo:
- `bookgate/api-service`
- `bookgate/chat-service`
- `bookgate/frontend`

Tag format:
- `IMAGE_TAG=$CI_COMMIT_SHORT_SHA`

## CI/CD

Pipeline file: `.gitlab-ci.yml`

Behavior:
- stage: `build`
- 3 parallel jobs: `build-api`, `build-chat`, `build-frontend`
- GitLab OIDC -> web identity credentials for AWS CLI
- login to ECR
- build and push images

Required GitLab CI variables:
- `AWS_ROLE_ARN`
- `AWS_REGION`
- `ECR_REGISTRY` — Terraform output `ecr_registry_url`

Notes:
- runner must support Docker-in-Docker and `privileged = true`
- build job installs `awscli` and `docker` inside an Ubuntu-based CI image to avoid Alpine Python package issues
- `ECR_REGISTRY` must be registry host only, for example `392423995152.dkr.ecr.us-east-1.amazonaws.com`
- `AWS_REGION` must match the region embedded in `ECR_REGISTRY`
- this repo currently does not trigger the Helm repo automatically

## Migrations

Migration is not part of this repo's CI pipeline.

Operationally, migration is run after:
1. Helm has created `ExternalSecret`
2. ESO has synced `bookgate-secret`

Command logic lives in:
- `api-service/scripts/migrate.sh`

It performs:
- `alembic upgrade head`
- admin bootstrap if missing

## Validation

```bash
docker build -t bookgate/api-service:test ./api-service
docker build -t bookgate/chat-service:test ./chat-service
docker build -t bookgate/frontend:test ./frontend
```
