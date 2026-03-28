# Stage 1: build static assets
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install --frozen-lockfile

COPY . .

# VITE_API_URL is baked into the bundle at build time.
# Default is empty string → axios uses relative URLs (works behind any Ingress).
# Override with --build-arg VITE_API_URL=https://api.example.com if the API
# is on a different origin than the frontend.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: serve with nginx
FROM nginx:1.27-alpine

# SPA routing: all paths fall back to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
