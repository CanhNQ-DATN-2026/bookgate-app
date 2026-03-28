# Bookgate — App Repo

Role-based digital library platform. This repo owns the three application
services: `api-service`, `chat-service`, and `frontend`.

---

## Repo layout

```
bookgate/
├── api-service/          # FastAPI — auth, books, users, admin, download workflow
├── chat-service/         # FastAPI — OpenAI streaming chat (stateless)
└── frontend/             # React/Vite — built to static assets, served by nginx
```

---

## 3-repo CI/CD architecture

```
terraform-repo          app-repo (this)         helm-repo
─────────────           ───────────────         ──────────────────
Provision infra    →    Build & push images  →  Update image tags
  EKS cluster            ECR:api-service         values.yaml tag bump
  RDS (Postgres)         ECR:chat-service     →  helm upgrade → EKS
  S3 bucket              ECR:frontend
  Secrets Manager
  ECR repositories
```

### Step 1 — Terraform (infra repo)
Provisions EKS, RDS, S3, ECR repos, and AWS Secrets Manager entries.
Outputs: `ecr_registry_url`, `s3_bucket_name`, `rds_endpoint`, `secret_name`.

### Step 2 — App repo CI (this repo)
Triggered on merge to `main`.

```bash
IMAGE_TAG=$COMMIT_SHA

docker build -t $ECR/bookgate/api-service:$IMAGE_TAG ./api-service
docker build -t $ECR/bookgate/chat-service:$IMAGE_TAG ./chat-service
docker build \
  --build-arg VITE_API_URL=https://bookgate.example.com \
  -t $ECR/bookgate/frontend:$IMAGE_TAG \
  ./frontend

docker push $ECR/bookgate/api-service:$IMAGE_TAG
docker push $ECR/bookgate/chat-service:$IMAGE_TAG
docker push $ECR/bookgate/frontend:$IMAGE_TAG
```

`VITE_API_URL` is baked into the frontend bundle at build time.
Leave it empty (default) if the API is on the same domain as the frontend.

### Step 3 — Helm repo (manual tag bump)
After images are pushed, update `values.yaml` in the helm repo:

```yaml
apiService:
  image:
    tag: "abc1234"
chatService:
  image:
    tag: "abc1234"
frontend:
  image:
    tag: "abc1234"
migrate:
  image:
    tag: "abc1234"
```

Commit and push → Helm repo CI runs `helm upgrade`.

---

## Environment variable contract

### api-service

| Variable | Source |
|---|---|
| `DATABASE_URL` | `bookgate-secret` (AWS Secrets Manager → K8s Secret) |
| `SECRET_KEY` | `bookgate-secret` |
| `ADMIN_PASSWORD` | `bookgate-secret` |
| `S3_BUCKET_NAME` | Terraform output `s3_bucket_name` (set in `values.yaml`) |
| `AWS_DEFAULT_REGION` | Set in `values.yaml` (e.g. `ap-southeast-1`) |
| `ADMIN_EMAIL` | Set in `values.yaml` |
| `ADMIN_FULL_NAME` | Set in `values.yaml` |
| `CORS_ORIGINS` | Set in `values.yaml` (frontend domain) |

Credentials for S3 are provided by IRSA (IAM Roles for Service Accounts) — no
access key or secret key is set in the environment.

### chat-service

| Variable | Source |
|---|---|
| `SECRET_KEY` | `bookgate-secret` |
| `OPENAI_API_KEY` | `bookgate-secret` |
| `API_SERVICE_URL` | K8s ClusterIP DNS (set by Helm: `http://bookgate-api-service:8000`) |
| `CORS_ORIGINS` | Set in `values.yaml` (frontend domain) |

---

## Production secrets (AWS Secrets Manager)

The Helm chart reads from a Kubernetes Secret named `bookgate-secret`
(configurable via `existingSecret` in `values.yaml`). The secret must
contain these keys: `DATABASE_URL`, `SECRET_KEY`, `ADMIN_PASSWORD`, `OPENAI_API_KEY`.

### Primary path — External Secrets Operator

In production the secret is synced automatically from AWS Secrets Manager
using [External Secrets Operator](https://external-secrets.io/). The
Terraform repo creates the Secrets Manager entry; ESO keeps the K8s Secret
in sync. No manual `kubectl` step is needed on upgrades.

### Fallback — manual bootstrap (first-time or non-ESO environments)

If ESO is not yet installed, create the secret once manually before the
first `helm install`:

```bash
kubectl create secret generic bookgate-secret \
  --namespace bookgate \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=SECRET_KEY="..." \
  --from-literal=ADMIN_PASSWORD="..." \
  --from-literal=OPENAI_API_KEY="sk-..."
```

This is a bootstrap fallback only. In steady-state production the secret
should be managed by ESO, not by hand.

---

## Database migrations

Migrations run automatically as a Helm pre-install/pre-upgrade Job before any
application Pod starts. To run manually:

```bash
kubectl run migrate --rm -it --restart=Never \
  --image=$ECR/bookgate/api-service:$TAG \
  --env-from=secret/bookgate-secret \
  -- bash scripts/migrate.sh
```

---

## Validation

```bash
# Build all images locally
docker build -t bookgate/api-service:test ./api-service
docker build -t bookgate/chat-service:test ./chat-service
docker build -t bookgate/frontend:test ./frontend

# Helm lint
cd ../helm-charts
helm lint bookgate/

# Helm template (dry-run)
helm template bookgate bookgate/ \
  --set ecr.registry=123456789.dkr.ecr.ap-southeast-1.amazonaws.com \
  --set apiService.image.tag=abc1234 \
  --set chatService.image.tag=abc1234 \
  --set frontend.image.tag=abc1234 \
  --set migrate.image.tag=abc1234 \
  --set apiService.env.s3BucketName=bookgate-prod \
  --set ingress.host=bookgate.example.com
```
