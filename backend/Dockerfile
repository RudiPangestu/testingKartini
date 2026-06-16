# ---- Builder ----
# Debian slim (glibc + OpenSSL 3) — Prisma query engine jalan andal di runtime.
FROM node:20-slim AS builder
WORKDIR /app

# Toolchain untuk build modul native (argon2) + openssl untuk Prisma
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Runner ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# OpenSSL diperlukan Prisma query engine saat runtime
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Bawa dependency + Prisma Client yang sudah ter-generate dari builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
# tsconfig.json diperlukan ts-node saat menjalankan seed (prisma/seed.ts)
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY package*.json ./

EXPOSE 3000

# Migrasi + seed admin awal (idempoten, tidak menggagalkan boot) lalu jalankan API
CMD ["sh", "-c", "npx prisma migrate deploy && (npm run seed || true) && node dist/main.js"]
