FROM node:22-alpine AS base
RUN npm install -g pnpm@9

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN pnpm run build

# `vite preview` is a dev convenience server — a single Node process with no
# worker pool and no connection tuning — and Vite documents it as unfit for
# production. Fanning ~120 hashed chunks plus the API through it produced
# ERR_CONNECTION_RESET under load, which surfaced in the browser as failed CSS
# preloads. It also forces Cache-Control: no-store on every asset, so nothing
# was ever cached and each navigation re-ran the whole fan-out. nginx serves the
# static build and proxies the API instead.
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# VITE_BACKEND_URL is injected at runtime via .env; both are substituted into
# the config by the nginx entrypoint before the server starts.
ENV VITE_PORT=3300

# Opt in to the entrypoint's 15-local-resolvers step. Without this the script
# returns early, NGINX_LOCAL_RESOLVERS is never exported, envsubst leaves the
# placeholder in the config verbatim and nginx refuses to start.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

EXPOSE 3300
