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
Key outputs: `ecr_registry_url`, `s3_bucket_name`, `rds_endpoint`,
`db_credentials_secret_arn`, `app_secrets_secret_arn`.

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
Leave it empty if the API is on the same domain as the frontend.

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
```

Commit and push → Helm repo CI runs `helm upgrade`.

---

## Environment variable contract

### api-service

| Variable | Source |
|---|---|
| `DATABASE_URL` | `bookgate-secret` ← ESO ← SM `bookgate/dev/app-secrets` |
| `SECRET_KEY` | `bookgate-secret` ← ESO ← SM `bookgate/dev/app-secrets` |
| `ADMIN_PASSWORD` | `bookgate-secret` ← ESO ← SM `bookgate/dev/app-secrets` |
| `S3_BUCKET_NAME` | `values.yaml` → `apiService.env.s3BucketName` |
| `AWS_DEFAULT_REGION` | `values.yaml` → `apiService.env.awsDefaultRegion` |
| `ADMIN_EMAIL` | `values.yaml` → `apiService.env.adminEmail` |
| `ADMIN_FULL_NAME` | `values.yaml` → `apiService.env.adminFullName` |
| `CORS_ORIGINS` | `values.yaml` → `apiService.env.corsOrigins` |

S3 credentials are provided by IRSA — no access key or secret key in env.

### chat-service

| Variable | Source |
|---|---|
| `SECRET_KEY` | `bookgate-secret` ← ESO ← SM `bookgate/dev/app-secrets` |
| `OPENAI_API_KEY` | `bookgate-secret` ← ESO ← SM `bookgate/dev/app-secrets` |
| `API_SERVICE_URL` | Helm: `http://bookgate-api-service:8000` |
| `CORS_ORIGINS` | `values.yaml` → `chatService.env.corsOrigins` |

---

## Secrets flow

Terraform creates the SM secret shell; operator populates it once; ESO syncs
it into the cluster automatically on every deploy.

```
Terraform
  └─ creates SM secret "bookgate/dev/app-secrets" (empty shell)
  └─ outputs: rds_endpoint, db_credentials_secret_arn

Operator (one-time after terraform apply)
  └─ constructs DATABASE_URL from rds_endpoint + RDS master password
  └─ populates SM "bookgate/dev/app-secrets" with all four keys

ESO (running in cluster with IRSA)
  └─ reads ExternalSecret CR (deployed by Helm chart)
  └─ syncs SM secret → K8s Secret "bookgate-secret"

Pods
  └─ read env vars via secretKeyRef from bookgate-secret
```

See helm repo README for the exact SM population command and ClusterSecretStore
setup.

---

## Database migrations

Migration is an **explicit operational step** — not a Helm hook.
It must be run **after** confirming `bookgate-secret` is synced.

```bash
# 1. Verify secret exists
kubectl get secret bookgate-secret -n bookgate

# 2. Run migration job
IMAGE="<ECR_REGISTRY>/bookgate/api-service:<IMAGE_TAG>"

kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: bookgate-migrate-$(date +%Y%m%d%H%M%S)
  namespace: bookgate
spec:
  ttlSecondsAfterFinished: 3600
  backoffLimit: 2
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: $IMAGE
          command: ["bash", "scripts/migrate.sh"]
          envFrom:
            - secretRef:
                name: bookgate-secret
          env:
            - name: ADMIN_EMAIL
              value: "admin@bookgate.com"
            - name: ADMIN_FULL_NAME
              value: "System Admin"
            - name: S3_BUCKET_NAME
              value: "<S3_BUCKET_NAME>"
            - name: AWS_DEFAULT_REGION
              value: "ap-southeast-1"
EOF
```

Migration runs: Alembic `upgrade head` + admin account bootstrap (idempotent).

---

## Validation

```bash
# Build all images
docker build -t bookgate/api-service:test ./api-service
docker build -t bookgate/chat-service:test ./chat-service
docker build -t bookgate/frontend:test ./frontend

# Helm lint
cd ../helm-charts
helm lint bookgate/

# Helm template dry-run
helm template bookgate bookgate/ \
  --set ecr.registry=123456789.dkr.ecr.ap-southeast-1.amazonaws.com \
  --set apiService.image.tag=abc1234 \
  --set chatService.image.tag=abc1234 \
  --set frontend.image.tag=abc1234 \
  --set apiService.env.s3BucketName=bookgate-prod \
  --set ingress.host=bookgate.example.com
```
