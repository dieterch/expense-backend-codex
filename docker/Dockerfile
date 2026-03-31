FROM node:22-alpine AS deps

WORKDIR /app

# Native modules used in this repo need a minimal build toolchain on Alpine.
RUN apk add --no-cache libc6-compat openssl python3 make g++

COPY expense-backend-codex/package*.json ./
COPY expense-backend-codex/web/package*.json ./web/

RUN npm ci
RUN npm --prefix web ci

FROM deps AS build

COPY expense-backend-codex/. .

RUN npx prisma generate
RUN npm run build
RUN npm run web:build

FROM node:22-alpine AS backend

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5678
ENV DATABASE_URL=file:/app/data/dev.db

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output
COPY --from=build /app/openapi.yaml ./openapi.yaml
COPY --from=build /app/prisma ./prisma

RUN mkdir -p /app/data /app/prisma

EXPOSE 5678

CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]

FROM node:22-alpine AS frontend

WORKDIR /app/web

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

COPY --from=build /app/web/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
